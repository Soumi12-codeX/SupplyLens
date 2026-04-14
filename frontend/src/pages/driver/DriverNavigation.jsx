import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import MapView from '../../components/Map/MapView';
import TruckMarker from '../../components/Map/TruckMarker';
import RouteOverlay from '../../components/Map/RouteOverlay';
import { MockSimulator } from '../../services/mockData';
import { Navigation, Compass, MapPin, Clock, Gauge, ArrowUp, ArrowUpRight, ArrowRight as ArrowR } from 'lucide-react';

export default function DriverNavigation() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [truck, setTruck] = useState(null);
  const [navPanelOpen, setNavPanelOpen] = useState(false);

  useEffect(() => {
    const sim = new MockSimulator(
      (fleet) => setTruck(fleet[0]),
      () => {}
    );
    sim.start();
    return () => sim.stop();
  }, []);

  if (!truck) {
    return (
      <div className="h-screen flex items-center justify-center bg-brand-dark">
        <div className="w-8 h-8 border-2 border-neon-blue border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const progress = Math.round(truck.progress * 100);

  // Simulated turn-by-turn directions
  const directions = [
    { icon: ArrowUp, instruction: 'Continue straight on NH-48', distance: '12.4 km', active: true },
    { icon: ArrowUpRight, instruction: 'Take exit toward Pune Highway', distance: '3.2 km', active: false },
    { icon: ArrowR, instruction: 'Turn right onto MG Road', distance: '800 m', active: false },
    { icon: ArrowUp, instruction: 'Continue on MG Road', distance: '5.6 km', active: false },
    { icon: ArrowUpRight, instruction: 'Merge onto Ring Road', distance: '2.1 km', active: false },
    { icon: ArrowR, instruction: 'Destination on your right', distance: '200 m', active: false },
  ];

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
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] px-4 py-2.5 md:px-5 md:py-3 rounded-xl bg-neon-blue/15 border border-neon-blue/30 backdrop-blur-md">
            <div className="flex items-center gap-2 md:gap-3">
              <ArrowUp size={18} className="text-neon-blue" />
              <div>
                <p className="text-white text-xs md:text-sm font-semibold">Continue straight</p>
                <p className="text-neon-blue text-[10px] md:text-xs">12.4 km ahead</p>
              </div>
            </div>
          </div>

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
