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

    public Alert saveAlert(Alert alert){
        alert.setStatus(AlertStatus.PENDING);
        alert.setTime(LocalDateTime.now());
        
        // Step 4: Find Affected Shipments
        if (alert.getNodeName() != null) {
            List<Shipment> affected = shipmentRepo.findByRouteNodesContaining(alert.getNodeName());
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

        if(alert.getRouteOptions() != null){
            for(RouteOption option : alert.getRouteOptions()){
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
            requestBody.put("source", sample.getRoute() != null ? sample.getRoute().getSource() : "Unknown");
            requestBody.put("destination", sample.getRoute() != null ? sample.getRoute().getDestination() : "Unknown");
            
            System.out.println("Calling Python AI for optimization: " + pythonUrl);
            
            // Call Python service
            ResponseEntity<java.util.Map> response = restTemplate.postForEntity(pythonUrl, requestBody, java.util.Map.class);
            
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                List<java.util.Map<String, Object>> options = (List<java.util.Map<String, Object>>) response.getBody().get("routeOptions");
                
                if (options != null) {
                    java.util.ArrayList<RouteOption> routeOptions = new java.util.ArrayList<>();
                    for (java.util.Map<String, Object> opt : options) {
                        RouteOption ro = new RouteOption();
                        ro.setLabel((String) opt.get("label"));
                        ro.setPath((String) opt.get("path"));
                        ro.setEstimatedHours((Integer) opt.get("estimatedHours"));
                        ro.setRiskLevel((String) opt.get("riskLevel"));
                        ro.setTradeoff((String) opt.get("tradeoff"));
                        ro.setAlert(alert);
                        ro.setStatus(RouteOptionStatus.PENDING);
                        routeOptions.add(ro);
                    }
                    routeOptionRepo.saveAll(routeOptions);
                    alert.setRouteOptions(routeOptions);
                    alertRepo.save(alert);
                    System.out.println("Saved " + routeOptions.size() + " route options from Python AI");
                }
            }
        } catch (Exception e) {
            System.err.println("Failed to call Python AI: " + e.getMessage());
            e.printStackTrace();
        }
    }

    public List<Alert> getAllAlerts(){
        return alertRepo.findAll();
    }

    public void selectRoute(Long alertId, Long routeOptionId){
        Alert alert = alertRepo.findById(alertId).orElseThrow();
        alert.setStatus(AlertStatus.ACCEPTED);
        alertRepo.save(alert);

        for(RouteOption option : alert.getRouteOptions()){
            if(option.getId().equals(routeOptionId)){
                option.setStatus(RouteOptionStatus.SELECTED);
            }
            else{
                option.setStatus(RouteOptionStatus.REJECTED);
            }
            routeOptionRepo.save(option);
        }
        updateShipments(alert, routeOptionId);
    }

    private void updateShipments(Alert alert, Long selectedRouteId) {
        if (alert.getAffectedShipmentIds() == null) return;
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
