package com.web.backend_SupplyLens.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.web.backend_SupplyLens.model.User;
import com.web.backend_SupplyLens.repository.UserRepository;
import com.web.backend_SupplyLens.security.JwtService;

@Service
public class AuthService {
    
    @Autowired
    private UserRepository userRepo;

    @Autowired
    private JwtService jwtService;

    public String adminLogin(String email, String password){
        User user = userRepo.findByEmail(email).orElseThrow();

        if(!user.getPassword().equals(password)){
            throw new RuntimeException("Invalid Exception");
        }
        return jwtService.generateToken(user.getEmail(), user.getRole());
    }

    public String driverLogin(Long driverId, String pin){
        User driver = userRepo.findByDriverId(driverId).orElseThrow();

        if(!driver.getPin().equals(pin)){
            throw new RuntimeException("Invalid pin!");
        }
        return jwtService.generateToken(driver.getDriverId(), driver.getRole());
    }


}
