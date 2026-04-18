package com.web.backend_SupplyLens.service;

import java.util.*;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.transaction.annotation.Transactional;

import com.web.backend_SupplyLens.model.*;
import com.web.backend_SupplyLens.repository.*;
import com.web.backend_SupplyLens.dto.RouteDTO;

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
    private UserRepository userRepo;

    @Autowired
    private RouteRepository routeRepo;

    @Autowired
    private RestTemplate restTemplate;

    public List<Shipment> getAllShipments() {
        return shipmentRepo.findAll();
    }

    public List<Shipment> getShipmentsByWarehouse(Long warehouseId) {
        return shipmentRepo.findByWarehouse_Id(warehouseId);
    }

    /**
     * MERGED METHOD: Handles Warehouse linking, AI Scanning, and Auto-Driver Assignment.
     */
    @Transactional
    public Shipment creatAndAssign(Shipment shipment, Long warehouseId) {
        // 1. Link Warehouse
        Warehouse warehouse = warehouseRepo.findById(warehouseId)
                .orElseThrow(() -> new RuntimeException("Warehouse not found"));
        shipment.setWarehouse(warehouse);

        // 2. Set Default Statuses
        if (shipment.getAssignmentStatus() == null) {
            shipment.setAssignmentStatus("UNASSIGNED");
        }
        shipment.setRouteStatus("NORMAL");

        // 3. Attach Route and Mirror Nodes for AI
        Route finalRoute = null;
        if (shipment.getRoute() != null && shipment.getRoute().getId() != null) {
            finalRoute = routeRepo.findById(shipment.getRoute().getId())
                    .orElseThrow(() -> new RuntimeException("Route not found"));
            shipment.setRoute(finalRoute);
            
            // Mirror nodes to shipment table (Requirement for your logic)
            shipment.setRouteNodes(finalRoute.getRouteNodes()); 
        }

        // 4. Run your Friend's Auto-Assignment Logic
        tryAssignDriver(shipment, warehouse);

        // 5. Save to DB (Generates ID)
        Shipment savedShipment = shipmentRepo.save(shipment);

        // 6. TRIGGER PYTHON AI SCAN (Requirement for your logic)
        // Note: Using warehouse.getAdminId() based on your previous requirement. 
        // If your friend renamed it, change this to getAdminUserId().
        if (finalRoute != null && warehouse.getAdminUserId() != null) {
            triggerPythonScan(savedShipment, warehouse.getAdminUserId());
        }

        return savedShipment;
    }

    private void triggerPythonScan(Shipment savedShipment, Long adminId) {
        try {
            Map<String, Object> pythonReq = new HashMap<>();
            pythonReq.put("shipmentId", savedShipment.getId());
            pythonReq.put("adminId", adminId);
            
            List<String> nodesList = Arrays.asList(savedShipment.getRouteNodes().split(", "));
            pythonReq.put("nodes", nodesList);

            restTemplate.postForEntity("http://localhost:5000/ai/scan-nodes", pythonReq, String.class);
            System.out.println(">>> AI: Triggered Scan for Shipment: " + savedShipment.getId() + " (Admin: " + adminId + ")");
        } catch (Exception e) {
            System.err.println(">>> AI ERROR: Scan failed: " + e.getMessage());
        }
    }

    /**
     * Friend's Logic: Attempts to find and assign the best available driver.
     */
    public void tryAssignDriver(Shipment shipment, Warehouse warehouse) {
        String nearestDriverId = findNearestDriver(warehouse.getLatitude(), warehouse.getLongitude());
        
        if (nearestDriverId != null) {
            shipment.setAssignedDriverId(nearestDriverId);
            shipment.setAssignmentStatus("ASSIGNED");

            // Dynamic Transport Assignment
            if (shipment.getTransport() == null || shipment.getTransport().getId() == null) {
                userRepo.findByDriverId(nearestDriverId).ifPresent(user -> {
                    transportRepo.findByDriver(user).ifPresentOrElse(
                        shipment::setTransport,
                        () -> transportRepo.findAll().stream()
                                .filter(t -> "AVAILABLE".equalsIgnoreCase(t.getStatus()))
                                .findFirst()
                                .ifPresent(shipment::setTransport)
                    );
                });
            }

            // Mark driver unavailable
            locationRepo.findByDriverId(nearestDriverId).ifPresent(loc -> {
                loc.setAvailable(false);
                locationRepo.save(loc);
            });
        }
    }

    private String findNearestDriver(double warehouseLat, double warehouseLong) {
        List<DriverLocation> availableDrivers = locationRepo.findByAvailableTrue();
        if(availableDrivers.isEmpty()) return null;

        DriverLocation bestDriver = null;
        double minDistance = Double.MAX_VALUE;

        for (DriverLocation driver : availableDrivers) {
            double dist = haversineDistance(warehouseLat, warehouseLong, driver.getLatitude(), driver.getLongitude());
            // Friend's 200km threshold
            if (dist <= 200.0 && dist < minDistance) {
                minDistance = dist;
                bestDriver = driver;
            }
        }
        return (bestDriver != null) ? bestDriver.getDriverId() : null;
    }

    private double haversineDistance(double lat1, double lng1, double lat2, double lng2) {
        if (lat1 == lat2 && lng1 == lng2) return 0.0;
        final int R = 6371;
        double dLat = Math.toRadians(lat2 - lat1);
        double dLng = Math.toRadians(lng2 - lng1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2) 
                 + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2)) 
                 * Math.sin(dLng / 2) * Math.sin(dLng / 2);
        return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }

    @jakarta.annotation.PostConstruct
    public void initAssignmentsOnBoot() {
        checkAndAssignPendingShipments();
    }

    public void checkAndAssignPendingShipments() {
        List<Shipment> unassigned = shipmentRepo.findPendingAssignments();
        unassigned.sort(Comparator.comparing(Shipment::getId));

        for (Shipment shipment : unassigned) {
            Warehouse wh = shipment.getWarehouse();
            if (wh == null) continue;
            tryAssignDriver(shipment, wh);
            if ("ASSIGNED".equals(shipment.getAssignmentStatus())) {
                shipmentRepo.save(shipment);
            }
        }
    }
}