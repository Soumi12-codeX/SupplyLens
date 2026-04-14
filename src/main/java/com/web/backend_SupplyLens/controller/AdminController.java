package com.web.backend_SupplyLens.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.web.backend_SupplyLens.model.Shipment;
import com.web.backend_SupplyLens.model.User;
import com.web.backend_SupplyLens.repository.UserRepository;
import com.web.backend_SupplyLens.service.ShipmentService;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    @Autowired
    private ShipmentService shipmentService;

    @Autowired
    private UserRepository userRepository;

    @GetMapping("/shipments")
    public List<Shipment> getAll(@org.springframework.web.bind.annotation.RequestParam(required = false) Long warehouseId) {
        System.out.println(">>> ADMIN FETCH SHIPMENTS - WarehouseID Filter: " + warehouseId);
        if (warehouseId != null) {
            return shipmentService.getShipmentsByWarehouse(warehouseId);
        }
        return shipmentService.getAllShipments();
    }
    @GetMapping("/drivers/available")
    public List<User> getAvailableDrivers() {
        return userRepository.findByRole("DRIVER");
    }
}