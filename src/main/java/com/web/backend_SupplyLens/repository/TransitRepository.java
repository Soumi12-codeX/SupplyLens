package com.web.backend_SupplyLens.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.web.backend_SupplyLens.model.TransitNode;

@Repository
public interface TransitRepository extends JpaRepository<TransitNode, Long> {
    Optional<TransitNode> findByNameIgnoreCase(String name);
    boolean existsByNameIgnoreCase(String name);
}
