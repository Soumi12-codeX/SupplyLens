package com.web.backend_SupplyLens.controller;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.ArrayList;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.web.backend_SupplyLens.model.Route;
import com.web.backend_SupplyLens.model.TransitNode;
import com.web.backend_SupplyLens.dto.RouteDTO;
import com.web.backend_SupplyLens.repository.RouteRepository;
import com.web.backend_SupplyLens.service.RedirectService;
import com.web.backend_SupplyLens.repository.TransitNodeRepository;

@RestController
@RequestMapping("/api/route")
public class RouteController {

    @Autowired
    private RouteRepository routeRepo;

    @Autowired
    private RedirectService redirectService;

    @Autowired
    private TransitNodeRepository transitNodeRepo;

    @PostMapping("/create")
    public ResponseEntity<?> createRoute(@RequestBody Route route) {
        return ResponseEntity.ok(routeRepo.save(route));
    }

    @GetMapping("/all")
    public List<Route> getAllRoutes() {
        return routeRepo.findAll();
    }

    @GetMapping("/detailed")
    public List<RouteDTO> getDetailedRoutes() {
        List<Route> routes = routeRepo.findAll();
        return routes.stream().map(route -> {
            List<TransitNode> nodes = new ArrayList<>();
            if (route.getPath() != null && !route.getPath().isEmpty()) {
                String[] cityNames = route.getPath().split(" -> ");
                for (String cityName : cityNames) {
                    transitNodeRepo.findByName(cityName.trim()).ifPresent(nodes::add);
                }
            }
            return new RouteDTO(route, nodes);
        }).collect(Collectors.toList());
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

    @GetMapping("/{id}/google-maps-link")
    public ResponseEntity<Map<String, String>> getDefaultRouteLink(@PathVariable Long id){
        String link = redirectService.generateDefaultRouteLink(id);

        Map<String, String> response = new HashMap<>();
        response.put("defaultRouteLink", link);

        return ResponseEntity.ok(response);
    }
}