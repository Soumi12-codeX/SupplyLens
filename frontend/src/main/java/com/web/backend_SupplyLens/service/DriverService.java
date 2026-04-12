package com.web.backend_SupplyLens.service;

import java.time.LocalDateTime;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import com.web.backend_SupplyLens.model.DriverLocation;
import com.web.backend_SupplyLens.repository.DriverLocationRepository;

@Service
public class DriverService {
    @Autowired
    private DriverLocationRepository locationRepo;

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    public void updateLocation(String driverId, double lat, double lng){
        DriverLocation loc = locationRepo.findByDriverId(driverId).orElse(new DriverLocation());
        loc.setDriverId(driverId);
        loc.setLatitude(lat);
        loc.setLongitude(lng);
        loc.setLastUpdated(LocalDateTime.now());
        if (loc.getId() == null) {
            loc.setAvailable(true);
        }

        locationRepo.save(loc);
        messagingTemplate.convertAndSend("/topic/location" + driverId, loc);
    }
}
