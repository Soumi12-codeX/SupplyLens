package com.web.backend_SupplyLens.service;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.web.backend_SupplyLens.model.Shipment;
import com.web.backend_SupplyLens.repository.ShipmentRepository;

@Service
public class ShipmentService {
    
    @Autowired
    private ShipmentRepository shipmentRepo;

    public List<Shipment> getAllShipments() {
        return shipmentRepo.findAll();
    }
}
