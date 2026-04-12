import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import MapView from '../../components/Map/MapView';
import TruckMarker from '../../components/Map/TruckMarker';
import RouteOverlay from '../../components/Map/RouteOverlay';
import DriverMessages from './DriverMessages';
import AINotification from '../../components/AINotification';
import { MockSimulator } from '../../services/mockData';
import { Navigation, MapPin, Clock, Gauge, Package, ChevronUp, ChevronDown, MessageSquare } from 'lucide-react';

export default function DriverDashboard() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [truck, setTruck] = useState(null);
  const [showMessages, setShowMessages] = useState(false);
  const [messages, setMessages] = useState([]);
  const [currentAlert, setCurrentAlert] = useState(null);
  const [bottomPanelExpanded, setBottomPanelExpanded] = useState(true);

  // Simulate driver's own truck (first truck in fleet)
  useEffect(() => {
    const sim = new MockSimulator(
      (fleet) => setTruck(fleet[0]),
      (alert) => {
        // Only show alerts for our truck
        if (!truck || alert.truckId === truck?.id) {
          setCurrentAlert(alert);
          setMessages((prev) => [{
            id: alert.id,
            type: 'ai_suggestion',
            icon: alert.icon,
            title: alert.title,
            text: `${alert.description} ${alert.suggestedRoute?.description || ''}`,
            timeSaved: alert.suggestedRoute?.timeSaved,
            extraDistance: alert.suggestedRoute?.additionalDistance,
            timestamp: alert.timestamp,
            status: 'pending',
          }, ...prev]);
        }
      }
    );
    sim.start();
    return () => sim.stop();
  }, []);

  const handleAcceptRoute = (alert) => {
    setCurrentAlert(null);
    setMessages((prev) =>
      prev.map((m) => m.id === alert.id ? { ...m, status: 'accepted' } : m)
    );
  };

  if (!truck) {
    return (
      <div className="h-screen flex items-center justify-center bg-brand-dark">
        <div className="w-8 h-8 border-2 border-neon-blue border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const progressPercent = Math.round(truck.progress * 100);

  return (
    <div className="h-screen flex bg-brand-dark overflow-hidden">
      {/* Sidebar */}
      <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />

      {/* Main Content */}
      <div className="flex-1 flex flex-col relative overflow-hidden">
        {/* Full-Screen Map */}
        <div className="flex-1 relative">
          <MapView
            center={[truck.currentPosition.lat, truck.currentPosition.lng]}
            zoom={10}
          >
            <TruckMarker truck={truck} isSelected onClick={() => {}} />
            <RouteOverlay route={truck.route} isActive />
          </MapView>

          {/* Top Info Bar — Google Maps style */}
          <div className="absolute top-4 left-4 right-4 z-[1000] flex items-center justify-between">
            {/* Route Info Pill */}
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-900/90 border border-white/10 backdrop-blur-md">
              <Navigation size={16} className="text-neon-blue" />
              <div>
                <p className="text-white text-sm font-semibold">
                  {truck.originName} → {truck.destinationName}
                </p>
                <p className="text-slate-400 text-xs">{truck.cargo}</p>
              </div>
            </div>

            {/* Messages Toggle */}
            <button
              onClick={() => setShowMessages(!showMessages)}
              className="relative px-3 py-3 rounded-xl bg-slate-900/90 border border-white/10 backdrop-blur-md text-slate-300 hover:text-white transition-colors"
            >
              <MessageSquare size={18} />
              {messages.filter(m => m.status === 'pending').length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-neon-blue text-[10px] text-white flex items-center justify-center font-bold">
                  {messages.filter(m => m.status === 'pending').length}
                </span>
              )}
            </button>
          </div>

          {/* AI Alert — appears in center top */}
          {currentAlert && (
            <div className="absolute top-20 left-1/2 -translate-x-1/2 z-[1000]">
              <AINotification
                alert={currentAlert}
                isDriver
                onApprove={handleAcceptRoute}
                onDismiss={() => setCurrentAlert(null)}
              />
            </div>
          )}

          {/* Messages Panel — slide from right */}
          {showMessages && (
            <div className="absolute top-0 right-0 h-full w-96 z-[1000] border-l border-white/5 bg-slate-950/95 backdrop-blur-md">
              <DriverMessages
                messages={messages}
                onClose={() => setShowMessages(false)}
                onAccept={(msgId) => {
                  setMessages((prev) =>
                    prev.map((m) => m.id === msgId ? { ...m, status: 'accepted' } : m)
                  );
                }}
              />
            </div>
          )}
        </div>

        {/* Bottom Trip Panel — Google Maps style */}
        <div className={`border-t border-white/10 bg-slate-950/95 backdrop-blur-md transition-all duration-300 ${
          bottomPanelExpanded ? 'h-44' : 'h-14'
        }`}>
          {/* Toggle Handle */}
          <button
            onClick={() => setBottomPanelExpanded(!bottomPanelExpanded)}
            className="w-full flex items-center justify-center py-1 text-slate-500 hover:text-white transition-colors"
          >
            {bottomPanelExpanded ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
          </button>

          {!bottomPanelExpanded ? (
            /* Collapsed — minimal info */
            <div className="px-6 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="text-neon-blue font-bold text-lg">{truck.eta}</span>
                <span className="text-slate-400 text-sm">• {truck.distanceRemaining}</span>
              </div>
              <span className="text-slate-500 text-sm">{truck.speed} km/h</span>
            </div>
          ) : (
            /* Expanded — full trip info */
            <div className="px-6 pb-4">
              {/* Progress Bar */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-emerald-400 text-xs font-medium">{truck.originName}</span>
                  <span className="text-xs text-slate-500">{progressPercent}% complete</span>
                  <span className="text-red-400 text-xs font-medium">{truck.destinationName}</span>
                </div>
                <div className="w-full h-2 rounded-full bg-white/5 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-emerald-400 via-neon-blue to-brand-primary transition-all duration-1000"
                    style={{ width: `${progressPercent}%` }}
                  ></div>
                </div>
              </div>

              {/* Stats Row */}
              <div className="grid grid-cols-4 gap-3">
                <div className="flex items-center gap-2 p-2 rounded-lg bg-white/3">
                  <Clock size={14} className="text-neon-blue shrink-0" />
                  <div>
                    <p className="text-white text-sm font-semibold">{truck.eta}</p>
                    <p className="text-slate-500 text-[10px]">ETA</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-2 rounded-lg bg-white/3">
                  <MapPin size={14} className="text-neon-blue shrink-0" />
                  <div>
                    <p className="text-white text-sm font-semibold">{truck.distanceRemaining}</p>
                    <p className="text-slate-500 text-[10px]">Distance</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-2 rounded-lg bg-white/3">
                  <Gauge size={14} className="text-neon-blue shrink-0" />
                  <div>
                    <p className="text-white text-sm font-semibold">{truck.speed} km/h</p>
                    <p className="text-slate-500 text-[10px]">Speed</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-2 rounded-lg bg-white/3">
                  <Package size={14} className="text-neon-blue shrink-0" />
                  <div>
                    <p className="text-white text-sm font-semibold truncate">{truck.cargo}</p>
                    <p className="text-slate-500 text-[10px]">Cargo</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
