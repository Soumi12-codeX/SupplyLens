import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import { 
  Package, MapPin, User, Weight, Hash, FileText, 
  ChevronDown, CheckCircle, ArrowRight, Sparkles, Box, Send 
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

const CARGO_TYPES = ['Electronics', 'Textiles', 'Pharmaceuticals', 'Automotive Parts', 'Food & Beverages', 'Machinery', 'Chemicals', 'FMCG', 'Furniture', 'Raw Materials'];

const PRIORITY_LEVELS = [
  { value: 'standard', label: 'Standard', color: 'text-slate-400', bg: 'bg-slate-500/10', border: 'border-slate-500/20' },
  { value: 'express', label: 'Express', color: 'text-neon-blue', bg: 'bg-neon-blue/10', border: 'border-neon-blue/20' },
  { value: 'urgent', label: 'Urgent', color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/20' },
  { value: 'critical', label: 'Critical', color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20' },
];

export default function CreateShipment() {
  const { user } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Data States
  const [warehouses, setWarehouses] = useState([]);
  const [assignedDriver, setAssignedDriver] = useState(null);

  // Form States
  const [pickupWarehouse, setPickupWarehouse] = useState(user?.warehouse?.id || '');
  const [deliveryLocation, setDeliveryLocation] = useState('');
  const [cargoType, setCargoType] = useState('');
  const [weight, setWeight] = useState('');
  const [quantity, setQuantity] = useState('');
  const [priority, setPriority] = useState('standard');
  const [notes, setNotes] = useState('');

  const steps = [
    { num: 1, label: 'Route', icon: MapPin },
    { num: 2, label: 'Package', icon: Package },
    { num: 3, label: 'Optimization', icon: Sparkles },
    { num: 4, label: 'Review', icon: CheckCircle },
  ];

  useEffect(() => {
    api.get('/warehouse/all')
      .then(res => setWarehouses(res.data))
      .catch(err => console.error("Failed to fetch warehouses", err));
  }, []);

  const canProceed = () => {
    if (currentStep === 1) return pickupWarehouse && deliveryLocation;
    if (currentStep === 2) return cargoType && weight && quantity;
    return true;
  };

  const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, 4));
  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1));

  const selectedPickup = warehouses.find(w => w.id === pickupWarehouse) || user?.warehouse;

  return (
    <div className="h-screen flex bg-brand-dark overflow-hidden">
      <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="border-b border-white/5 bg-slate-950/80 backdrop-blur-sm shrink-0 h-14 flex items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <Send size={16} className="text-neon-blue" />
            <h1 className="text-white font-semibold">Create Shipment</h1>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Sparkles size={14} className="text-neon-blue" />
            AI-optimized routing enabled
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-4xl mx-auto">
            {/* Step Indicators */}
            <nav className="flex items-center justify-center mb-10 gap-2">
              {steps.map((step, i) => (
                <React.Fragment key={step.num}>
                  <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium border transition-all ${
                    currentStep === step.num ? 'bg-neon-blue/15 text-neon-blue border-neon-blue/30' : 'bg-white/3 text-slate-500 border-white/5'
                  }`}>
                    <step.icon size={16} />
                    <span className="hidden sm:inline">{step.label}</span>
                  </div>
                  {i < steps.length - 1 && <div className="w-8 h-px bg-white/10" />}
                </React.Fragment>
              ))}
            </nav>

            {/* Step 1: Route Selection */}
            {currentStep === 1 && (
              <div className="space-y-6 animate-fade-in">
                <div>
                  <h2 className="text-xl font-bold text-white mb-1">Select Route</h2>
                  <p className="text-slate-400 text-sm">Define the logistics path from origin to destination.</p>
                </div>

                {/* Origin (Auto-selected based on Auth User) */}
                <section>
                  <label className="flex items-center gap-2 text-slate-300 text-sm font-medium mb-3">
                    <Box size={14} className="text-emerald-400" /> Origin Warehouse
                  </label>
                  <div className="p-4 rounded-xl border bg-emerald-500/10 border-emerald-500/30">
                    <p className="text-sm font-semibold text-emerald-400">{selectedPickup?.name || "Loading..."}</p>
                    <p className="text-xs text-slate-500">{selectedPickup?.address}</p>
                  </div>
                </section>

                {/* Destination (Fetched from DB) */}
                <section>
                  <label className="flex items-center gap-2 text-slate-300 text-sm font-medium mb-3">
                    <MapPin size={14} className="text-red-400" /> Delivery Destination
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {warehouses.filter(w => w.id !== pickupWarehouse).map((dl) => (
                      <button
                        key={dl.id}
                        onClick={() => setDeliveryLocation(dl.id)}
                        className={`p-4 rounded-xl border text-left transition-all ${
                          deliveryLocation === dl.id ? 'bg-red-500/10 border-red-500/30 ring-1 ring-red-500/20' : 'bg-white/3 border-white/8 hover:bg-white/5'
                        }`}
                      >
                        <p className={`text-sm font-semibold mb-1 ${deliveryLocation === dl.id ? 'text-red-400' : 'text-white'}`}>{dl.name}</p>
                        <p className="text-xs text-slate-500">{dl.address}</p>
                      </button>
                    ))}
                  </div>
                </section>
              </div>
            )}

            {/* Placeholder for Step 2 & 3 */}
            {currentStep === 2 && <div className="text-white">Package Details Form goes here...</div>}
            {currentStep === 3 && (
              <div className="text-center py-10">
                <Sparkles size={40} className="text-neon-blue mx-auto mb-4 animate-pulse" />
                <h2 className="text-white text-lg font-bold">AI Optimization Active</h2>
                <p className="text-slate-400 text-sm">The backend will automatically select the best driver and vehicle upon submission.</p>
              </div>
            )}

            {/* Navigation Footer */}
            <div className="flex items-center justify-between mt-12 pt-6 border-t border-white/5">
              <button
                onClick={prevStep}
                disabled={currentStep === 1}
                className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${
                  currentStep === 1 ? 'opacity-20 cursor-not-allowed' : 'bg-white/5 text-slate-300 hover:bg-white/10'
                }`}
              >
                Back
              </button>
              
              {currentStep < 4 && (
                <button
                  onClick={nextStep}
                  disabled={!canProceed()}
                  className={`px-8 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-all ${
                    canProceed() ? 'bg-neon-blue text-slate-900 shadow-lg shadow-neon-blue/20' : 'bg-white/5 text-slate-600 cursor-not-allowed'
                  }`}
                >
                  Continue <ArrowRight size={16} />
                </button>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}