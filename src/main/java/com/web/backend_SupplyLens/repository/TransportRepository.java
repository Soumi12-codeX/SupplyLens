package com.web.backend_SupplyLens.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.web.backend_SupplyLens.model.Transport;
import com.web.backend_SupplyLens.model.User;

@Repository
public interface TransportRepository extends JpaRepository<Transport, Long> {

    Optional<Transport> findByDriver(User driver);
}
