package com.web.backend_SupplyLens.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.web.backend_SupplyLens.model.Route;

@Repository
public interface RouteRepository extends JpaRepository<Route, Long> {
    
    // find routes by source city
    List<Route> findBySource(String source);
    
    // find routes by destination city
    List<Route> findByDestination(String destination);
    
    // find routes between two cities
    List<Route> findBySourceAndDestination(String source, String destination);
}