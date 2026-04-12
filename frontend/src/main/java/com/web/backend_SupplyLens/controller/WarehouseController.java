package com.web.backend_SupplyLens.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.web.backend_SupplyLens.model.Warehouse;
import com.web.backend_SupplyLens.repository.WarehouseRepository;

@RestController
@RequestMapping("/api/warehouse")
public class WarehouseController {
    
    @Autowired
    private WarehouseRepository warehouseRepo;

    @PostMapping("/create")
    public ResponseEntity<?> createWarehouse(@RequestBody Warehouse warehouse){
        return ResponseEntity.ok(warehouseRepo.save(warehouse));
    }

    @GetMapping("/all")
    public List<Warehouse> getAllWarehouses(){
        return warehouseRepo.findAll();
    }
}
