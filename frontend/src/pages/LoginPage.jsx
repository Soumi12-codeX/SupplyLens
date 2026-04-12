import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Shield, Truck, Eye, EyeOff, ArrowLeft } from 'lucide-react';

export default function LoginPage() {
  const [selectedRole, setSelectedRole] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    // Simulate login delay
    await new Promise((r) => setTimeout(r, 1200));

    login(selectedRole, { 
      email, 
      name: selectedRole === 'admin' ? 'Admin User' : 'Rajesh Kumar',
      ...(selectedRole === 'admin' && { warehouseId: 'wh-001' })
    });
    setIsLoading(false);
    navigate(selectedRole === 'admin' ? '/admin' : '/driver');
  };

  return (
    <div className="min-h-screen bg-brand-dark flex items-center justify-center px-4 relative overflow-hidden">
      {/* Ambient background glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-neon-blue/5 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-neon-purple/5 rounded-full blur-3xl pointer-events-none"></div>

      {/* Back button */}
      <button
        onClick={() => selectedRole ? setSelectedRole(null) : navigate('/')}
        className="absolute top-6 left-6 text-slate-400 hover:text-white transition-colors flex items-center gap-2 text-sm z-10"
      >
        <ArrowLeft size={18} />
        {selectedRole ? 'Back' : 'Home'}
      </button>

      <div className="w-full max-w-lg">
        {/* Logo */}
        <div className="text-center mb-10">
          <h1 className="font-outfit text-3xl font-bold text-white mb-2">
            Supply
            <span className="text-neon-blue">Lens</span>
          </h1>
          <p className="text-slate-400 text-sm">Sign in to your dashboard</p>
        </div>

        {!selectedRole ? (
          /* Role Selection */
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 animate-fade-in-up">
            {/* Admin Card */}
            <button
              onClick={() => setSelectedRole('admin')}
              className="group relative p-8 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm hover:border-neon-blue/50 hover:bg-white/8 transition-all duration-500 text-left overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-neon-blue/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative z-10">
                <div className="w-14 h-14 rounded-xl bg-neon-blue/10 border border-neon-blue/20 flex items-center justify-center mb-5 group-hover:shadow-[0_0_20px_rgba(0,240,255,0.2)] transition-shadow duration-500">
                  <Shield className="text-neon-blue" size={26} />
                </div>
                <h3 className="text-white text-lg font-semibold mb-2">Admin</h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                  Monitor all trucks, manage routes, and receive AI alerts.
                </p>
              </div>
            </button>

            {/* Driver Card */}
            <button
              onClick={() => setSelectedRole('driver')}
              className="group relative p-8 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm hover:border-neon-purple/50 hover:bg-white/8 transition-all duration-500 text-left overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-neon-purple/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative z-10">
                <div className="w-14 h-14 rounded-xl bg-neon-purple/10 border border-neon-purple/20 flex items-center justify-center mb-5 group-hover:shadow-[0_0_20px_rgba(168,85,247,0.2)] transition-shadow duration-500">
                  <Truck className="text-neon-purple" size={26} />
                </div>
                <h3 className="text-white text-lg font-semibold mb-2">Driver</h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                  View your route, track distance, and get AI navigation.
                </p>
              </div>
            </button>
          </div>
        ) : (
          /* Login Form */
          <form
            onSubmit={handleLogin}
            className="p-8 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm animate-fade-in-up"
          >
            <div className="flex items-center gap-3 mb-8">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${selectedRole === 'admin' ? 'bg-neon-blue/10 border border-neon-blue/20' : 'bg-neon-purple/10 border border-neon-purple/20'}`}>
                {selectedRole === 'admin'
                  ? <Shield className="text-neon-blue" size={20} />
                  : <Truck className="text-neon-purple" size={20} />
                }
              </div>
              <div>
                <h3 className="text-white font-semibold">
                  {selectedRole === 'admin' ? 'Admin Login' : 'Driver Login'}
                </h3>
                <p className="text-slate-500 text-xs">Enter your credentials</p>
              </div>
            </div>

            {/* Email */}
            <div className="mb-5">
              <label className="block text-slate-400 text-sm mb-2">Email</label>
              <input
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@supplylens.com"
                className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-neon-blue/50 focus:ring-1 focus:ring-neon-blue/25 transition-all text-sm"
                required
              />
            </div>

            {/* Password */}
            <div className="mb-7">
              <label className="block text-slate-400 text-sm mb-2">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-neon-blue/50 focus:ring-1 focus:ring-neon-blue/25 transition-all text-sm pr-12"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full py-3.5 rounded-lg font-semibold text-sm transition-all duration-300 flex items-center justify-center gap-2 ${
                selectedRole === 'admin'
                  ? 'bg-neon-blue/20 text-neon-blue border border-neon-blue/30 hover:bg-neon-blue/30 hover:shadow-[0_0_25px_rgba(0,240,255,0.2)]'
                  : 'bg-neon-purple/20 text-neon-purple border border-neon-purple/30 hover:bg-neon-purple/30 hover:shadow-[0_0_25px_rgba(168,85,247,0.2)]'
              } ${isLoading ? 'opacity-60 cursor-not-allowed' : ''}`}
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
