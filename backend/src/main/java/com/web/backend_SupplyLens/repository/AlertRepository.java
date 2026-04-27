package com.web.backend_SupplyLens.repository;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.web.backend_SupplyLens.model.Alert;

@Repository
public interface AlertRepository extends JpaRepository<Alert, Long> {
    List<Alert> findByAdminId(Long adminId);
}
