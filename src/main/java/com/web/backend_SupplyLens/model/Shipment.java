package com.web.backend_SupplyLens.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;

@Entity
public class Shipment {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    private Transport transport;

    @ManyToOne
    private Route route;

    private String status;
    private String notes;
    private String priority;

    private String routeStatus; //normal, rerouted

    @Column(columnDefinition = "TEXT")
    private String currentPath; //set when admin selects a route

    @Column(columnDefinition = "TEXT")
    private String routeNodes; // Comma-separated list of nodes like "HAMBURG,HANOVER,FRANKFURT,MUNICH"

    private String assignedDriverId;
    private String assignmentStatus; // UNASSIGNED, ASSIGNED, IN_PROGRESS, DELIVERED

    @ManyToOne
    @JoinColumn(name = "warehouse_id")
    private Warehouse warehouse;     // which warehouse this shipment is from

    public Long getId() {
        return id;
    }
    public void setId(Long id) {
        this.id = id;
    }
    public Transport getTransport() {
        return transport;
    }
    public void setTransport(Transport transport) {
        this.transport = transport;
    }
    public Route getRoute() {
        return route;
    }
    public void setRoute(Route route) {
        this.route = route;
    }
    public String getStatus() {
        return status;
    }
    public void setStatus(String status) {
        this.status = status;
    }
    public String getNotes() {
        return notes;
    }
    public void setNotes(String notes) {
        this.notes = notes;
    }
    public String getPriority() {
        return priority;
    }
    public void setPriority(String priority) {
        this.priority = priority;
    }
    public String getRouteStatus() {
        return routeStatus;
    }
    public void setRouteStatus(String routeStatus) {
        this.routeStatus = routeStatus;
    }
    public String getCurrentPath() {
        return currentPath;
    }
    public void setCurrentPath(String currentPath) {
        this.currentPath = currentPath;
    }
    public String getRouteNodes() {
        return routeNodes;
    }
    public void setRouteNodes(String routeNodes) {
        this.routeNodes = routeNodes;
    }
    public String getAssignedDriverId() {
        return assignedDriverId;
    }
    public void setAssignedDriverId(String assignedDriverId) {
        this.assignedDriverId = assignedDriverId;
    }
    public String getAssignmentStatus() {
        return assignmentStatus;
    }
    public void setAssignmentStatus(String assignmentStatus) {
        this.assignmentStatus = assignmentStatus;
    }
    public Warehouse getWarehouse() {
        return warehouse;
    }
    public void setWarehouse(Warehouse warehouse) {
        this.warehouse = warehouse;
    }
    
}
