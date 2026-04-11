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

    public Alert saveAlert(Alert alert){
        alert.setStatus(AlertStatus.PENDING);
        alert.setTime(LocalDateTime.now());
        
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
            List<Shipment> shipments = shipmentRepo.findByAssignedDriverId(idStr.trim());
            for (Shipment shipment : shipments) {
                shipment.setCurrentPath(selected.getPath());
                shipment.setRouteStatus("REROUTED");
                shipmentRepo.save(shipment);
            }
        }
    }

    public void dismiss(Long id) {
        Alert alert = alertRepo.findById(id).orElseThrow();
        alert.setStatus(AlertStatus.DISMISSED);
        alertRepo.save(alert);
    }
}
