package com.web.backend_SupplyLens.controller;

import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.web.backend_SupplyLens.dto.DriverLocationRequest;
import com.web.backend_SupplyLens.model.Shipment;
import com.web.backend_SupplyLens.repository.DriverLocationRepository;
import com.web.backend_SupplyLens.repository.ShipmentRepository;
import com.web.backend_SupplyLens.repository.UserRepository;
import com.web.backend_SupplyLens.security.JwtService;
import com.web.backend_SupplyLens.service.DriverService;
import com.web.backend_SupplyLens.service.RedirectService;
import com.web.backend_SupplyLens.service.ShipmentService;

import jakarta.servlet.http.HttpServletRequest;

@RestController
@RequestMapping("/api/driver")
public class DriverController {

    @Autowired
    private DriverService driverService;

    @Autowired
    private DriverLocationRepository locationRepo;

    @Autowired
    private ShipmentRepository shipmentRepo;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ShipmentService shipmentService;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private RedirectService redirectService;

    @GetMapping("/shipments/{driverId}")
    public List<Shipment> getShipmentsForDriver(@PathVariable String driverId) {
        return shipmentRepo.findByAssignedDriverId(driverId);
    }

    // ✅ driver sends location every 15s from frontend
    @PostMapping("/location")
    public ResponseEntity<?> updateLocation(@RequestBody DriverLocationRequest req) {
        driverService.updateLocation(req.getDriverId(), req.getLatitude(), req.getLongitude());
        return ResponseEntity.ok("Location updated");
    }

    // ✅ admin watches driver live on map
    @GetMapping("/location/{driverId}")
    public ResponseEntity<?> getDriverLocation(@PathVariable String driverId) {
        return locationRepo.findByDriverId(driverId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // ✅ driver marks shipment as delivered → frees them up for next assignment
    @PostMapping("/shipments/{shipmentId}/delivered")
    public ResponseEntity<?> markDelivered(@PathVariable Long shipmentId) {
        Shipment shipment = shipmentRepo.findById(shipmentId).orElseThrow();
        shipment.setAssignmentStatus("DELIVERED");
        shipmentRepo.save(shipment);

        // mark driver available again for next assignment
        locationRepo.findByDriverId(shipment.getAssignedDriverId()).ifPresent(loc -> {
            loc.setAvailable(true);
            
            // Auto-return to base city coordinates
            userRepository.findByDriverId(shipment.getAssignedDriverId()).ifPresent(user -> {
                if (user.getLatitude() != null && user.getLongitude() != null) {
                    loc.setLatitude(user.getLatitude());
                    loc.setLongitude(user.getLongitude());
                }
            });

            locationRepo.saveAndFlush(loc);

            // Driver found! Try assigning them to another pending shipment immediately
            shipmentService.checkAndAssignPendingShipments();
        });

        return ResponseEntity.ok("Shipment delivered, driver is now available");
    }

    // ✅ driver starts the trip after being assigned
    @PostMapping("/shipments/{shipmentId}/start")
    public ResponseEntity<?> startTrip(@PathVariable Long shipmentId) {
        Shipment shipment = shipmentRepo.findById(shipmentId).orElseThrow();
        shipment.setAssignmentStatus("IN_PROGRESS");
        shipmentRepo.save(shipment);

        // mark driver unavailable when they start the trip and snap position to
        // warehouse
        locationRepo.findByDriverId(shipment.getAssignedDriverId()).ifPresent(loc -> {
            if (shipment.getWarehouse() != null) {
                loc.setLatitude(shipment.getWarehouse().getLatitude());
                loc.setLongitude(shipment.getWarehouse().getLongitude());
            }
            loc.setAvailable(false);
            locationRepo.save(loc);
        });

        return ResponseEntity.ok("Trip started! Drive safe.");
    }

    @GetMapping("/my-route-link")
    public ResponseEntity<?> getMyRouteLink(HttpServletRequest request) {

        // 1. Extract driverId from JWT — driver can never fake this
        String header = request.getHeader("Authorization");
        System.out.println("Auth Header received: " + header);
        if (header == null || !header.startsWith("Bearer ")) {
            System.out.println("Failed at header check");
            return ResponseEntity.status(401).body("Missing token");
        }
        String token = header.substring(7);

        String role = jwtService.extractRole(token);
        if (!"DRIVER".equalsIgnoreCase(role)) {
            return ResponseEntity.status(403).body("Access denied — drivers only");
        }

        // driverLogin() sets driverId as JWT subject — so extractUsername gives
        // driverId
        String driverId = jwtService.extractUsername(token);

        // 2. Find active shipment for this driver only
        Shipment activeShipment = shipmentRepo.findByAssignedDriverId(driverId).stream()
                .filter(s -> "ASSIGNED".equals(s.getAssignmentStatus())
                        || "IN_PROGRESS".equals(s.getAssignmentStatus()))
                .findFirst()
                .orElse(null);

        if (activeShipment == null) {
            return ResponseEntity.status(404).body("No active shipment assigned to you");
        }

        if (activeShipment.getRoute() == null) {
            return ResponseEntity.status(404).body("Shipment has no route assigned");
        }

        // 3. Generate Google Maps link
        try {
            String link;
            if ("REROUTED".equals(activeShipment.getRouteStatus()) && activeShipment.getActiveRouteOptionId() != null) {
                Long sourceWhId = activeShipment.getWarehouse() != null ? activeShipment.getWarehouse().getId() : 1L;
                Long destWhId = activeShipment.getRoute().getDestination().getId();
                link = redirectService.generateRedirectLinkFromOption(activeShipment.getActiveRouteOptionId(), sourceWhId, destWhId);
            } else {
                link = redirectService.generateDefaultRouteLink(activeShipment.getRoute().getId());
            }
            return ResponseEntity.ok(Map.of(
                    "driverId", driverId,
                    "shipmentId", activeShipment.getId(),
                    "googleMapsLink", link));
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Could not generate route link: " + e.getMessage());
        }
    }
}
