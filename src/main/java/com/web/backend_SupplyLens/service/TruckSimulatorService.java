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

import jakarta.transaction.Transactional;

@Service
public class TruckSimulatorService {

    @Autowired
    private ShipmentRepository shipmentRepo;

    @Autowired
    private DriverLocationRepository driverLocationRepo;

    @Autowired
    private ShipmentService shipmentService;

    @Autowired
    private CoordinateService coordinateService;

    // steps between two nodes 20...1/20 covered ~ 25% distance covered
    private static final int STEPS_PER_LEG = 20;

    private final Map<String, SimState> simStates = new ConcurrentHashMap<>();

    @Scheduled(fixedDelay = 1500)
    @Transactional
    public void tick() {
        List<Shipment> activeShipments = shipmentRepo.findAll().stream().filter(
                s -> ("ASSIGNED".equals(s.getAssignmentStatus()) || "IN_PROGRESS".equals(s.getAssignmentStatus()))
                        && s.getAssignedDriverId() != null && s.getRouteNodes() != null && !s.getRouteNodes().isBlank())
                .toList();

        for (Shipment shipment : activeShipments) {
            String driverId = shipment.getAssignedDriverId();
            List<String> nodes = parseNodes(shipment.getRouteNodes());

            if (nodes.size() < 2) {
                continue;
            }
            // initialisation
            SimState state = simStates.computeIfAbsent(driverId, k -> {
                SimState s = new SimState();
                s.nodeIndex = 0;
                s.step = 0;
                return s;
            });
            // finished all legs
            if (state.nodeIndex >= nodes.size() - 1)
                continue;

            String fromCity = nodes.get(state.nodeIndex);
            String toCity = nodes.get(state.nodeIndex + 1);

            // fetch coordinates from transit nodes
            TransitNode from = coordinateService.getCoordinates(fromCity);

            TransitNode to = coordinateService.getCoordinates(toCity);

            if (from == null || to == null) {
                System.err.printf(">>> SIMULATOR: Could not resolve coordinates for '%s' or '%s' — skipping%n",
                        fromCity, toCity);
                continue;
            }

            state.step++;

            double progress = (double) state.step / STEPS_PER_LEG;
            double lat = from.getLatitude() + (to.getLatitude() - from.getLatitude()) * progress;

            double lng = from.getLongitude() + (to.getLongitude() - from.getLongitude()) * progress;

            // update in db
            driverLocationRepo.findByDriverId(driverId).ifPresent(loc -> {
                loc.setLatitude(lat);
                loc.setLongitude(lng);
                loc.setLastUpdated(LocalDateTime.now());
                driverLocationRepo.save(loc);
            });
            System.out.printf(">>> SIMULATOR: Driver %-10s | %-12s → %-12s | step %2d/%2d | %.4f, %.4f%n",
                    driverId, fromCity, toCity, state.step, STEPS_PER_LEG, lat, lng);

            // arrive at next node
            if (state.step >= STEPS_PER_LEG) {
                state.nodeIndex++;
                state.step = 0;

                shipment.setCurrentPath(toCity);
                shipmentRepo.save(shipment);
                System.out.println(">>> SIMULATOR: Driver " + driverId + " arrived at " + toCity);

                // final destination reached
                if (state.nodeIndex >= nodes.size() - 1) {
                    shipment.setAssignmentStatus("DELIVERED");
                    shipmentRepo.save(shipment);

                    driverLocationRepo.findByDriverId(driverId).ifPresent(loc -> {
                        loc.setAvailable(true);
                        loc.setLatitude(to.getLatitude());
                        loc.setLongitude(to.getLongitude());
                        loc.setLastUpdated(LocalDateTime.now());
                        driverLocationRepo.save(loc);
                    });

                    simStates.remove(driverId);
                    System.out.println(">>> SIMULATOR: Shipment " + shipment.getId()
                            + " DELIVERED. Driver " + driverId + " is now free.");

                    shipmentService.checkAndAssignPendingShipments();
                }
            }

        }
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
    }

}
