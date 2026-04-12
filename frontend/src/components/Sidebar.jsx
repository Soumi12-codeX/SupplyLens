import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard, Map, Truck, Bell, LogOut,
  ChevronLeft, ChevronRight, Route, MessageSquare,
  Send, Users,
} from 'lucide-react';

export default function Sidebar({ collapsed, onToggle }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const isAdmin = user?.role === 'admin';

  const adminLinks = [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/admin' },
    { label: 'Live Map', icon: Map, path: '/admin/map' },
    { label: 'Fleet', icon: Truck, path: '/admin/fleet' },
    { label: 'Create Shipment', icon: Send, path: '/admin/shipment' },
    { label: 'Manage Drivers', icon: Users, path: '/admin/drivers' },
    { label: 'Alerts', icon: Bell, path: '/admin/alerts' },
  ];

  const driverLinks = [
    { label: 'My Route', icon: Route, path: '/driver' },
    { label: 'Navigation', icon: Map, path: '/driver/navigation' },
    { label: 'Messages', icon: MessageSquare, path: '/driver/messages' },
  ];

  const links = isAdmin ? adminLinks : driverLinks;

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div
      className={`h-full flex flex-col border-r border-white/5 bg-slate-950/80 backdrop-blur-md transition-all duration-300 ${
        collapsed ? 'w-16' : 'w-60'
      }`}
    >
      {/* Header */}
      <div className="p-4 flex items-center justify-between border-b border-white/5">
        {!collapsed && (
          <h2 className="font-outfit text-lg font-bold text-white">
            Supply<span className="text-neon-blue">Lens</span>
          </h2>
        )}
        <button
          onClick={onToggle}
          className="text-slate-500 hover:text-white transition-colors p-1 ml-auto"
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      {/* Nav Links */}
      <nav className="flex-1 p-3 space-y-1">
        {links.map((link) => {
          const isActive = location.pathname === link.path;
          const Icon = link.icon;

          return (
            <button
              key={link.label}
              onClick={() => navigate(link.path)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-neon-blue/10 text-neon-blue border border-neon-blue/15'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
              title={collapsed ? link.label : undefined}
            >
              <Icon size={18} className="shrink-0" />
              {!collapsed && <span>{link.label}</span>}
            </button>
          );
        })}
      </nav>

      {/* User / Logout */}
      <div className="p-3 border-t border-white/5">
        {!collapsed && (
          <div className="px-3 py-2 mb-2">
            <p className="text-white text-sm font-medium truncate">{user?.name || 'User'}</p>
            <p className="text-slate-500 text-xs capitalize">{user?.role}</p>
          </div>
        )}
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-400 hover:text-red-400 hover:bg-red-500/5 transition-all"
          title={collapsed ? 'Logout' : undefined}
        >
          <LogOut size={18} className="shrink-0" />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </div>
  );
}
