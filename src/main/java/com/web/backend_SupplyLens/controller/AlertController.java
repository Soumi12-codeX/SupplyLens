package com.web.backend_SupplyLens.controller;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

import com.web.backend_SupplyLens.dto.RerouteRequest;
import com.web.backend_SupplyLens.model.Alert;
import com.web.backend_SupplyLens.model.RouteOption;
import com.web.backend_SupplyLens.model.Shipment;
import com.web.backend_SupplyLens.model.TransitNode;
import com.web.backend_SupplyLens.repository.AlertRepository;
import com.web.backend_SupplyLens.repository.RouteOptionRepo;
import com.web.backend_SupplyLens.repository.ShipmentRepository;
import com.web.backend_SupplyLens.service.AlertService;
import com.web.backend_SupplyLens.service.CoordinateService;
import com.web.backend_SupplyLens.service.RedirectService;

@RestController
@RequestMapping("/api/alerts")
@CrossOrigin(origins = "*")
public class AlertController {

    @Autowired
    private AlertService alertService;

    @Autowired
    private AlertRepository alertRepo;

    @Autowired
    private ShipmentRepository shipmentRepo;

    @Autowired
    private RedirectService redirectService;

    @Autowired
    private CoordinateService coordinateService;

    @Autowired
    private RouteOptionRepo routeOptionRepo;

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    @Autowired
    private RestTemplate restTemplate;

    @PostMapping("/from-python")
    public ResponseEntity<?> receiveAlert(@RequestBody Alert alert) {
        alert.setTime(LocalDateTime.now());
        Alert savedAlert = alertRepo.save(alert);

        // Find all shipments passing through the affected node
        List<Shipment> affected = shipmentRepo.findAffectedByNode(alert.getNodeName());

        Set<Long> notifiedAdmins = new HashSet<>();

        for (Shipment s : affected) {
            // FIX: Using your standardized variable name 'adminUserId'
            Long adminId = s.getWarehouse().getAdminUserId();

            if (adminId != null && !notifiedAdmins.contains(adminId)) {
                messagingTemplate.convertAndSendToUser(
                        adminId.toString(),
                        "/topic/alerts",
                        savedAlert);
                notifiedAdmins.add(adminId);
            }

            // Prepare request for Python AI Rerouting
            Map<String, Object> rerouteReq = new HashMap<>();
            rerouteReq.put("shipmentId", s.getId());
            rerouteReq.put("blockedNode", alert.getNodeName());
            
            // Safety check for route destination
            if (s.getRoute() != null) {
                rerouteReq.put("destination", s.getRoute().getDestination());
            }

            try {
                // Call Python AI for rerouting options
                ResponseEntity<List<Map<String, Object>>> response = restTemplate.exchange(
                        "http://localhost:5000/ai/optimize-route",
                        HttpMethod.POST,
                        new HttpEntity<>(rerouteReq),
                        new ParameterizedTypeReference<List<Map<String, Object>>>() {});

                List<Map<String, Object>> options = response.getBody();
                if (options != null) {
                    saveOptionsToDatabase(savedAlert, options);
                }
            } catch (Exception e) {
                System.err.println(">>> AI ERROR: Reroute failed for Shipment " + s.getId() + ": " + e.getMessage());
            }
        }

        return ResponseEntity.ok("Alert processed. Notified " + notifiedAdmins.size() + " admins.");
    }

    private void saveOptionsToDatabase(Alert alert, List<Map<String, Object>> options) {
        for (Map<String, Object> opt : options) {
            RouteOption routeOption = new RouteOption();
            routeOption.setAlert(alert);
            routeOption.setLabel((String) opt.get("label"));

            // Convert List from Python path to a String for DB storage
            Object pathObj = opt.get("path");
            if (pathObj instanceof List) {
                routeOption.setPath(String.join(" -> ", (List<String>) pathObj));
            }

            // FIX: Robust Number conversion to avoid ClassCastException from Python JSON
            Object hrs = opt.get("estimatedHours");
            routeOption.setEstimatedHours(hrs instanceof Number ? ((Number) hrs).intValue() : 0);

            routeOption.setRiskLevel((String) opt.get("riskLevel"));
            routeOption.setTradeoff((String) opt.get("tradeoff"));
            
            routeOptionRepo.save(routeOption);
        }
    }

    @GetMapping("/all")
    public List<Alert> getAllAlerts() {
        return alertService.getAllAlerts();
    }

    @PostMapping("/{id}/dismiss")
    public ResponseEntity<?> dismiss(@PathVariable Long id) {
        alertService.dismiss(id);
        return ResponseEntity.ok("Dismissed");
    }

    @PostMapping("/{alertId}/select-route/{routeOptionId}")
    public ResponseEntity<?> selectRoute(
            @PathVariable Long alertId,
            @PathVariable Long routeOptionId,
            @RequestParam Long sourceWhId,
            @RequestParam Long destWhId) {
        
        alertService.selectRoute(alertId, routeOptionId);
        String googleMapsLink = redirectService.generateRedirectLinkFromOption(routeOptionId, sourceWhId, destWhId);

        Map<String, String> response = new HashMap<>();
        response.put("message", "Route selected, driver notified");
        response.put("redirectionLink", googleMapsLink);

        return ResponseEntity.ok(response);
    }

    @PostMapping("/preview-path")
    public ResponseEntity<?> previewPath(@RequestBody List<String> cityNames) {
        return ResponseEntity.ok(getCoordsForPath(cityNames));
    }

    @PostMapping("/process-reroute")
    public ResponseEntity<?> processReroute(@RequestBody Map<String, Object> pythonResponse) {
        List<String> cityNames = (List<String>) pythonResponse.get("path");
        return ResponseEntity.ok(getCoordsForPath(cityNames));
    }

    // Helper to keep code clean
    private List<Map<String, Object>> getCoordsForPath(List<String> cityNames) {
        return cityNames.stream().map(city -> {
            TransitNode node = coordinateService.getCoordinates(city.trim());
            Map<String, Object> nodeData = new HashMap<>();
            nodeData.put("name", city.trim());
            nodeData.put("lat", node != null ? node.getLatitude() : 0);
            nodeData.put("lng", node != null ? node.getLongitude() : 0);
            return nodeData;
        }).collect(Collectors.toList());
    }
}