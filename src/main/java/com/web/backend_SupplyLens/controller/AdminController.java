package com.web.backend_SupplyLens.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.web.backend_SupplyLens.dto.DriverDTO;
import com.web.backend_SupplyLens.model.DriverLocation;
import com.web.backend_SupplyLens.model.Shipment;
import com.web.backend_SupplyLens.model.User;
import com.web.backend_SupplyLens.repository.DriverLocationRepository;
import com.web.backend_SupplyLens.repository.UserRepository;
import com.web.backend_SupplyLens.service.ShipmentService;
import java.util.ArrayList;
import java.util.Optional;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    @Autowired
    private ShipmentService shipmentService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private DriverLocationRepository driverLocationRepository;

    @Autowired
    private com.web.backend_SupplyLens.repository.WarehouseRepository warehouseRepository;

    @GetMapping("/shipments")
    public List<Shipment> getAll(@org.springframework.web.bind.annotation.RequestParam(required = false) Long warehouseId) {
        System.out.println(">>> ADMIN FETCH SHIPMENTS - WarehouseID Filter: " + warehouseId);
        if (warehouseId != null) {
            return shipmentService.getShipmentsByWarehouse(warehouseId);
        }
        return shipmentService.getAllShipments();
    }

    @GetMapping("/drivers/available")
    public List<User> getAvailableDrivers() {
        return userRepository.findByRole("DRIVER");
    }

    @GetMapping("/drivers")
    public List<DriverDTO> getAllDrivers(@org.springframework.web.bind.annotation.RequestParam(required = false) Long originWarehouseId) {
        List<User> drivers = userRepository.findByRole("DRIVER");
        List<DriverDTO> driverDTOs = new ArrayList<>();

        com.web.backend_SupplyLens.model.Warehouse originWarehouse = null;
        if (originWarehouseId != null) {
            originWarehouse = warehouseRepository.findById(originWarehouseId).orElse(null);
        }

        for (User driver : drivers) {
            String status = "offline";
            String city = driver.getCity() != null ? driver.getCity() : "N/A";
            
            Optional<DriverLocation> locOpt = driverLocationRepository.findByDriverId(driver.getDriverId());
            if (locOpt.isPresent()) {
                DriverLocation loc = locOpt.get();
                if (!loc.isAvailable()) {
                    continue; // Skip On-Route drivers for security/privacy
                }
                status = "available";
            }

            DriverDTO dto = new DriverDTO(
                driver.getUsername(),
                driver.getEmail(),
                driver.getDriverId(),
                status,
                city,
                driver.getWarehouse() != null ? driver.getWarehouse().getName() : "N/A",
                driver.getLatitude(),
                driver.getLongitude()
            );

            // Calculate distance if origin warehouse is provided
            if (originWarehouse != null) {
                // Exact City Match Check
                if (driver.getCity() != null && driver.getCity().equalsIgnoreCase(originWarehouse.getCity())) {
                    dto.setLocal(true);
                    dto.setDistance(0.0);
                    driverDTOs.add(dto);
                } else if (driver.getLatitude() != null && driver.getLongitude() != null) {
                    double dist = calculateDistance(
                        originWarehouse.getLatitude(), originWarehouse.getLongitude(),
                        driver.getLatitude(), driver.getLongitude()
                    );
                    
                    // Filter: Only include drivers within 200km operational radius
                    if (dist <= 200.0) {
                        dto.setDistance(Math.round(dist * 10.0) / 10.0);
                        driverDTOs.add(dto);
                    }
                } else {
                    // Keep drivers with unknown location so admin can identify missing data
                    driverDTOs.add(dto);
                }
            } else {
                // No warehouse filter, show everyone
                driverDTOs.add(dto);
            }
        }

        // Sort by distance if applicable
        if (originWarehouseId != null) {
            driverDTOs.sort((a, b) -> {
                // Priority 1: Same City
                if (a.isLocal() && !b.isLocal()) return -1;
                if (!a.isLocal() && b.isLocal()) return 1;

                // Priority 2: Distance
                if (a.getDistance() == null) return 1;
                if (b.getDistance() == null) return -1;
                return a.getDistance().compareTo(b.getDistance());
            });
        }

        return driverDTOs;
    }

    // Haversine formula
    private double calculateDistance(double lat1, double lon1, double lat2, double lon2) {
        final int R = 6371; // Radius of the earth
        double latDistance = Math.toRadians(lat2 - lat1);
        double lonDistance = Math.toRadians(lon2 - lon1);
        double a = Math.sin(latDistance / 2) * Math.sin(latDistance / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(lonDistance / 2) * Math.sin(lonDistance / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }
}