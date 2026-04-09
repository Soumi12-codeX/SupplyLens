package com.web.backend_SupplyLens.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.web.backend_SupplyLens.model.Shipment;

@Repository
public interface ShipmentRepository extends JpaRepository<Shipment, String> {
    List<Shipment> findByTransport_Driver_DriverId(String driverId);
}
