import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from '../../components/Sidebar';
import MapView from '../../components/Map/MapView';
import TruckMarker from '../../components/Map/TruckMarker';
import RouteOverlay from '../../components/Map/RouteOverlay';
import RoadConditionOverlay from '../../components/Map/RoadConditionOverlay';
import AINotification from '../../components/AINotification';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import wsService from '../../services/websocket';
import { Truck, AlertTriangle, Activity, X, CheckCircle, Navigation } from 'lucide-react';

export default function LiveMapPage() {
  const { user } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [fleet, setFleet] = useState([]);
  const [selectedTruck, setSelectedTruck] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [roadConditions, setRoadConditions] = useState([]);
  const [mapCenter, setMapCenter] = useState([20.5937, 78.9629]); // India center
  const [mapZoom, setMapZoom] = useState(5);
  const [isInitializing, setIsInitializing] = useState(true);

  const transformShipments = useCallback((backendShipments) => {
    return backendShipments.map((s) => {
      const origin = { 
        lat: s.warehouse?.latitude || 20.5937, 
        lng: s.warehouse?.longitude || 78.9629 
      };
      const dest = { 
        lat: s.route?.latitude || origin.lat + 0.1, 
        lng: s.route?.longitude || origin.lng + 0.1 
      };
      
      const isUnassigned = s.assignmentStatus === "UNASSIGNED";
      const isStarted = s.assignmentStatus === "IN_PROGRESS" || s.assignmentStatus === "ASSIGNED";
      
      // Stagger base progress so they don't perfectly stack on the route line
      const baseProgress = s.assignmentStatus === "DELIVERED" ? 1 : 0.02 + ((s.id % 20) * 0.04);
      const progress = isStarted ? baseProgress : 0;

      let status = "delayed";
      if (s.assignmentStatus === "DELIVERED") status = "delivered";
      else if (isStarted) status = "on-route";
      else if (isUnassigned) status = "awaiting-dispatch";

      // Apply a circular scatter to unassigned/idle trucks near origin
      const jitterLat = (!isStarted && !isUnassigned) ? 0 : (Math.sin(s.id * 10) * 0.02);
      const jitterLng = (!isStarted && !isUnassigned) ? 0 : (Math.cos(s.id * 10) * 0.02);

      return {
        id: `SHP-${s.id}`,
        driver: s.assignedDriverId || "Awaiting Assignment",
        originName: s.warehouse?.name || "Warehouse",
        destinationName: s.route?.path?.split(" -> ").pop() || "Destination",
        cargo: s.notes || "High Priority Goods",
        status: status,
        speed: isStarted ? 60 : 0,
        progress: progress,
        eta: s.route?.estimatedTime || "Pending",
        distanceRemaining: s.route?.distance ? `${s.route.distance} km` : "200 km",
        originPosition: origin,
        destinationPosition: dest,
        currentPosition: {
          lat: origin.lat + (dest.lat - origin.lat) * progress + jitterLat,
          lng: origin.lng + (dest.lng - origin.lng) * progress + jitterLng,
        },
        route: [] 
      };
    });
  }, []);

  useEffect(() => {
    const fetchShipments = async () => {
      try {
        const warehouseId = user?.warehouse?.id;
        const url = warehouseId ? `/admin/shipments?warehouseId=${warehouseId}` : '/admin/shipments';
        const res = await api.get(url);
        const realShipments = transformShipments(res.data);
        setFleet(realShipments);
        setIsInitializing(false);
      } catch (err) {
        console.error("Error fetching shipments:", err);
        setIsInitializing(false);
      }
    };

    fetchShipments();
    const pollInterval = setInterval(fetchShipments, 30000); // Poll every 30s
    
    // Local simulation for smooth progress
    const simInterval = setInterval(() => {
      setFleet(prevFleet => prevFleet.map(truck => {
        if (truck.status === 'on-route' && truck.progress < 1) {
          const newProgress = Math.min(1, truck.progress + 0.001);
          // Interpolate position
          const lat = truck.originPosition.lat + (truck.destinationPosition.lat - truck.originPosition.lat) * newProgress;
          const lng = truck.originPosition.lng + (truck.destinationPosition.lng - truck.originPosition.lng) * newProgress;
          return {
             ...truck,
             progress: newProgress,
             currentPosition: { lat, lng }
          };
        }
        return truck;
      }));
    }, 2000);

    // Subscribe to real WebSocket alerts
    wsService.connect();
    const unsubscribe = wsService.subscribe('alerts', (alert) => {
      console.log('[LiveMap] Received real-time alert:', alert);
      setAlerts((prev) => [{
        ...alert,
        icon: alert.alertType === 'LABOR_STRIKE' ? '🏥' : '🚧',
        title: alert.alertType,
        description: alert.messsage,
        timestamp: new Date().toISOString()
      }, ...prev]);
    });

    return () => {
      clearInterval(pollInterval);
      clearInterval(simInterval);
      unsubscribe();
      wsService.disconnect();
    };
  }, []);

  const handleSelectTruck = useCallback((truck) => {
    setSelectedTruck(truck);
    setMapCenter([truck.currentPosition.lat, truck.currentPosition.lng]);
    setMapZoom(10);
  }, []);

  const handleApproveAlert = (alert) => {
    setAlerts((prev) => prev.filter((a) => a.id !== alert.id));
    setRoadConditions((prev) => prev.filter((c) => c.alertId !== alert.id));
  };

  const handleDismissAlert = (alertId) => {
    setAlerts((prev) => prev.filter((a) => a.id !== alertId));
  };

  return (
    <div className="h-screen flex bg-brand-dark overflow-hidden">
      <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="border-b border-white/5 bg-slate-950/80 backdrop-blur-sm shrink-0">
          <div className="min-h-12 flex flex-wrap items-center justify-between px-3 md:px-6 py-2 gap-2">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <h1 className="text-white font-semibold text-sm">Live Map</h1>
              <span className="text-xs text-slate-500">{fleet.length} trucks</span>
            </div>
            <div className="flex items-center gap-3 md:gap-4 text-xs">
              <span className="flex items-center gap-1.5 text-emerald-400">
                <Truck size={12} />
                {fleet.filter(t => t.status === 'on-route').length} active
              </span>
              <span className="flex items-center gap-1.5 text-red-400">
                <AlertTriangle size={12} />
                {alerts.length} alerts
              </span>
            </div>
          </div>
        </div>

        {/* Full-screen Map */}
        <div className="flex-1 relative">
          {isInitializing ? (
            <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm">
              <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-4 border-neon-blue border-t-transparent rounded-full animate-spin"></div>
                <p className="text-neon-blue text-sm font-medium tracking-wide">INITIALIZING LIVE FLEET...</p>
              </div>
            </div>
          ) : null}

          <MapView center={mapCenter} zoom={mapZoom}>
            <RoadConditionOverlay conditions={roadConditions} />
            {fleet.map((truck) => (
              <React.Fragment key={truck.id}>
                <TruckMarker
                  truck={truck}
                  isSelected={selectedTruck?.id === truck.id}
                  onClick={handleSelectTruck}
                />
                {selectedTruck?.id === truck.id && (
                  <RouteOverlay route={truck.route} isActive />
                )}
              </React.Fragment>
            ))}
          </MapView>

          {/* Selected truck info overlay */}
          {selectedTruck && (
            <div className="absolute bottom-6 left-3 md:left-6 right-3 md:right-auto z-[1000] md:w-80 p-4 rounded-xl bg-slate-900/95 border border-white/10 backdrop-blur-md">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Truck size={14} className="text-neon-blue" />
                  <span className="text-white font-semibold text-sm">{selectedTruck.id}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                    selectedTruck.status === 'delayed'
                      ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                      : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  }`}>
                    {selectedTruck.status === 'delayed' ? 'Delayed' : 'On Route'}
                  </span>
                </div>
                <button
                  onClick={() => { setSelectedTruck(null); setMapCenter([20.5937, 78.9629]); setMapZoom(5); }}
                  className="text-slate-500 hover:text-white transition-colors"
                >
                  <X size={14} />
                </button>
              </div>
              <p className="text-slate-400 text-xs mb-1">{selectedTruck.driver} • {selectedTruck.phone}</p>
              <p className="text-slate-500 text-xs">{selectedTruck.originName} → {selectedTruck.destinationName}</p>
              <div className="flex items-center gap-3 md:gap-4 mt-3 pt-3 border-t border-white/5 text-xs flex-wrap">
                <span className="text-slate-400">ETA: <span className="text-white font-medium">{selectedTruck.eta}</span></span>
                <span className="text-slate-400">Speed: <span className="text-white font-medium">{selectedTruck.speed} km/h</span></span>
                <span className="text-slate-400">Cargo: <span className="text-white font-medium">{selectedTruck.cargo}</span></span>
              </div>
            </div>
          )}

          {/* Legend */}
          <div className="absolute bottom-4 right-2 md:right-4 z-[1000] px-3 md:px-4 py-2 md:py-3 rounded-lg bg-slate-900/90 border border-white/10 backdrop-blur-sm">
            <p className="text-slate-500 text-[10px] uppercase tracking-wider mb-1.5">Legend</p>
            <div className="flex flex-col gap-1 text-[10px] md:text-xs">
              <span className="flex items-center gap-1.5"><span className="w-4 md:w-6 h-1.5 rounded bg-neon-blue"></span> On route</span>
              <span className="flex items-center gap-1.5"><span className="w-4 md:w-6 h-1.5 rounded bg-red-500"></span> Delayed</span>
              <span className="flex items-center gap-1.5"><span className="w-4 md:w-6 h-2 rounded bg-red-500"></span> Blocked 🚫</span>
              <span className="flex items-center gap-1.5"><span className="w-4 md:w-6 h-2 rounded bg-yellow-400"></span> Congested ⚠</span>
              <span className="flex items-center gap-1.5"><span className="w-4 md:w-6 h-2 rounded bg-orange-400"></span> Semi 🟠</span>
            </div>
          </div>

          {/* AI Alerts */}
          {alerts.length > 0 && (
            <div className="absolute top-4 right-2 md:right-4 z-[1000] space-y-2 md:space-y-3 pointer-events-none" style={{ maxWidth: '320px' }}>
              {alerts.slice(0, 2).map((alert) => (
                <div key={alert.id} className="pointer-events-auto">
                  <AINotification
                    alert={alert}
                    onApprove={handleApproveAlert}
                    onDismiss={() => handleDismissAlert(alert.id)}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      {/* Mobile nav padding */}
      <div className="md:hidden h-16 shrink-0" />
    </div>
  );
}
