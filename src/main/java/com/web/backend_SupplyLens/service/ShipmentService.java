package com.web.backend_SupplyLens.service;

import java.util.Arrays;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

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

    public List<Shipment> getShipmentsByWarehouse(Long warehouseId) {
        return shipmentRepo.findByWarehouse_Id(warehouseId);
    }

    public Shipment creatAndAssign(Shipment shipment, Long warehouseId){
        Warehouse warehouse = warehouseRepo.findById(warehouseId).orElseThrow();
        shipment.setWarehouse(warehouse);
        if (shipment.getAssignmentStatus() == null) {
            shipment.setAssignmentStatus("UNASSIGNED");
        }

        if (shipment.getTransport() != null && shipment.getTransport().getId() != null) {
            Transport transport = transportRepo.findById(shipment.getTransport().getId())
                    .orElseThrow(() -> new RuntimeException("Transport not found"));
            shipment.setTransport(transport);
        }

        Route finalRoute = null;
        if (shipment.getRoute() != null && shipment.getRoute().getId() != null) {
            finalRoute = routeRepo.findById(shipment.getRoute().getId())
                    .orElseThrow(() -> new RuntimeException("Route not found"));
            shipment.setRoute(finalRoute);
        }

        // --- NEW: Generate currentPath for map visualization ---
        if (finalRoute != null) {
            // Try to find the destination warehouse by name to get its coordinates
            Warehouse destWh = warehouseRepo.findByName(finalRoute.getDestination()).orElse(null);
            if (destWh != null) {
                String pathJson = generateDefaultPath(
                    warehouse.getLatitude(), warehouse.getLongitude(),
                    destWh.getLatitude(), destWh.getLongitude()
                );
                shipment.setCurrentPath(pathJson);
            }
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
            shipment.setAssignmentStatus("UNASSIGNED");
            shipment.setAssignedDriverId(null);
        }
        shipment.setRouteStatus("NORMAL");
        return shipmentRepo.save(shipment);
    }

    private String generateDefaultPath(double lat1, double lng1, double lat2, double lng2) {
        StringBuilder json = new StringBuilder("[");
        int points = 15;
        for (int i = 0; i <= points; i++) {
            double t = (double) i / points;
            // Linear interpolation with a tiny bit of random "road" variance
            double lat = lat1 + (lat2 - lat1) * t;
            double lng = lng1 + (lng2 - lng1) * t;
            
            // Add a slight curve (sine wave) for visual appeal on the map
            double curve = Math.sin(t * Math.PI) * 0.02;
            lat += curve;

            json.append(String.format(java.util.Locale.ROOT, "{\"lat\": %f, \"lng\": %f}", lat, lng));
            if (i < points) json.append(",");
        }
        json.append("]");
        return json.toString();
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

    public void syncRouteWithPython(Shipment shipment){
        RestTemplate rest = new RestTemplate();
        String url = "http://localhost:5000/api/sync-watchlist";

        List<String> nodes = Arrays.asList(shipment.getRoute().getRouteNodes().split(", "));

        Map<String, Object> body = new HashMap<>();
        body.put("shipmentId", shipment.getId());
        body.put("nodes", nodes);

        rest.postForEntity(url, body, String.class);
    }
}
