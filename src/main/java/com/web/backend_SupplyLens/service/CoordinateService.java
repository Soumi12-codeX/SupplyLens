package com.web.backend_SupplyLens.service;

import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import com.web.backend_SupplyLens.model.TransitNode;
import com.web.backend_SupplyLens.repository.TransitNodeRepository;

@Service
public class CoordinateService {

    @Autowired
    private TransitNodeRepository transitRepo;

    /**
     * Main entry point: Checks DB first, then fetches from external API if missing.
     */
    public TransitNode getCoordinates(String cityName) {
        if (cityName == null || cityName.isBlank()) {
            return null;
        }

        String cleaned = cityName.trim();
        // 1. Search DB (Case-Insensitive) with exact name
        java.util.Optional<TransitNode> node = transitRepo.findFirstByNameIgnoreCase(cleaned);
        
        if (node.isPresent()) return node.get();

        // 2. Try cleaning common suffixes if not found
        String simpleName = cleaned.replaceAll("(?i)\\s+(Logistics Hub|Hub|Warehouse|Supply Center|Distribution Center|Regional Hub|Port|Tech|Trade Hub)", "").trim();
        if (!simpleName.equals(cleaned)) {
            node = transitRepo.findFirstByNameIgnoreCase(simpleName);
            if (node.isPresent()) return node.get();
        }

        // 3. Fallback to Nominatim
        return fetchFromNominatim(cleaned);
    }

    /**
     * External call to Nominatim OpenStreetMap API.
     * Note: Respects the Nominatim Usage Policy (identifies via User-Agent).
     */
    private TransitNode fetchFromNominatim(String cityName) {
        RestTemplate restTemplate = new RestTemplate();
        String url = "https://nominatim.openstreetmap.org/search?q=" + cityName + "&format=json&limit=1";

        try {
            // CRITICAL: Nominatim requires a User-Agent header to prevent blocking
            HttpHeaders headers = new HttpHeaders();
            headers.set("User-Agent", "SupplyLens-Logistics-Optimization-App");
            HttpEntity<String> entity = new HttpEntity<>(headers);

            // Using exchange to include headers in the GET request
            ResponseEntity<List> response = restTemplate.exchange(
                    url, 
                    HttpMethod.GET, 
                    entity, 
                    List.class
            );

            List<Map<String, Object>> body = response.getBody();

            if (body != null && !body.isEmpty()) {
                Map<String, Object> firstResult = (Map<String, Object>) body.get(0);

                TransitNode newNode = new TransitNode();
                newNode.setName(cityName);
                
                // Parse coordinates safely from the API response
                double lat = Double.parseDouble(firstResult.get("lat").toString());
                double lon = Double.parseDouble(firstResult.get("lon").toString());
                
                newNode.setLatitude(lat);
                newNode.setLongitude(lon);

                // 2. Save new city to DB knowledge base for future use
                return transitRepo.save(newNode);
            }
        } catch (Exception e) {
            // Log the error and return null so the flow doesn't crash
            System.err.println("Nominatim Geocoding Error for " + cityName + ": " + e.getMessage());
        }
        
        return null;
    }
}