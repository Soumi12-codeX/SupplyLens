package com.web.backend_SupplyLens.model;


import com.fasterxml.jackson.annotation.JsonProperty;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;

@Entity
public class Transport {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "transport_id")
    private String transportId;
    
    @ManyToOne
    @JoinColumn(name = "driver_id")
    private User driver;

    private String currentLocation;

    private String currentRouteId;    
    private String transportStatus;

    public String getTransportId() {
        return transportId;
    }
    public void setTransportId(String transportId) {
        this.transportId = transportId;
    }

    public Long getId() {
        return id;
    }
    public void setId(Long id) {
        this.id = id;
    }

    public User getDriver() {
        return driver;
    }
    public void setDriver(User driver) {
        this.driver = driver;
    }
    public String getCurrentLocation() {
        return currentLocation;
    }
    public void setCurrentLocation(String currentLocation) {
        this.currentLocation = currentLocation;
    }
    public String getCurrentRouteId() {
        return currentRouteId;
    }
    public void setCurrentRouteId(String currentRouteId) {
        this.currentRouteId = currentRouteId;
    }
    public String getTransportStatus() {
        return transportStatus;
    }
    public void setTransportStatus(String transportStatus) {
        this.transportStatus = transportStatus;
    }
}
