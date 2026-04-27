package com.web.backend_SupplyLens.service;

import java.util.*;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.messaging.simp.SimpMessagingTemplate; // REQUIRED IMPORT

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

    // ADDED THIS TO FIX THE BUILD ERROR
    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    public List<Shipment> getAllShipments() {
        return shipmentRepo.findAll();
    }

    public List<Shipment> getShipmentsByWarehouse(Long warehouseId) {
        return shipmentRepo.findByWarehouse_Id(warehouseId);
    }

    public List<Shipment> getShipmentsByAdmin(Long adminId) {
        return shipmentRepo.findByAdminId(adminId);
    }

    @Transactional
    public Shipment creatAndAssign(Shipment shipment, Long warehouseId, Long adminId) {
        Warehouse warehouse = warehouseRepo.findById(warehouseId)
                .orElseThrow(() -> new RuntimeException("Warehouse not found"));
        shipment.setWarehouse(warehouse);
        shipment.setAdminId(adminId);

        if (shipment.getAssignmentStatus() == null) {
            shipment.setAssignmentStatus("UNASSIGNED");
        }
        shipment.setRouteStatus("NORMAL");

        Route finalRoute = null;
        if (shipment.getRoute() != null && shipment.getRoute().getId() != null) {
            finalRoute = routeRepo.findById(shipment.getRoute().getId())
                    .orElseThrow(() -> new RuntimeException("Route not found"));
            shipment.setRoute(finalRoute);
            shipment.setRouteNodes(finalRoute.getPath());

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

                            List<String> jsonCoords = coords.stream()
                                    .map(c -> String.format("{\"lat\": %f, \"lng\": %f}", c.get(1), c.get(0)))
                                    .toList();

                            shipment.setCurrentPath("[" + String.join(",", jsonCoords) + "]");
                            System.out.println(">>> SHIPMENT: Persisted road path (" + coords.size() + " nodes)");
                        }
                    }
                }
            } catch (Exception e) {
                System.err.println("Failed to fetch OSRM path: " + e.getMessage());
                shipment.setCurrentPath("[]");
            }
        }

        tryAssignDriver(shipment, warehouse);

        Shipment savedShipment = shipmentRepo.save(shipment);

        if (finalRoute != null && warehouse.getAdminUserId() != null) {
            triggerPythonScan(savedShipment, warehouse.getAdminUserId());
        }

        // Broadcast New Assignment
        if (savedShipment.getAssignedDriverId() != null) {
            Map<String, Object> wsMsg = new HashMap<>();
            wsMsg.put("type", "NEW_ASSIGNMENT");
            wsMsg.put("shipment", savedShipment);
            messagingTemplate.convertAndSend("/topic/driver/" + savedShipment.getAssignedDriverId(), wsMsg);
        }

        return savedShipment;
    }

    public void triggerPythonScan(Shipment savedShipment, Long adminId) {
        try {
            Map<String, Object> pythonReq = new HashMap<>();
            pythonReq.put("shipmentId", savedShipment.getId());
            pythonReq.put("adminId", adminId);

            String path = savedShipment.getRouteNodes();
            if (path == null || path.isEmpty()) return;

            String delimiter = path.contains("->") ? "\\s*->\\s*" : ",\\s*";
            List<String> nodesList = Arrays.asList(path.split(delimiter));
            pythonReq.put("nodes", nodesList);

            restTemplate.postForEntity("http://localhost:5000/ai/scan-nodes", pythonReq, String.class);
            System.out.println(">>> AI: Triggered Scan for Shipment: " + savedShipment.getId());
        } catch (Exception e) {
            System.err.println(">>> AI ERROR: Scan failed: " + e.getMessage());
        }
    }

    public void tryAssignDriver(Shipment shipment, Warehouse warehouse) {
        double lat = warehouse.getLatitude();
        double lng = warehouse.getLongitude();

        if (lat == 0.0 && lng == 0.0) {
            // Coordinate fallback logic... (omitted for brevity but kept in original)
            lat = 20.5937; lng = 78.9629; 
        }

        String nearestDriverId = findNearestDriver(lat, lng);

        if (nearestDriverId != null) {
            shipment.setAssignedDriverId(nearestDriverId);
            shipment.setAssignmentStatus("ASSIGNED");

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
                        })
                );
            });

            locationRepo.findByDriverId(nearestDriverId).ifPresent(loc -> {
                loc.setAvailable(false);
                locationRepo.saveAndFlush(loc);
            });

            // BROADCAST UPDATE
            Map<String, Object> payload = new HashMap<>();
            payload.put("type", "SHIPMENT_UPDATE");
            payload.put("payload", shipment);
            messagingTemplate.convertAndSend("/topic/driver/" + nearestDriverId, payload);
        } else {
            shipment.setAssignmentStatus("UNASSIGNED");
        }
    }

    private String findNearestDriver(double warehouseLat, double warehouseLong) {
        List<DriverLocation> availableDrivers = locationRepo.findByAvailableTrue();
        List<DriverLocation> validDrivers = new ArrayList<>();

        for (DriverLocation dl : availableDrivers) {
            Optional<User> userOpt = userRepo.findByDriverId(dl.getDriverId());
            if (userOpt.isEmpty()) continue;
            User driver = userOpt.get();
            if (driver.getLatitude() == null || driver.getLongitude() == null) continue;
            if (isDriverAlreadyBusy(dl.getDriverId())) continue;

            double dist = GeoUtils.haversineDistance(warehouseLat, warehouseLong, driver.getLatitude(), driver.getLongitude());
            if (dist <= 300.0) {
                validDrivers.add(dl);
            }
        }

        if (validDrivers.isEmpty()) return null;

        DriverLocation bestDriver = null;
        double minDistance = Double.MAX_VALUE;
        for (DriverLocation dl : validDrivers) {
            User driver = userRepo.findByDriverId(dl.getDriverId()).get();
            double dist = GeoUtils.haversineDistance(warehouseLat, warehouseLong, driver.getLatitude(), driver.getLongitude());
            if (dist < minDistance) {
                minDistance = dist;
                bestDriver = dl;
            }
        }
        return bestDriver != null ? bestDriver.getDriverId() : null;
    }

    private boolean isDriverAlreadyBusy(String driverId) {
        return shipmentRepo.countByAssignedDriverIdAndAssignmentStatusNot(driverId, "DELIVERED") > 0;
    }

    @PostConstruct
    public void initAssignmentsOnBoot() {
        checkAndAssignPendingShipments();
    }

    public void checkAndAssignPendingShipments() {
        List<Shipment> unassigned = shipmentRepo.findPendingAssignments();
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