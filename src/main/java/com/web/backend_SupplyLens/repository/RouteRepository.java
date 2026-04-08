package com.web.backend_SupplyLens.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.web.backend_SupplyLens.model.Route;

@Repository
public interface RouteRepository extends JpaRepository<Route, Long> {
}
