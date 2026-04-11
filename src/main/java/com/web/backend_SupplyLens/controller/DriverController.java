package com.web.backend_SupplyLens.controller;

import java.util.List;

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
import com.web.backend_SupplyLens.service.DriverService;


@RestController
@RequestMapping("/api/driver")
public class DriverController {
    
    @Autowired
    private DriverService driverService;

    @Autowired
    private DriverLocationRepository locationRepo;

    @Autowired
    private ShipmentRepository shipmentRepo;

    @GetMapping("/shipments/{driverId}")
    public List<Shipment> getShipmentsForDriver(@PathVariable String driverId){
        return shipmentRepo.findByTransport_Driver_DriverId(driverId);
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
            locationRepo.save(loc);
        });

        return ResponseEntity.ok("Shipment delivered, driver is now available");
    }
}

