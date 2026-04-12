package com.web.backend_SupplyLens.service;

import java.util.Comparator;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.web.backend_SupplyLens.model.DriverLocation;
import com.web.backend_SupplyLens.model.Route;
import com.web.backend_SupplyLens.model.Shipment;
import com.web.backend_SupplyLens.model.Transport;
import com.web.backend_SupplyLens.model.Warehouse;
import com.web.backend_SupplyLens.repository.DriverLocationRepository;
import com.web.backend_SupplyLens.repository.RouteOptionRepo;
import com.web.backend_SupplyLens.repository.RouteRepository;
import com.web.backend_SupplyLens.repository.ShipmentRepository;
import com.web.backend_SupplyLens.repository.TransportRepository;
import com.web.backend_SupplyLens.repository.WarehouseRepository;

@Service
public class ShipmentService {
    
    @Autowired
    private ShipmentRepository shipmentRepo;

    @Autowired
    private DriverLocationRepository locationRepo;

    @Autowired
    private WarehouseRepository warehouseRepo;

    @Autowired
    private TransportRepository transportRepo;

    @Autowired
    private RouteRepository routeRepo;

    public List<Shipment> getAllShipments() {
        return shipmentRepo.findAll();
    }

    public Shipment creatAndAssign(Shipment shipment, Long warehouseId){
        Warehouse warehouse = warehouseRepo.findById(warehouseId).orElseThrow();
        shipment.setWarehouse(warehouse);
        shipment.setAssignmentStatus("UNASSIGNED");

        if (shipment.getTransport() != null && shipment.getTransport().getId() != null) {
            Transport transport = transportRepo.findById(shipment.getTransport().getId())
                    .orElseThrow(() -> new RuntimeException("Transport not found"));
            shipment.setTransport(transport);
        }

        if (shipment.getRoute() != null && shipment.getRoute().getId() != null) {
            Route route = routeRepo.findById(shipment.getRoute().getId())
                    .orElseThrow(() -> new RuntimeException("Route not found"));
            shipment.setRoute(route);
        }

        //find nearest drivers
        String nearestDriverId = findNearestDriver(
            warehouse.getLatitude(), 
            warehouse.getLongitude()
        );

        if (nearestDriverId != null) {
            shipment.setAssignedDriverId(nearestDriverId);
            shipment.setAssignmentStatus("ASSIGNED");
            
            locationRepo.findByDriverId(nearestDriverId).ifPresent(loc -> {
                loc.setAvailable(false);
                locationRepo.save(loc);
            });
        }
        else {
            // ✅ no drivers available — don't crash
            shipment.setAssignmentStatus("UNASSIGNED");
            shipment.setAssignedDriverId(null);
        }
        shipment.setRouteStatus("NORMAL");
        return shipmentRepo.save(shipment);
    }

    private String findNearestDriver(double warehouseLat, double warehouseLong){
        List<DriverLocation> availableDrivers = locationRepo.findByAvailableTrue();
        if(availableDrivers.isEmpty()) return null;

        return availableDrivers.stream()
            .min(Comparator.comparingDouble(driver -> haversineDistance(
                warehouseLat, warehouseLong, driver.getLatitude(), driver.getLongitude()
            )))
            .map(DriverLocation::getDriverId)
            .orElse(null);
    }

    private double haversineDistance(double lat1, double lng1, double lat2, double lng2) {
        final int R = 6371; // Earth radius in km
        double dLat = Math.toRadians(lat2 - lat1);
        double dLng = Math.toRadians(lng2 - lng1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2) 
                + Math.cos(Math.toRadians(lat1)) 
                * Math.cos(Math.toRadians(lat2)) 
                * Math.sin(dLng / 2) * Math.sin(dLng / 2);
        return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }
}
