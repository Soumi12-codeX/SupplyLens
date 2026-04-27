package com.web.backend_SupplyLens.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.web.backend_SupplyLens.model.Route;

@Repository
public interface RouteRepository extends JpaRepository<Route, Long> {
    
    // find routes by source warehouse ID
    List<Route> findBySource_Id(Long sourceId);
    
    // find routes by destination warehouse ID
    List<Route> findByDestination_Id(Long destinationId);
    
    // find routes between two warehouses
    List<Route> findBySource_IdAndDestination_Id(Long sourceId, Long destinationId);
}