package com.web.backend_SupplyLens.service;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.web.backend_SupplyLens.model.Alert;
import com.web.backend_SupplyLens.repository.AlertRepository;

@Service
public class AlertService {
    
    @Autowired
    private AlertRepository alertRepo;

    public Alert saveAlert(Alert alert){
        alert.setTime(LocalDateTime.now());
        return alertRepo.save(alert);
    }

    public List<Alert> getAllAlerts(){
        return alertRepo.findAll();
    }
}
