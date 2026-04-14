package com.web.backend_SupplyLens.controller;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.RestTemplate;


import com.web.backend_SupplyLens.model.Alert;
import com.web.backend_SupplyLens.model.RouteOption;
import com.web.backend_SupplyLens.model.Shipment;
import com.web.backend_SupplyLens.repository.AlertRepository;
import com.web.backend_SupplyLens.repository.ShipmentRepository;
import com.web.backend_SupplyLens.service.AlertService;

@RestController
@RequestMapping("/api/alerts")
public class AlertController {

    @Autowired
    private AlertService alertService;

    @Autowired
    private AlertRepository alertRepo;

    @Autowired
    private ShipmentRepository shipmentRepo;

    @PostMapping("/from-python")
    public ResponseEntity<?> receiveAlert(@RequestBody Alert alert) {
        // 1. Save Alert to DB
        alert.setTime(LocalDateTime.now());
        Alert savedAlert = alertRepo.save(alert);

        // 2. Find Affected Shipments
        List<Shipment> affected = shipmentRepo.findAffectedByNode(alert.getNodeName());

        RestTemplate restTemplate = new RestTemplate();

        for (Shipment s : affected) {
            Map<String, Object> rerouteReq = new HashMap<>();
            rerouteReq.put("shipmentId", s.getId());
            rerouteReq.put("blockedNode", alert.getNodeName());
            rerouteReq.put("destination", s.getRoute().getDestination());

            try {
                // Fix Type Mismatch: Use ParameterizedTypeReference for List of Maps
                ResponseEntity<List<Map<String, Object>>> response = restTemplate.exchange(
                        "http://localhost:5000/ai/optimize-route",
                        HttpMethod.POST,
                        new HttpEntity<>(rerouteReq),
                        new ParameterizedTypeReference<List<Map<String, Object>>>() {
                        });

                List<Map<String, Object>> options = response.getBody();
                if (options != null) {
                    // Save these options using a helper method
                    saveOptionsToDatabase(savedAlert, options);
                }
            } catch (Exception e) {
                System.err.println("Error calling Python AI: " + e.getMessage());
            }
        }

        return ResponseEntity.ok("Alert processed and " + affected.size() + " shipments analyzed.");
    }
    
    private void saveOptionsToDatabase(Alert alert, List<Map<String, Object>> options) {
        for (Map<String, Object> opt : options) {
            RouteOption routeOption = new RouteOption();
            routeOption.setAlert(alert);
            routeOption.setLabel((String) opt.get("label"));

            // Convert List from Python path to a String for your DB
            Object pathObj = opt.get("path");
            if (pathObj instanceof List) {
                routeOption.setPath(String.join(" -> ", (List<String>) pathObj));
            }

            routeOption.setEstimatedHours((Integer) opt.get("estimatedHours"));
            routeOption.setRiskLevel((String) opt.get("riskLevel"));
            routeOption.setTradeoff((String) opt.get("tradeoff"));

        }
    }

    @GetMapping("/all")
    public List<Alert> getAllAlerts() {
        return alertService.getAllAlerts();
    }

    @PostMapping("/{alertId}/select-route/{routeOptionId}")
    public ResponseEntity<?> selectRoute(@PathVariable Long alertId, @PathVariable Long routeOptionId) {
        alertService.selectRoute(alertId, routeOptionId);
        return ResponseEntity.ok("Route selected, driver notified");
    }

    @PostMapping("/{id}/dismiss")
    public ResponseEntity<?> dismiss(@PathVariable Long id) {
        alertService.dismiss(id);
        return ResponseEntity.ok("Dismissed");
    }
}