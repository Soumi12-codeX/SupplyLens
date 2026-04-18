import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from '../../components/Sidebar';
import MapView from '../../components/Map/MapView';
import TruckMarker from '../../components/Map/TruckMarker';
import RouteOverlay from '../../components/Map/RouteOverlay';
import RoadConditionOverlay from '../../components/Map/RoadConditionOverlay';
import WarehouseMarker from '../../components/Map/WarehouseMarker';
import TruckList from './TruckList';
import TruckDetail from './TruckDetail';
import AINotification from '../../components/AINotification';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import {
  Truck, AlertTriangle, Activity, Clock,
  CheckCircle, X, ChevronDown, ChevronUp,
} from 'lucide-react';

// Severity config for the feed bar
const SEV = {
  critical: { bg: 'bg-red-500/10',    border: 'border-red-500/30',    text: 'text-red-400',    dot: 'bg-red-500',    label: 'Critical' },
  high:     { bg: 'bg-orange-500/10', border: 'border-orange-500/30', text: 'text-orange-400', dot: 'bg-orange-400', label: 'High' },
  medium:   { bg: 'bg-yellow-500/10', border: 'border-yellow-500/20', text: 'text-yellow-400', dot: 'bg-yellow-400', label: 'Medium' },
};

export default function AdminDashboard() {
  const { user } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [fleet, setFleet] = useState([]);
  const [selectedTruck, setSelectedTruck] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [roadConditions, setRoadConditions] = useState([]);
  const [mapCenter, setMapCenter] = useState([20.5937, 78.9629]);
  const [mapZoom, setMapZoom] = useState(5);
  const [showTruckList, setShowTruckList] = useState(true);
  const [alertFeedOpen, setAlertFeedOpen] = useState(true);

  const [shipments, setShipments] = useState([]);

  // Fetch real shipments
  useEffect(() => {
    const fetchShipments = async () => {
      try {
        const warehouseId = user?.warehouse?.id;
        const url = warehouseId ? `/admin/shipments?warehouseId=${warehouseId}` : '/admin/shipments';
        const res = await api.get(url);
        const realShipments = transformShipments(res.data);
        setFleet(realShipments);
      } catch (err) {
        console.error("Error fetching shipments:", err);
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

    return () => {
      clearInterval(pollInterval);
      clearInterval(simInterval);
    };
  }, []);

  const transformShipments = (backendShipments) => {
    return backendShipments
      .map((s) => {
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
  };
  const handleSelectTruck = useCallback((truck) => {
    setSelectedTruck(truck);
    setMapCenter([truck.currentPosition.lat, truck.currentPosition.lng]);
    setMapZoom(8);
  }, []);

  const handleApproveAlert = (alert) => {
    setAlerts((prev) => prev.filter((a) => a.id !== alert.id));
    setRoadConditions((prev) => prev.filter((c) => c.alertId !== alert.id));
  };

  const handleDismissAlert = (alertId) => {
    setAlerts((prev) => prev.filter((a) => a.id !== alertId));
  };

  const criticalCount = alerts.filter((a) => a.severity === 'critical').length;
  const highCount     = alerts.filter((a) => a.severity === 'high').length;
  const blockedRoads  = roadConditions.filter((c) => c.condition === 'blocked').length;
  const congestedRoads = roadConditions.filter((c) => c.condition !== 'blocked').length;

  // Extract unique warehouses from fleet
  const warehouses = React.useMemo(() => {
    const wMap = new Map();
    fleet.forEach(t => {
      if (t.originName && t.originPosition) {
        wMap.set(`orig-${t.originName}`, { name: t.originName, position: t.originPosition, type: 'origin' });
      }
    });
    return Array.from(wMap.values());
  }, [fleet]);

  const stats = [
    { label: 'Active Trucks',  value: fleet.filter((t) => t.status === 'on-route').length, icon: Truck,          color: 'text-neon-blue'  },
    { label: 'Delayed',        value: fleet.filter((t) => t.status === 'delayed').length,  icon: AlertTriangle,  color: 'text-red-400'    },
    { label: 'Open Alerts',    value: alerts.length,                                        icon: Activity,       color: 'text-orange-400' },
    { label: 'Avg Speed',      value: fleet.length ? `${Math.floor(fleet.reduce((s, t) => s + t.speed, 0) / fleet.length)} km/h` : '—', icon: Clock, color: 'text-emerald-400' },
    { label: 'Roads Blocked',  value: blockedRoads,                                         icon: AlertTriangle,  color: 'text-red-500'    },
    { label: 'Congested',      value: congestedRoads,                                       icon: Activity,       color: 'text-yellow-400' },
  ];

  return (
    <div className="h-screen flex bg-brand-dark overflow-hidden">
      {/* Sidebar */}
      <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* ── Top Stats Bar ───────────────────────────────────────── */}
        <div className="border-b border-white/5 bg-slate-950/80 backdrop-blur-sm shrink-0">
          {/* Row 1: title + stats */}
          <div className="min-h-14 flex flex-wrap items-center justify-between px-3 md:px-6 py-2 gap-2">
            <div className="flex items-center gap-3">
              <h1 className="text-white font-semibold text-sm md:text-base">Fleet Command</h1>
              {/* Live pulse indicator */}
              {alerts.length > 0 && (
                <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-[11px] font-medium animate-pulse">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400 inline-block"></span>
                  {criticalCount > 0 ? `${criticalCount} Critical` : `${alerts.length} Active`}
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 md:gap-5 flex-wrap">
              {stats.slice(0, 4).map((stat) => (
                <div key={stat.label} className="flex items-center gap-1.5">
                  <stat.icon size={13} className={stat.color} />
                  <div>
                    <p className="text-[9px] text-slate-500 leading-none mb-0.5 hidden sm:block">{stat.label}</p>
                    <p className={`text-xs font-bold leading-none ${stat.color}`}>{stat.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Row 2: Abnormality feed bar (collapsible) */}
          {alerts.length > 0 && (
            <div className="border-t border-white/5">
              {/* Toggle header */}
              <button
                onClick={() => setAlertFeedOpen(!alertFeedOpen)}
                className="w-full flex items-center justify-between px-6 py-1.5 hover:bg-white/2 transition-colors"
              >
                <span className="text-[11px] text-slate-400 font-medium uppercase tracking-wider flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse inline-block"></span>
                  Live Abnormalities &amp; Delays — {alerts.length} active
                </span>
                {alertFeedOpen
                  ? <ChevronUp size={14} className="text-slate-500" />
                  : <ChevronDown size={14} className="text-slate-500" />
                }
              </button>

              {/* Feed items — horizontal scrollable ticker */}
              {alertFeedOpen && (
                <div className="flex gap-2 px-6 pb-3 overflow-x-auto no-scrollbar">
                  {alerts.map((alert) => {
                    const s = SEV[alert.severity] || SEV.medium;
                    return (
                      <div
                        key={alert.id}
                        className={`shrink-0 flex items-start gap-3 px-3 py-2.5 rounded-xl border ${s.bg} ${s.border} min-w-[280px] max-w-[320px] cursor-default group`}
                      >
                        {/* Severity dot + icon */}
                        <div className="flex flex-col items-center gap-1 pt-0.5">
                          <span className={`w-2 h-2 rounded-full ${s.dot} animate-pulse`}></span>
                          <span className="text-base leading-none">{alert.icon}</span>
                        </div>

                        <div className="flex-1 min-w-0">
                          {/* Truck + severity badge */}
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-white text-xs font-semibold">{alert.truckId}</span>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full border ${s.bg} ${s.border} ${s.text} font-medium`}>
                              {s.label}
                            </span>
                          </div>
                          {/* Title */}
                          <p className={`text-xs font-medium ${s.text} leading-tight`}>{alert.title}</p>
                          {/* Area */}
                          <p className="text-[10px] text-slate-500 mt-0.5 truncate">{alert.affectedArea}</p>
                          {/* Time */}
                          <p className="text-[10px] text-slate-600 mt-0.5">
                            {new Date(alert.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>

                        {/* Quick actions */}
                        <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                          <button
                            onClick={() => handleApproveAlert(alert)}
                            title="Approve route change"
                            className="p-1 rounded bg-neon-blue/10 text-neon-blue hover:bg-neon-blue/25 transition-colors"
                          >
                            <CheckCircle size={13} />
                          </button>
                          <button
                            onClick={() => handleDismissAlert(alert.id)}
                            title="Dismiss"
                            className="p-1 rounded bg-white/5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                          >
                            <X size={13} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Main Map + Panels ──────────────────────────────────── */}
        <div className="flex-1 flex relative overflow-hidden">
          {/* Truck List Panel — desktop: fixed left column | mobile: hidden (use toggle) */}
          {showTruckList && (
            <div className="hidden md:block w-80 border-r border-white/5 bg-slate-950/40 overflow-y-auto shrink-0">
              <TruckList
                trucks={fleet}
                alerts={alerts}
                selectedId={selectedTruck?.id}
                onSelect={handleSelectTruck}
              />
            </div>
          )}

          {/* Map */}
          <div className="flex-1 relative">
            <MapView center={mapCenter} zoom={mapZoom}>
              {/* Road condition overlays — drawn first so truck markers sit on top */}
              <RoadConditionOverlay conditions={roadConditions} />

              {warehouses.map(w => (
                <WarehouseMarker key={`${w.type}-${w.name}`} name={w.name} position={w.position} type={w.type} />
              ))}

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

            {/* Toggle truck list — desktop only */}
            <button
              onClick={() => setShowTruckList(!showTruckList)}
              className="hidden md:block absolute top-4 left-4 z-[1000] px-3 py-2 rounded-lg bg-slate-900/90 border border-white/10 text-slate-300 text-xs hover:text-white hover:border-neon-blue/30 transition-all"
            >
              {showTruckList ? 'Hide List' : 'Show List'}
            </button>

            {/* Mobile: Show trucks floating button */}
            <button
              onClick={() => setShowTruckList(!showTruckList)}
              className="md:hidden absolute top-4 left-4 z-[1000] px-3 py-2 rounded-lg bg-slate-900/90 border border-white/10 text-slate-300 text-xs hover:text-white transition-all"
            >
              {showTruckList ? '✕ Trucks' : '🚛 Trucks'}
            </button>

            {/* Map Legend — compact on mobile */}
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
          </div>

          {/* Truck Detail Panel — desktop: fixed right column | mobile: bottom sheet */}
          {selectedTruck && (
            <>
              {/* Desktop */}
              <div className="hidden md:block w-96 border-l border-white/5 bg-slate-950/40 overflow-y-auto shrink-0">
                <TruckDetail
                  truck={fleet.find((t) => t.id === selectedTruck.id) || selectedTruck}
                  alerts={alerts.filter((a) => a.truckId === selectedTruck.id)}
                  onClose={() => { setSelectedTruck(null); setMapCenter([20.5937, 78.9629]); setMapZoom(5); }}
                />
              </div>
              {/* Mobile bottom sheet */}
              <div className="md:hidden absolute bottom-16 left-0 right-0 z-[1500] max-h-[55vh] overflow-y-auto rounded-t-2xl bg-slate-950/98 border-t border-white/10 backdrop-blur-md">
                <TruckDetail
                  truck={fleet.find((t) => t.id === selectedTruck.id) || selectedTruck}
                  alerts={alerts.filter((a) => a.truckId === selectedTruck.id)}
                  onClose={() => { setSelectedTruck(null); setMapCenter([20.5937, 78.9629]); setMapZoom(5); }}
                />
              </div>
            </>
          )}

          {/* Mobile truck list bottom sheet */}
          {showTruckList && (
            <div className="md:hidden absolute bottom-16 left-0 right-0 z-[1400] max-h-[45vh] overflow-y-auto rounded-t-2xl bg-slate-950/98 border-t border-white/10 backdrop-blur-md">
              <TruckList
                trucks={fleet}
                alerts={alerts}
                selectedId={selectedTruck?.id}
                onSelect={(t) => { handleSelectTruck(t); setShowTruckList(false); }}
              />
            </div>
          )}

          {/* AI Alerts popup stack — top right, only show latest 2 */}
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
      {/* Bottom padding for mobile nav */}
      <div className="md:hidden h-16 shrink-0" />
    </div>
  );
}
