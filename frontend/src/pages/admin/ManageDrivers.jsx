import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import api from '../../services/api';
import {
  Users, UserPlus, Search, Phone, MapPin, Star,
  Truck, CheckCircle, Clock, X, Mail, Send, Filter,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const CITY_COORDINATES = {
  'Kolkata': { lat: 22.5726, lon: 88.3639 },
  'Howrah': { lat: 22.5958, lon: 88.2636 },
  'Mumbai': { lat: 19.0760, lon: 72.8777 },
  'Delhi': { lat: 28.6139, lon: 77.2090 },
  'Bangalore': { lat: 12.9716, lon: 77.5946 },
  'Hyderabad': { lat: 17.3850, lon: 78.4867 },
  'Chennai': { lat: 13.0827, lon: 80.2707 },
  'Pune': { lat: 18.5204, lon: 73.8567 },
  'Ahmedabad': { lat: 23.0225, lon: 72.5714 },
};


const STATUS_STYLES = {
  available: { label: 'Available', color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', dot: 'bg-emerald-400' },
  'on-route': { label: 'On Route', color: 'text-neon-blue', bg: 'bg-neon-blue/10', border: 'border-neon-blue/20', dot: 'bg-neon-blue' },
  offline: { label: 'Offline', color: 'text-slate-500', bg: 'bg-slate-500/10', border: 'border-slate-500/20', dot: 'bg-slate-500' },
};

export default function ManageDrivers() {
  const { user } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [warehouses, setWarehouses] = useState([]);
  const [selectedWarehouseId, setSelectedWarehouseId] = useState(user?.warehouse?.id || '');

  useEffect(() => {
    fetchDrivers();
    fetchWarehouses();
  }, []);

  const fetchWarehouses = async () => {
    try {
      const res = await api.get('/warehouse/all');
      setWarehouses(res.data);
    } catch (err) {
      console.error("Failed to fetch warehouses", err);
    }
  };

  useEffect(() => {
    fetchDrivers();
  }, [selectedWarehouseId]);

  const fetchDrivers = async () => {
    try {
      setLoading(true);
      const url = selectedWarehouseId 
        ? `/admin/drivers?originWarehouseId=${selectedWarehouseId}`
        : '/admin/drivers';
      const res = await api.get(url);
      // Extend backend DTO with UI fields if needed
      const mapped = res.data.map(d => ({
        ...d,
        id: d.driverId, // use driverId as key
        phone: d.phone || '+91 XXXX XXXX',
        trips: d.trips || 0,
        rating: d.rating || 0,
        joinedAt: d.joinedAt || new Date().toISOString(),
        avatar: d.name.split(' ').map(n => n[0]).join('').toUpperCase(),
      }));
      setDrivers(mapped);
    } catch (err) {
      console.error("Failed to fetch drivers:", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredDrivers = drivers.filter((d) => {
    const matchSearch = d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        d.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        d.phone.includes(searchQuery);
    const matchStatus = filterStatus === 'all' || d.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const stats = [
    { label: 'Total Drivers', value: drivers.length, icon: Users, color: 'text-neon-blue' },
    { label: 'Available', value: drivers.filter(d => d.status === 'available').length, icon: CheckCircle, color: 'text-emerald-400' },
    { label: 'On Route', value: drivers.filter(d => d.status === 'on-route').length, icon: Truck, color: 'text-neon-blue' },
    { label: 'Offline', value: drivers.filter(d => d.status === 'offline').length, icon: Clock, color: 'text-slate-500' },
  ];

  return (
    <div className="h-screen flex bg-brand-dark overflow-hidden">
      <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="border-b border-white/5 bg-slate-950/80 backdrop-blur-sm shrink-0">
          <div className="h-14 flex items-center justify-between px-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-neon-purple/10 border border-neon-purple/20 flex items-center justify-center">
                <Users size={16} className="text-neon-purple" />
              </div>
              <h1 className="text-white font-semibold text-base flex items-center gap-2">
                Manage Drivers
                <span className="text-slate-700 font-thin">|</span>
                <span className="text-[10px] text-neon-blue font-mono uppercase tracking-[0.2em] bg-neon-blue/5 px-2.5 py-1 rounded border border-neon-blue/10 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-neon-blue animate-pulse shadow-[0_0_8px_#00f0ff]" />
                  Hub: {user?.warehouse?.name || 'Central'}
                </span>
              </h1>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-6xl mx-auto">
            {/* Stats Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
              {stats.map((stat) => {
                const Icon = stat.icon;
                return (
                  <div key={stat.label} className="p-4 rounded-xl bg-white/3 border border-white/8">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                        stat.color === 'text-neon-blue' ? 'bg-neon-blue/10' :
                        stat.color === 'text-emerald-400' ? 'bg-emerald-500/10' :
                        'bg-white/5'
                      }`}>
                        <Icon size={16} className={stat.color} />
                      </div>
                      <div>
                        <p className={`text-xl font-bold ${stat.color}`}>{stat.value}</p>
                        <p className="text-xs text-slate-500">{stat.label}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Search & Filter Bar */}
            <div className="flex flex-col sm:flex-row items-center gap-3 mb-6">
              <div className="flex-1 relative w-full">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by name, city, or phone..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-neon-blue/50 focus:ring-1 focus:ring-neon-blue/25 transition-all text-sm"
                />
              </div>

              {/* Hub Context Indicator */}
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/3 border border-white/5 text-[10px] text-slate-500 font-medium">
                <MapPin size={12} className="text-neon-blue" />
                AUTO-FILTERING FOR {user?.warehouse?.city?.toUpperCase() || 'LOCAL'} CENTER
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-2 sm:pb-0">
                <Filter size={14} className="text-slate-500 shrink-0" />
                {['all', 'available', 'on-route', 'offline'].map((status) => (
                  <button
                    key={status}
                    onClick={() => setFilterStatus(status)}
                    className={`px-3 py-2 rounded-lg text-xs font-medium border transition-all duration-300 whitespace-nowrap ${
                      filterStatus === status
                        ? 'bg-neon-blue/10 text-neon-blue border-neon-blue/30'
                        : 'bg-white/3 text-slate-500 border-white/8 hover:bg-white/5 hover:text-slate-300'
                    }`}
                  >
                    {status === 'all' ? 'All' : status === 'on-route' ? 'On Route' : status.charAt(0).toUpperCase() + status.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="w-10 h-10 border-4 border-neon-blue border-t-transparent rounded-full animate-spin mb-4" />
                <p className="text-slate-500 animate-pulse">Synchronizing driver pool...</p>
              </div>
            ) : (
              <>
                {/* Driver Cards Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredDrivers.map((driver) => {
                    const statusStyle = STATUS_STYLES[driver.status];
                    return (
                      <div
                        key={driver.id}
                        className="group p-5 rounded-xl bg-white/3 border border-white/8 hover:bg-white/5 hover:border-white/15 transition-all duration-300"
                      >
                        {/* Header */}
                        <div className="flex items-start gap-3 mb-4">
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-neon-blue/20 to-neon-purple/20 flex items-center justify-center text-white font-bold text-sm shrink-0">
                            {driver.avatar}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-white text-sm font-semibold truncate">{driver.name}</p>
                            <p className="text-slate-500 text-xs truncate">{driver.email}</p>
                          </div>
                          <span className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-medium ${statusStyle.bg} ${statusStyle.border} ${statusStyle.color} border shrink-0`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${statusStyle.dot} ${driver.status === 'available' ? 'animate-pulse' : ''}`} />
                            {statusStyle.label}
                          </span>
                        </div>

                        {/* Info Grid */}
                        <div className="grid grid-cols-2 gap-3 mb-4">
                          <div className="flex items-center gap-2">
                            <Phone size={12} className="text-slate-600" />
                            <span className="text-xs text-slate-400 truncate">{driver.phone}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPin size={12} className="text-slate-600" />
                            <span className="text-xs text-slate-400">{driver.city}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Truck size={12} className="text-slate-600" />
                            <span className="text-xs text-slate-400">{driver.trips} trips</span>
                          </div>
                          <div className="flex items-center gap-2">
                            {driver.isLocal ? (
                              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">
                                <CheckCircle size={10} className="text-emerald-400" />
                                <span className="text-[10px] text-emerald-400 font-black tracking-wider uppercase">Local Hub</span>
                              </div>
                            ) : driver.distance !== null ? (
                              <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded border font-black tracking-wider uppercase text-[10px] ${
                                driver.distance < 10 ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' :
                                driver.distance < 30 ? 'bg-neon-blue/10 border-neon-blue/20 text-neon-blue' :
                                'bg-amber-500/10 border-amber-500/20 text-amber-400'
                              }`}>
                                <MapPin size={10} />
                                {driver.distance} km away
                              </div>
                            ) : (
                              <>
                                <Star size={12} className="text-yellow-500" />
                                <span className="text-xs text-slate-400">{driver.rating > 0 ? driver.rating : 'New'}</span>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Footer */}
                        <div className="flex items-center justify-between pt-3 border-t border-white/5">
                          <span className="text-[10px] text-slate-600">
                            Joined {new Date(driver.joinedAt).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
                          </span>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            <button className="p-1.5 rounded-lg bg-white/5 text-slate-400 hover:text-neon-blue hover:bg-neon-blue/10 transition-all" title="Call">
                              <Phone size={13} />
                            </button>
                            <button className="p-1.5 rounded-lg bg-white/5 text-slate-400 hover:text-neon-blue hover:bg-neon-blue/10 transition-all" title="Email">
                              <Mail size={13} />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {filteredDrivers.length === 0 && (
                  <div className="text-center py-16">
                    <Users size={40} className="text-slate-700 mx-auto mb-3" />
                    <p className="text-slate-500 text-sm">No drivers found matching your search.</p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
