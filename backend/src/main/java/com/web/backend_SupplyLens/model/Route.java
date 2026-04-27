package com.web.backend_SupplyLens.model;
 
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "routes")
public class Route {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "source_id")
    private Warehouse source;

    @ManyToOne
    @JoinColumn(name = "destination_id")
    private Warehouse destination;

    private double distance;
    private String estimatedTime;
    private String riskLevel; //low, medium, high
    private String status; //active, rerouted, blocked
    
    @Column(columnDefinition="TEXT")
    private String path; //Stores the display path like "Anantapur -> Kurnool"

    private int priority;

    public Long getId() {
        return id;
    }
    public void setId(Long id) {
        this.id = id;
    }
    public Warehouse getSource() {
        return source;
    }
    public void setSource(Warehouse source) {
        this.source = source;
    }
    public Warehouse getDestination() {
        return destination;
    }
    public void setDestination(Warehouse destination) {
        this.destination = destination;
    }
    public double getDistance() {
        return distance;
    }
    public void setDistance(double distance) {
        this.distance = distance;
    }
    public String getEstimatedTime() {
        return estimatedTime;
    }
    public void setEstimatedTime(String estimatedTime) {
        this.estimatedTime = estimatedTime;
    }
    public String getRiskLevel() {
        return riskLevel;
    }
    public void setRiskLevel(String riskLevel) {
        this.riskLevel = riskLevel;
    }
    public String getStatus() {
        return status;
    }
    public void setStatus(String status) {
        this.status = status;
    }
    public String getPath() {
        return path;
    }
    public void setPath(String path) {
        this.path = path;
    }
    public int getPriority() {
        return priority;
    }
    public void setPriority(int priority) {
        this.priority = priority;
    }

    // Keep legacy support for routeNodes if needed by DTOs/other services
    public String getRouteNodes() {
        return path;
    }
    public void setRouteNodes(String routeNodes) {
        this.path = routeNodes;
    }
}
