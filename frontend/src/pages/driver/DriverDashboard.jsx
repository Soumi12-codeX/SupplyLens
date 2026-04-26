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
  const [activeRouteOption, setActiveRouteOption] = useState(null);

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
  const showReroutePopup = activeShipment?.routeStatus === 'REROUTED'
    && activeShipment?.activeRouteOptionId != null
    && acknowledgedRouteOptionId !== activeShipment?.activeRouteOptionId;

  // Fetch Route Option details when it changes
  useEffect(() => {
    const fetchRouteOption = async () => {
      if (activeShipment?.activeRouteOptionId && showReroutePopup) {
        try {
          const res = await api.get(`/alerts/route-option/${activeShipment.activeRouteOptionId}`);
          setActiveRouteOption(res.data);
        } catch (err) {
          console.error("Failed to fetch route option details:", err);
        }
      }
    };
    fetchRouteOption();
  }, [activeShipment?.activeRouteOptionId, showReroutePopup]);

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
              <div className="fixed inset-0 bg-slate-950/40 z-[2000] flex items-center justify-center p-4 backdrop-blur-md transition-all duration-500">
                <div className="relative group max-w-sm w-full animate-fade-in-up">
                  {/* Animated Border Glow */}
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-orange-500 via-amber-400 to-orange-600 rounded-3xl blur opacity-30 group-hover:opacity-50 transition duration-1000 group-hover:duration-200 animate-pulse"></div>
                  
                  {/* Main Modal Content */}
                  <div className="relative bg-slate-900/90 border border-white/10 backdrop-blur-2xl rounded-3xl p-8 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.7)] flex flex-col items-center text-center">
                    
                    {/* Futuristic Icon Hub */}
                    <div className="relative mb-8">
                      <div className="absolute inset-0 bg-orange-500/20 blur-2xl rounded-full animate-pulse"></div>
                      <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-br from-orange-500/10 to-transparent border border-orange-500/30 flex items-center justify-center overflow-hidden">
                        {/* Scanning Effect */}
                        <div className="absolute inset-0 bg-gradient-to-b from-orange-500/20 to-transparent h-1/2 w-full animate-[bounce_3s_infinite] opacity-50"></div>
                        <AlertTriangle className="text-orange-500 w-10 h-10 drop-shadow-[0_0_15px_rgba(249,115,22,0.6)]" />
                      </div>
                      
                      {/* Floating Particles (CSS) */}
                      <div className="absolute -top-2 -right-2 w-3 h-3 rounded-full bg-orange-400/40 animate-ping"></div>
                    </div>

                    <div className="space-y-3 mb-8">
                      <h2 className="text-2xl font-black text-white tracking-tight font-outfit">
                        ROUTE <span className="text-orange-500">OPTIMIZED</span>
                      </h2>
                      <div className="flex items-center justify-center gap-2">
                        <div className="h-px w-8 bg-gradient-to-r from-transparent to-orange-500/50"></div>
                        <span className="text-[10px] font-bold text-orange-500/80 uppercase tracking-[0.2em]">AI Intelligence Active</span>
                        <div className="h-px w-8 bg-gradient-to-l from-transparent to-orange-500/50"></div>
                      </div>
                      <p className="text-slate-400 text-sm leading-relaxed font-medium px-2">
                        {activeRouteOption?.tradeoff || "Obstacle detected on current path. SupplyLens Intelligence has calculated a high-efficiency alternative."}
                      </p>
                    </div>

                    {/* Route Preview Section */}
                    {activeRouteOption?.path && (
                      <div className="w-full mb-8 p-4 rounded-2xl bg-white/[0.03] border border-white/5 text-left">
                        <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-2 flex items-center gap-2">
                          <Navigation size={10} className="text-orange-500" /> NEW PATH PREVIEW
                        </p>
                        <p className="text-white text-xs font-bold leading-relaxed">
                          {activeRouteOption.path}
                        </p>
                      </div>
                    )}

                    {/* Action Button */}
                    <button
                      onClick={handleReroute}
                      className="group relative w-full overflow-hidden rounded-2xl p-px transition-all hover:scale-[1.02] active:scale-[0.98]"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-orange-600 via-amber-500 to-orange-600 animate-[gradient_3s_linear_infinite]"></div>
                      <div className="relative flex items-center justify-center gap-3 bg-slate-950 py-4 px-6 rounded-[15px] transition-colors group-hover:bg-transparent">
                        <Navigation className="w-5 h-5 text-white group-hover:animate-bounce" />
                        <span className="text-white font-black text-sm tracking-wider">INITIATE REROUTE</span>
                      </div>
                    </button>

                    <button 
                      onClick={() => setAcknowledgedRouteOptionId(activeShipment.activeRouteOptionId)}
                      className="mt-6 text-slate-500 text-[11px] font-bold uppercase tracking-widest hover:text-white transition-colors"
                    >
                      Dismiss Alert
                    </button>
                  </div>
                </div>
              </div>
            )}

          </div>

          {/* Parallel Assignment Window — Non-blocking, side-aligned */}
          {isAssigned && (
            <div className="absolute top-4 left-4 bottom-4 w-full max-w-[340px] pointer-events-none z-[1500] flex items-center md:items-start">
              <div className="relative group w-full bg-slate-900/40 border border-white/10 rounded-[32px] overflow-hidden shadow-[0_32px_64px_-16px_rgba(0,0,0,0.6)] backdrop-blur-2xl animate-fade-in-left pointer-events-auto max-h-[90vh] flex flex-col">
                
                {/* Top Brand Stripe */}
                <div className="h-1.5 w-full bg-gradient-to-r from-neon-blue via-brand-primary to-neon-blue animate-[gradient_3s_linear_infinite]"></div>

                <div className="p-6 flex-1 overflow-y-auto no-scrollbar">
                  <div className="flex items-center gap-4 mb-8">
                    <div className="relative shrink-0">
                      <div className="absolute inset-0 bg-neon-blue/20 blur-xl rounded-full animate-pulse"></div>
                      <div className="relative w-14 h-14 rounded-2xl bg-slate-950 border border-neon-blue/30 flex items-center justify-center">
                        <Package className="text-neon-blue drop-shadow-[0_0_8px_rgba(0,240,255,0.5)]" size={28} />
                      </div>
                    </div>
                    <div>
                      <h2 className="text-xl font-black text-white tracking-tight font-outfit leading-tight">NEW ASSIGNMENT</h2>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="flex h-1.5 w-1.5 rounded-full bg-neon-blue animate-ping"></span>
                        <p className="text-slate-500 text-[10px] uppercase tracking-[0.15em] font-black">Live Update</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4 mb-8">
                    {/* Route Info Card */}
                    <div className="group/card relative p-4 rounded-2xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.06] transition-all duration-300">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <MapPin size={14} className="text-emerald-400" />
                          <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Logistics Route</span>
                        </div>
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[9px] font-bold border border-emerald-500/20">VERIFIED</span>
                      </div>
                      <div className="flex flex-col gap-1">
                        <p className="text-white text-sm font-bold flex items-center gap-2">
                          {activeShipment.warehouse?.name}
                        </p>
                        <div className="h-4 w-px bg-slate-800 ml-1.5 my-0.5"></div>
                        <p className="text-white text-sm font-bold flex items-center gap-2">
                          {activeShipment.route?.destination?.name || "N/A"}
                        </p>
                      </div>
                    </div>

                    {/* Cargo & ETA */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5">
                        <Package size={14} className="text-neon-blue mb-2" />
                        <span className="block text-[9px] text-slate-500 uppercase font-bold mb-1">Payload</span>
                        <p className="text-white text-xs font-bold truncate">{activeShipment.notes || "High Priority"}</p>
                      </div>
                      <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5">
                        <Clock size={14} className="text-amber-400 mb-2" />
                        <span className="block text-[9px] text-slate-500 uppercase font-bold mb-1">Timeframe</span>
                        <p className="text-white text-xs font-bold">{activeShipment.route?.estimatedTime || "Calc..."}</p>
                      </div>
                    </div>

                    {/* Visual Journey Preview */}
                    <div className="relative p-5 rounded-3xl bg-slate-950/50 border border-white/5 overflow-hidden group/journey">
                      {/* Scanning Line */}
                      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-neon-blue/40 to-transparent animate-[scan_2s_linear_infinite] pointer-events-none"></div>
                      
                      <p className="text-[10px] text-neon-blue/60 font-black uppercase tracking-widest mb-4">Journey Visualizer</p>
                      <div className="space-y-5 relative">
                        <div className="absolute left-[7px] top-2 bottom-2 w-[1px] bg-slate-800 border-l border-dashed border-slate-700"></div>

                        <div className="flex items-center gap-4 relative">
                          <div className="w-3.5 h-3.5 rounded-full bg-emerald-500 ring-4 ring-emerald-500/10"></div>
                          <div>
                            <p className="text-[11px] text-white font-bold">{activeShipment.warehouse?.name}</p>
                            <p className="text-[9px] text-slate-500">Pickup Location</p>
                          </div>
                        </div>

                        {truck.route?.length > 2 && (
                          <div className="flex items-center gap-4 relative">
                            <div className="w-3.5 h-3.5 rounded-full bg-neon-blue ring-4 ring-neon-blue/10"></div>
                            <p className="text-[10px] text-slate-400 font-medium italic">{truck.route.length - 2} Dynamic Transit Nodes</p>
                          </div>
                        )}

                        <div className="flex items-center gap-4 relative">
                          <div className="w-3.5 h-3.5 rounded-full bg-red-500 ring-4 ring-red-500/10 shadow-[0_0_12px_rgba(239,68,68,0.3)]"></div>
                          <div>
                            <p className="text-[11px] text-white font-bold">{activeShipment.route?.destination?.name || "Destination"}</p>
                            <p className="text-[9px] text-slate-500">Final Drop-off</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={handleStartTrip}
                    disabled={startingTrip}
                    className="group relative w-full overflow-hidden rounded-2xl p-px transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-neon-blue via-brand-primary to-neon-blue animate-[gradient_3s_linear_infinite]"></div>
                    <div className="relative flex items-center justify-center gap-3 bg-slate-950 py-4 px-6 rounded-[15px] transition-colors group-hover:bg-transparent">
                      {startingTrip ? (
                        <Loader2 className="animate-spin text-neon-blue" size={20} />
                      ) : (
                        <>
                          <Play size={18} className="text-white fill-white group-hover:scale-110 transition-transform" />
                          <span className="text-white font-black text-sm tracking-widest">COMMENCE JOURNEY</span>
                        </>
                      )}
                    </div>
                  </button>
                </div>

                <div className="px-6 py-4 bg-slate-950/80 border-t border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                    <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">System Ready</span>
                  </div>
                  <span className="text-[9px] text-slate-600 font-medium tracking-tighter">ID: {activeShipment.id}</span>
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
          <div className={`border-t border-white/5 bg-slate-950/40 backdrop-blur-3xl transition-all duration-500 shrink-0 ${bottomPanelExpanded ? 'h-64 md:h-56' : 'h-16'
            } safe-area-inset-bottom`}>
            
            {/* Toggle Handle */}
            <button
              onClick={() => setBottomPanelExpanded(!bottomPanelExpanded)}
              className="w-full flex items-center justify-center py-2 group transition-all"
            >
              <div className={`w-12 h-1 rounded-full bg-white/10 group-hover:bg-neon-blue/40 transition-colors ${bottomPanelExpanded ? 'mb-1' : ''}`}></div>
            </button>

            {!bottomPanelExpanded ? (
              <div className="px-8 flex items-center justify-between animate-fade-in-up">
                <div className="flex items-center gap-6">
                  <div className="flex flex-col">
                    <span className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Arrival</span>
                    <span className="text-neon-blue font-black text-xl font-outfit">{truck.eta}</span>
                  </div>
                  <div className="h-8 w-px bg-white/5"></div>
                  <div className="flex flex-col">
                    <span className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Remaining</span>
                    <span className="text-white font-bold text-sm tracking-tight">{truck.distanceRemaining}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.03] border border-white/5">
                  <Gauge size={14} className="text-neon-blue" />
                  <span className="text-white font-bold text-sm">{truck.speed} <span className="text-slate-500 font-medium">km/h</span></span>
                </div>
              </div>
            ) : (
              <div className="px-8 pb-6 animate-fade-in-up">
                <div className="mb-8 relative">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex flex-col">
                      <span className="text-emerald-400 text-[10px] font-black uppercase tracking-widest">{truck.originName}</span>
                      <span className="text-[10px] text-slate-500 font-bold uppercase mt-0.5">Departed</span>
                    </div>
                    <div className="flex flex-col items-center">
                       <span className="text-white text-xs font-black tracking-widest bg-white/[0.05] px-3 py-1 rounded-full border border-white/5">{progressPercent}%</span>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-red-400 text-[10px] font-black uppercase tracking-widest">{truck.destinationName}</span>
                      <span className="text-[10px] text-slate-500 font-bold uppercase mt-0.5">Destination</span>
                    </div>
                  </div>
                  
                  {/* Premium Progress Bar */}
                  <div className="relative h-3 w-full rounded-full bg-slate-900 border border-white/5 p-0.5 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-neon-blue to-brand-primary transition-all duration-1000 relative"
                      style={{ width: `${progressPercent}%` }}
                    >
                      {/* Glow Head */}
                      <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-r from-transparent to-white/40 blur-md"></div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col md:flex-row gap-6 items-center">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 flex-1 w-full">
                    <div className="group/stat p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.05] transition-all">
                      <div className="flex items-center gap-2 mb-2">
                        <Clock size={16} className="text-neon-blue opacity-70 group-hover:opacity-100 transition-opacity" />
                        <span className="text-[10px] text-slate-500 font-black uppercase tracking-tighter">Est. Arrival</span>
                      </div>
                      <p className="text-white text-xl font-black font-outfit tracking-tight">{truck.eta}</p>
                    </div>
                    
                    <div className="group/stat p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.05] transition-all">
                      <div className="flex items-center gap-2 mb-2">
                        <Gauge size={16} className="text-neon-blue opacity-70 group-hover:opacity-100 transition-opacity" />
                        <span className="text-[10px] text-slate-500 font-black uppercase tracking-tighter">Current Velocity</span>
                      </div>
                      <p className="text-white text-xl font-black font-outfit tracking-tight">{truck.speed} <span className="text-xs text-slate-500">KM/H</span></p>
                    </div>
                  </div>

                  <button
                    onClick={handleMarkDelivered}
                    className="group relative w-full md:w-auto overflow-hidden rounded-2xl p-px transition-all hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 via-emerald-400 to-emerald-600 animate-[gradient_3s_linear_infinite] opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <div className="relative flex items-center justify-center gap-3 bg-emerald-500/10 text-emerald-400 py-4 px-8 rounded-[15px] border border-emerald-500/20 group-hover:bg-slate-950 group-hover:text-white transition-all">
                      <CheckCircle2 size={18} className="group-hover:scale-110 transition-transform" />
                      <span className="font-black text-xs tracking-widest">MARK AS DELIVERED</span>
                    </div>
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
