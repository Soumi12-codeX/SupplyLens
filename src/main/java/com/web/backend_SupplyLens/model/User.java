package com.web.backend_SupplyLens.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Entity
@Table(name =  "users")
public class User {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String username;
    
    @Column(unique = true)
    private String email; //only for admin

    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    private String password;

    private String role;//admin or driver

    //for driver
    private String driverId;
    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    private String pin;

    @ManyToOne
    @JoinColumn(name = "warehouse_id")
    private Warehouse warehouse;

    public User() {
    }

    public Long getId() {
        return id;
    }
    public void setId(Long id) {
        this.id = id;
    }
    public String getUsername() {
        return username;
    }
    public void setUsername(String username) {
        this.username = username;
    }
    public String getEmail() {
        return email;
    }
    public void setEmail(String email) {
        this.email = email;
    }
    public String getPassword() {
        return password;
    }
    public void setPassword(String password) {
        this.password = password;
    }
    public String getRole() {
        return role;
    }
    public void setRole(String role) {
        this.role = role;
    }
    public String getDriverId() {
        return driverId;
    }
    public void setDriverId(String driverId) {
        this.driverId = driverId;
    }
    public String getPin() {
        return pin;
    }
    public void setPin(String pin) {
        this.pin = pin;
    }
    public Warehouse getWarehouse() {
        return warehouse;
    }
    public void setWarehouse(Warehouse warehouse) {
        this.warehouse = warehouse;
    }
}
