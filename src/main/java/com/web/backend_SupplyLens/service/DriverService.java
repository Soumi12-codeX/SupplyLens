package com.web.backend_SupplyLens.service;

import java.time.LocalDateTime;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.web.backend_SupplyLens.model.DriverLocation;
import com.web.backend_SupplyLens.repository.DriverLocationRepository;

@Service
public class DriverService {
    @Autowired
    private DriverLocationRepository locationRepo;

    public void updateLocation(String driverId, double lat, double lng){
        DriverLocation loc = locationRepo.findByDriverId(driverId).orElse(new DriverLocation());
        loc.setDriverId(driverId);
        loc.setLatitude(lat);
        loc.setLongitude(lng);
        loc.setLastUpdated(LocalDateTime.now());
        locationRepo.save(loc);
    }
}
