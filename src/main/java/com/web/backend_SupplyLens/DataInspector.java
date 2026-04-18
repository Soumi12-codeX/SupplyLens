
package com.web.backend_SupplyLens;

import com.web.backend_SupplyLens.model.Warehouse;
import com.web.backend_SupplyLens.repository.RouteRepository;
import com.web.backend_SupplyLens.repository.WarehouseRepository;
import com.web.backend_SupplyLens.model.Route;
import com.web.backend_SupplyLens.service.ShipmentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class DataInspector implements CommandLineRunner {

    @Autowired
    private WarehouseRepository warehouseRepo;

    @Autowired
    private RouteRepository routeRepo;

    @Autowired
    private ShipmentService shipmentService;
 
    @Override
    public void run(String... args) throws Exception {
        List<Warehouse> warehouses = warehouseRepo.findAll();
        System.out.println(">>> DATA INSPECTOR: Found " + warehouses.size() + " warehouses.");
        for (Warehouse w : warehouses) {
            System.out.println(">>> WAREHOUSE: " + w.getName() + " (ID: " + w.getId() + ")");
        }

        // --- FORCED AUTO-ASSIGN ON STARTUP ---
        System.out.println(">>> DATA INSPECTOR: Triggering startup auto-assignment...");
        shipmentService.checkAndAssignPendingShipments();
    }
}
