package com.web.backend_SupplyLens.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.web.backend_SupplyLens.model.DriverLocation;
import com.web.backend_SupplyLens.model.Shipment;
import com.web.backend_SupplyLens.repository.DriverLocationRepository;
import com.web.backend_SupplyLens.repository.ShipmentRepository;
import com.web.backend_SupplyLens.service.ShipmentService;

@RestController
@RequestMapping("/api/shipments")
public class ShipmentController {

    @Autowired
    private ShipmentService shipmentService;

    @Autowired
    private ShipmentRepository shipmentRepo;

    @Autowired
    private DriverLocationRepository locationRepo;

    @PostMapping("/create")
    public ResponseEntity<?> createShipment(@RequestBody Shipment shipment, @RequestParam Long warehouseId) {
        try {
            System.out.println(">>> CONTROLLER: Creating shipment for warehouse " + warehouseId);
            return ResponseEntity.ok(shipmentService.creatAndAssign(shipment, warehouseId));
        } catch (Exception e) {
            System.err.println(">>> CONTROLLER ERROR: Failed to create shipment!");
            e.printStackTrace();
            return ResponseEntity.status(500).body(e.getMessage());
        }
    }

    @PostMapping("/{id}/delivered")
    public ResponseEntity<?> markDelivered(@PathVariable Long id) {
        Shipment s = shipmentRepo.findById(id).orElseThrow();
        s.setAssignmentStatus("DELIVERED");
        shipmentRepo.save(s);

        locationRepo.findByDriverId(s.getAssignedDriverId()).ifPresent(loc -> {
            loc.setAvailable(true);
            locationRepo.save(loc);
            
            // Trigger auto-assignment for waiting shipments
            shipmentService.checkAndAssignPendingShipments();
        });
        return ResponseEntity.ok("Delivered");
    }

    @GetMapping("/location/{driverId}")
    public DriverLocation getDriverLocation(@PathVariable String driverId) {
        return locationRepo.findByDriverId(driverId).orElseThrow();
    }
}