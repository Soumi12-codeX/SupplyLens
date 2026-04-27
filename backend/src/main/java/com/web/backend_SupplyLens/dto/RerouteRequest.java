package com.web.backend_SupplyLens.dto;

import java.util.List;

public class RerouteRequest {
    private Long sourceWarehouseId;
    private Long destWarehouseId;
    private List<String> transitCities;

    
    public Long getSourceWarehouseId() { 
        return sourceWarehouseId; 
    }
    public void setSourceWarehouseId(Long id) { 
        this.sourceWarehouseId = id; 
    }
    public Long getDestWarehouseId(){
        return destWarehouseId;
    }
    public void setDestWarehouseId(Long destWarehouseId){
        this.destWarehouseId = destWarehouseId;
    }
    public List<String> getTransitCities(){
        return transitCities;
    }
    public void setTransitCities(List<String> transitCities){
        this.transitCities = transitCities;
    }
}
