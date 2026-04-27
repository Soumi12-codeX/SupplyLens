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
import com.web.backend_SupplyLens.util.GeoUtils;
import jakarta.annotation.PostConstruct;

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

    @Autowired
    private CoordinateService coordinateService;

    public List<Shipment> getAllShipments() {
        return shipmentRepo.findAll();
    }

    public List<Shipment> getShipmentsByWarehouse(Long warehouseId) {
        return shipmentRepo.findByWarehouse_Id(warehouseId);
    }

    public List<Shipment> getShipmentsByAdmin(Long adminId) {
        return shipmentRepo.findByAdminId(adminId);
    }

    /**
     * MERGED METHOD: Handles Warehouse linking, AI Scanning, and Auto-Driver
     * Assignment.
     */
    @Transactional
    public Shipment creatAndAssign(Shipment shipment, Long warehouseId, Long adminId) {
        // 1. Link Warehouse and Admin
        Warehouse warehouse = warehouseRepo.findById(warehouseId)
                .orElseThrow(() -> new RuntimeException("Warehouse not found"));
        shipment.setWarehouse(warehouse);
        shipment.setAdminId(adminId);

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
            shipment.setRouteNodes(finalRoute.getPath());

                // --- IMPROVED LOGIC: Fetch REAL road-snapped path from OSRM on the backend ---
                try {
                    String path = finalRoute.getPath();
                    String delimiter = path.contains("->") ? "\\s*->\\s*" : ",\\s*";
                    String[] nodeNames = path.split(delimiter);
                    
                    List<TransitNode> hubs = new ArrayList<>();
                    for (String name : nodeNames) {
                        TransitNode n = coordinateService.getCoordinates(name.trim());
                        if (n != null) hubs.add(n);
                    }

                    if (hubs.size() >= 2) {
                        String coordsStr = hubs.stream()
                            .map(h -> h.getLongitude() + "," + h.getLatitude())
                            .collect(Collectors.joining(";"));
                        
                        String osrmUrl = "https://router.project-osrm.org/route/v1/driving/" + coordsStr + "?overview=full&geometries=geojson";
                        Map<String, Object> osrmRes = restTemplate.getForObject(osrmUrl, Map.class);
                        
                        if (osrmRes != null && "Ok".equals(osrmRes.get("code"))) {
                            List<Map<String, Object>> routes = (List<Map<String, Object>>) osrmRes.get("routes");
                            if (!routes.isEmpty()) {
                                Map<String, Object> geometry = (Map<String, Object>) routes.get(0).get("geometry");
                                List<List<Double>> coords = (List<List<Double>>) geometry.get("coordinates");
                                
                                // Map GeoJSON [lng, lat] to our JSON [lat, lng] format
                                List<String> jsonCoords = coords.stream()
                                    .map(c -> String.format("{\"lat\": %f, \"lng\": %f}", c.get(1), c.get(0)))
                                    .toList();
                                
                                shipment.setCurrentPath("[" + String.join(",", jsonCoords) + "]");
                                System.out.println(">>> SHIPMENT: Persisted high-fidelity road path (" + coords.size() + " nodes)");
                            }
                        }
                    }
                } catch (Exception e) {
                    System.err.println("Failed to fetch OSRM road path on backend: " + e.getMessage());
                    // Fallback to simple hub list if OSRM fails
                    shipment.setCurrentPath("[]"); 
                }
            // --- END ADDED LOGIC ---
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

    public void triggerPythonScan(Shipment savedShipment, Long adminId) {
    try {
        Map<String, Object> pythonReq = new HashMap<>();
        pythonReq.put("shipmentId", savedShipment.getId());
        pythonReq.put("adminId", adminId);

        // --- ADDED LOGIC START ---
        String path = savedShipment.getRouteNodes();
        if (path == null || path.isEmpty()) {
            System.err.println(">>> AI ERROR: No route nodes found for shipment " + savedShipment.getId());
            return;
        }

        // Handles "City A -> City B" or "City A, City B"
        String delimiter = path.contains("->") ? "\\s*->\\s*" : ",\\s*";
        List<String> nodesList = Arrays.asList(path.split(delimiter));
        // --- ADDED LOGIC END ---

        pythonReq.put("nodes", nodesList);

        restTemplate.postForEntity("http://localhost:5000/ai/scan-nodes", pythonReq, String.class);
        System.out.println(
                ">>> AI: Triggered Scan for Shipment: " + savedShipment.getId() + " (Admin: " + adminId + ")");
    } catch (Exception e) {
        System.err.println(">>> AI ERROR: Scan failed: " + e.getMessage());
    }
}

    public void tryAssignDriver(Shipment shipment, Warehouse warehouse) {
        double lat = warehouse.getLatitude();
        double lng = warehouse.getLongitude();

        // Smart Fallback: If coordinates are missing, try to find a city name in the warehouse name or city field
        if (lat == 0.0 && lng == 0.0) {
            String cityKey = null;
            if (warehouse.getCity() != null && GeoUtils.CITY_COORDINATES.containsKey(warehouse.getCity())) {
                cityKey = warehouse.getCity();
            } else if (warehouse.getName() != null) {
                for (String city : GeoUtils.CITY_COORDINATES.keySet()) {
                    if (warehouse.getName().toLowerCase().contains(city.toLowerCase())) {
                        cityKey = city;
                        break;
                    }
                }
            }

            if (cityKey != null) {
                double[] coords = GeoUtils.CITY_COORDINATES.get(cityKey);
                lat = coords[0];
                lng = coords[1];
                System.out.println(">>> ASSIGNMENT: Auto-detected warehouse location from name/city: " + cityKey);
            } else {
                System.out.println(">>> ASSIGNMENT WARNING: Warehouse " + warehouse.getName() + " has [0,0] coordinates and no city match. Using central India fallback.");
                lat = 20.5937;
                lng = 78.9629;
            }
        }

        System.out.println(">>> ASSIGNMENT: Searching for driver near warehouse: " + warehouse.getName() + 
            " (" + lat + ", " + lng + ")");
            
        String nearestDriverId = findNearestDriver(lat, lng);

        if (nearestDriverId != null) {
            System.out.println(">>> ASSIGNMENT: Found driver " + nearestDriverId + " for shipment");
            shipment.setAssignedDriverId(nearestDriverId);
            shipment.setAssignmentStatus("ASSIGNED");

            // Dynamic Transport Assignment
            if (shipment.getTransport() == null || shipment.getTransport().getId() == null) {
                userRepo.findByDriverId(nearestDriverId).ifPresent(user -> {
                    transportRepo.findByDriver(user).ifPresentOrElse(
                            t -> {
                                t.setTransportStatus("IN_TRANSIT");
                                transportRepo.save(t);
                                shipment.setTransport(t);
                            },
                            () -> transportRepo.findAll().stream()
                                    .filter(t -> "AVAILABLE".equalsIgnoreCase(t.getTransportStatus()))
                                    .findFirst()
                                    .ifPresent(t -> {
                                        t.setTransportStatus("IN_TRANSIT");
                                        transportRepo.save(t);
                                        shipment.setTransport(t);
                                    }));
                });
            }

            // Mark driver unavailable and FLUSH immediately
            locationRepo.findByDriverId(nearestDriverId).ifPresent(loc -> {
                loc.setAvailable(false);
                locationRepo.saveAndFlush(loc);
            });
        } else {
            System.out.println(">>> ASSIGNMENT: No suitable driver found within 300km of " + warehouse.getName());
            shipment.setAssignedDriverId(null);
            shipment.setAssignmentStatus("UNASSIGNED");
        }
    }

    private String findNearestDriver(double warehouseLat, double warehouseLong) {
        List<DriverLocation> availableDrivers = locationRepo.findByAvailableTrue();
        
        // STRICT WAREHOUSE-SCOPED ASSIGNMENT:
        // Only consider drivers whose HOME CITY (profile coordinates) is within 300km
        // of the warehouse. This matches exactly what the "Manage Drivers" page shows.
        // We use the driver's REGISTERED coordinates, NOT their live GPS position.
        List<DriverLocation> validDrivers = new ArrayList<>();
        
        for (DriverLocation dl : availableDrivers) {
            Optional<User> userOpt = userRepo.findByDriverId(dl.getDriverId());
            if (userOpt.isEmpty()) continue;
            
            User driver = userOpt.get();
            
            // Skip drivers with no profile coordinates
            if (driver.getLatitude() == null || driver.getLongitude() == null) continue;
            
            // Skip drivers already busy with another shipment
            if (isDriverAlreadyBusy(dl.getDriverId())) continue;
            
            // Use HOME CITY coordinates for distance check (same as Manage Drivers page)
            double dist = GeoUtils.haversineDistance(warehouseLat, warehouseLong, 
                driver.getLatitude(), driver.getLongitude());
            
            // Only include drivers within 300km of the warehouse (same radius as Manage Drivers)
            if (dist <= 300.0) {
                validDrivers.add(dl);
                System.out.println(">>> ASSIGNMENT: Local driver " + dl.getDriverId() + 
                    " (" + driver.getCity() + ") is " + String.format("%.1f", dist) + " km from warehouse");
            }
        }

        System.out.println(">>> ASSIGNMENT: Total available drivers: " + availableDrivers.size() + 
            " (Local & free for this warehouse: " + validDrivers.size() + ")");
        
        if (validDrivers.isEmpty())
            return null;

        // Among the local drivers, pick the nearest one using their HOME coordinates
        DriverLocation bestDriver = null;
        double minDistance = Double.MAX_VALUE;

        for (DriverLocation dl : validDrivers) {
            User driver = userRepo.findByDriverId(dl.getDriverId()).get();
            double dist = GeoUtils.haversineDistance(warehouseLat, warehouseLong, 
                driver.getLatitude(), driver.getLongitude());
            if (dist < minDistance) {
                minDistance = dist;
                bestDriver = dl;
            }
        }

        if (bestDriver != null) {
            System.out.println(">>> ASSIGNMENT: SUCCESS! Selected nearest LOCAL driver: " + bestDriver.getDriverId() + 
                " at distance: " + String.format("%.2f", minDistance) + " km");
            return bestDriver.getDriverId();
        }

        return null;
    }

    private boolean isDriverAlreadyBusy(String driverId) {
        // A driver is busy if they have ANY shipment that is not DELIVERED
        long activeCount = shipmentRepo.countByAssignedDriverIdAndAssignmentStatusNot(driverId, "DELIVERED");
        if (activeCount > 0) {
            System.out.println(">>> ASSIGNMENT: Driver " + driverId + " skipped (already has " + activeCount + " active shipments)");
            return true;
        }
        return false;
    }

    @jakarta.annotation.PostConstruct
    public void initAssignmentsOnBoot() {
        checkAndAssignPendingShipments();
    }

    public void checkAndAssignPendingShipments() {
        List<Shipment> unassigned = shipmentRepo.findPendingAssignments();
        System.out.println(">>> AUTO-ASSIGN: Found " + unassigned.size() + " pending shipments needing a driver.");
        
        unassigned.sort(Comparator.comparing(Shipment::getId));

        for (Shipment shipment : unassigned) {
            Warehouse wh = shipment.getWarehouse();
            if (wh == null) {
                System.out.println(">>> AUTO-ASSIGN: Shipment " + shipment.getId() + " has no warehouse link — skipping.");
                continue;
            }
            
            System.out.println(">>> AUTO-ASSIGN: Attempting to assign Driver to Shipment " + shipment.getId() + " from " + wh.getName());
            tryAssignDriver(shipment, wh);
            
            if ("ASSIGNED".equals(shipment.getAssignmentStatus())) {
                System.out.println(">>> AUTO-ASSIGN: SUCCESS! Shipment " + shipment.getId() + " assigned to " + shipment.getAssignedDriverId());
                shipmentRepo.save(shipment);
            } else {
                System.out.println(">>> AUTO-ASSIGN: FAILED to find nearby driver for Shipment " + shipment.getId());
            }
        }
    }
}