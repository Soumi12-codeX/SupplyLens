package com.web.backend_SupplyLens.model;

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
    
    private String transportId;
    
    @ManyToOne
    @JoinColumn(name = "driver_id")
    private User driver;

    private String status; //idle, in_transit, rerouted

    private String currentLocation;

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
    public String getStatus() {
        return status;
    }
    public void setStatus(String status) {
        this.status = status;
    }
    public String getCurrentLocation() {
        return currentLocation;
    }
    public void setCurrentLocation(String currentLocation) {
        this.currentLocation = currentLocation;
    }
}
