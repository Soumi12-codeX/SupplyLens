package com.web.backend_SupplyLens.model;

import java.time.LocalDateTime;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonFormat;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;

@Entity
public class Alert {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name="alert_type")
    private String alertType;
    
    @Column(name="node_name")
    private String nodeName;
    private String messsage;
    private int severity;
    private Long adminId;
   
    @JsonFormat(pattern="yyyy-MM-dd HH:mm:ss")
    private LocalDateTime time;

    @Enumerated(EnumType.STRING)
    private AlertStatus status = AlertStatus.PENDING;

    private String affectedShipmentIds;

    @OneToMany(mappedBy = "alert", cascade = CascadeType.ALL, fetch = FetchType.EAGER)
    private List<RouteOption> routeOptions;

    public Alert() {
    }
    public Long getId() {
        return id;
    }
    public void setId(Long id) {
        this.id = id;
    }
    public String getAlertType() {
        return alertType;
    }
    public void setAlertType(String alertType) {
        this.alertType = alertType;
    }
    public String getNodeName() {
        return nodeName;
    }
    public void setNodeName(String nodeName) {
        this.nodeName = nodeName;
    }
    public String getMesssage() {
        return messsage;
    }
    public void setMesssage(String messsage) {
        this.messsage = messsage;
    }
    public int getSeverity() {
        return severity;
    }
    public void setSeverity(int severity) {
        this.severity = severity;
    }
    public LocalDateTime getTime() {
        return time;
    }
    public void setTime(LocalDateTime time) {
        this.time = time;
    } 
    public String  getAffectedShipmentIds(){
        return affectedShipmentIds;
    }     
    public void setAffectedShipmentIds(String affectedShipmentIds){
        this.affectedShipmentIds = affectedShipmentIds;
    }
    public List<RouteOption> getRouteOptions(){
        return routeOptions;
    }
    public void setRouteOptions(List<RouteOption> routeOptions){
        this.routeOptions = routeOptions;
    }
    public AlertStatus getStatus() {
        return status;
    }
    public void setStatus(AlertStatus status) {
        this.status = status;
    }
    public Long getAdminId(){
        return adminId;
    }
    public void setAdminId(Long adminId){
        this.adminId = adminId;
    }
}
