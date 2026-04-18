package com.web.backend_SupplyLens.controller;

import java.util.*;
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
@CrossOrigin(origins = "*") // Ensures your React frontend can always connect
public class RouteController {

    @Autowired
    private RouteRepository routeRepo;

    @Autowired
    private RedirectService redirectService;

    @Autowired
    private TransitNodeRepository transitNodeRepo;

    @PostMapping("/create")
    public ResponseEntity<Route> createRoute(@RequestBody Route route) {
        // Ensure routeNodes and path are synced before saving
        if (route.getRouteNodes() != null && route.getPath() == null) {
            route.setPath(route.getRouteNodes().replace(", ", " -> "));
        }
        return ResponseEntity.ok(routeRepo.save(route));
    }

    @GetMapping("/all")
    public List<Route> getAllRoutes() {
        return routeRepo.findAll();
    }

    /**
     * Fetches routes and converts the city names into actual TransitNode objects 
     * (with Lat/Lng) for the Leaflet map.
     */
    @GetMapping("/detailed")
    public List<RouteDTO> getDetailedRoutes() {
        List<Route> routes = routeRepo.findAll();
        return routes.stream().map(route -> {
            List<TransitNode> nodes = new ArrayList<>();
            
            // Priority: Use routeNodes first as it's cleaner for splitting
            String nodeSource = route.getRouteNodes() != null ? route.getRouteNodes() : route.getPath();
            
            if (nodeSource != null && !nodeSource.isEmpty()) {
                // Regex handles both "City, City" and "City -> City"
                String[] cityNames = nodeSource.split(",\\s*|\\s*->\\s*");
                for (String cityName : cityNames) {
                    transitNodeRepo.findByName(cityName.trim())
                            .ifPresent(nodes::add);
                }
            }
            return new RouteDTO(route, nodes);
        }).collect(Collectors.toList());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Route> getRouteById(@PathVariable Long id) {
        return routeRepo.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<String> deleteRoute(@PathVariable Long id) {
        routeRepo.deleteById(id);
        return ResponseEntity.ok("Route deleted");
    }

    @GetMapping("/{id}/google-maps-link")
    public ResponseEntity<Map<String, String>> getDefaultRouteLink(@PathVariable Long id) {
        String link = redirectService.generateDefaultRouteLink(id);
        Map<String, String> response = new HashMap<>();
        response.put("defaultRouteLink", link);
        return ResponseEntity.ok(response);
    }

    /**
     * Required for Graph/Network visualizers on the frontend.
     * Splits paths into individual A to B segments.
     */
    @GetMapping("/all-segments")
    public List<Map<String, String>> getAllSegments() {
        List<Route> routes = routeRepo.findAll();
        return routes.stream().flatMap(route -> {
            String nodeSource = route.getRouteNodes() != null ? route.getRouteNodes() : route.getPath();
            if (nodeSource == null) return java.util.stream.Stream.empty();

            String[] nodes = nodeSource.split(",\\s*|\\s*->\\s*");
            List<Map<String, String>> segments = new ArrayList<>();
            
            for (int i = 0; i < nodes.length - 1; i++) {
                Map<String, String> edge = new HashMap<>();
                edge.put("u", nodes[i].trim());
                edge.put("v", nodes[i + 1].trim());
                
                // Calculate average distance per segment if total distance is known
                double segmentDist = (route.getDistance() > 0) ? route.getDistance() / (nodes.length - 1) : 0;
                edge.put("distance", String.format("%.2f", segmentDist));
                segments.add(edge);
            }
            return segments.stream();
        }).distinct().collect(Collectors.toList());
    }
}