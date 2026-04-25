import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import {
  Truck, Search, MapPin, Clock, Gauge, Package,
  Phone, AlertTriangle, Filter, ArrowUpDown,
} from 'lucide-react';

export default function FleetPage() {
  const { user } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [fleet, setFleet] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('id');

  useEffect(() => {
    const fetchFleet = async () => {
      try {
        const warehouseId = user?.warehouse?.id;
        const url = warehouseId ? `/admin/shipments?warehouseId=${warehouseId}` : '/admin/shipments';
        console.log('[FleetPage] Fetching fleet for warehouseId:', warehouseId, 'URL:', url);
        const res = await api.get(url);
        console.log('[FleetPage] Received shipments:', res.data.length);
        // Map backend Shipment to UI format
        const mapped = await Promise.all(res.data.map(async (s) => {
          const isUnassigned = s.assignmentStatus === "UNASSIGNED";
          const isStarted = s.assignmentStatus === "IN_PROGRESS" || s.assignmentStatus === "ASSIGNED";
          
          let status = "delayed";
          if (s.assignmentStatus === "DELIVERED") status = "delivered";
          else if (isStarted) status = "on-route";
          else if (isUnassigned) status = "awaiting-dispatch";

          // Dynamic progress: compare driver position vs route endpoints
          let progress = 0;
          if (s.assignmentStatus === "DELIVERED") {
            progress = 1;
          } else if (isStarted && s.warehouse && s.route) {
            const originLat = s.warehouse.latitude || 0;
            const originLng = s.warehouse.longitude || 0;
            const destLat = s.route.latitude || originLat;
            const destLng = s.route.longitude || originLng;
            
            // Use currentPath to determine actual position along route
            if (s.currentPath) {
              try {
                let pathStr = s.currentPath.replace(/,\s*]/g, ']');
                const path = JSON.parse(pathStr);
                if (path.length > 0 && s.assignedDriverId) {
                  // Fetch driver's current location
                  try {
                    const locRes = await api.get(`/driver/location/${s.assignedDriverId}`);
                    const driverLat = locRes.data?.latitude || originLat;
                    const driverLng = locRes.data?.longitude || originLng;
                    
                    // Find closest point on path
                    let closestIdx = 0;
                    let minDist = Infinity;
                    for (let i = 0; i < path.length; i++) {
                      const dx = path[i].lat - driverLat;
                      const dy = path[i].lng - driverLng;
                      const d = dx * dx + dy * dy;
                      if (d < minDist) { minDist = d; closestIdx = i; }
                    }
                    progress = (path.length > 1) ? closestIdx / (path.length - 1) : 0;
                  } catch {
                    progress = 0.05;
                  }
                }
              } catch {
                progress = 0.05;
              }
            }
          }

          return {
            id: `SHP-${s.id}`,
            driver: s.assignedDriverId || "Awaiting Assignment",
            phone: s.assignmentStatus === "UNASSIGNED" ? "Driver pending..." : "+91 98765 43210",
            originName: s.warehouse?.name || "Warehouse",
            destinationName: s.route?.path?.split(" -> ").pop() || "Destination",
            cargo: s.notes || "Industrial Goods",
            status: status,
            speed: isStarted ? 65 : 0,
            progress: progress,
            eta: s.route?.estimatedTime || "Pending",
          };
        }));
        setFleet(mapped);
      } catch (err) {
        console.error("Failed to fetch fleet data:", err);
      }
    };

    fetchFleet();
    const interval = setInterval(fetchFleet, 10000); // Polling for updates
    return () => clearInterval(interval);
  }, []);

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
          <div className="min-h-14 flex flex-wrap items-center justify-between px-3 md:px-6 py-2 gap-2">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-neon-blue/10 border border-neon-blue/20 flex items-center justify-center">
                <Truck size={16} className="text-neon-blue" />
              </div>
              <h1 className="text-white font-semibold text-sm md:text-base">Fleet Management</h1>
            </div>
            <div className="flex items-center gap-3 md:gap-5">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span className="text-xs text-slate-400">{stats.onRoute} Active</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
                <span className="text-xs text-slate-400">{stats.delayed} Delayed</span>
              </div>
              <div className="text-xs text-slate-500 hidden sm:block">Avg {stats.avgSpeed} km/h</div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-3 md:p-6 pb-20 md:pb-6">
          <div className="max-w-6xl mx-auto">
            {/* Search & Filter */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 md:gap-3 mb-5">
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
              <div className="flex items-center gap-2 flex-wrap">
                <Filter size={14} className="text-slate-500 shrink-0" />
                {['all', 'on-route', 'delayed'].map((status) => (
                  <button
                    key={status}
                    onClick={() => setFilterStatus(status)}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all duration-300 ${
                      filterStatus === status
                        ? 'bg-neon-blue/10 text-neon-blue border-neon-blue/30'
                        : 'bg-white/3 text-slate-500 border-white/8 hover:bg-white/5 hover:text-slate-300'
                    }`}
                  >
                    {status === 'all' ? 'All' : status === 'on-route' ? 'On Route' : 'Delayed'}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <ArrowUpDown size={14} className="text-slate-500 shrink-0" />
                {['id', 'speed', 'progress'].map((s) => (
                  <button
                    key={s}
                    onClick={() => setSortBy(s)}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all duration-300 ${
                      sortBy === s
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
                    className={`group p-5 rounded-xl border transition-all duration-300 ${
                      truck.status === 'delayed'
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
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                        truck.status === 'delayed'
                          ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                          : progress >= 100
                          ? 'bg-brand-primary/10 text-brand-primary border border-brand-primary/20'
                          : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      }`}>
                        {truck.status === 'delayed' ? 'Delayed' : progress >= 100 ? 'Completed' : 'On Route'}
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
                          className={`h-full rounded-full transition-all duration-1000 ${
                            truck.status === 'delayed'
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
