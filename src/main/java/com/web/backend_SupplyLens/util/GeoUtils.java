package com.web.backend_SupplyLens.util;

import java.util.HashMap;
import java.util.Map;

public class GeoUtils {
    public static final Map<String, double[]> CITY_COORDINATES = new HashMap<>();

    static {
        // Primary Hubs
        CITY_COORDINATES.put("Kolkata", new double[] { 22.5726, 88.3639 });
        CITY_COORDINATES.put("Mumbai", new double[] { 19.0760, 72.8777 });
        CITY_COORDINATES.put("Bangalore", new double[] { 12.9716, 77.5946 });
        CITY_COORDINATES.put("Hyderabad", new double[] { 17.3850, 78.4867 });
        CITY_COORDINATES.put("Chennai", new double[] { 13.0827, 80.2707 });
        CITY_COORDINATES.put("Pune", new double[] { 18.5204, 73.8567 });
        CITY_COORDINATES.put("Ahmedabad", new double[] { 23.0225, 72.5714 });
        CITY_COORDINATES.put("Jaipur", new double[] { 26.9124, 75.7873 });
        CITY_COORDINATES.put("Lucknow", new double[] { 26.8467, 80.9462 });
        CITY_COORDINATES.put("Delhi", new double[] { 28.6139, 77.2090 });
        CITY_COORDINATES.put("Howrah", new double[] { 22.5958, 88.2636 });

        // Kolkata Nearby
        CITY_COORDINATES.put("Salt Lake", new double[] { 22.5866, 88.4116 });
        CITY_COORDINATES.put("Newtown", new double[] { 22.5746, 88.4735 });
        CITY_COORDINATES.put("Hooghly", new double[] { 22.9010, 88.3899 });
        CITY_COORDINATES.put("Durgapur", new double[] { 23.5204, 87.3119 });
        CITY_COORDINATES.put("Asansol", new double[] { 23.6739, 86.9524 });
        CITY_COORDINATES.put("Kharagpur", new double[] { 22.3302, 87.3237 });
        CITY_COORDINATES.put("Haldia", new double[] { 22.0257, 88.0583 });

        // Mumbai/Pune Nearby
        CITY_COORDINATES.put("Thane", new double[] { 19.2183, 72.9781 });
        CITY_COORDINATES.put("Navi Mumbai", new double[] { 19.0330, 73.0297 });
        CITY_COORDINATES.put("Kalyan", new double[] { 19.2403, 73.1305 });
        CITY_COORDINATES.put("Pimpri-Chinchwad", new double[] { 18.6298, 73.7997 });

        // Jaipur Nearby
        CITY_COORDINATES.put("Ajmer", new double[] { 26.4499, 74.6399 });

        // Lucknow Nearby
        CITY_COORDINATES.put("Kanpur", new double[] { 26.4499, 80.3319 });
        CITY_COORDINATES.put("Prayagraj", new double[] { 25.4358, 81.8463 });

        // Bangalore Nearby
        CITY_COORDINATES.put("Hosur", new double[] { 12.7409, 77.8253 });
        CITY_COORDINATES.put("Tumkur", new double[] { 13.3392, 77.1016 });
        CITY_COORDINATES.put("Mysore", new double[] { 12.2958, 76.6394 });

        // Hyderabad Nearby
        CITY_COORDINATES.put("Secunderabad", new double[] { 17.4399, 78.4983 });
        CITY_COORDINATES.put("Warangal", new double[] { 17.9689, 79.5941 });

        // Chennai Nearby
        CITY_COORDINATES.put("Kanchipuram", new double[] { 12.8185, 79.6947 });
        CITY_COORDINATES.put("Tiruvallur", new double[] { 13.1492, 79.9071 });

        // Ahmedabad Nearby
        CITY_COORDINATES.put("Gandhinagar", new double[] { 23.2156, 72.6369 });
        CITY_COORDINATES.put("Vadodara", new double[] { 22.3072, 73.1812 });
    }

    public static double haversineDistance(double lat1, double lon1, double lat2, double lon2) {
        double R = 6371; // Earth radius in km
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2)) *
                        Math.sin(dLon / 2) * Math.sin(dLon / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }
}
