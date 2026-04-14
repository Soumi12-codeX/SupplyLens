package com.web.backend_SupplyLens.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.web.backend_SupplyLens.dto.AuthResponse;
import com.web.backend_SupplyLens.model.DriverLocation;
import com.web.backend_SupplyLens.repository.DriverLocationRepository;
import com.web.backend_SupplyLens.model.User;
import com.web.backend_SupplyLens.model.Warehouse;
import com.web.backend_SupplyLens.repository.UserRepository;
import com.web.backend_SupplyLens.repository.WarehouseRepository;
import com.web.backend_SupplyLens.security.JwtService;

import java.time.LocalDateTime;

@Service
public class AuthService {

    @Autowired
    private UserRepository userRepo;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private WarehouseRepository warehouseRepo;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private DriverLocationRepository driverLocationRepo;

    public AuthResponse adminLogin(String email, String password) {
        User user = userRepo.findByEmail(email).orElseThrow();

        if (!passwordEncoder.matches(password, user.getPassword())) {
            throw new RuntimeException("Invalid credentials!");
        }

        String token = jwtService.generateToken(user.getEmail(), user.getRole());

        return new AuthResponse(token, user);
    }

    public String driverLogin(String driverId, String pin) {
        User driver = userRepo.findByDriverId(driverId).orElseThrow();

        if (!passwordEncoder.matches(pin, driver.getPin())) {
            throw new RuntimeException("Invalid pin!");
        }
        return jwtService.generateToken(driver.getDriverId(), driver.getRole());
    }

    public User register(User user) {
        if (user.getEmail() != null && userRepo.findByEmail(user.getEmail()).isPresent()) {
            throw new RuntimeException("Email already exists!");
        }
        if (user.getDriverId() != null && userRepo.findByDriverId(user.getDriverId()).isPresent()) {
            throw new RuntimeException("Driver Id already exists!");
        }
        if (user.getPassword() != null) {
            user.setPassword(passwordEncoder.encode(user.getPassword()));
        }
        if (user.getPin() != null) {
            user.setPin(passwordEncoder.encode(user.getPin()));
        }
        if ("ADMIN".equalsIgnoreCase(user.getRole()) && user.getWarehouse() != null) {
            Long warehouseId = user.getWarehouse().getId();
            Warehouse warehouse = warehouseRepo.findById(warehouseId)
                    .orElseThrow(() -> new RuntimeException("Warehouse does not exists"));
            user.setWarehouse(warehouse);
        }

        User savedUser = userRepo.save(user);

        // If it's a driver, initialize their location so they can be assigned shipments
        if ("DRIVER".equalsIgnoreCase(savedUser.getRole()) && savedUser.getDriverId() != null) {
            DriverLocation location = new DriverLocation();
            location.setDriverId(savedUser.getDriverId());
            location.setAvailable(true);
            location.setLatitude(20.5937); // Default central location
            location.setLongitude(78.9629);
            location.setLastUpdated(LocalDateTime.now());
            driverLocationRepo.save(location);
        }

        return savedUser;
    }
}
