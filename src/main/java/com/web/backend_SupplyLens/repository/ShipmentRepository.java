package com.web.backend_SupplyLens.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.web.backend_SupplyLens.model.Shipment;

@Repository
public interface ShipmentRepository extends JpaRepository<Shipment, Long> {
    List<Shipment> findByTransport_Driver_DriverId(String driverId);
    // for AlertService.updateShipments() - findById(Long) now works correctly
    // for ShipmentService - assigned driver queries
    List<Shipment> findByAssignedDriverId(String driverId);
    
    // for admin - see all shipments from their warehouse
    List<Shipment> findByWarehouse_Id(Long warehouseId);
    
    // for admin - filter by status
    List<Shipment> findByAssignmentStatus(String status);

    @Query("SELECT s FROM Shipment s WHERE s.route.routeNodes LIKE %:nodeName%")
    List<Shipment> findAffectedByNode(@Param("nodeName") String nodeName);
}
