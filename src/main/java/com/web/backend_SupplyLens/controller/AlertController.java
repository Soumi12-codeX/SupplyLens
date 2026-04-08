package com.web.backend_SupplyLens.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.web.backend_SupplyLens.model.Alert;
import com.web.backend_SupplyLens.service.AlertService;

@RestController
@RequestMapping("api/alerts")
public class AlertController {
    
    @Autowired
    private AlertService alertService;

    @PostMapping("/from-python")
    public Alert receiveAlert(@RequestBody Alert alert){
        return alertService.saveAlert(alert);
    }

    @GetMapping("/all")
    public List<Alert> getAllAlerts(){
        return alertService.getAllAlerts();
    }
}