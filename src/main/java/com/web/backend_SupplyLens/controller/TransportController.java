package com.web.backend_SupplyLens.controller;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.web.backend_SupplyLens.model.DriverLocation;
import com.web.backend_SupplyLens.model.RouteOption;
import com.web.backend_SupplyLens.model.Shipment;
import com.web.backend_SupplyLens.model.Transport;
import com.web.backend_SupplyLens.repository.DriverLocationRepository;
import com.web.backend_SupplyLens.repository.RouteOptionRepo;
import com.web.backend_SupplyLens.repository.ShipmentRepository;
import com.web.backend_SupplyLens.repository.TransportRepository;

@RestController
@RequestMapping("/api/transport")
public class TransportController {
    @Autowired
    private TransportRepository transportRepo;

    @Autowired
    private DriverLocationRepository locationRepo;

    @Autowired
    private ShipmentRepository shipmentRepo;

    @Autowired
    private RouteOptionRepo routeOptionRepo;

    @PostMapping("/create")
    public ResponseEntity<?> createTransport(@RequestBody Transport transport) {
        return ResponseEntity.ok(transportRepo.save(transport));
    }

    @GetMapping("/all")
    public List<Transport> getAllTransports() {
        return transportRepo.findAll();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteTransport(@PathVariable Long id) {
        transportRepo.deleteById(id);
        return ResponseEntity.ok("Transport deleted");
    }

    @GetMapping("/search/{transportId}")
    public ResponseEntity<?> searchTransport(@PathVariable Long transportId){
        Transport transport = transportRepo.findByTransportId(transportId).orElseThrow(()-> new RuntimeException("Transport not found"));

        //drivers current location
        DriverLocation location = locationRepo
        .findByDriverId(transport.getDriver().getDriverId()).orElse(null);

        //get its shipments
        List<Shipment> shipments = shipmentRepo.findByTransport_Driver_DriverId(transport.getDriver().getDriverId());

        Map<String, Object> response = new HashMap<>();
        response.put("transport", transport);
        response.put("liveLocation", location);
        response.put("activeShipments", shipments);

        return ResponseEntity.ok(response);
    }

    //admin assigns a route to a transport
    @PostMapping("/{transportId}/assign-route/{routeOptionId}")
    public ResponseEntity<?> assignRoute(@PathVariable Long transportId, @PathVariable Long routeOptionId){
        //find transport
        Transport transport = transportRepo.findByTransportId(transportId).orElseThrow(()-> new RuntimeException("Transport not found"));

        //find route option
        RouteOption option = routeOptionRepo.findById(routeOptionId).orElseThrow(()-> new RuntimeException("Route option not found"));

        List<Shipment> shipments = shipmentRepo.findByTransport_Driver_DriverId(transport.getDriver().getDriverId());

        for(Shipment s : shipments){
            s.setCurrentPath(option.getPath());
            s.setRouteStatus("REROUTED");
            shipmentRepo.save(s);
        }
        transport.setCurrentLocation(String.valueOf(routeOptionId));
        transport.setStatus("REROUTED");
        transportRepo.save(transport);

        return ResponseEntity.ok("Route assigned to transport " + transportId);
    }
    
}
