package com.web.backend_SupplyLens.service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import com.web.backend_SupplyLens.model.Alert;
import com.web.backend_SupplyLens.model.AlertStatus;
import com.web.backend_SupplyLens.model.RouteOption;
import com.web.backend_SupplyLens.model.RouteOptionStatus;
import com.web.backend_SupplyLens.model.Shipment;
import com.web.backend_SupplyLens.model.TransitNode;
import com.web.backend_SupplyLens.model.Warehouse;
import com.web.backend_SupplyLens.repository.AlertRepository;
import com.web.backend_SupplyLens.repository.RouteOptionRepo;
import com.web.backend_SupplyLens.repository.ShipmentRepository;

import jakarta.transaction.Transactional;

import org.springframework.web.client.RestTemplate;
import org.springframework.http.ResponseEntity;

@Service
public class AlertService {

    @Autowired
    private AlertRepository alertRepo;

    @Autowired
    private ShipmentRepository shipmentRepo;

    @Autowired
    private RouteOptionRepo routeOptionRepo;

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    @Autowired
    private RestTemplate restTemplate;

    @Autowired
    private CoordinateService coordinateService;


    @Transactional
    public Alert saveAlert(Alert alert) {
        alert.setStatus(AlertStatus.PENDING);
        alert.setTime(LocalDateTime.now());

        if (alert.getNodeName() != null) {
            List<Shipment> affected = shipmentRepo.findAffectedByNode(alert.getNodeName());
            if (!affected.isEmpty()) {
                // Logic: Take the first affected shipment, find its warehouse,
                // and assign the alert to that warehouse's admin.
                Shipment firstShipment = affected.get(0);
                Warehouse wh = firstShipment.getWarehouse();

                if (wh.getAdminUserId() != null) {
                    alert.setAdminId(wh.getAdminUserId()); // Automatically link to the Warehouse Admin
                }

                String ids = affected.stream()
                        .map(s -> s.getId().toString())
                        .collect(Collectors.joining(","));
                alert.setAffectedShipmentIds(ids);

                triggerOptimization(alert, affected);
            }
        }

        if (alert.getRouteOptions() != null) {
            for (RouteOption option : alert.getRouteOptions()) {
                option.setAlert(alert);
                option.setStatus(RouteOptionStatus.PENDING);
            }
        }
        Alert saved = alertRepo.save(alert);
        messagingTemplate.convertAndSend("/topic/alerts", saved);
        return saved;
    }

    private void triggerOptimization(Alert alert, List<Shipment> shipments) {
        try {
            String pythonUrl = "https://supplylens-1.onrender.com/ai/optimize-route";
            Shipment sample = shipments.get(0);

            java.util.Map<String, Object> requestBody = new java.util.HashMap<>();
            requestBody.put("alertId", alert.getId());
            requestBody.put("blockedNode", alert.getNodeName());
            requestBody.put("shipmentId", sample.getId());

            // Clean names to match TransitNode names
            String src = sample.getWarehouse().getCity().toLowerCase().trim();
            String dest = sample.getRoute().getDestination().getCity().toLowerCase().trim();

            requestBody.put("source", src);
            requestBody.put("destination", dest);
            requestBody.put("sourceLat", sample.getWarehouse().getLatitude());
            requestBody.put("sourceLng", sample.getWarehouse().getLongitude());
            requestBody.put("destLat", sample.getRoute().getDestination().getLatitude());
            requestBody.put("destLng", sample.getRoute().getDestination().getLongitude());

            System.out.println("Calling Python AI: " + src + " -> " + dest + " (Avoiding " + alert.getNodeName() + ")");
            System.out.println("AI Request Body: " + requestBody);

            ResponseEntity<java.util.Map> response = restTemplate.postForEntity(pythonUrl, requestBody,
                    java.util.Map.class);
            
            System.out.println("AI Response Status: " + response.getStatusCode());
            System.out.println("AI Response Body: " + response.getBody());

            // Replace the previous response handling with this more robust version:
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                java.util.Map<String, Object> body = response.getBody();

                // Check if the key exists before casting
                if (body.containsKey("routeOptions")) {
                    Object optionsObj = body.get("routeOptions");

                    if (optionsObj instanceof List) {
                        List<java.util.Map<String, Object>> options = (List<java.util.Map<String, Object>>) optionsObj;
                        java.util.ArrayList<RouteOption> routeOptions = new java.util.ArrayList<>();

                        for (java.util.Map<String, Object> opt : options) {
                            RouteOption ro = new RouteOption();
                            ro.setLabel((String) opt.get("label"));

                            // Safety check for Hours
                            Object hrs = opt.get("estimatedHours");
                            ro.setEstimatedHours(hrs instanceof Number ? ((Number) hrs).intValue() : 0);

                            // Safety check for Path
                            Object pathObj = opt.get("path");
                            if (pathObj instanceof List) {
                                ro.setPath(String.join(" -> ", (List<String>) pathObj));
                            } else {
                                ro.setPath(pathObj != null ? pathObj.toString() : "No Path");
                            }

                            ro.setRiskLevel((String) opt.get("riskLevel"));
                            ro.setTradeoff((String) opt.get("tradeoff"));
                            ro.setAlert(alert);
                            ro.setStatus(RouteOptionStatus.PENDING);
                            routeOptions.add(ro);
                        }

                        if (!routeOptions.isEmpty()) {
                            routeOptionRepo.saveAll(routeOptions);
                            alert.setRouteOptions(routeOptions);
                            alertRepo.save(alert);
                            System.out.println(">>> SUCCESS: Saved " + routeOptions.size() + " options to DB.");
                        }
                    }
                } else {
                    System.out.println(">>> AI ERROR: Python returned 200 but 'routeOptions' key was missing.");
                }
            }
        } catch (Exception e) {
            System.err.println("Failed to call Python AI: " + e.getMessage());
        }
    }

    public List<Alert> getAllAlerts() {
        return alertRepo.findAll();
    }

    public void selectRoute(Long alertId, Long routeOptionId) {
        Alert alert = alertRepo.findById(alertId).orElseThrow();
        alert.setStatus(AlertStatus.ACCEPTED);
        alertRepo.save(alert);

        for (RouteOption option : alert.getRouteOptions()) {
            if (option.getId().equals(routeOptionId)) {
                option.setStatus(RouteOptionStatus.SELECTED);
            } else {
                option.setStatus(RouteOptionStatus.REJECTED);
            }
            routeOptionRepo.save(option);
        }
        updateShipments(alert, routeOptionId);
    }

    private void updateShipments(Alert alert, Long selectedRouteId) {
        if (alert.getAffectedShipmentIds() == null)
            return;
        RouteOption selected = routeOptionRepo.findById(selectedRouteId).orElseThrow();

        for (String idStr : alert.getAffectedShipmentIds().split(",")) {
            String trimmed = idStr.trim();
            if (trimmed.isEmpty()) continue;
            try {
                Long shipmentId = Long.parseLong(trimmed);
                shipmentRepo.findById(shipmentId).ifPresent(shipment -> {
                    // Generate coordinate JSON from the path text to keep progress simulation working
                    String pathText = selected.getPath();
                    String jsonPath = generateCoordinateJson(pathText);
                    
                    shipment.setCurrentPath(jsonPath);
                    shipment.setRouteStatus("REROUTED");
                    shipment.setActiveRouteOptionId(selectedRouteId);
                    shipmentRepo.save(shipment);
                });
            } catch (NumberFormatException e) {
                System.err.println("Failed to parse shipment ID: " + trimmed);
            }
        }
    }

    public void dismiss(Long id) {
        Alert alert = alertRepo.findById(id).orElseThrow();
        alert.setStatus(AlertStatus.DISMISSED);
        alertRepo.save(alert);
    }

    private String generateCoordinateJson(String pathText) {
        String[] cities = pathText.split(" -> ");
        java.util.List<TransitNode> hubs = new java.util.ArrayList<>();
        
        for (String city : cities) {
            TransitNode node = coordinateService.getCoordinates(city.trim());
            if (node != null) {
                hubs.add(node);
            }
        }

        // Try OSRM for high-fidelity road-snapped path (same as ShipmentService)
        if (hubs.size() >= 2) {
            try {
                String coordsStr = hubs.stream()
                    .map(h -> h.getLongitude() + "," + h.getLatitude())
                    .collect(java.util.stream.Collectors.joining(";"));

                String osrmUrl = "https://router.project-osrm.org/route/v1/driving/" + coordsStr + "?overview=full&geometries=geojson";
                ResponseEntity<java.util.Map> osrmRes = restTemplate.getForEntity(osrmUrl, java.util.Map.class);

                if (osrmRes.getStatusCode().is2xxSuccessful() && osrmRes.getBody() != null) {
                    java.util.Map<String, Object> body = osrmRes.getBody();
                    if ("Ok".equals(body.get("code"))) {
                        java.util.List<java.util.Map<String, Object>> routes = (java.util.List<java.util.Map<String, Object>>) body.get("routes");
                        if (!routes.isEmpty()) {
                            java.util.Map<String, Object> geometry = (java.util.Map<String, Object>) routes.get(0).get("geometry");
                            java.util.List<java.util.List<Double>> coords = (java.util.List<java.util.List<Double>>) geometry.get("coordinates");

                            java.util.List<String> jsonCoords = coords.stream()
                                .map(c -> String.format("{\"lat\": %f, \"lng\": %f}", c.get(1), c.get(0)))
                                .collect(java.util.stream.Collectors.toList());

                            System.out.println(">>> REROUTE: Generated OSRM road path with " + coords.size() + " points");
                            return "[" + String.join(",", jsonCoords) + "]";
                        }
                    }
                }
            } catch (Exception e) {
                System.err.println(">>> REROUTE: OSRM fetch failed, falling back to hub coords: " + e.getMessage());
            }
        }
        
        // Fallback: hub-level coordinates only
        StringBuilder sb = new StringBuilder("[");
        for (int i = 0; i < hubs.size(); i++) {
            sb.append("{\"lat\":").append(hubs.get(i).getLatitude()).append(",\"lng\":").append(hubs.get(i).getLongitude()).append("}");
            if (i < hubs.size() - 1) sb.append(",");
        }
        sb.append("]");
        return sb.toString();
    }
}
