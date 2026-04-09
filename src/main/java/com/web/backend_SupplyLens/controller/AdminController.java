package com.web.backend_SupplyLens.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.web.backend_SupplyLens.model.Shipment;
import com.web.backend_SupplyLens.service.ShipmentService;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    @Autowired
    private ShipmentService shipmentService;

    @GetMapping("/shipments")
    public List<Shipment> getAll() {
        return shipmentService.getAllShipments();
    }
}