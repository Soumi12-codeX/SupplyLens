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
    @Query("SELECT s FROM Shipment s JOIN FETCH s.warehouse JOIN FETCH s.route WHERE s.assignedDriverId = :driverId")
    List<Shipment> findByAssignedDriverId(@Param("driverId") String driverId);
    
    // for admin - see all shipments from their warehouse with full details
    @Query("SELECT s FROM Shipment s JOIN FETCH s.warehouse JOIN FETCH s.route WHERE s.warehouse.id = :warehouseId")
    List<Shipment> findByWarehouse_Id(@Param("warehouseId") Long warehouseId);
    
    List<Shipment> findByAdminId(Long adminId);
    
    // Find shipments that need a driver: either explicitly UNASSIGNED 
    // or ASSIGNED but missing a driver ID (stuck shipments)
    @Query("SELECT s FROM Shipment s WHERE s.assignmentStatus = 'UNASSIGNED' OR (s.assignmentStatus = 'ASSIGNED' AND s.assignedDriverId IS NULL)")
    List<Shipment> findPendingAssignments();

    @Query("SELECT s FROM Shipment s JOIN s.route r WHERE LOWER(r.path) LIKE LOWER(CONCAT('%', :nodeName, '%')) AND s.assignmentStatus != 'DELIVERED'")
    List<Shipment> findAffectedByNode(@Param("nodeName") String nodeName);
    long countByAssignedDriverIdAndAssignmentStatus(String driverId, String status);
    long countByAssignedDriverIdAndAssignmentStatusNot(String driverId, String status);
}
