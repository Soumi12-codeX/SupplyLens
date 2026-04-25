import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Shield, Truck, Eye, EyeOff, ArrowLeft, UserPlus, Box, MapPin } from 'lucide-react';
import api from '../services/api.js';

const CITY_COORDINATES = {
  // Primary Hubs
  'Kolkata': { lat: 22.5726, lon: 88.3639 },
  'Mumbai': { lat: 19.0760, lon: 72.8777 },
  'Bangalore': { lat: 12.9716, lon: 77.5946 },
  'Hyderabad': { lat: 17.3850, lon: 78.4867 },
  'Chennai': { lat: 13.0827, lon: 80.2707 },
  'Pune': { lat: 18.5204, lon: 73.8567 },
  'Ahmedabad': { lat: 23.0225, lon: 72.5714 },
  'Jaipur': { lat: 26.9124, lon: 75.7873 },
  'Lucknow': { lat: 26.8467, lon: 80.9462 },
  
  // Kolkata Nearby
  'Salt Lake': { lat: 22.5866, lon: 88.4116 },
  'Newtown': { lat: 22.5746, lon: 88.4735 },
  'Hooghly': { lat: 22.9010, lon: 88.3899 },
  'Durgapur': { lat: 23.5204, lon: 87.3119 },
  'Asansol': { lat: 23.6739, lon: 86.9524 },
  'Kharagpur': { lat: 22.3302, lon: 87.3237 },
  'Haldia': { lat: 22.0257, lon: 88.0583 },

  // Mumbai/Pune Nearby
  'Thane': { lat: 19.2183, lon: 72.9781 },
  'Navi Mumbai': { lat: 19.0330, lon: 73.0297 },
  'Kalyan': { lat: 19.2403, lon: 73.1305 },
  'Pimpri-Chinchwad': { lat: 18.6298, lon: 73.7997 },

  // Jaipur Nearby (within 200km)
  'Ajmer': { lat: 26.4499, lon: 74.6399 },

  // Lucknow Nearby (within 200km)
  'Kanpur': { lat: 26.4499, lon: 80.3319 },
  'Prayagraj': { lat: 25.4358, lon: 81.8463 },

  // Bangalore Nearby
  'Hosur': { lat: 12.7409, lon: 77.8253 },
  'Tumkur': { lat: 13.3392, lon: 77.1016 },
  'Mysore': { lat: 12.2958, lon: 76.6394 },

  // Hyderabad Nearby
  'Secunderabad': { lat: 17.4399, lon: 78.4983 },
  'Warangal': { lat: 17.9689, lon: 79.5941 },

  // Chennai Nearby
  'Kanchipuram': { lat: 12.8185, lon: 79.6947 },
  'Tiruvallur': { lat: 13.1492, lon: 79.9071 },

  // Ahmedabad Nearby (within 200km)
  'Gandhinagar': { lat: 23.2156, lon: 72.6369 },
  'Vadodara': { lat: 22.3072, lon: 73.1812 },
};

const ORDERED_CITIES = [
  // Kolkata Hub
  'Kolkata', 'Salt Lake', 'Newtown', 'Hooghly', 'Durgapur', 'Asansol', 'Kharagpur', 'Haldia',
  // Mumbai Hub
  'Mumbai', 'Thane', 'Navi Mumbai', 'Kalyan',
  // Bangalore Hub
  'Bangalore', 'Hosur', 'Tumkur', 'Mysore',
  // Hyderabad Hub
  'Hyderabad', 'Secunderabad', 'Warangal',
  // Chennai Hub
  'Chennai', 'Kanchipuram', 'Tiruvallur',
  // Pune Hub
  'Pune', 'Pimpri-Chinchwad',
  // Ahmedabad Hub
  'Ahmedabad', 'Gandhinagar', 'Vadodara',
  // Jaipur Hub
  'Jaipur', 'Ajmer',
  // Lucknow Hub
  'Lucknow', 'Kanpur', 'Prayagraj'
];

export default function RegisterPage() {
  const [selectedRole, setSelectedRole] = useState(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [assignedDriverId, setAssignedDriverId] = useState(null);
  const [city, setCity] = useState('');
  const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [warehouseId, setWarehouseId] = useState('');
  const [warehouses, setWarehouses] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { register } = useAuth();

  // fetch warehouses for admin dropdown
  useEffect(() => {
    api.get('/warehouse/all')
      .then(res => setWarehouses(res.data))
      .catch(() => setError('Failed to load warehouses'));
  }, []);

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');

    // validations
    if (selectedRole === 'admin') {
      if (password !== confirmPassword) {
        setError('Passwords do not match');
        return;
      }
      if (password.length < 6) {
        setError('Password must be at least 6 characters');
        return;
      }
      if (!warehouseId) {
        setError('Please select a warehouse');
        return;
      }
    } else {
      if (pin !== confirmPin) {
        setError('PINs do not match');
        return;
      }
      if (pin.length < 4) {
        setError('PIN must be at least 4 characters');
        return;
      }
      if (!city) {
        setError('Please select your base city');
        return;
      }
    }

    setIsLoading(true);

    const result = await register(selectedRole, {
      name,
      email,
      password,
      warehouseId,
      pin,
      city,
      latitude,
      longitude
    });

    setIsLoading(false);

    if (result.success) {
      if (selectedRole === 'driver' && result.driverId) {
        setAssignedDriverId(result.driverId);
      } else {
        navigate('/login');
      }
    } else {
      setError(result.message);
    }
  };

  return (
    <div className="min-h-screen bg-brand-dark flex items-center justify-center px-4 relative overflow-hidden">
      {/* Ambient background glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-neon-blue/5 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-neon-purple/5 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-neon-blue/3 rounded-full blur-[120px] pointer-events-none"></div>

      {/* Back button */}
      <button
        onClick={() => selectedRole ? setSelectedRole(null) : navigate('/')}
        className="absolute top-6 left-6 text-slate-400 hover:text-white transition-colors flex items-center gap-2 text-sm z-10"
      >
        <ArrowLeft size={18} />
        {selectedRole ? 'Back' : 'Home'}
      </button>

      {/* Already have account */}
      <button
        onClick={() => navigate('/login')}
        className="absolute top-6 right-6 text-slate-400 hover:text-neon-blue transition-colors text-sm z-10"
      >
        Already have an account?{' '}
        <span className="text-neon-blue font-medium">Sign In</span>
      </button>

      <div className="w-full max-w-lg">
        {/* Logo */}
        <div className="text-center mb-10">
          <h1 className="font-outfit text-3xl font-bold text-white mb-2">
            Supply<span className="text-neon-blue">Lens</span>
          </h1>
          <p className="text-slate-400 text-sm">
            {selectedRole
              ? `Create your ${selectedRole === 'admin' ? 'Admin' : 'Driver'} account`
              : 'Choose your role to get started'}
          </p>
        </div>

        {!selectedRole ? (
          /* Role Selection */
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 animate-fade-in-up">
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
          /* Registration Form */
          <form
            onSubmit={handleRegister}
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
                  {selectedRole === 'admin' ? 'Admin Registration' : 'Driver Registration'}
                </h3>
                <p className="text-slate-500 text-xs">Fill in your details to create an account</p>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-5 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                {error}
              </div>
            )}

            {/* Full Name */}
            <div className="mb-5">
              <label className="block text-slate-400 text-sm mb-2">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
                className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-neon-blue/50 focus:ring-1 focus:ring-neon-blue/25 transition-all text-sm"
                required
              />
            </div>

            {/* ADMIN FIELDS */}
            {selectedRole === 'admin' && (
              <>
                {/* Warehouse */}
                <div className="mb-5">
                  <label className="flex items-center gap-2 text-slate-400 text-sm mb-2">
                    <Box size={14} className="text-neon-blue" />
                    Select Warehouse
                  </label>
                  <select
                    value={warehouseId}
                    onChange={(e) => setWarehouseId(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-neon-blue/50 focus:ring-1 focus:ring-neon-blue/25 transition-all text-sm appearance-none"
                    required
                  >
                    <option value="" className="bg-slate-900">Choose a warehouse...</option>
                    {warehouses.map((wh) => (
                      <option key={wh.id} value={wh.id} className="bg-slate-900">
                        {wh.name} ({wh.city})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Email */}
                <div className="mb-5">
                  <label className="block text-slate-400 text-sm mb-2">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@supplylens.com"
                    className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-neon-blue/50 focus:ring-1 focus:ring-neon-blue/25 transition-all text-sm"
                    required
                  />
                </div>

                {/* Password */}
                <div className="mb-5">
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
                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors">
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div className="mb-7">
                  <label className="block text-slate-400 text-sm mb-2">Confirm Password</label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-neon-blue/50 focus:ring-1 focus:ring-neon-blue/25 transition-all text-sm"
                    required
                  />
                </div>
              </>
            )}

            {/* DRIVER FIELDS */}
            {selectedRole === 'driver' && (
              <>
                {/* Driver ID - REMOVED: now auto-assigned by backend */}

                {/* City Selection */}
                <div className="mb-5">
                  <label className="flex items-center gap-2 text-slate-400 text-sm mb-2">
                    <MapPin size={14} className="text-neon-purple" />
                    Base City
                  </label>
                  <select
                    value={city}
                    onChange={(e) => {
                      const selectedCity = e.target.value;
                      setCity(selectedCity);
                      if (CITY_COORDINATES[selectedCity]) {
                        setLatitude(CITY_COORDINATES[selectedCity].lat);
                        setLongitude(CITY_COORDINATES[selectedCity].lon);
                      }
                    }}
                    className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-neon-purple/50 focus:ring-1 focus:ring-neon-purple/25 transition-all text-sm appearance-none"
                    required
                  >
                    <option value="" className="bg-slate-900">Choose your city...</option>
                    {ORDERED_CITIES.map((c) => (
                      <option key={c} value={c} className="bg-slate-900">{c}</option>
                    ))}
                  </select>
                </div>

                {/* PIN */}
                <div className="mb-5">
                  <label className="block text-slate-400 text-sm mb-2">PIN</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={pin}
                      onChange={(e) => setPin(e.target.value)}
                      placeholder="••••"
                      className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-neon-purple/50 focus:ring-1 focus:ring-neon-purple/25 transition-all text-sm pr-12"
                      required
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors">
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                {/* Confirm PIN */}
                <div className="mb-7">
                  <label className="block text-slate-400 text-sm mb-2">Confirm PIN</label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPin}
                    onChange={(e) => setConfirmPin(e.target.value)}
                    placeholder="••••"
                    className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-neon-purple/50 focus:ring-1 focus:ring-neon-purple/25 transition-all text-sm"
                    required
                  />
                </div>
              </>
            )}

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
                  Creating Account...
                </>
              ) : (
                <>
                  <UserPlus size={18} />
                  Create Account
                </>
              )}
            </button>
          </form>
        )}
      </div>

      {/* Driver ID Success Modal */}
      {assignedDriverId && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 px-4">
          <div className="w-full max-w-md p-8 rounded-2xl border border-neon-purple/30 bg-slate-950/90 backdrop-blur-sm text-center animate-fade-in-up">
            <div className="w-16 h-16 rounded-full bg-neon-purple/10 border border-neon-purple/30 flex items-center justify-center mx-auto mb-5">
              <Truck size={28} className="text-neon-purple" />
            </div>
            <h2 className="text-white text-xl font-bold mb-1">Account Created!</h2>
            <p className="text-slate-400 text-sm mb-6">Your Driver ID has been auto-assigned. Save it — you'll need it to log in.</p>

            <div className="bg-neon-purple/10 border border-neon-purple/30 rounded-xl p-5 mb-2">
              <p className="text-slate-400 text-xs uppercase tracking-widest mb-2">Your Driver ID</p>
              <p className="text-neon-purple font-mono text-3xl font-bold tracking-widest">{assignedDriverId}</p>
            </div>
            <p className="text-slate-500 text-xs mb-6">Screenshot or write this down before continuing.</p>

            <button
              onClick={() => {
                navigator.clipboard?.writeText(assignedDriverId);
                navigate('/login');
              }}
              className="w-full py-3.5 rounded-lg font-semibold text-sm bg-neon-purple/20 text-neon-purple border border-neon-purple/30 hover:bg-neon-purple/30 transition-all flex items-center justify-center gap-2"
            >
              <UserPlus size={16} />
              Copy ID &amp; Go to Login
            </button>
          </div>
        </div>
      )}
    </div>
  );
}