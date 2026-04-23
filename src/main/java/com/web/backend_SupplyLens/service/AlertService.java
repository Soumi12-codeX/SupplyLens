package com.web.backend_SupplyLens.service;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import com.web.backend_SupplyLens.model.Alert;
import com.web.backend_SupplyLens.model.AlertStatus;
import com.web.backend_SupplyLens.model.RouteOption;
import com.web.backend_SupplyLens.model.RouteOptionStatus;
import com.web.backend_SupplyLens.model.Shipment;
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

    @Transactional
    public Alert saveAlert(Alert alert) {
        alert.setStatus(AlertStatus.PENDING);
        alert.setTime(LocalDateTime.now());

        // Step 4: Find Affected Shipments
        if (alert.getNodeName() != null) {
            List<Shipment> affected = shipmentRepo.findAffectedByNode(alert.getNodeName());
            if (!affected.isEmpty()) {
                String ids = affected.stream()
                        .map(s -> s.getId().toString())
                        .reduce((a, b) -> a + "," + b)
                        .orElse("");
                alert.setAffectedShipmentIds(ids);

                // Step 5: For each affected shipment, request optimization from Python
                // For simplicity, we trigger it for the first one or a general request
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
            String pythonUrl = "http://localhost:5000/ai/optimize-route";
            Shipment sample = shipments.get(0);

            java.util.Map<String, Object> requestBody = new java.util.HashMap<>();
            requestBody.put("alertId", alert.getId());
            requestBody.put("blockedNode", alert.getNodeName());
            requestBody.put("shipmentId", sample.getId());

            // Clean names to match TransitNode names (removing Hub/Warehouse)
            String src = sample.getWarehouse().getName().toLowerCase()
                    .replaceAll(" hub| warehouse| logistics| port| tech", "").trim();
            String dest = sample.getRoute().getDestination().getName().toLowerCase()
                    .replaceAll(" hub| warehouse| logistics| port| tech", "").trim();

            requestBody.put("source", src);
            requestBody.put("destination", dest);

            System.out.println("Calling Python AI: " + src + " -> " + dest + " (Avoiding " + alert.getNodeName() + ")");

            ResponseEntity<java.util.Map> response = restTemplate.postForEntity(pythonUrl, requestBody,
                    java.util.Map.class);

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
            Long shipmentId = Long.parseLong(idStr.trim());
            shipmentRepo.findById(shipmentId).ifPresent(shipment -> {
                shipment.setCurrentPath(selected.getPath());
                shipment.setRouteStatus("REROUTED");
                shipmentRepo.save(shipment);
            });
        }
    }

    public void dismiss(Long id) {
        Alert alert = alertRepo.findById(id).orElseThrow();
        alert.setStatus(AlertStatus.DISMISSED);
        alertRepo.save(alert);
    }
}
