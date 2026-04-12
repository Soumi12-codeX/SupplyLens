import React, { useState } from 'react';
import Sidebar from '../../components/Sidebar';
import {
  Users, UserPlus, Search, Phone, MapPin, Star,
  Truck, CheckCircle, Clock, X, Mail, Send, Filter,
} from 'lucide-react';

const MOCK_DRIVERS = [
  { id: 'drv-001', name: 'Rajesh Kumar', email: 'rajesh@supplylens.com', phone: '+91 9812345678', city: 'Mumbai', status: 'available', trips: 142, rating: 4.8, joinedAt: '2025-03-15', avatar: 'RK' },
  { id: 'drv-002', name: 'Amit Sharma', email: 'amit@supplylens.com', phone: '+91 9823456789', city: 'Delhi', status: 'available', trips: 98, rating: 4.6, joinedAt: '2025-06-22', avatar: 'AS' },
  { id: 'drv-003', name: 'Suresh Patel', email: 'suresh@supplylens.com', phone: '+91 9834567890', city: 'Ahmedabad', status: 'on-route', trips: 214, rating: 4.9, joinedAt: '2024-11-10', avatar: 'SP' },
  { id: 'drv-004', name: 'Vikram Singh', email: 'vikram@supplylens.com', phone: '+91 9845678901', city: 'Jaipur', status: 'available', trips: 76, rating: 4.5, joinedAt: '2025-09-05', avatar: 'VS' },
  { id: 'drv-005', name: 'Deepak Verma', email: 'deepak@supplylens.com', phone: '+91 9856789012', city: 'Bangalore', status: 'on-route', trips: 167, rating: 4.7, joinedAt: '2025-01-18', avatar: 'DV' },
  { id: 'drv-006', name: 'Arun Yadav', email: 'arun@supplylens.com', phone: '+91 9867890123', city: 'Chennai', status: 'available', trips: 53, rating: 4.4, joinedAt: '2025-12-01', avatar: 'AY' },
  { id: 'drv-007', name: 'Pradeep Mishra', email: 'pradeep@supplylens.com', phone: '+91 9878901234', city: 'Kolkata', status: 'offline', trips: 31, rating: 4.2, joinedAt: '2026-02-14', avatar: 'PM' },
  { id: 'drv-008', name: 'Manoj Tiwari', email: 'manoj@supplylens.com', phone: '+91 9889012345', city: 'Lucknow', status: 'available', trips: 89, rating: 4.6, joinedAt: '2025-07-30', avatar: 'MT' },
];

const STATUS_STYLES = {
  available: { label: 'Available', color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', dot: 'bg-emerald-400' },
  'on-route': { label: 'On Route', color: 'text-neon-blue', bg: 'bg-neon-blue/10', border: 'border-neon-blue/20', dot: 'bg-neon-blue' },
  offline: { label: 'Offline', color: 'text-slate-500', bg: 'bg-slate-500/10', border: 'border-slate-500/20', dot: 'bg-slate-500' },
};

export default function ManageDrivers() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [drivers, setDrivers] = useState(MOCK_DRIVERS);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [invitePhone, setInvitePhone] = useState('');
  const [inviteCity, setInviteCity] = useState('');
  const [inviteSending, setInviteSending] = useState(false);
  const [inviteSent, setInviteSent] = useState(false);

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

  const handleInvite = async () => {
    setInviteSending(true);
    await new Promise((r) => setTimeout(r, 1500));

    const newDriver = {
      id: `drv-${Date.now()}`,
      name: inviteName,
      email: inviteEmail,
      phone: invitePhone,
      city: inviteCity,
      status: 'offline',
      trips: 0,
      rating: 0,
      joinedAt: new Date().toISOString().split('T')[0],
      avatar: inviteName.split(' ').map(n => n[0]).join('').toUpperCase(),
    };
    setDrivers((prev) => [...prev, newDriver]);

    setInviteSending(false);
    setInviteSent(true);
    setTimeout(() => {
      setShowInviteModal(false);
      setInviteSent(false);
      setInviteEmail('');
      setInviteName('');
      setInvitePhone('');
      setInviteCity('');
    }, 2000);
  };

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
              <h1 className="text-white font-semibold text-base">Manage Drivers</h1>
            </div>
            <button
              onClick={() => setShowInviteModal(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-neon-blue/15 text-neon-blue border border-neon-blue/30 hover:bg-neon-blue/25 hover:shadow-[0_0_20px_rgba(0,240,255,0.15)] transition-all text-sm font-medium"
            >
              <UserPlus size={16} />
              Invite Driver
            </button>
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
            <div className="flex items-center gap-3 mb-6">
              <div className="flex-1 relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by name, city, or phone..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-neon-blue/50 focus:ring-1 focus:ring-neon-blue/25 transition-all text-sm"
                />
              </div>
              <div className="flex items-center gap-2">
                <Filter size={14} className="text-slate-500" />
                {['all', 'available', 'on-route', 'offline'].map((status) => (
                  <button
                    key={status}
                    onClick={() => setFilterStatus(status)}
                    className={`px-3 py-2 rounded-lg text-xs font-medium border transition-all duration-300 ${
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
                        <Star size={12} className="text-yellow-500" />
                        <span className="text-xs text-slate-400">{driver.rating > 0 ? driver.rating : 'New'}</span>
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
          </div>
        </div>
      </div>

      {/* Invite Driver Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => !inviteSending && setShowInviteModal(false)}
          />

          {/* Modal */}
          <div className="relative w-full max-w-md rounded-2xl bg-slate-900 border border-white/10 shadow-2xl overflow-hidden animate-fade-in-up">
            {/* Close */}
            <button
              onClick={() => !inviteSending && setShowInviteModal(false)}
              className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors"
            >
              <X size={18} />
            </button>

            <div className="p-6">
              {inviteSent ? (
                /* Success */
                <div className="text-center py-8">
                  <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-4">
                    <CheckCircle size={32} className="text-emerald-400" />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">Invitation Sent!</h3>
                  <p className="text-slate-400 text-sm">
                    {inviteName} has been invited to join as a driver.
                  </p>
                </div>
              ) : (
                <>
                  {/* Header */}
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-lg bg-neon-blue/10 border border-neon-blue/20 flex items-center justify-center">
                      <UserPlus size={18} className="text-neon-blue" />
                    </div>
                    <div>
                      <h3 className="text-white font-semibold">Invite New Driver</h3>
                      <p className="text-slate-500 text-xs">Send a registration invite to a new driver</p>
                    </div>
                  </div>

                  {/* Form */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-slate-400 text-sm mb-1.5">Full Name</label>
                      <input
                        type="text"
                        value={inviteName}
                        onChange={(e) => setInviteName(e.target.value)}
                        placeholder="Driver's full name"
                        className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-neon-blue/50 focus:ring-1 focus:ring-neon-blue/25 transition-all text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 text-sm mb-1.5">Email</label>
                      <input
                        type="email"
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                        placeholder="driver@email.com"
                        className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-neon-blue/50 focus:ring-1 focus:ring-neon-blue/25 transition-all text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 text-sm mb-1.5">Phone</label>
                      <input
                        type="tel"
                        value={invitePhone}
                        onChange={(e) => setInvitePhone(e.target.value)}
                        placeholder="+91 98XXXXXXXX"
                        className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-neon-blue/50 focus:ring-1 focus:ring-neon-blue/25 transition-all text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 text-sm mb-1.5">City</label>
                      <input
                        type="text"
                        value={inviteCity}
                        onChange={(e) => setInviteCity(e.target.value)}
                        placeholder="e.g. Mumbai"
                        className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-neon-blue/50 focus:ring-1 focus:ring-neon-blue/25 transition-all text-sm"
                      />
                    </div>
                  </div>

                  {/* Submit */}
                  <button
                    onClick={handleInvite}
                    disabled={!inviteName || !inviteEmail || inviteSending}
                    className={`w-full mt-6 py-3 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 transition-all duration-300 ${
                      inviteName && inviteEmail && !inviteSending
                        ? 'bg-neon-blue/15 text-neon-blue border border-neon-blue/30 hover:bg-neon-blue/25 hover:shadow-[0_0_25px_rgba(0,240,255,0.2)]'
                        : 'bg-white/5 text-slate-600 border border-white/5 cursor-not-allowed'
                    }`}
                  >
                    {inviteSending ? (
                      <>
                        <div className="w-4 h-4 border-2 border-neon-blue border-t-transparent rounded-full animate-spin" />
                        Sending Invite...
                      </>
                    ) : (
                      <>
                        <Send size={16} />
                        Send Invitation
                      </>
                    )}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
