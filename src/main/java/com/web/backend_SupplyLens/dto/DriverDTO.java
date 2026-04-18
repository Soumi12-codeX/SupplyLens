package com.web.backend_SupplyLens.dto;

public class DriverDTO {
    private String name;
    private String email;
    private String driverId;
    private String status; // "Available", "On Route", "Offline"
    private String city;
    private String warehouseName;
    private Double distance; // Distance from selected warehouse
    private Double latitude;
    private Double longitude;
    private boolean isLocal; // True if in same city as origin warehouse

    public DriverDTO() {}

    public boolean isLocal() {
        return isLocal;
    }

    public void setLocal(boolean local) {
        isLocal = local;
    }

    public DriverDTO(String name, String email, String driverId, String status, String city, String warehouseName) {
        this.name = name;
        this.email = email;
        this.driverId = driverId;
        this.status = status;
        this.city = city;
        this.warehouseName = warehouseName;
    }

    public DriverDTO(String name, String email, String driverId, String status, String city, String warehouseName, Double latitude, Double longitude) {
        this.name = name;
        this.email = email;
        this.driverId = driverId;
        this.status = status;
        this.city = city;
        this.warehouseName = warehouseName;
        this.latitude = latitude;
        this.longitude = longitude;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getDriverId() {
        return driverId;
    }

    public void setDriverId(String driverId) {
        this.driverId = driverId;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getCity() {
        return city;
    }

    public void setCity(String city) {
        this.city = city;
    }

    public String getWarehouseName() {
        return warehouseName;
    }

    public void setWarehouseName(String warehouseName) {
        this.warehouseName = warehouseName;
    }

    public Double getDistance() {
        return distance;
    }

    public void setDistance(Double distance) {
        this.distance = distance;
    }

    public Double getLatitude() {
        return latitude;
    }

    public void setLatitude(Double latitude) {
        this.latitude = latitude;
    }

    public Double getLongitude() {
        return longitude;
    }

    public void setLongitude(Double longitude) {
        this.longitude = longitude;
    }
}
