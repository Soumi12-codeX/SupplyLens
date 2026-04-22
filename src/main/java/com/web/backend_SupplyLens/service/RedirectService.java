package com.web.backend_SupplyLens.service;

import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.web.backend_SupplyLens.model.Route;
import com.web.backend_SupplyLens.model.RouteOption;
import com.web.backend_SupplyLens.model.TransitNode;
import com.web.backend_SupplyLens.model.Warehouse;
import com.web.backend_SupplyLens.repository.RouteOptionRepo;
import com.web.backend_SupplyLens.repository.RouteRepository;
import com.web.backend_SupplyLens.repository.WarehouseRepository;

@Service
public class RedirectService {

    @Autowired
    private RouteOptionRepo routeOptionRepo;

    @Autowired
    private WarehouseRepository warehouseRepo;

    @Autowired
    private CoordinateService coordinateService;

    @Autowired
    private RouteRepository routeRepo;

    public String generateDefaultRouteLink(Long routeId) {
        Route route = routeRepo.findById(routeId)
                .orElseThrow(() -> new RuntimeException("Route not found"));

        String nodeSource = route.getPath();
        String delimiter = nodeSource.contains("->") ? "\\s*->\\s*" : ",\\s*";
        List<String> cityNames = Arrays.asList(nodeSource.split(delimiter));

        List<TransitNode> nodes = cityNames.stream()
                .map(city -> {
                    // 1. Slice out anything after a parenthesis (e.g., "Jaipur (Direct)" ->
                    // "Jaipur")
                    // 2. Trim whitespace
                    String cleanCity = city.split("\\(")[0].trim();

                    TransitNode n = coordinateService.getCoordinates(cleanCity);
                    if (n == null) {
                        throw new RuntimeException("Coordinate not found for: " + cleanCity);
                    }
                    return n;
                })
                .collect(Collectors.toList());

        // ... rest of the origin/destination/waypoints logic remains the same ...

        // Ensure you are using the correct Google Maps URL format we discussed:
        String origin = nodes.get(0).getLatitude() + "," + nodes.get(0).getLongitude();
        String destination = nodes.get(nodes.size() - 1).getLatitude() + ","
                + nodes.get(nodes.size() - 1).getLongitude();

        StringBuilder url = new StringBuilder("https://www.google.com/maps/dir/?api=1");
        url.append("&origin=").append(origin);
        url.append("&destination=").append(destination);
        url.append("&travelmode=driving");

        return url.toString();
    }

    public String generateRedirectLinkFromOption(Long routeOptionId, Long sourceWhId, Long destWhId) {
        // fetch saved routeOption
        RouteOption option = routeOptionRepo.findById(routeOptionId)
                .orElseThrow(() -> new RuntimeException("Route Option not found"));

        List<String> cityNames = Arrays.asList(option.getPath().split(" -> "));

        return generateGoogleMapsLink(sourceWhId, destWhId, cityNames);
    }

    public String generateGoogleMapsLink(Long sourceWhId, Long destWhId, List<String> transitCities) {
        Warehouse source = warehouseRepo.findById(sourceWhId).orElseThrow();
        Warehouse dest = warehouseRepo.findById(destWhId).orElseThrow();

        String origin = source.getLatitude() + "," + source.getLongitude();
        String destination = dest.getLatitude() + "," + dest.getLongitude();

        String waypoints = transitCities.stream().map(city -> {
            TransitNode node = coordinateService.getCoordinates(city);
            return node.getLatitude() + "," + node.getLongitude();
        }).collect(Collectors.joining("|"));

        StringBuilder url = new StringBuilder("https://www.google.com/maps/dir/?api=1");
        url.append("&origin=").append(origin);
        url.append("&destination=").append(destination);

        if (!waypoints.isEmpty()) {
            url.append("&waypoints=").append(waypoints);
        }
        url.append("&travelmode=driving");
        return url.toString();
    }
}
