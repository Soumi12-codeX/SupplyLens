package com.web.backend_SupplyLens.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.web.backend_SupplyLens.model.TransitNode;
import java.util.Optional;

@Repository
public interface TransitNodeRepository extends JpaRepository<TransitNode, Long> {
    Optional<TransitNode> findByName(String name);
}
