package com.web.backend_SupplyLens.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.web.backend_SupplyLens.model.User;
import com.web.backend_SupplyLens.repository.UserRepository;
import com.web.backend_SupplyLens.security.JwtService;

@Service
public class AuthService {
    
    @Autowired
    private UserRepository userRepo;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtService jwtService;

    public String adminLogin(String email, String password){
        User user = userRepo.findByEmail(email).orElseThrow();

        if(!passwordEncoder.matches(password, user.getPassword())){
            throw new RuntimeException("Invalid credentials!");
        }
        return jwtService.generateToken(user.getEmail(), user.getRole());
    }

    public String driverLogin(String driverId, String pin){
        User driver = userRepo.findByDriverId(driverId).orElseThrow();

        if(!passwordEncoder.matches(pin, driver.getPin())){
            throw new RuntimeException("Invalid pin!");
        }
        return jwtService.generateToken(driver.getDriverId(), driver.getRole());
    }
    
    public User register(User user){
        if(user.getEmail() != null && userRepo.findByEmail(user.getEmail()).isPresent()){
            throw new RuntimeException("Email already exists!");
        }
        if(user.getDriverId() != null && userRepo.findByDriverId(user.getDriverId()).isPresent()){
            throw new RuntimeException("Driver Id already exists!");
        }
        if(user.getPassword() != null){
            user.setPassword(passwordEncoder.encode(user.getPassword()));
        }
        if(user.getPin() != null){
            user.setPin(passwordEncoder.encode(user.getPin()));
        }
        return userRepo.save(user);
    }
}
