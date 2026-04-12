import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from '../../components/Sidebar';
import MapView from '../../components/Map/MapView';
import TruckMarker from '../../components/Map/TruckMarker';
import RouteOverlay from '../../components/Map/RouteOverlay';
import RoadConditionOverlay from '../../components/Map/RoadConditionOverlay';
import AINotification from '../../components/AINotification';
import { MockSimulator } from '../../services/mockData';
import { Truck, AlertTriangle, Activity, X, CheckCircle } from 'lucide-react';

export default function LiveMapPage() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [fleet, setFleet] = useState([]);
  const [selectedTruck, setSelectedTruck] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [roadConditions, setRoadConditions] = useState([]);
  const [mapCenter, setMapCenter] = useState([20.5937, 78.9629]);
  const [mapZoom, setMapZoom] = useState(5);

  useEffect(() => {
    const sim = new MockSimulator(
      (updatedFleet) => setFleet(updatedFleet),
      (alert) => setAlerts((prev) => [alert, ...prev].slice(0, 20)),
      (condition) => setRoadConditions((prev) => [condition, ...prev].slice(0, 20))
    );
    sim.start();
    return () => sim.stop();
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
          <div className="h-12 flex items-center justify-between px-6">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <h1 className="text-white font-semibold text-sm">Live Map</h1>
              <span className="text-xs text-slate-500">{fleet.length} trucks tracked</span>
            </div>
            <div className="flex items-center gap-4 text-xs">
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
            <div className="absolute bottom-6 left-6 z-[1000] w-80 p-4 rounded-xl bg-slate-900/95 border border-white/10 backdrop-blur-md">
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
              <div className="flex items-center gap-4 mt-3 pt-3 border-t border-white/5 text-xs">
                <span className="text-slate-400">ETA: <span className="text-white font-medium">{selectedTruck.eta}</span></span>
                <span className="text-slate-400">Speed: <span className="text-white font-medium">{selectedTruck.speed} km/h</span></span>
                <span className="text-slate-400">Cargo: <span className="text-white font-medium">{selectedTruck.cargo}</span></span>
              </div>
            </div>
          )}

          {/* Legend */}
          <div className="absolute bottom-4 right-4 z-[1000] px-4 py-3 rounded-lg bg-slate-900/90 border border-white/10 backdrop-blur-sm">
            <p className="text-slate-500 text-[10px] uppercase tracking-wider mb-2">Legend</p>
            <div className="flex flex-col gap-1.5 text-xs">
              <span className="flex items-center gap-2"><span className="w-6 h-1.5 rounded bg-neon-blue"></span> On route</span>
              <span className="flex items-center gap-2"><span className="w-6 h-1.5 rounded bg-red-500"></span> Delayed</span>
              <span className="flex items-center gap-2"><span className="w-6 h-2 rounded bg-red-500"></span> Blocked 🚫</span>
              <span className="flex items-center gap-2"><span className="w-6 h-2 rounded bg-yellow-400"></span> Congested ⚠</span>
              <span className="flex items-center gap-2"><span className="w-6 h-2 rounded bg-orange-400"></span> Semi-congested 🟠</span>
            </div>
          </div>

          {/* AI Alerts */}
          {alerts.length > 0 && (
            <div className="absolute top-4 right-4 z-[1000] space-y-3 pointer-events-none" style={{ maxWidth: '400px' }}>
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
    </div>
  );
}
