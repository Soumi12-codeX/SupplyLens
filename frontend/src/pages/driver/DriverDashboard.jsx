import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import MapView from '../../components/Map/MapView';
import TruckMarker from '../../components/Map/TruckMarker';
import RouteOverlay from '../../components/Map/RouteOverlay';
import DriverMessages from './DriverMessages';
import AINotification from '../../components/AINotification';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { CircleMarker, Tooltip } from 'react-leaflet';
import {
  Navigation, MapPin, Clock, Gauge, Package,
  ChevronUp, ChevronDown, MessageSquare, Loader2, Play, CheckCircle2, AlertTriangle
} from 'lucide-react';

export default function DriverDashboard() {
  const { user } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [truck, setTruck] = useState(null); // This stores the current visual state (simulated or real)
  const [activeShipment, setActiveShipment] = useState(null);
  const [showMessages, setShowMessages] = useState(false);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bottomPanelExpanded, setBottomPanelExpanded] = useState(true);
  const [startingTrip, setStartingTrip] = useState(false);
  const [acknowledgedRouteOptionId, setAcknowledgedRouteOptionId] = useState(null);

  // 1. Fetch data initially and Poll for new assignments
  const fetchData = async () => {
    if (!user?.driverId) return;
    try {
      const locRes = await api.get(`/driver/location/${user.driverId}`);
      const loc = locRes.data || { latitude: 20.5937, longitude: 78.9629 };

      const shipRes = await api.get(`/driver/shipments/${user.driverId}`);
      const current = shipRes.data.find(s => s.assignmentStatus !== 'DELIVERED') || null;

      setActiveShipment(current);

      if (!current || current.assignmentStatus === 'ASSIGNED') {
        const staticTruck = {
          id: `TRK-${user.driverId}`,
          currentPosition: { lat: loc.latitude, lng: loc.longitude },
          status: current ? 'assigned' : 'idle',
          route: (() => {
            try {
              let jsonStr = current?.currentPath;
              const origin = { lat: current?.warehouse?.latitude || 20.5937, lng: current?.warehouse?.longitude || 78.9629 };
              const dest = { lat: current?.route?.destination?.latitude || origin.lat, lng: current?.route?.destination?.longitude || origin.lng };

              if (!jsonStr || jsonStr === "[]") return [origin, dest];
              jsonStr = jsonStr.replace(/,\s*]/g, ']');
              const parsed = JSON.parse(jsonStr);
              return (parsed && parsed.length > 0) ? parsed : [origin, dest];
            } catch (e) {
              console.error("Failed to parse currentPath", e);
              const origin = { lat: current?.warehouse?.latitude || 20.5937, lng: current?.warehouse?.longitude || 78.9629 };
              const dest = { lat: current?.route?.destination?.latitude || origin.lat, lng: current?.route?.destination?.longitude || origin.lng };
              return [origin, dest];
            }
          })(),
          originName: current?.warehouse?.name || "Base",
          destinationName: current?.route?.destination?.name || "N/A",
          cargo: current?.notes || "No cargo",
          progress: 0,
          speed: 0,
          eta: current?.route?.estimatedTime || "N/A",
          distanceRemaining: "Calculating..."
        };
        setTruck(staticTruck);
      } else if (current.assignmentStatus === 'IN_PROGRESS') {
        const parsedRoute = (() => {
          try {
            let jsonStr = current?.currentPath;
            if (!jsonStr) return [];
            jsonStr = jsonStr.replace(/,\s*]/g, ']');
            return JSON.parse(jsonStr);
          } catch (e) {
            console.error("Failed to parse currentPath", e);
            return [];
          }
        })();

        // Dynamic progress: find nearest point on route to current position
        let progressFraction = 0;
        let closestIdx = 0;
        if (parsedRoute.length >= 2) {
          let minDist = Infinity;
          for (let i = 0; i < parsedRoute.length; i++) {
            const dx = parsedRoute[i].lat - loc.latitude;
            const dy = parsedRoute[i].lng - loc.longitude;
            const d = dx * dx + dy * dy;
            if (d < minDist) { minDist = d; closestIdx = i; }
          }
          progressFraction = (parsedRoute.length > 1) ? closestIdx / (parsedRoute.length - 1) : 0;
        }

        // Dynamic km remaining: haversine from truck to destination
        const destPt = parsedRoute.length > 0 ? parsedRoute[parsedRoute.length - 1] : null;
        let kmRemaining = 'Calculating...';
        if (destPt) {
          const R = 6371;
          const dLat = (destPt.lat - loc.latitude) * Math.PI / 180;
          const dLng = (destPt.lng - loc.longitude) * Math.PI / 180;
          const a = Math.sin(dLat / 2) ** 2 + Math.cos(loc.latitude * Math.PI / 180) * Math.cos(destPt.lat * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
          kmRemaining = Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))) + ' km left';
        }

        const activeTruck = {
          id: `TRK-${user.driverId}`,
          currentPosition: { lat: loc.latitude, lng: loc.longitude },
          status: 'on-route',
          route: parsedRoute,
          originName: current.warehouse?.name,
          destinationName: current.route?.destination?.name || "N/A",
          cargo: current.notes,
          progress: progressFraction,
          progressIndex: closestIdx,
          speed: 65,
          eta: current.route?.estimatedTime || "4h",
          distanceRemaining: kmRemaining
        };
        setTruck(activeTruck);
      }
      setLoading(false);
    } catch (err) {
      console.error("Failed to fetch driver data:", err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 3000); // Poll every 3s for smooth tracking
    return () => clearInterval(interval);
  }, [user]);

  // Derive whether the reroute popup should show:
  // Show only when routeStatus is REROUTED AND the driver hasn't acknowledged THIS specific route option yet
  const showReroutePopup = activeShipment?.routeStatus === 'REROUTED'
    && activeShipment?.activeRouteOptionId != null
    && acknowledgedRouteOptionId !== activeShipment?.activeRouteOptionId;

  // --- Cleanup: Removed frontend simulator to avoid conflict with backend road-aware engine ---

  const handleStartTrip = async () => {
    if (!activeShipment) return;
    setStartingTrip(true);
    try {
      await api.post(`/driver/shipments/${activeShipment.id}/start`);
      await fetchData();
    } catch (err) {
      alert("Failed to start trip. Please try again.");
    } finally {
      setStartingTrip(false);
    }
  };

  const handleMarkDelivered = async () => {
    if (!activeShipment) return;
    try {
      await api.post(`/driver/shipments/${activeShipment.id}/delivered`);
      await fetchData();
    } catch (err) {
      alert("Failed to mark delivered.");
    }
  }

  const handleReroute = async () => {
    try {
      const shipmentId = activeShipment.id.toString().replace('SHP-', '');
      const res = await api.get(`/route/driver-link/${shipmentId}`);
      if (res.data && res.data.link) {
        window.open(res.data.link, '_blank');
        // Mark THIS route option ID as acknowledged so popup won't reappear
        setAcknowledgedRouteOptionId(activeShipment.activeRouteOptionId);
      }
    } catch (err) {
      console.error("Failed to get reroute link:", err);
    }
  };

  if (loading || !truck) {
    return (
      <div className="h-screen flex items-center justify-center bg-brand-dark">
        <Loader2 className="w-8 h-8 text-neon-blue animate-spin" />
      </div>
    );
  }

  const isAssigned = activeShipment?.assignmentStatus === 'ASSIGNED';
  const isInProgress = activeShipment?.assignmentStatus === 'IN_PROGRESS';
  const progressPercent = Math.round((truck.progress || 0) * 100);

  return (
    <div className="h-screen flex bg-brand-dark overflow-hidden">
      <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />

      <div className="flex-1 flex flex-col relative overflow-hidden">
        {/* Full-Screen Map */}
        <div className="flex-1 relative">
          <MapView
            center={[truck.currentPosition.lat, truck.currentPosition.lng]}
            zoom={isInProgress || isAssigned ? 10 : 13}
            route={(isAssigned || isInProgress) ? truck.route : null}
          >
            <TruckMarker truck={truck} isSelected onClick={() => { }} />
            {(isInProgress || isAssigned) && truck.route && (
              <RouteOverlay route={truck.route} isActive={isInProgress} progressIndex={truck.progressIndex || 0} />
            )}

            {/* Origin & Destination Labels on Map */}
            {(isInProgress || isAssigned) && truck.route && truck.route.length >= 2 && (
              <>
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
                      <span style={{
                        color: '#22c55e',
                        fontSize: '10px',
                        fontWeight: 800,
                        letterSpacing: '0.5px',
                        textTransform: 'uppercase',
                      }}>⬤ </span>
                      <span style={{
                        color: '#ffffff',
                        fontSize: '11px',
                        fontWeight: 700,
                      }}>{truck.originName}</span>
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
                      <span style={{
                        color: '#ef4444',
                        fontSize: '10px',
                        fontWeight: 800,
                        letterSpacing: '0.5px',
                        textTransform: 'uppercase',
                      }}>⬤ </span>
                      <span style={{
                        color: '#ffffff',
                        fontSize: '11px',
                        fontWeight: 700,
                      }}>{truck.destinationName}</span>
                    </div>
                  </Tooltip>
                </CircleMarker>
              </>
            )}
          </MapView>

          {/* HUD UI */}
          <div className="absolute top-4 left-4 right-4 z-[1000] flex flex-col gap-3">
            {!activeShipment && (
              <div className="self-center px-4 py-2 rounded-full bg-slate-900/90 border border-white/10 backdrop-blur-md flex items-center gap-3 animate-pulse">
                <div className="w-2 h-2 rounded-full bg-neon-blue shadow-[0_0_8px_#00f0ff]" />
                <span className="text-white text-xs font-semibold tracking-wider uppercase">Searching for Shipments...</span>
              </div>
            )}

            {isInProgress && (
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-slate-900/90 border border-white/10 backdrop-blur-md min-w-0">
                <Navigation size={16} className="text-neon-blue shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-white text-xs md:text-sm font-semibold truncate">
                    {truck.originName} → {truck.destinationName}
                  </p>
                  <p className="text-slate-400 text-[10px] md:text-xs truncate">{truck.cargo}</p>
                </div>
                <button
                  onClick={() => setShowMessages(!showMessages)}
                  className="relative p-2 text-slate-300 hover:text-white transition-colors"
                >
                  <MessageSquare size={18} />
                </button>
              </div>
            )}

            {showReroutePopup && (
              <div className="fixed inset-0 bg-black/60 z-[2000] flex items-center justify-center p-4 backdrop-blur-sm">
                <div className="bg-slate-900 border border-orange-500/50 rounded-2xl p-6 max-w-sm w-full shadow-[0_0_40px_rgba(249,115,22,0.2)] flex flex-col items-center text-center animate-fade-in-up">
                  <div className="w-16 h-16 rounded-full bg-orange-500/10 flex items-center justify-center mb-4">
                    <AlertTriangle className="text-orange-500 w-8 h-8 animate-pulse" />
                  </div>
                  <h2 className="text-xl font-bold text-white mb-2">Route Updated</h2>
                  <p className="text-slate-300 text-sm mb-6 leading-relaxed">
                    The Command Center has approved a new AI-optimized route due to an obstacle ahead.
                  </p>
                  <button
                    onClick={handleReroute}
                    className="w-full py-3.5 bg-orange-500 text-white font-bold text-sm rounded-xl hover:bg-orange-600 transition-all shadow-[0_0_20px_rgba(249,115,22,0.3)] hover:shadow-[0_0_25px_rgba(249,115,22,0.5)] transform hover:-translate-y-0.5 active:translate-y-0"
                  >
                    START NEW ROUTE
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Parallel Assignment Window — Non-blocking, side-aligned */}
          {isAssigned && (
            <div className="absolute top-4 left-4 bottom-4 w-full max-w-[320px] pointer-events-none z-[1500] flex items-center md:items-start">
              <div className="w-full bg-slate-900/95 border border-white/10 rounded-3xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] backdrop-blur-md animate-fade-in-left pointer-events-auto max-h-[90vh] flex flex-col">
                <div className="p-5 flex-1 overflow-y-auto">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 rounded-2xl bg-neon-blue/10 border border-neon-blue/20 flex items-center justify-center shrink-0">
                      <Package className="text-neon-blue" size={24} />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-white leading-tight">New Journey Assigned</h2>
                      <p className="text-slate-500 text-[11px] uppercase tracking-wider font-semibold">Active Assignment</p>
                    </div>
                  </div>

                  <div className="space-y-3 mb-6">
                    <div className="p-3.5 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/8 transition-colors">
                      <div className="flex items-center gap-2 mb-2">
                        <MapPin size={14} className="text-emerald-400" />
                        <span className="text-[10px] text-slate-500 uppercase font-bold">Planned Route</span>
                      </div>
                      <p className="text-white text-sm font-semibold leading-relaxed">
                        {activeShipment.warehouse?.name}
                        <span className="mx-2 text-slate-600">→</span>
                        {activeShipment.route?.destination?.name || "N/A"}
                      </p>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/8 transition-colors">
                      <div className="flex items-center gap-2 mb-2">
                        <Package size={14} className="text-neon-blue" />
                        <span className="text-[10px] text-slate-500 uppercase font-bold">Cargo Details</span>
                      </div>
                      <p className="text-white text-sm font-semibold">
                        {activeShipment.notes || "High Priority Parcel"}
                      </p>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/8 transition-colors">
                      <div className="flex items-center gap-2 mb-2">
                        <Clock size={14} className="text-amber-400" />
                        <span className="text-[10px] text-slate-500 uppercase font-bold">Estimated Time</span>
                      </div>
                      <p className="text-white text-sm font-semibold">
                        {activeShipment.route?.estimatedTime || "Calculating..."}
                      </p>
                    </div>

                    {/* Journey Timeline Preview */}
                    <div className="p-4 rounded-2xl bg-brand-primary/5 border border-brand-primary/10">
                      <p className="text-[10px] text-brand-primary font-bold uppercase tracking-wider mb-3">Journey Preview</p>
                      <div className="space-y-4 relative">
                        <div className="absolute left-1.5 top-2 bottom-2 w-0.5 bg-slate-800 border-l border-dashed border-slate-700"></div>

                        <div className="flex items-start gap-3 relative">
                          <div className="w-3 h-3 rounded-full bg-emerald-500 mt-1 shadow-[0_0_8px_rgba(16,185,129,0.4)]"></div>
                          <p className="text-xs text-white font-medium">{activeShipment.warehouse?.name}</p>
                        </div>

                        {truck.route?.length > 2 && (
                          <div className="flex items-start gap-3 relative">
                            <div className="w-3 h-3 rounded-full bg-neon-blue mt-1"></div>
                            <p className="text-[10px] text-slate-400">{truck.route.length - 2} Intermediate Hubs</p>
                          </div>
                        )}

                        <div className="flex items-start gap-3 relative">
                          <div className="w-3 h-3 rounded-full bg-red-500 mt-1 shadow-[0_0_8px_rgba(239,68,68,0.4)]"></div>
                          <p className="text-xs text-white font-medium">{activeShipment.route?.destination?.name || "Destination"}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={handleStartTrip}
                    disabled={startingTrip}
                    className="group relative w-full py-4 rounded-2xl bg-neon-blue text-brand-dark font-black text-sm hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 shadow-[0_10px_30px_rgba(0,240,255,0.3)] disabled:opacity-50 overflow-hidden"
                  >
                    {startingTrip ? (
                      <Loader2 className="animate-spin" size={18} />
                    ) : (
                      <>
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                        <Play size={18} className="fill-current" />
                        START YOUR TRIP
                      </>
                    )}
                  </button>
                </div>

                <div className="p-4 bg-white/5 border-t border-white/5">
                  <p className="text-[10px] text-slate-500 text-center italic">
                    Assigned by Command Center • Real-time tracking enabled
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Messages Panel */}
          {showMessages && (
            <div className="absolute top-0 right-0 h-full w-full sm:w-96 z-[1000] border-l border-white/5 bg-slate-950/95 backdrop-blur-md">
              <DriverMessages
                messages={messages}
                onClose={() => setShowMessages(false)}
                onAccept={(msgId) => { }}
              />
            </div>
          )}
        </div>

        {/* Bottom Trip Panel */}
        {isInProgress && (
          <div className={`border-t border-white/10 bg-slate-950/95 backdrop-blur-md transition-all duration-300 shrink-0 ${bottomPanelExpanded ? 'h-56 md:h-52' : 'h-14'
            }`}>
            <button
              onClick={() => setBottomPanelExpanded(!bottomPanelExpanded)}
              className="w-full flex items-center justify-center py-1 text-slate-500 hover:text-white transition-colors"
            >
              {bottomPanelExpanded ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
            </button>

            {!bottomPanelExpanded ? (
              <div className="px-6 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <span className="text-neon-blue font-bold text-lg">{truck.eta}</span>
                  <span className="text-slate-400 text-sm">• {truck.distanceRemaining}</span>
                </div>
                <span className="text-slate-500 text-sm">{truck.speed} km/h</span>
              </div>
            ) : (
              <div className="px-6 pb-4">
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-emerald-400 text-xs font-medium">{truck.originName}</span>
                    <span className="text-xs text-slate-500 font-medium">{truck.distanceRemaining}</span>
                    <span className="text-red-400 text-xs font-medium">{truck.destinationName}</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-white/5 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-emerald-400 via-neon-blue to-brand-primary transition-all duration-1000"
                      style={{ width: `${progressPercent}%` }}
                    ></div>
                  </div>
                </div>

                <div className="flex flex-col md:flex-row gap-4 items-center">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 flex-1 w-full">
                    <div className="flex items-center gap-2 p-2 rounded-lg bg-white/3">
                      <Clock size={14} className="text-neon-blue shrink-0" />
                      <div>
                        <p className="text-white text-sm font-semibold">{truck.eta}</p>
                        <p className="text-slate-500 text-[10px]">ETA</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 p-2 rounded-lg bg-white/3">
                      <Gauge size={14} className="text-neon-blue shrink-0" />
                      <div>
                        <p className="text-white text-sm font-semibold">{truck.speed} km/h</p>
                        <p className="text-slate-500 text-[10px]">Speed</p>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={handleMarkDelivered}
                    className="w-full md:w-auto px-6 py-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-bold hover:bg-emerald-500/20 transition-all flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 size={16} />
                    MARK DELIVERED
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      <div className="md:hidden h-16 shrink-0" />
    </div>
  );
}
