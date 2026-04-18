package com.web.backend_SupplyLens.dto;

import com.web.backend_SupplyLens.model.Route;
import com.web.backend_SupplyLens.model.TransitNode;
import java.util.List;

public class RouteDTO {
    private Route route;
    private List<TransitNode> nodes;

    public RouteDTO() {}

    public RouteDTO(Route route, List<TransitNode> nodes) {
        this.route = route;
        this.nodes = nodes;
    }

    public Route getRoute() {
        return route;
    }

    public void setRoute(Route route) {
        this.route = route;
    }

    public List<TransitNode> getNodes() {
        return nodes;
    }

    public void setNodes(List<TransitNode> nodes) {
        this.nodes = nodes;
    }
}
