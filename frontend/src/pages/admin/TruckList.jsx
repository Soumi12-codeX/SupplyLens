import React from 'react';
import { Search, Truck, MapPin } from 'lucide-react';

export default function TruckList({ trucks, alerts = [], selectedId, onSelect }) {
  const [search, setSearch] = React.useState('');

  const filtered = trucks.filter((t) =>
    t.id.toLowerCase().includes(search.toLowerCase()) ||
    t.driver.toLowerCase().includes(search.toLowerCase()) ||
    t.destinationName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full">
      {/* Search */}
      <div className="p-4 border-b border-white/5">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search trucks, drivers..."
            className="w-full pl-9 pr-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-neon-blue/30 transition-colors"
          />
        </div>
        <p className="text-xs text-slate-500 mt-2">{filtered.length} trucks</p>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {filtered.map((truck) => (
          <button
            key={truck.id}
            onClick={() => onSelect(truck)}
            className={`w-full text-left p-3 rounded-lg transition-all duration-200 ${
              selectedId === truck.id
                ? 'bg-neon-blue/10 border border-neon-blue/20'
                : 'hover:bg-white/5 border border-transparent'
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Truck size={14} className={truck.status === 'delayed' ? 'text-red-400' : 'text-neon-blue'} />
                  {/* Alert badge */}
                  {alerts.some((a) => a.truckId === truck.id) && (
                    <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-orange-400 border border-slate-950 animate-pulse"></span>
                  )}
                </div>
                <span className="text-white text-sm font-medium">{truck.id}</span>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full ${
                truck.status === 'delayed'
                  ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                  : truck.status === 'awaiting-dispatch'
                  ? 'bg-neon-blue/10 text-neon-blue border border-neon-blue/20'
                  : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
              }`}>
                {truck.status === 'delayed' ? 'Delayed' : (truck.status === 'awaiting-dispatch' ? 'Pending' : 'On Route')}
              </span>
            </div>
            <p className="text-slate-400 text-xs">{truck.driver}</p>
            <div className="flex items-center gap-1 mt-1">
              <MapPin size={11} className="text-slate-500" />
              <p className="text-slate-500 text-xs truncate">
                {truck.originName} → {truck.destinationName}
              </p>
            </div>
            <div className="flex items-center justify-between mt-2">
              <span className="text-xs text-slate-500">{truck.cargo}</span>
              <span className="text-xs text-slate-400">{truck.speed} km/h</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
