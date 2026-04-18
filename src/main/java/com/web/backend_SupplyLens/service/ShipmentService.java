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
import com.web.backend_SupplyLens.repository.UserRepository;
import com.web.backend_SupplyLens.repository.TransitNodeRepository;
import com.web.backend_SupplyLens.model.TransitNode;
import com.web.backend_SupplyLens.dto.RouteDTO;
import java.util.ArrayList;
import java.util.Optional;
import java.util.stream.Collectors;
import java.util.stream.Stream;

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

    @Autowired
    private UserRepository userRepo;

    @Autowired
    private TransitNodeRepository transitNodeRepo;

    public List<Shipment> getAllShipments() {
        return shipmentRepo.findAll();
    }

    public List<Shipment> getShipmentsByWarehouse(Long warehouseId) {
        return shipmentRepo.findByWarehouse_Id(warehouseId);
    }

    public Shipment creatAndAssign(Shipment shipment, Long warehouseId){
        System.out.println(">>> SHIPMENT SERVICE: Creating shipment for warehouse ID: " + warehouseId);
        
        Warehouse warehouse = warehouseRepo.findById(warehouseId).orElse(null);
        if (warehouse == null) {
            System.err.println(">>> ERROR: Warehouse ID " + warehouseId + " not found!");
            throw new RuntimeException("Warehouse not found");
        }

        shipment.setWarehouse(warehouse);
        if (shipment.getAssignmentStatus() == null) {
            shipment.setAssignmentStatus("UNASSIGNED");
        }

        if (shipment.getTransport() != null && shipment.getTransport().getId() != null) {
            transportRepo.findById(shipment.getTransport().getId()).ifPresent(shipment::setTransport);
        }

        Route finalRoute = null;
        if (shipment.getRoute() != null && shipment.getRoute().getId() != null) {
            finalRoute = routeRepo.findById(shipment.getRoute().getId()).orElse(null);
            if (finalRoute == null) {
                System.err.println(">>> ERROR: Route ID " + shipment.getRoute().getId() + " not found!");
                throw new RuntimeException("Route not found");
            }
            shipment.setRoute(finalRoute);
        }

        // --- Generate real currentPath for map visualization ---
        if (finalRoute != null) {
            String pathJson = buildRealRoutePath(finalRoute, warehouse);
            shipment.setCurrentPath(pathJson);
        }

        shipment.setRouteStatus("NORMAL");

        // 1. Committing to DB first ensures strict FIFO queueing
        Shipment savedShipment = shipmentRepo.save(shipment);

        // 2. Global sweep: Assigns drivers to oldest UNASSIGNED shipments FIRST
        checkAndAssignPendingShipments();

        // --- Diagnostic: Print lengths before return ---
        Shipment updatedShipment = shipmentRepo.findById(savedShipment.getId()).get();
        System.out.println(">>> DATA SCRUTINIZER - Final Field Review:");
        logField("assignedDriverId", updatedShipment.getAssignedDriverId());
        logField("assignmentStatus", updatedShipment.getAssignmentStatus());
        logField("currentPath", updatedShipment.getCurrentPath());
        logField("routeNodes", updatedShipment.getRouteNodes());
        logField("notes", updatedShipment.getNotes());
        logField("status", updatedShipment.getStatus());

        return updatedShipment;
    }

    private void logField(String name, String value) {
        if (value == null) {
            System.out.println("  - " + name + ": NULL");
        } else {
            System.out.println("  - " + name + ": length=" + value.length() + " [" + (value.length() > 20 ? value.substring(0, 20) + "..." : value) + "]");
        }
    }

    /**
     * Builds a JSON path string using actual TransitNodes from the DB.
     */
    private String buildRealRoutePath(Route route, Warehouse origin) {
        if (route.getPath() == null || route.getPath().isEmpty()) {
            return generateDefaultPath(origin.getLatitude(), origin.getLongitude(), 
                                     route.getDestination().getLatitude(), route.getDestination().getLongitude());
        }

        String[] stopNames = route.getPath().split(" -> ");
        List<Map<String, Object>> coordinates = new ArrayList<>();

        // 1. Start with Origin Warehouse
        addCoordinate(coordinates, origin.getLatitude(), origin.getLongitude(), origin.getName());

        // 2. Add intermediate TransitNodes from DB
        for (String name : stopNames) {
            String cleanName = name.trim();
            // Don't duplicate origin if it's the first stop in the string
            if (cleanName.equalsIgnoreCase(origin.getName())) continue;
            // Don't duplicate destination if it's the last stop (we add it later)
            if (cleanName.equalsIgnoreCase(route.getDestination().getName())) continue;

            transitNodeRepo.findByName(cleanName).ifPresent(node -> {
                addCoordinate(coordinates, node.getLatitude(), node.getLongitude(), node.getName());
            });
        }

        // 3. End with Destination Warehouse
        addCoordinate(coordinates, route.getDestination().getLatitude(), route.getDestination().getLongitude(), route.getDestination().getName());

        // 4. Convert to JSON
        return coordinates.stream()
                .map(c -> String.format(java.util.Locale.ROOT, "{\"lat\": %f, \"lng\": %f, \"name\": \"%s\"}", 
                        c.get("lat"), c.get("lng"), c.get("name")))
                .collect(Collectors.joining(",", "[", "]"));
    }

    private void addCoordinate(List<Map<String, Object>> list, double lat, double lng, String name) {
        Map<String, Object> point = new HashMap<>();
        point.put("lat", lat);
        point.put("lng", lng);
        point.put("name", name);
        list.add(point);
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

    @jakarta.annotation.PostConstruct
    public void initAssignmentsOnBoot() {
        System.out.println(">>> BOOT: Initializing assignment sweep for stuck UNASSIGNED shipments...");
        checkAndAssignPendingShipments();
    }

    private String findNearestDriver(double warehouseLat, double warehouseLong){
        List<DriverLocation> availableDrivers = locationRepo.findByAvailableTrue();
        if(availableDrivers.isEmpty()) {
            System.out.println(">>> AUTO-ASSIGN: No available drivers globally.");
            return null;
        }

        System.out.println(">>> AUTO-ASSIGN: Scanning " + availableDrivers.size() + " drivers for warehouse...");
        DriverLocation bestDriver = null;
        double minDistance = Double.MAX_VALUE;

        for (DriverLocation driver : availableDrivers) {
            double dist = haversineDistance(warehouseLat, warehouseLong, driver.getLatitude(), driver.getLongitude());
            if (dist <= 200.0 && dist < minDistance) {
                minDistance = dist;
                bestDriver = driver;
            }
        }

        if (bestDriver != null) {
            System.out.println(">>> AUTO-ASSIGN: Found nearest driver " + bestDriver.getDriverId() + " at distance " + minDistance + " km");
            return bestDriver.getDriverId();
        }

        System.out.println(">>> AUTO-ASSIGN: No available drivers within the 200km threshold.");
        return null;
    }

    private double haversineDistance(double lat1, double lng1, double lat2, double lng2) {
        if (lat1 == lat2 && lng1 == lng2) return 0.0;
        
        final int R = 6371; // Earth radius in km
        double dLat = Math.toRadians(lat2 - lat1);
        double dLng = Math.toRadians(lng2 - lng1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2) 
                + Math.cos(Math.toRadians(lat1)) 
                * Math.cos(Math.toRadians(lat2)) 
                * Math.sin(dLng / 2) * Math.sin(dLng / 2);
        
        a = Math.max(0.0, Math.min(1.0, a));
        return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }

    public void syncRouteWithPython(Shipment shipment){
        RestTemplate rest = new RestTemplate();
        String url = "http://localhost:5000/api/sync-watchlist";

        List<String> nodes = Arrays.asList(shipment.getRoute().getPath().split(" -> "));

        Map<String, Object> body = new HashMap<>();
        body.put("shipmentId", shipment.getId());
        body.put("nodes", nodes);

        rest.postForEntity(url, body, String.class);
    }

    /**
     * Attempts to find and assign the best available driver for a shipment.
     */
    private void tryAssignDriver(Shipment shipment, Warehouse warehouse) {
        String nearestDriverId = findNearestDriver(warehouse.getLatitude(), warehouse.getLongitude());
        
        if (nearestDriverId != null) {
            System.out.println(">>> AUTO-ASSIGN: Assigning driver " + nearestDriverId + " to shipment " + shipment.getId());
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
        } else {
            shipment.setAssignmentStatus("UNASSIGNED");
            shipment.setAssignedDriverId(null);
        }
    }

    /**
     * Scans for all UNASSIGNED shipments and tries to find drivers for them.
     * Called when a new driver joins or an existing one becomes free.
     */
    public void checkAndAssignPendingShipments() {
        System.out.println(">>> AUTO-ASSIGN: Checking for pending shipments (including stuck ones)...");
        List<Shipment> unassigned = shipmentRepo.findPendingAssignments();
        
        // Sort by ID to prioritize oldest shipments
        unassigned.sort(Comparator.comparing(Shipment::getId));

        for (Shipment shipment : unassigned) {
            Warehouse wh = shipment.getWarehouse();
            if (wh == null) continue;

            tryAssignDriver(shipment, wh);
            
            // If successfully assigned, save it
            if ("ASSIGNED".equals(shipment.getAssignmentStatus())) {
                shipmentRepo.save(shipment);
                System.out.println(">>> AUTO-ASSIGN: Shipment " + shipment.getId() + " successfully assigned!");
            }
        }
    }
}
