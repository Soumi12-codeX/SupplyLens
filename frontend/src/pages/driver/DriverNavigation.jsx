import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import MapView from '../../components/Map/MapView';
import TruckMarker from '../../components/Map/TruckMarker';
import RouteOverlay from '../../components/Map/RouteOverlay';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { Navigation, Compass, MapPin, Clock, Gauge, ArrowUp, ArrowUpRight, ArrowRight, ArrowUpLeft, ArrowLeft, CornerUpRight, CornerUpLeft, Loader2 } from 'lucide-react';

export default function DriverNavigation() {
  const { user } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [truck, setTruck] = useState(null);
  const [activeShipment, setActiveShipment] = useState(null);
  const [navPanelOpen, setNavPanelOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [directions, setDirections] = useState([]);

  const fetchData = async () => {
    if (!user?.driverId) return;
    try {
      const locRes = await api.get(`/driver/location/${user.driverId}`);
      const loc = locRes.data || { latitude: 20.5937, longitude: 78.9629 };

      const shipRes = await api.get(`/driver/shipments/${user.driverId}`);
      const current = shipRes.data.find(s => s.assignmentStatus !== 'DELIVERED');
      
      setActiveShipment(current || null);

      if (current) {
        const realTruck = {
          id: `TRK-${user.driverId}`,
          currentPosition: { lat: loc.latitude, lng: loc.longitude },
          status: current.assignmentStatus === 'IN_PROGRESS' ? 'on-route' : 'assigned',
          route: (() => {
            try {
              return current.currentPath ? JSON.parse(current.currentPath) : null;
            } catch (e) {
              return null;
            }
          })(),
          originName: current.warehouse?.name || "Origin Hub",
          destinationName: current.route?.destination?.name || "Destination Hub",
          cargo: current.notes || "Standard Cargo",
          progress: current.assignmentStatus === 'IN_PROGRESS' ? 0.35 : 0, 
          speed: current.assignmentStatus === 'IN_PROGRESS' ? 65 : 0,
          eta: current.route?.estimatedTime || "N/A",
          distanceRemaining: "Calculating..."
        };
        setTruck(realTruck);
      } else {
        // Idle state
        setTruck({
          id: `TRK-${user.driverId}`,
          currentPosition: { lat: loc.latitude, lng: loc.longitude },
          status: 'idle',
          originName: "Base",
          destinationName: "N/A",
          progress: 0,
          speed: 0
        });
      }
      setLoading(false);
    } catch (err) {
      console.error("Failed to fetch navigation data:", err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, [user]);

  // Turn-by-Turn generator from real routing points
  useEffect(() => {
    if (!truck || !truck.route || truck.route.length < 2) return;

    const fetchOSRM = async () => {
      try {
        const coordsStr = truck.route.map(p => `${p.lng},${p.lat}`).join(';');
        const res = await fetch(`https://router.project-osrm.org/route/v1/driving/${coordsStr}?steps=true`);
        const data = await res.json();

        if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
          const legs = data.routes[0].legs;
          const allSteps = [];

          const getDirectionIcon = (modifier) => {
            if (!modifier) return ArrowUp;
            if (modifier.includes('right')) {
              if (modifier.includes('slight')) return ArrowUpRight;
              if (modifier.includes('sharp')) return CornerUpRight;
              return ArrowRight;
            }
            if (modifier.includes('left')) {
              if (modifier.includes('slight')) return ArrowUpLeft;
              if (modifier.includes('sharp')) return CornerUpLeft;
              return ArrowLeft;
            }
            if (modifier === 'uturn') return ArrowUp;
            return ArrowUp;
          };

          legs.forEach(leg => {
            leg.steps.forEach((step, index) => {
              if (step.distance < 10 && step.maneuver.type === 'continue') return; // skip trivial mini-steps

              const modifier = step.maneuver.modifier;
              const type = step.maneuver.type;
              const name = step.name ? step.name : "Unnamed Road";
              const distStr = step.distance >= 1000 ? (step.distance/1000).toFixed(1) + " km" : Math.round(step.distance) + " m";

              let instr = `Continue on ${name}`;
              if (type === 'depart') instr = `Head ${modifier || 'straight'} on ${name}`;
              else if (type === 'turn') instr = `Turn ${modifier || 'right'} onto ${name}`;
              else if (type === 'arrive') instr = `Arrive at destination`;
              else if (type === 'roundabout') instr = `Take roundabout onto ${name}`;
              else if (type === 'merge') instr = `Merge onto ${name}`;
              else if (type === 'on ramp' || type === 'off ramp') instr = `Take ramp onto ${name}`;

              instr = instr.replace(/ onto Unnamed Road$/, '').replace(/ on Unnamed Road$/, '').trim();
              if (instr.endsWith('onto')) instr = instr.replace('onto', '').trim();

              allSteps.push({
                icon: getDirectionIcon(modifier),
                instruction: instr || "Maintain current direction",
                distance: distStr,
                active: allSteps.length === 0, // First step is active
              });
            });
          });

          setDirections(allSteps.slice(0, 20)); // Limit to first 20 steps
        }
      } catch (err) {
        console.error("OSRM steps fetch error:", err);
      }
    };

    fetchOSRM();
  }, [truck?.route]);

  if (loading || !truck) {
    return (
      <div className="h-screen flex items-center justify-center bg-brand-dark">
        <Loader2 className="w-8 h-8 text-neon-blue animate-spin" />
      </div>
    );
  }

  const progress = Math.round(truck.progress * 100);
  
  // Get active step info for banner
  const activeStep = directions.length > 0 ? directions[0] : null;

  return (
    <div className="h-screen flex bg-brand-dark overflow-hidden">
      <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />

      <div className="flex-1 flex overflow-hidden">
        {/* Map */}
        <div className="flex-1 relative">
          <MapView center={[truck.currentPosition.lat, truck.currentPosition.lng]} zoom={12}>
            <TruckMarker truck={truck} isSelected onClick={() => {}} />
            <RouteOverlay route={truck.route} isActive />
          </MapView>

          {/* Compass Indicator */}
          <div className="absolute top-4 left-4 z-[1000] p-2.5 md:p-3 rounded-xl bg-slate-900/90 border border-white/10 backdrop-blur-md">
            <div className="flex items-center gap-2 md:gap-3">
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-neon-blue/10 border border-neon-blue/20 flex items-center justify-center">
                <Compass size={18} className="text-neon-blue" />
              </div>
              <div>
                <p className="text-white text-xs md:text-sm font-semibold">{truck.speed} km/h</p>
                <p className="text-slate-500 text-[9px] md:text-[10px]">Current Speed</p>
              </div>
            </div>
          </div>

          {/* Next Turn Banner */}
          {activeStep && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] px-4 py-2.5 md:px-5 md:py-3 rounded-xl bg-neon-blue/15 border border-neon-blue/30 backdrop-blur-md">
              <div className="flex items-center gap-2 md:gap-3">
                <activeStep.icon size={18} className="text-neon-blue" />
                <div>
                  <p className="text-white text-xs md:text-sm font-semibold">{activeStep.instruction}</p>
                  <p className="text-neon-blue text-[10px] md:text-xs">{activeStep.distance} ahead</p>
                </div>
              </div>
            </div>
          )}

          {/* Mobile: Toggle nav panel button */}
          <button
            onClick={() => setNavPanelOpen(!navPanelOpen)}
            className="md:hidden absolute bottom-4 right-4 z-[1000] px-4 py-2.5 rounded-xl bg-neon-blue/15 border border-neon-blue/30 backdrop-blur-md text-neon-blue text-xs font-medium"
          >
            {navPanelOpen ? 'Hide Nav' : 'Show Nav'}
          </button>
        </div>

        {/* Navigation Panel — desktop: fixed right | mobile: bottom sheet */}
        {/* Desktop */}
        <div className="hidden md:flex w-96 border-l border-white/5 bg-slate-950/80 backdrop-blur-md flex-col overflow-hidden shrink-0">
          {/* Route Header */}
          <div className="p-4 md:p-5 border-b border-white/5">
            <div className="flex items-center gap-2 mb-3">
              <Navigation size={16} className="text-neon-blue" />
              <h2 className="text-white font-semibold text-sm">Navigation</h2>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="text-emerald-400 font-medium">{truck.originName}</span>
              <span className="text-slate-600">→</span>
              <span className="text-red-400 font-medium">{truck.destinationName}</span>
            </div>

            {/* Progress */}
            <div className="mt-4">
              <div className="flex justify-between mb-1">
                <span className="text-[10px] text-slate-500">{progress}% complete</span>
                <span className="text-[10px] text-neon-blue">{truck.distanceRemaining} left</span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-white/5 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-400 via-neon-blue to-brand-primary transition-all duration-1000"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            {/* ETA & Speed */}
            <div className="grid grid-cols-3 gap-3 mt-4">
              <div className="p-2.5 rounded-lg bg-white/3 border border-white/5">
                <Clock size={12} className="text-neon-blue mb-1" />
                <p className="text-white text-sm font-bold">{truck.eta}</p>
                <p className="text-slate-600 text-[10px]">ETA</p>
              </div>
              <div className="p-2.5 rounded-lg bg-white/3 border border-white/5">
                <Gauge size={12} className="text-neon-blue mb-1" />
                <p className="text-white text-sm font-bold">{truck.speed} km/h</p>
                <p className="text-slate-600 text-[10px]">Speed</p>
              </div>
              <div className="p-2.5 rounded-lg bg-white/3 border border-white/5">
                <MapPin size={12} className="text-neon-blue mb-1" />
                <p className="text-white text-sm font-bold">{truck.distanceRemaining}</p>
                <p className="text-slate-600 text-[10px]">Distance</p>
              </div>
            </div>
          </div>

          {/* Turn-by-Turn Directions */}
          <div className="flex-1 overflow-y-auto p-4">
            <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-3 font-medium">Turn-by-Turn</p>
            <div className="space-y-1">
              {directions.map((dir, i) => {
                const Icon = dir.icon;
                return (
                  <div
                    key={i}
                    className={`flex items-center gap-3 p-3 rounded-lg transition-all ${
                      dir.active
                        ? 'bg-neon-blue/10 border border-neon-blue/20'
                        : 'hover:bg-white/3'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                      dir.active ? 'bg-neon-blue/20 text-neon-blue' : 'bg-white/5 text-slate-500'
                    }`}>
                      <Icon size={16} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs font-medium ${dir.active ? 'text-white' : 'text-slate-400'}`}>
                        {dir.instruction}
                      </p>
                      <p className="text-[10px] text-slate-600">{dir.distance}</p>
                    </div>
                    {dir.active && (
                      <span className="w-2 h-2 rounded-full bg-neon-blue animate-pulse shrink-0" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Mobile bottom sheet nav panel */}
        {navPanelOpen && (
          <div className="md:hidden absolute bottom-16 left-0 right-0 z-[1500] max-h-[55vh] overflow-y-auto rounded-t-2xl bg-slate-950/98 border-t border-white/10 backdrop-blur-md">
            <div className="p-4 border-b border-white/5">
              <div className="flex items-center gap-2 mb-3">
                <Navigation size={16} className="text-neon-blue" />
                <h2 className="text-white font-semibold text-sm">Navigation</h2>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="text-emerald-400 font-medium">{truck.originName}</span>
                <span className="text-slate-600">→</span>
                <span className="text-red-400 font-medium">{truck.destinationName}</span>
              </div>

              {/* Progress */}
              <div className="mt-4">
                <div className="flex justify-between mb-1">
                  <span className="text-[10px] text-slate-500">{progress}% complete</span>
                  <span className="text-[10px] text-neon-blue">{truck.distanceRemaining} left</span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-white/5 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-emerald-400 via-neon-blue to-brand-primary transition-all duration-1000"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>

              {/* ETA & Speed */}
              <div className="grid grid-cols-3 gap-3 mt-4">
                <div className="p-2.5 rounded-lg bg-white/3 border border-white/5">
                  <Clock size={12} className="text-neon-blue mb-1" />
                  <p className="text-white text-sm font-bold">{truck.eta}</p>
                  <p className="text-slate-600 text-[10px]">ETA</p>
                </div>
                <div className="p-2.5 rounded-lg bg-white/3 border border-white/5">
                  <Gauge size={12} className="text-neon-blue mb-1" />
                  <p className="text-white text-sm font-bold">{truck.speed} km/h</p>
                  <p className="text-slate-600 text-[10px]">Speed</p>
                </div>
                <div className="p-2.5 rounded-lg bg-white/3 border border-white/5">
                  <MapPin size={12} className="text-neon-blue mb-1" />
                  <p className="text-white text-sm font-bold">{truck.distanceRemaining}</p>
                  <p className="text-slate-600 text-[10px]">Distance</p>
                </div>
              </div>
            </div>

            {/* Turn-by-Turn Directions */}
            <div className="p-4">
              <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-3 font-medium">Turn-by-Turn</p>
              <div className="space-y-1">
                {directions.map((dir, i) => {
                  const Icon = dir.icon;
                  return (
                    <div
                      key={i}
                      className={`flex items-center gap-3 p-3 rounded-lg transition-all ${
                        dir.active
                          ? 'bg-neon-blue/10 border border-neon-blue/20'
                          : 'hover:bg-white/3'
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                        dir.active ? 'bg-neon-blue/20 text-neon-blue' : 'bg-white/5 text-slate-500'
                      }`}>
                        <Icon size={16} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs font-medium ${dir.active ? 'text-white' : 'text-slate-400'}`}>
                          {dir.instruction}
                        </p>
                        <p className="text-[10px] text-slate-600">{dir.distance}</p>
                      </div>
                      {dir.active && (
                        <span className="w-2 h-2 rounded-full bg-neon-blue animate-pulse shrink-0" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
      {/* Mobile nav bottom spacing */}
      <div className="md:hidden h-16 shrink-0" />
    </div>
  );
}
