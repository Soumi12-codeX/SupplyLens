import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import api from '../../services/api';
import {
  Truck, Search, MapPin, Clock, Gauge, Package,
  Phone, AlertTriangle, Filter, ArrowUpDown,
} from 'lucide-react';

export default function FleetPage() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [fleet, setFleet] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('id');

  const [vehicles, setVehicles] = useState([]);

  useEffect(() => {
    const fetchVehicles = async () => {
      try {
        const res = await api.get("/vehicles"); // or /drivers
        setVehicles(res.data);
      } catch (err) {
        console.error(err);
      }
    };

    fetchVehicles();
  }, []);

  const transformShipments = (shipments) => {
    return shipments
      .filter(s => s.assignmentStatus === "ASSIGNED" || s.assignmentStatus === "IN_PROGRESS")
      .map((s, index) => ({
        id: `TRK-${s.id}`,
        driver: s.assignedDriverId || "Not Assigned",
        originName: s.route?.source || "Warehouse",
        destinationName: s.route?.destination || "Destination",
        cargo: s.transport?.type || "Goods",
        status: s.assignmentStatus === "DELIVERED" ? "delayed" : "on-route",
        speed: 50,
        progress: 0.3,
        eta: "5h",
        distanceRemaining: "200 km",

        // TEMP STATIC LOCATION (we'll fix later with live tracking)
        currentPosition: {
          lat: 20.5937 + Math.random(),
          lng: 78.9629 + Math.random(),
        },

        route: []
      }));
  };

  useEffect(() => {
    fetchShipments();
  }, []);

  const fetchShipments = async () => {
    try {
      const res = await api.get('/admin/shipments');
      const transformed = transformShipments(res.data);
      setFleet(transformed);
    } catch (err) {
      console.error(err);
      setFleet([]);
    }
  };

  const filtered = fleet
    .filter((t) => {
      const matchSearch =
        t.id.toLowerCase().includes(search.toLowerCase()) ||
        t.driver.toLowerCase().includes(search.toLowerCase()) ||
        t.originName.toLowerCase().includes(search.toLowerCase()) ||
        t.destinationName.toLowerCase().includes(search.toLowerCase()) ||
        t.cargo.toLowerCase().includes(search.toLowerCase());
      const matchStatus = filterStatus === 'all' || t.status === filterStatus;
      return matchSearch && matchStatus;
    })
    .sort((a, b) => {
      if (sortBy === 'speed') return b.speed - a.speed;
      if (sortBy === 'progress') return b.progress - a.progress;
      return a.id.localeCompare(b.id);
    });

  const stats = {
    total: fleet.length,
    onRoute: fleet.filter((t) => t.status === 'on-route').length,
    delayed: fleet.filter((t) => t.status === 'delayed').length,
    avgSpeed: fleet.length ? Math.floor(fleet.reduce((s, t) => s + t.speed, 0) / fleet.length) : 0,
  };

  return (
    <div className="h-screen flex bg-brand-dark overflow-hidden">
      <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="border-b border-white/5 bg-slate-950/80 backdrop-blur-sm shrink-0">
          <div className="h-14 flex items-center justify-between px-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-neon-blue/10 border border-neon-blue/20 flex items-center justify-center">
                <Truck size={16} className="text-neon-blue" />
              </div>
              <h1 className="text-white font-semibold text-base">Fleet Management</h1>
            </div>
            <div className="flex items-center gap-5">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span className="text-xs text-slate-400">{stats.onRoute} Active</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
                <span className="text-xs text-slate-400">{stats.delayed} Delayed</span>
              </div>
              <div className="text-xs text-slate-500">Avg {stats.avgSpeed} km/h</div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-6xl mx-auto">
            {/* Search & Filter */}
            <div className="flex items-center gap-3 mb-6">
              <div className="flex-1 relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by ID, driver, route, cargo..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-neon-blue/50 focus:ring-1 focus:ring-neon-blue/25 transition-all text-sm"
                />
              </div>
              <div className="flex items-center gap-2">
                <Filter size={14} className="text-slate-500" />
                {['all', 'on-route', 'delayed'].map((status) => (
                  <button
                    key={status}
                    onClick={() => setFilterStatus(status)}
                    className={`px-3 py-2 rounded-lg text-xs font-medium border transition-all duration-300 ${filterStatus === status
                      ? 'bg-neon-blue/10 text-neon-blue border-neon-blue/30'
                      : 'bg-white/3 text-slate-500 border-white/8 hover:bg-white/5 hover:text-slate-300'
                      }`}
                  >
                    {status === 'all' ? 'All' : status === 'on-route' ? 'On Route' : 'Delayed'}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <ArrowUpDown size={14} className="text-slate-500" />
                {['id', 'speed', 'progress'].map((s) => (
                  <button
                    key={s}
                    onClick={() => setSortBy(s)}
                    className={`px-3 py-2 rounded-lg text-xs font-medium border transition-all duration-300 ${sortBy === s
                      ? 'bg-neon-blue/10 text-neon-blue border-neon-blue/30'
                      : 'bg-white/3 text-slate-500 border-white/8 hover:bg-white/5 hover:text-slate-300'
                      }`}
                  >
                    {s === 'id' ? 'ID' : s.charAt(0).toUpperCase() + s.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Fleet Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((truck) => {
                const truckAlerts = alerts.filter((a) => a.truckId === truck.id);
                const progress = Math.round(truck.progress * 100);
                return (
                  <div
                    key={truck.id}
                    className={`group p-5 rounded-xl border transition-all duration-300 ${truck.status === 'delayed'
                      ? 'bg-red-500/3 border-red-500/15 hover:border-red-500/30'
                      : 'bg-white/3 border-white/8 hover:border-white/15'
                      } hover:bg-white/5`}
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="relative">
                          <Truck size={16} className={truck.status === 'delayed' ? 'text-red-400' : 'text-neon-blue'} />
                          {truckAlerts.length > 0 && (
                            <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-orange-400 animate-pulse" />
                          )}
                        </div>
                        <span className="text-white font-semibold text-sm">{truck.id}</span>
                      </div>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${truck.status === 'delayed'
                        ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                        : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        }`}>
                        {truck.status === 'delayed' ? 'Delayed' : 'On Route'}
                      </span>
                    </div>

                    {/* Driver */}
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-7 h-7 rounded-lg bg-neon-blue/10 flex items-center justify-center text-neon-blue text-[10px] font-bold">
                        {truck.driver.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <p className="text-white text-xs font-medium">{truck.driver}</p>
                        <p className="text-slate-600 text-[10px]">{truck.phone}</p>
                      </div>
                    </div>

                    {/* Route */}
                    <div className="flex items-center gap-1.5 mb-3">
                      <MapPin size={11} className="text-emerald-400 shrink-0" />
                      <span className="text-xs text-slate-400 truncate">
                        {truck.originName} → {truck.destinationName}
                      </span>
                    </div>

                    {/* Progress */}
                    <div className="mb-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] text-slate-500">Progress</span>
                        <span className="text-[10px] text-neon-blue font-semibold">{progress}%</span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-white/5 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-1000 ${truck.status === 'delayed'
                            ? 'bg-gradient-to-r from-red-500 to-orange-400'
                            : 'bg-gradient-to-r from-neon-blue to-brand-primary'
                            }`}
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-2 pt-3 border-t border-white/5">
                      <div className="flex items-center gap-1.5">
                        <Clock size={11} className="text-slate-600" />
                        <span className="text-xs text-slate-400">{truck.eta}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Gauge size={11} className="text-slate-600" />
                        <span className="text-xs text-slate-400">{truck.speed} km/h</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Package size={11} className="text-slate-600" />
                        <span className="text-xs text-slate-400 truncate">{truck.cargo}</span>
                      </div>
                    </div>

                    {/* Alerts */}
                    {truckAlerts.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-white/5">
                        {truckAlerts.slice(0, 1).map((alert) => (
                          <div key={alert.id} className="flex items-center gap-2">
                            <AlertTriangle size={11} className="text-orange-400 shrink-0" />
                            <span className="text-[10px] text-orange-400 truncate">{alert.title}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {filtered.length === 0 && (
              <div className="text-center py-16">
                <Truck size={40} className="text-slate-700 mx-auto mb-3" />
                <p className="text-slate-500 text-sm">No trucks match your search.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
