package com.web.backend_SupplyLens.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.web.backend_SupplyLens.model.Warehouse;
import com.web.backend_SupplyLens.repository.WarehouseRepository;

import jakarta.transaction.Transactional;

@RestController
@RequestMapping("/api/warehouse")
public class WarehouseController {

    @Autowired
    private WarehouseRepository warehouseRepo;

    @PostMapping("/create")
    public ResponseEntity<?> createWarehouse(@RequestBody Warehouse warehouse) {
        return ResponseEntity.ok(warehouseRepo.save(warehouse));
    }

    @GetMapping("/all")
    public List<Warehouse> getAllWarehouses() {
        return warehouseRepo.findAll();
    }

    @Transactional
    @PutMapping("/{warehouseId}/assign-admin/{adminId}")
    public ResponseEntity<String> assignAdminToWarehouse(@PathVariable Long warehouseId, @PathVariable Long adminId) {
        Warehouse warehouse = warehouseRepo.findById(warehouseId)
                .orElseThrow(() -> new RuntimeException("Warehouse not found"));

        // Security Check: Ensure the warehouse isn't already taken
        if (warehouse.getAdminUserId() != null) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body("Warehouse already has an assigned admin.");
        }

        warehouse.setAdminUserId(adminId);
        warehouseRepo.save(warehouse);

        return ResponseEntity.ok("Admin " + adminId + " successfully registered to Warehouse: " + warehouse.getName());
    }
}
