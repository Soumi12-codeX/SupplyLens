package com.web.backend_SupplyLens.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.web.backend_SupplyLens.model.Shipment;
import com.web.backend_SupplyLens.model.Transport;
import com.web.backend_SupplyLens.model.User;
import com.web.backend_SupplyLens.repository.ShipmentRepository;
import com.web.backend_SupplyLens.repository.TransportRepository;
import com.web.backend_SupplyLens.repository.UserRepository;

@RestController
@RequestMapping("/api/driver")
public class DriverController {
    
    @Autowired
    private TransportRepository transportRepo;

    @Autowired
    private ShipmentRepository shipmentRepo;

    @Autowired
    private UserRepository userRepo;

    @GetMapping("/shipments/{driverId}")
    public List<Shipment> getShipmentsForDriver(@PathVariable String driverId){
        User driver = userRepo.findByDriverId(driverId).orElseThrow();
        Transport transport = transportRepo.findByDriver(driver).orElseThrow();
        return shipmentRepo.findByTransportId(transport.getId());
    }
}
