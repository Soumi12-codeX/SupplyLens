package com.web.backend_SupplyLens.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.web.backend_SupplyLens.dto.AuthResponse;
import com.web.backend_SupplyLens.model.User;
import com.web.backend_SupplyLens.service.AuthService;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private AuthService authService;

    @GetMapping("/test")
    public String test() {
        return "Auth controller is reachable!";
    }

    @PostMapping("/register")
    public User register(@RequestBody User user) {
        System.out.println(">>> REGISTER HIT - Role: " + user.getRole() + ", Name: " + user.getUsername());
        return authService.register(user);
    }

    @PostMapping("/admin/login")
    public AuthResponse adminLogin(@RequestBody User user) {
        return authService.adminLogin(user.getEmail(), user.getPassword());
    }

    @PostMapping("/driver/login")
    public AuthResponse driverLogin(@RequestBody User user) {
        return authService.driverLogin(user.getDriverId(), user.getPin());
    }
}
