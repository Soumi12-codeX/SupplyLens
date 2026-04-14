package com.web.backend_SupplyLens.config;

import com.web.backend_SupplyLens.model.DriverLocation;
import com.web.backend_SupplyLens.model.User;
import com.web.backend_SupplyLens.repository.DriverLocationRepository;
import com.web.backend_SupplyLens.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;

@Component
public class DataInitializer implements CommandLineRunner {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private DriverLocationRepository driverLocationRepository;

    @Override
    public void run(String... args) throws Exception {
        System.out.println(">>> CHECKING DRIVER REQUISITIONS...");
        
        List<User> drivers = userRepository.findByRole("DRIVER");
        for (User driver : drivers) {
            String drvId = driver.getDriverId();
            if (drvId == null) continue;

            if (driverLocationRepository.findByDriverId(drvId).isEmpty()) {
                System.out.println(">>> INITIALIZING LOCATION FOR DRIVER: " + drvId);
                DriverLocation location = new DriverLocation();
                location.setDriverId(drvId);
                location.setAvailable(true);
                location.setLatitude(20.5937);
                location.setLongitude(78.9629);
                location.setLastUpdated(LocalDateTime.now());
                driverLocationRepository.save(location);
            }
        }
        
        System.out.println(">>> DRIVER POOL READY.");
    }
}
