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
import { CircleMarker, Tooltip } from 'react-leaflet';

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
        const adminId = user?.id;
        const url = adminId ? `/admin/shipments?adminId=${adminId}` : (warehouseId ? `/admin/shipments?warehouseId=${warehouseId}` : '/admin/shipments');
        const res = await api.get(url);
        setShipments(res.data);
        setFleet(prevFleet => {
          return transformShipments(res.data, prevFleet);
        });
      } catch (err) {
        console.error("Error fetching shipments:", err);
      }
    };

    fetchShipments();
    const pollInterval = setInterval(fetchShipments, 15000); // Poll shipments every 15s
    
    // Real-time driver location polling for smooth progress
    const locInterval = setInterval(async () => {
      let currentFleet = [];
      setFleet(prevFleet => {
        currentFleet = prevFleet;
        return prevFleet;
      });
      
      // Fetch driver positions for all active shipments
      try {
        const updates = await Promise.all(
          currentFleet.filter(t => t.status === 'on-route' && t.driverId).map(async (t) => {
            try {
              const locRes = await api.get(`/driver/location/${t.driverId}`);
              return { id: t.id, lat: locRes.data.latitude, lng: locRes.data.longitude };
            } catch { return null; }
          })
        );
        
        setFleet(prevFleet => prevFleet.map(truck => {
          const update = updates.find(u => u && u.id === truck.id);
          if (!update) return truck;
          
          // Dynamic progress: find nearest point on route to current position
          let progressFraction = truck.progress;
          let closestIdx = 0;
          if (truck.route && truck.route.length >= 2) {
            let minDist = Infinity;
            for (let i = 0; i < truck.route.length; i++) {
              const dx = truck.route[i].lat - update.lat;
              const dy = truck.route[i].lng - update.lng;
              const d = dx * dx + dy * dy;
              if (d < minDist) { minDist = d; closestIdx = i; }
            }
            progressFraction = closestIdx / (truck.route.length - 1);
          }
          
          return {
            ...truck,
            progress: progressFraction,
            progressIndex: closestIdx,
            currentPosition: { lat: update.lat, lng: update.lng }
          };
        }));
      } catch (err) {
        // Silent fail — will retry on next interval
      }
    }, 3000);

    return () => {
      clearInterval(pollInterval);
      clearInterval(locInterval);
    };
  }, []);

  // Fetch Alerts
  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const res = await api.get('/alerts/all');
        const activeAlerts = res.data.filter(a => a.status === 'PENDING');
        const formattedAlerts = activeAlerts.map(a => ({
          id: a.id,
          truckId: a.affectedShipmentIds ? `SHP-${a.affectedShipmentIds.split(',')[0]}` : 'Unknown',
          driverName: "Affected Driver",
          title: "AI Route Optimization",
          description: a.messsage || "Obstacle detected. Rerouting recommended.",
          affectedArea: a.nodeName || "Unknown Node",
          timestamp: a.time,
          severity: a.severity === 1 ? 'critical' : (a.severity === 2 ? 'high' : 'medium'),
          icon: <AlertTriangle size={20} className="text-red-400" />,
          routeOptions: a.routeOptions?.map(ro => ({
            id: ro.id,
            label: ro.label,
            path: ro.path,
            estimatedHours: ro.estimatedHours,
            riskLevel: ro.riskLevel,
            tradeoff: ro.tradeoff
          })) || []
        }));
        setAlerts(formattedAlerts);
      } catch (err) {
        console.error("Error fetching alerts:", err);
      }
    };

    fetchAlerts();
    const interval = setInterval(fetchAlerts, 5000);
    return () => clearInterval(interval);
  }, []);

  const transformShipments = (backendShipments, prevFleet = []) => {
    return backendShipments
      .map((s) => {
        const existing = prevFleet.find(t => t.id === `SHP-${s.id}`);
        
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
        
        // Dynamic progress: preserved from existing or fallback to 0.02
        let progress = 0;
        if (s.assignmentStatus === "DELIVERED") {
          progress = 1;
        } else if (isStarted) {
          progress = existing?.progress || 0.02;
        }

        let status = "delayed";
        if (s.assignmentStatus === "DELIVERED") status = "delivered";
        else if (isStarted) status = "on-route";
        else if (isUnassigned) status = "awaiting-dispatch";

        // Apply a circular scatter to unassigned/idle trucks near origin
        const jitterLat = (!isStarted && !isUnassigned) ? 0 : (Math.sin(s.id * 10) * 0.02);
        const jitterLng = (!isStarted && !isUnassigned) ? 0 : (Math.cos(s.id * 10) * 0.02);

        let parsedRoute = [];
        if (s.currentPath) {
          try {
            let jsonStr = s.currentPath.replace(/,\s*]/g, ']');
            parsedRoute = JSON.parse(jsonStr);
          } catch (e) {
            console.error("Failed to parse currentPath", e);
          }
        }

        let currentPos = {
          lat: origin.lat + (dest.lat - origin.lat) * progress + jitterLat,
          lng: origin.lng + (dest.lng - origin.lng) * progress + jitterLng,
        };
        let closestIdx = 0;

        if (parsedRoute.length >= 2) {
           const routeIdx = Math.min(parsedRoute.length - 1, Math.max(0, Math.floor(progress * (parsedRoute.length - 1))));
           currentPos = { lat: parsedRoute[routeIdx].lat + jitterLat, lng: parsedRoute[routeIdx].lng + jitterLng };
           closestIdx = routeIdx;
        }

        return {
          id: `SHP-${s.id}`,
          driverId: s.assignedDriverId || null,
          driver: s.assignedDriverId || "Awaiting Assignment",
          originName: s.warehouse?.name || "Warehouse",
          destinationName: s.route?.path?.split(" -> ").pop() || "Destination",
          cargo: s.notes || "High Priority Goods",
          status: status,
          speed: isStarted ? 60 : 0,
          progress: progress,
          progressIndex: closestIdx,
          eta: s.route?.estimatedTime || "Pending",
          distanceRemaining: s.route?.distance ? `${s.route.distance} km` : "200 km",
          originPosition: origin,
          destinationPosition: dest,
          currentPosition: currentPos,
          route: parsedRoute 
        };
      });
  };
  const handleSelectTruck = useCallback((truck) => {
    setSelectedTruck(truck);
    setMapCenter([truck.currentPosition.lat, truck.currentPosition.lng]);
    setMapZoom(8);
  }, []);

  const handleApproveAlert = async (alert) => {
    try {
      const bestOption = alert.routeOptions?.[0];
      if (!bestOption) return;

      const shipmentIdStr = alert.truckId.replace('SHP-', '');
      const shipment = shipments.find(s => s.id.toString() === shipmentIdStr);
      const sourceWhId = shipment?.warehouse?.id || 1;
      const destWhId = shipment?.route?.destination?.id || 2;

      await api.post(`/alerts/${alert.id}/select-route/${bestOption.id}?sourceWhId=${sourceWhId}&destWhId=${destWhId}`);
      
      setAlerts((prev) => prev.filter((a) => a.id !== alert.id));
      setRoadConditions((prev) => prev.filter((c) => c.alertId !== alert.id));
    } catch (err) {
      console.error("Failed to approve alert:", err);
    }
  };

  const handleDismissAlert = async (alertId) => {
    try {
      await api.post(`/alerts/${alertId}/dismiss`);
      setAlerts((prev) => prev.filter((a) => a.id !== alertId));
    } catch (err) {
      console.error("Failed to dismiss alert:", err);
    }
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
    { label: 'Active Trucks',  value: fleet.filter((t) => t.status === 'on-route' || t.progress >= 1).length, icon: Truck,          color: 'text-neon-blue'  },
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
                  {selectedTruck?.id === truck.id && truck.route && truck.route.length >= 2 && (
                    <>
                      <RouteOverlay 
                        route={truck.route} 
                        isActive={truck.status === 'on-route' || truck.status === 'delayed'} 
                        progressIndex={truck.progressIndex || 0}
                      />
                      {/* Origin marker — Green */}
                      <CircleMarker
                        center={[truck.route[0].lat, truck.route[0].lng]}
                        radius={8}
                        pathOptions={{
                          fillColor: '#22c55e',
                          fillOpacity: 1,
                          color: '#ffffff',
                          weight: 2,
                          opacity: 0.9,
                        }}
                      >
                        <Tooltip 
                          direction="top" 
                          offset={[0, -12]} 
                          opacity={1} 
                          permanent={true}
                          className="origin-destination-label"
                        >
                          <div style={{
                            background: 'rgba(15, 23, 42, 0.95)',
                            border: '1px solid rgba(34, 197, 94, 0.4)',
                            borderRadius: '8px',
                            padding: '4px 10px',
                            backdropFilter: 'blur(8px)',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
                          }}>
                            <span style={{ color: '#22c55e', fontSize: '10px', fontWeight: 800, letterSpacing: '0.5px', textTransform: 'uppercase' }}>⬤ </span>
                            <span style={{ color: '#ffffff', fontSize: '11px', fontWeight: 700 }}>{truck.originName}</span>
                          </div>
                        </Tooltip>
                      </CircleMarker>

                      {/* Destination marker — Red */}
                      <CircleMarker
                        center={[truck.route[truck.route.length - 1].lat, truck.route[truck.route.length - 1].lng]}
                        radius={8}
                        pathOptions={{
                          fillColor: '#ef4444',
                          fillOpacity: 1,
                          color: '#ffffff',
                          weight: 2,
                          opacity: 0.9,
                        }}
                      >
                        <Tooltip 
                          direction="top" 
                          offset={[0, -12]} 
                          opacity={1} 
                          permanent={true}
                          className="origin-destination-label"
                        >
                          <div style={{
                            background: 'rgba(15, 23, 42, 0.95)',
                            border: '1px solid rgba(239, 68, 68, 0.4)',
                            borderRadius: '8px',
                            padding: '4px 10px',
                            backdropFilter: 'blur(8px)',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
                          }}>
                            <span style={{ color: '#ef4444', fontSize: '10px', fontWeight: 800, letterSpacing: '0.5px', textTransform: 'uppercase' }}>⬤ </span>
                            <span style={{ color: '#ffffff', fontSize: '11px', fontWeight: 700 }}>{truck.destinationName}</span>
                          </div>
                        </Tooltip>
                      </CircleMarker>
                    </>
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
