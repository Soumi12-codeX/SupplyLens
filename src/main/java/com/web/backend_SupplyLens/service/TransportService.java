package com.web.backend_SupplyLens.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.web.backend_SupplyLens.model.Transport;
import com.web.backend_SupplyLens.model.User;
import com.web.backend_SupplyLens.repository.TransportRepository;
import com.web.backend_SupplyLens.repository.UserRepository;

@Service
public class TransportService {
    
    @Autowired
    private TransportRepository transportRepo;

    @Autowired
    private UserRepository userRepo;

    public Transport assignDriver(Long transportId, Long userId){
        Transport t =  transportRepo.findById(transportId).orElseThrow();
        User driver = userRepo.findById(userId).orElseThrow();

        t.setDriver(driver);
        return transportRepo.save(t);
    }

}
