package com.web.backend_SupplyLens.service;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.regex.Pattern;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import com.web.backend_SupplyLens.model.Shipment;
import com.web.backend_SupplyLens.model.TransitNode;
import com.web.backend_SupplyLens.repository.DriverLocationRepository;
import com.web.backend_SupplyLens.repository.ShipmentRepository;

import com.web.backend_SupplyLens.repository.UserRepository;
import jakarta.transaction.Transactional;

@Service
public class TruckSimulatorService {

    @Autowired
    private ShipmentRepository shipmentRepo;

    @Autowired
    private DriverLocationRepository driverLocationRepo;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ShipmentService shipmentService;

    @Autowired
    private CoordinateService coordinateService;

    // Smooth simulation: 300 steps per leg at 500ms interval = ~2.5 minutes per city-to-city leg
    private static final int STEPS_PER_LEG = 300;

    private final Map<String, SimState> simStates = new ConcurrentHashMap<>();

    @Scheduled(fixedDelay = 500)
    @Transactional
    public void tick() {
        List<Shipment> activeShipments = shipmentRepo.findAll().stream().filter(
                s -> ("IN_PROGRESS".equals(s.getAssignmentStatus()))
                        && s.getAssignedDriverId() != null)
                .toList();

        for (Shipment shipment : activeShipments) {
            String driverId = shipment.getAssignedDriverId();
            
            // Try to follow the high-fidelity road path from currentPath (JSON)
            List<TransitNode> roadPath = parseJsonPath(shipment.getCurrentPath());

            if (roadPath.isEmpty()) {
                // Fallback to hub-to-hub straight line movement if no road path exists
                System.out.println(">>> SIMULATOR DEBUG: Shipment " + shipment.getId() + " has empty roadPath (currentPath length=" + 
                    (shipment.getCurrentPath() != null ? shipment.getCurrentPath().length() : "null") + "). Falling back to straight-line.");
                handleStraightLineMovement(shipment, driverId);
                continue;
            }

            SimState state = simStates.computeIfAbsent(driverId, k -> {
                SimState s = new SimState();
                s.nodeIndex = 0;
                s.step = 0;
                s.currentPath = shipment.getCurrentPath();
                System.out.println(">>> SIMULATOR DEBUG: NEW SimState for driver " + driverId + " | roadPath.size()=" + roadPath.size() + " | step=0");
                return s;
            });

            // If the path has changed (e.g. due to rerouting), find nearest point on new path
            // and resume from there — do NOT reset to 0 (that would cause instant delivery)
            if (shipment.getCurrentPath() != null && !shipment.getCurrentPath().equals(state.currentPath)) {
                System.out.println(">>> SIMULATOR: Path changed for driver " + driverId + " (REROUTE detected). Finding resume point.");
                state.currentPath = shipment.getCurrentPath();

                // Find driver's current GPS position to locate nearest point on new path
                int resumeStep = 0;
                final String fDriverId = driverId;
                var locOpt = driverLocationRepo.findByDriverId(fDriverId);
                if (locOpt.isPresent()) {
                    double curLat = locOpt.get().getLatitude();
                    double curLng = locOpt.get().getLongitude();
                    double minDist = Double.MAX_VALUE;
                    for (int i = 0; i < roadPath.size(); i++) {
                        double dLat = roadPath.get(i).getLatitude() - curLat;
                        double dLng = roadPath.get(i).getLongitude() - curLng;
                        double dist = dLat * dLat + dLng * dLng;
                        if (dist < minDist) {
                            minDist = dist;
                            resumeStep = i;
                        }
                    }
                }
                // Calculate the step value based on skip factor so simulation resumes correctly
                int newSkipFactor = Math.max(1, roadPath.size() / 1800);
                state.step = resumeStep / newSkipFactor;
                state.nodeIndex = 0;
                System.out.println(">>> SIMULATOR: Resuming at step " + state.step + " (coord index ~" + resumeStep + " of " + roadPath.size() + ")");
            }

            // Dynamic skip: complete any journey in ~1800 visible steps (~15 min at 500ms)
            int totalCoords = roadPath.size();
            int skipFactor = Math.max(1, totalCoords / 1800);

            // Calculate the actual position index using the skip factor
            int posIndex = state.step * skipFactor;

            // DEBUG: Log every 100th tick to trace progression
            if (state.step % 100 == 0) {
                System.out.println(">>> SIMULATOR DEBUG: Shipment " + shipment.getId() + " | driver=" + driverId + 
                    " | step=" + state.step + " | posIndex=" + posIndex + " | totalCoords=" + totalCoords + 
                    " | skipFactor=" + skipFactor);
            }

            if (posIndex >= totalCoords) {
                System.out.println(">>> SIMULATOR DEBUG: DELIVERING shipment " + shipment.getId() + " | posIndex=" + posIndex + " >= totalCoords=" + totalCoords + " | step=" + state.step);
                deliverShipment(shipment, driverId, roadPath.get(totalCoords - 1));
                continue;
            }

            TransitNode currentPos = roadPath.get(posIndex);
            
            // update in db
            driverLocationRepo.findByDriverId(driverId).ifPresent(loc -> {
                loc.setLatitude(currentPos.getLatitude());
                loc.setLongitude(currentPos.getLongitude());
                loc.setLastUpdated(LocalDateTime.now());
                driverLocationRepo.save(loc);
            });

            state.step++;
            
            // Check if NEXT step would exceed the path
            if ((state.step * skipFactor) >= totalCoords) {
                deliverShipment(shipment, driverId, roadPath.get(totalCoords - 1));
            }
        }
    }

    private List<TransitNode> parseJsonPath(String jsonPath) {
        if (jsonPath == null || !jsonPath.startsWith("[")) return List.of();
        try {
            // Very basic manual parsing to avoid adding heavy JSON dependencies
            // Format: [{"lat": 22.1, "lng": 88.2}, ...]
            List<TransitNode> path = new java.util.ArrayList<>();
            String[] points = jsonPath.substring(1, jsonPath.length() - 1).split("\\},\\{");
            for (String p : points) {
                String clean = p.replace("{", "").replace("}", "");
                String[] parts = clean.split(",");
                double lat = 0, lng = 0;
                for (String part : parts) {
                    if (part.contains("lat")) lat = Double.parseDouble(part.split(":")[1].trim());
                    if (part.contains("lng")) lng = Double.parseDouble(part.split(":")[1].trim());
                }
                TransitNode tn = new TransitNode();
                tn.setLatitude(lat);
                tn.setLongitude(lng);
                path.add(tn);
            }
            return path;
        } catch (Exception e) {
            return List.of();
        }
    }

    private void handleStraightLineMovement(Shipment shipment, String driverId) {
        List<String> nodes = parseNodes(shipment.getRouteNodes());
        if (nodes.size() < 2) return;

        SimState state = simStates.computeIfAbsent(driverId, k -> {
            SimState s = new SimState();
            s.nodeIndex = 0;
            s.step = 0;
            return s;
        });

        if (state.nodeIndex >= nodes.size() - 1) return;

        String fromCity = nodes.get(state.nodeIndex);
        String toCity = nodes.get(state.nodeIndex + 1);
        TransitNode from = coordinateService.getCoordinates(fromCity);
        TransitNode to = coordinateService.getCoordinates(toCity);

        if (from == null || to == null) return;

        state.step++;
        double progress = (double) state.step / STEPS_PER_LEG;
        double lat = from.getLatitude() + (to.getLatitude() - from.getLatitude()) * progress;
        double lng = from.getLongitude() + (to.getLongitude() - from.getLongitude()) * progress;

        driverLocationRepo.findByDriverId(driverId).ifPresent(loc -> {
            loc.setLatitude(lat);
            loc.setLongitude(lng);
            loc.setLastUpdated(LocalDateTime.now());
            driverLocationRepo.save(loc);
        });

        if (state.step >= STEPS_PER_LEG) {
            state.nodeIndex++;
            state.step = 0;
            if (state.nodeIndex >= nodes.size() - 1) {
                deliverShipment(shipment, driverId, to);
            }
        }
    }

    private void deliverShipment(Shipment shipment, String driverId, TransitNode finalPos) {
        System.out.println(">>> SIMULATOR: Shipment " + shipment.getId() + " is now DELIVERED!");
        shipment.setAssignmentStatus("DELIVERED");
        shipmentRepo.save(shipment);

        driverLocationRepo.findByDriverId(driverId).ifPresent(loc -> {
            loc.setAvailable(true);
            userRepository.findByDriverId(driverId).ifPresent(user -> {
                if (user.getLatitude() != null && user.getLongitude() != null) {
                    loc.setLatitude(user.getLatitude());
                    loc.setLongitude(user.getLongitude());
                } else {
                    loc.setLatitude(finalPos.getLatitude());
                    loc.setLongitude(finalPos.getLongitude());
                }
            });
            loc.setLastUpdated(LocalDateTime.now());
            driverLocationRepo.saveAndFlush(loc);
        });

        simStates.remove(driverId);
        shipmentService.checkAndAssignPendingShipments();
    }

    private List<String> parseNodes(String routeNodes) {
        // handles both "A -> B -> C" and "A, B, C" formats
        String delimiter = routeNodes.contains("->") ? "->" : ",";
        return Arrays.stream(routeNodes.split(Pattern.quote(delimiter)))
                .map(String::trim)
                .filter(s -> !s.isBlank())
                .toList();
    }

    private static class SimState {
        int nodeIndex; // index of the starting node or node currently travelling from
        int step; // no of steps between consequent nodes at a time
        String currentPath; // Track the current path to detect reroutes
    }

}
