package com.web.backend_SupplyLens.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.web.backend_SupplyLens.model.Shipment;

import com.web.backend_SupplyLens.repository.ShipmentRepository;


@RestController
@RequestMapping("/api/driver")
public class DriverController {
    

    @Autowired
    private ShipmentRepository shipmentRepo;

    @GetMapping("/shipments/{driverId}")
    public List<Shipment> getShipmentsForDriver(@PathVariable String driverId){
        return shipmentRepo.findByTransport_Driver_DriverId(driverId);
    }
}
