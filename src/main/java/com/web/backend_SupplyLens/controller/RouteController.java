package com.web.backend_SupplyLens.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.web.backend_SupplyLens.model.Route;
import com.web.backend_SupplyLens.repository.RouteRepository;

@RestController
@RequestMapping("/api/route")
public class RouteController {

    @Autowired
    private RouteRepository routeRepo;

    @PostMapping("/create")
    public ResponseEntity<?> createRoute(@RequestBody Route route) {
        return ResponseEntity.ok(routeRepo.save(route));
    }

    @GetMapping("/all")
    public List<Route> getAllRoutes() {
        return routeRepo.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getRouteById(@PathVariable Long id) {
        return routeRepo.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteRoute(@PathVariable Long id) {
        routeRepo.deleteById(id);
        return ResponseEntity.ok("Route deleted");
    }
}