package com.web.backend_SupplyLens.model;

import com.fasterxml.jackson.annotation.JsonIgnore;

import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Table;

@Entity
@Table(name = "route_option")
public class RouteOption {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String label; //safe but slow
    private String path; //Mumbai -> Pune -> Hyd
    private int estimatedHours; 
    private String riskLevel; //low, medium, high
    private String tradeoff; //avoid strikezone, adds 3 hours

    @Enumerated(EnumType.STRING)
    private RouteOptionStatus status = RouteOptionStatus.PENDING;

    public RouteOption() {
    }

    @ManyToOne
    @JoinColumn(name = "alert_id")
    @JsonIgnore
    private Alert alert;

    public Long getId() {
        return id;
    }
    public void setId(Long id) {
        this.id = id;
    }
    public String getLabel() {
        return label;
    }
    public void setLabel(String label) {
        this.label = label;
    }
    public String getPath() {
        return path;
    }
    public void setPath(String path) {
        this.path = path;
    }
    public int getEstimatedHours() {
        return estimatedHours;
    }
    public void setEstimatedHours(int estimatedHours) {
        this.estimatedHours = estimatedHours;
    }
    public String getRiskLevel() {
        return riskLevel;
    }
    public void setRiskLevel(String riskLevel) {
        this.riskLevel = riskLevel;
    }
    public String getTradeoff() {
        return tradeoff;
    }
    public void setTradeoff(String tradeoff) {
        this.tradeoff = tradeoff;
    }
    public RouteOptionStatus getStatus() {
        return status;
    }
    public void setStatus(RouteOptionStatus status) {
        this.status = status;
    }
    public Alert getAlert() {
        return alert;
    }
    public void setAlert(Alert alert) {
        this.alert = alert;
    }
}
