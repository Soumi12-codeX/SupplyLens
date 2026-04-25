import React from 'react';
import { X, Phone, Package, MapPin, Clock, Gauge, Navigation, AlertTriangle } from 'lucide-react';

const SEV_COLOR = {
  critical: 'text-red-400 border-red-500/30 bg-red-500/10',
  high:     'text-orange-400 border-orange-500/30 bg-orange-500/10',
  medium:   'text-yellow-400 border-yellow-500/25 bg-yellow-500/10',
};

export default function TruckDetail({ truck, alerts = [], onClose }) {
  if (!truck) return null;

  const progressPercent = Math.round(truck.progress * 100);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-white/5 flex items-center justify-between">
        <div>
          <h3 className="text-white font-semibold text-lg">{truck.id}</h3>
          <p className="text-slate-400 text-sm">{truck.driver}</p>
        </div>
        <button
          onClick={onClose}
          className="text-slate-500 hover:text-white transition-colors p-1"
        >
          <X size={18} />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {/* Status Card */}
        <div className={`p-4 rounded-xl border ${
          truck.status === 'delayed'
            ? 'border-red-500/20 bg-red-500/5'
            : progressPercent === 100
              ? 'border-brand-primary/20 bg-brand-primary/5'
              : 'border-emerald-500/20 bg-emerald-500/5'
        }`}>
          <div className="flex items-center gap-2 mb-1">
            <div className={`w-2 h-2 rounded-full ${truck.status === 'delayed' ? 'bg-red-400 animate-pulse' : progressPercent === 100 ? 'bg-brand-primary' : 'bg-emerald-400'}`}></div>
            <span className={`text-sm font-medium ${truck.status === 'delayed' ? 'text-red-400' : progressPercent === 100 ? 'text-brand-primary' : 'text-emerald-400'}`}>
              {truck.status === 'delayed' ? 'Delayed' : progressPercent === 100 ? 'Completed' : 'On Route'}
            </span>
          </div>
          <p className="text-slate-400 text-xs">Last updated: just now</p>
        </div>

        {/* Active Alerts for this truck */}
        {alerts.length > 0 && (
          <div>
            <h4 className="text-slate-400 text-xs font-medium uppercase tracking-wider mb-2 flex items-center gap-2">
              <AlertTriangle size={11} className="text-orange-400" />
              Active Alerts ({alerts.length})
            </h4>
            <div className="space-y-2">
              {alerts.map((alert) => {
                const col = SEV_COLOR[alert.severity] || SEV_COLOR.medium;
                return (
                  <div key={alert.id} className={`flex items-start gap-3 p-3 rounded-lg border ${col}`}>
                    <span className="text-lg leading-none">{alert.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs font-semibold ${col.split(' ')[0]}`}>{alert.title}</p>
                      <p className="text-slate-400 text-[11px] mt-0.5 truncate">{alert.affectedArea}</p>
                      <p className="text-slate-500 text-[10px] mt-0.5">
                        {new Date(alert.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Route Info */}
        <div>
          <h4 className="text-slate-400 text-xs font-medium uppercase tracking-wider mb-3">Route</h4>
          <div className="flex items-start gap-3">
            <div className="flex flex-col items-center gap-0.5 mt-1">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-emerald-400/30"></div>
              <div className="w-px h-10 bg-gradient-to-b from-emerald-400/50 to-red-400/50"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-red-400 border-2 border-red-400/30"></div>
            </div>
            <div className="flex-1">
              <div className="mb-4">
                <p className="text-white text-sm font-medium">{truck.originName}</p>
                <p className="text-slate-500 text-xs">Origin</p>
              </div>
              <div>
                <p className="text-white text-sm font-medium">{truck.destinationName}</p>
                <p className="text-slate-500 text-xs">Destination</p>
              </div>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-slate-400 text-xs">Progress</span>
            <span className="text-neon-blue text-xs font-semibold">{progressPercent}%</span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-white/5 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-neon-blue to-brand-primary transition-all duration-1000"
              style={{ width: `${progressPercent}%` }}
            ></div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-lg bg-white/3 border border-white/5">
            <Clock size={14} className="text-slate-500 mb-1" />
            <p className="text-white text-sm font-semibold">{truck.eta}</p>
            <p className="text-slate-500 text-xs">ETA</p>
          </div>
          <div className="p-3 rounded-lg bg-white/3 border border-white/5">
            <MapPin size={14} className="text-slate-500 mb-1" />
            <p className="text-white text-sm font-semibold">{truck.distanceRemaining}</p>
            <p className="text-slate-500 text-xs">Remaining</p>
          </div>
          <div className="p-3 rounded-lg bg-white/3 border border-white/5">
            <Gauge size={14} className="text-slate-500 mb-1" />
            <p className="text-white text-sm font-semibold">{truck.speed} km/h</p>
            <p className="text-slate-500 text-xs">Speed</p>
          </div>
          <div className="p-3 rounded-lg bg-white/3 border border-white/5">
            <Package size={14} className="text-slate-500 mb-1" />
            <p className="text-white text-sm font-semibold truncate">{truck.cargo}</p>
            <p className="text-slate-500 text-xs">Cargo</p>
          </div>
        </div>

        {/* Contact */}
        <div>
          <h4 className="text-slate-400 text-xs font-medium uppercase tracking-wider mb-3">Driver Contact</h4>
          <div className="flex items-center gap-3 p-3 rounded-lg bg-white/3 border border-white/5">
            <div className="w-10 h-10 rounded-full bg-neon-blue/10 border border-neon-blue/20 flex items-center justify-center">
              <span className="text-neon-blue font-semibold text-sm">{truck.driver.charAt(0)}</span>
            </div>
            <div className="flex-1">
              <p className="text-white text-sm font-medium">{truck.driver}</p>
              <p className="text-slate-500 text-xs">{truck.phone}</p>
            </div>
            <button className="p-2 rounded-lg bg-neon-blue/10 text-neon-blue hover:bg-neon-blue/20 transition-colors">
              <Phone size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
