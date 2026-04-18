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

    // Fallback coordinate mapping for systemic consistency
    private static final java.util.Map<String, double[]> CITY_COORDINATES = new java.util.HashMap<>();
    static {
        CITY_COORDINATES.put("Kolkata", new double[] { 22.5726, 88.3639 });
        CITY_COORDINATES.put("Howrah", new double[] { 22.5958, 88.2636 });
        CITY_COORDINATES.put("Mumbai", new double[] { 19.0760, 72.8777 });
        CITY_COORDINATES.put("Delhi", new double[] { 28.6139, 77.2090 });
        CITY_COORDINATES.put("Bangalore", new double[] { 12.9716, 77.5946 });
        CITY_COORDINATES.put("Hyderabad", new double[] { 17.3850, 78.4867 });
        CITY_COORDINATES.put("Chennai", new double[] { 13.0827, 80.2707 });
        CITY_COORDINATES.put("Pune", new double[] { 18.5204, 73.8567 });
        CITY_COORDINATES.put("Ahmedabad", new double[] { 23.0225, 72.5714 });
        CITY_COORDINATES.put("Jaipur", new double[] { 26.9124, 75.7873 });
        CITY_COORDINATES.put("Lucknow", new double[] { 26.8467, 80.9462 });
    }

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

    @Autowired
    private ShipmentService shipmentService;

    public AuthResponse adminLogin(String email, String password) {
        User user = userRepo.findByEmail(email).orElseThrow();

        if (!passwordEncoder.matches(password, user.getPassword())) {
            throw new RuntimeException("Invalid credentials!");
        }

        String token = jwtService.generateToken(user.getEmail(), user.getRole());

        return new AuthResponse(token, user);
    }

    public AuthResponse driverLogin(String driverId, String pin) {
        User driver = userRepo.findByDriverId(driverId).orElseThrow();

        if (!passwordEncoder.matches(pin, driver.getPin())) {
            throw new RuntimeException("Invalid pin!");
        }
        String token = jwtService.generateToken(driver.getDriverId(), driver.getRole());
        return new AuthResponse(token, driver);
    }

    public User register(User user) {
        if (user.getEmail() != null && userRepo.findByEmail(user.getEmail()).isPresent()) {
            throw new RuntimeException("Email already exists!");
        }

        // Auto-generate driverId for drivers if not provided
        if ("DRIVER".equalsIgnoreCase(user.getRole()) && (user.getDriverId() == null || user.getDriverId().isBlank())) {
            String cityPrefix = (user.getCity() != null && user.getCity().length() >= 3)
                    ? user.getCity().substring(0, 3).toUpperCase()
                    : "DRV";
            String generatedId;
            do {
                int suffix = (int) (Math.random() * 9000) + 1000; // 4-digit: 1000–9999
                generatedId = cityPrefix + "-" + suffix;
            } while (userRepo.findByDriverId(generatedId).isPresent());
            user.setDriverId(generatedId);
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

        // Fallback coordinate population from city name
        if ("DRIVER".equalsIgnoreCase(user.getRole()) && user.getCity() != null) {
            if (user.getLatitude() == null || user.getLongitude() == null) {
                double[] coords = CITY_COORDINATES.get(user.getCity());
                if (coords != null) {
                    System.out.println(">>> BACKEND FALLBACK: Populating coordinates for " + user.getCity());
                    user.setLatitude(coords[0]);
                    user.setLongitude(coords[1]);
                }
            }
        }

        if ("ADMIN".equalsIgnoreCase(user.getRole()) && user.getWarehouse() != null) {
            Long warehouseId = user.getWarehouse().getId();
            Warehouse warehouse = warehouseRepo.findById(warehouseId)
                    .orElseThrow(() -> new RuntimeException("Warehouse does not exists"));
            user.setWarehouse(warehouse);
        }

        User savedUser = userRepo.save(user);

        if ("ADMIN".equalsIgnoreCase(savedUser.getRole()) && savedUser.getWarehouse() != null) {
            Warehouse warehouse = savedUser.getWarehouse();
            if (warehouse.getAdminUserId() == null) {
                warehouse.setAdminUserId(savedUser.getId());
                warehouseRepo.save(warehouse);
            }
        }

        // If it's a driver, initialize their location so they can be assigned shipments
        if ("DRIVER".equalsIgnoreCase(savedUser.getRole()) && savedUser.getDriverId() != null) {
            DriverLocation location = new DriverLocation();
            location.setDriverId(savedUser.getDriverId());
            location.setAvailable(true);

            // Use registered coordinates if available, otherwise default to central India
            if (savedUser.getLatitude() != null && savedUser.getLongitude() != null) {
                location.setLatitude(savedUser.getLatitude());
                location.setLongitude(savedUser.getLongitude());
            } else {
                location.setLatitude(20.5937);
                location.setLongitude(78.9629);
            }

            location.setLastUpdated(LocalDateTime.now());
            driverLocationRepo.save(location);

            // New driver is available! Check if any shipments are waiting
            shipmentService.checkAndAssignPendingShipments();
        }
        return savedUser;
    }
}
