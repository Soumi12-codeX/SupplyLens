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
  const [submittedData, setSubmittedData] = useState(null);

  // --- 1. DATA STATES ---
  const [warehouses, setWarehouses] = useState([]);
  const [routes, setRoutes] = useState([]);

  // --- 2. FORM STATES ---
  const [pickupWarehouse, setPickupWarehouse] = useState(user?.warehouse?.id || '');
  const [deliveryLocation, setDeliveryLocation] = useState('');
  const [cargoType, setCargoType] = useState('');
  const [weight, setWeight] = useState('');
  const [quantity, setQuantity] = useState('');
  const [priority, setPriority] = useState('standard');
  const [notes, setNotes] = useState('');
  const [selectedRouteId, setSelectedRouteId] = useState(''); // FIXED: Added missing state

  const steps = [
    { num: 1, label: 'Route', icon: MapPin },
    { num: 2, label: 'Package', icon: Package },
    { num: 3, label: 'Optimization', icon: Sparkles },
    { num: 4, label: 'Review', icon: CheckCircle },
  ];

  // --- 3. FETCH DATA ---
  useEffect(() => {
    api.get('/warehouse/all')
      .then(res => setWarehouses(res.data))
      .catch(err => console.error("Failed to fetch warehouses", err));

    api.get('/route/all')
      .then(res => setRoutes(res.data))
      .catch(err => console.error("Failed to fetch routes", err));
  }, []);

  // --- 4. DERIVED LOGIC ---
  const selectedPickup = warehouses.find(w => w.id === pickupWarehouse) || user?.warehouse;
  const selectedDelivery = warehouses.find(w => w.id === deliveryLocation);

  // Filter routes that match the specific city names
  const availableRoutes = routes.filter(r =>
    r.source === selectedPickup?.name &&
    r.destination === selectedDelivery?.name
  );

  // Find the full object of the route chosen in the dropdown
  const selectedRouteData = routes.find(r => r.id === parseInt(selectedRouteId));

  const canProceed = () => {
    switch (currentStep) {
      case 1: return pickupWarehouse && deliveryLocation;
      case 2: return cargoType && weight && quantity;
      case 3: return selectedRouteId; // Require route selection to proceed to review
      case 4: return true;
      default: return false;
    }
  };

  // --- 5. SUBMISSION LOGIC ---
  const handleSubmit = async () => {
    setIsSubmitting(true);
    const shipmentPayload = {
      route: { id: parseInt(selectedRouteId) },
      transport: { id: 1 }, 
      status: "PENDING",
    };

    try {
      const response = await api.post(
        `/shipments/create?warehouseId=${pickupWarehouse}`,
        shipmentPayload
      );

      if (response.status === 200 || response.status === 201) {
        setSubmittedData(response.data);
      }
    } catch (error) {
      console.error("Error creating shipment:", error);
      alert("Failed to create shipment. Ensure backend matches the payload.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, 4));
  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1));

  return (
    <div className="h-screen flex bg-brand-dark overflow-hidden text-white">
      <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="border-b border-white/5 bg-slate-950/80 backdrop-blur-sm shrink-0 h-14 flex items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <Send size={16} className="text-neon-blue" />
            <h1 className="text-white font-semibold">Create Shipment</h1>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-4xl mx-auto">
            {/* Step Indicators */}
            <nav className="flex items-center justify-center mb-10 gap-2">
              {steps.map((step, i) => (
                <React.Fragment key={step.num}>
                  <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium border transition-all ${currentStep === step.num ? 'bg-neon-blue/15 text-neon-blue border-neon-blue/30' : 'bg-white/3 text-slate-500 border-white/5'}`}>
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
                  <h2 className="text-xl font-bold mb-1">Select Destinations</h2>
                  <p className="text-slate-400 text-sm">Choose origin and delivery locations.</p>
                </div>
                <section>
                  <label className="flex items-center gap-2 text-slate-300 text-sm mb-3"><Box size={14} className="text-emerald-400" /> Origin</label>
                  <div className="p-4 rounded-xl border bg-emerald-500/10 border-emerald-500/30">
                    <p className="text-sm font-semibold text-emerald-400">{selectedPickup?.name || "Warehouse Loading..."}</p>
                    <p className="text-xs text-slate-500">{selectedPickup?.address}</p>
                  </div>
                </section>
                <section>
                  <label className="flex items-center gap-2 text-slate-300 text-sm mb-3"><MapPin size={14} className="text-red-400" /> Destination</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {warehouses.filter(w => w.id !== pickupWarehouse).map((dl) => (
                      <button key={dl.id} onClick={() => setDeliveryLocation(dl.id)} className={`p-4 rounded-xl border text-left transition-all ${deliveryLocation === dl.id ? 'bg-red-500/10 border-red-500/30' : 'bg-white/3 border-white/8'}`}>
                        <p className="text-sm font-semibold">{dl.name}</p>
                        <p className="text-xs text-slate-500">{dl.address}</p>
                      </button>
                    ))}
                  </div>
                </section>
              </div>
            )}

            {/* Step 2: Package Details */}
            {currentStep === 2 && (
              <div className="space-y-6 animate-fade-in">
                <div>
                  <h2 className="text-xl font-bold text-white mb-1">Package Details</h2>
                  <p className="text-slate-400 text-sm">Describe the cargo for logistical planning.</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="flex items-center gap-2 text-slate-300 text-sm font-medium mb-2"><Package size={14} className="text-neon-blue" /> Cargo Type</label>
                    <div className="relative">
                      <select value={cargoType} onChange={(e) => setCargoType(e.target.value)} className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white text-sm appearance-none outline-none focus:border-neon-blue/50">
                        <option value="" className="bg-slate-900">Select type...</option>
                        {CARGO_TYPES.map(type => <option key={type} value={type} className="bg-slate-900">{type}</option>)}
                      </select>
                      <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                    </div>
                  </div>
                  <div>
                    <label className="flex items-center gap-2 text-slate-300 text-sm font-medium mb-2"><Weight size={14} className="text-neon-blue" /> Weight (kg)</label>
                    <input type="number" value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="e.g. 5000" className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white outline-none focus:border-neon-blue/50 text-sm" />
                  </div>
                  <div>
                    <label className="flex items-center gap-2 text-slate-300 text-sm font-medium mb-2"><Hash size={14} className="text-neon-blue" /> Quantity</label>
                    <input type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} placeholder="e.g. 120" className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white outline-none focus:border-neon-blue/50 text-sm" />
                  </div>
                  <div>
                    <label className="flex items-center gap-2 text-slate-300 text-sm font-medium mb-2"><Sparkles size={14} className="text-neon-blue" /> Priority</label>
                    <div className="flex gap-2">
                      {PRIORITY_LEVELS.map((p) => (
                        <button key={p.value} onClick={() => setPriority(p.value)} className={`flex-1 py-2.5 rounded-lg text-[10px] font-bold border transition-all ${priority === p.value ? `${p.bg} ${p.border} ${p.color}` : 'bg-white/3 border-white/8 text-slate-500'}`}>
                          {p.label.toUpperCase()}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Optimization / Route Choice */}
            {currentStep === 3 && (
              <div className="space-y-6 animate-fade-in">
                <div>
                  <h2 className="text-xl font-bold text-white mb-1">Route Optimization</h2>
                  <p className="text-slate-400 text-sm">Select a pre-defined path from the database.</p>
                </div>
                <div className="space-y-3">
                  <label className="text-xs text-slate-500 uppercase font-bold tracking-wider">Available Defined Routes</label>
                  <select
                    value={selectedRouteId}
                    onChange={(e) => setSelectedRouteId(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white outline-none focus:border-neon-blue transition-all"
                  >
                    <option value="">-- Select a Route --</option>
                    {routes.map((r) => (
                      <option key={r.id} value={r.id} className="bg-slate-900">
                        #{r.id} | {r.source} to {r.destination} ({r.distance}km)
                      </option>
                    ))}
                  </select>
                </div>

                {selectedRouteData ? (
                  <div className="p-5 rounded-2xl bg-neon-blue/5 border border-neon-blue/20 animate-slide-up">
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <p className="text-[10px] text-slate-500 uppercase">Distance</p>
                        <p className="text-white font-bold">{selectedRouteData.distance} KM</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] text-slate-500 uppercase">Estimated Time</p>
                        <p className="text-white font-bold">{selectedRouteData.estimatedTime}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-500 uppercase">Risk Level</p>
                        <p className="text-orange-400 font-bold uppercase text-xs">{selectedRouteData.riskLevel}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] text-slate-500 uppercase">Route Status</p>
                        <p className="text-emerald-400 font-bold uppercase text-xs">{selectedRouteData.status}</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-10 border border-dashed border-white/10 rounded-2xl text-center">
                    <p className="text-slate-500 text-sm italic">
                      {availableRoutes.length > 0 ? "Please pick a route to continue." : "No routes found matching your origin/destination."}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Step 4: Final Review */}
            {currentStep === 4 && (
              <div className="space-y-6 animate-fade-in">
                <div className="p-6 rounded-2xl bg-white/3 border border-white/10 space-y-4">
                  <div className="flex justify-between items-center border-b border-white/5 pb-3">
                    <h3 className="text-white font-bold">Dispatch Summary</h3>
                    <span className="text-neon-blue font-mono text-xs">RT-{selectedRouteData?.id || 'N/A'}</span>
                  </div>
                  <div className="space-y-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Path:</span>
                      <span className="text-white font-medium">{selectedPickup?.name} → {selectedDelivery?.name}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Logistics:</span>
                      <span className="text-white">{selectedRouteData?.distance}km | {selectedRouteData?.estimatedTime}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Cargo:</span>
                      <span className="text-white">{quantity}x {cargoType} ({weight}kg)</span>
                    </div>
                    <div className="pt-4 border-t border-white/5">
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-slate-500">Driver Assigned:</span>
                        <span className="text-emerald-400 font-bold">
                          {submittedData ? `ID: ${submittedData.assignedDriverId}` : "Pending confirmation"}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">Vehicle Assigned:</span>
                        <span className="text-white font-bold">
                          {submittedData ? (submittedData.transport?.id || "TRK-AUTO") : "Pending confirmation"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {!submittedData && (
                  <button
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="w-full bg-neon-blue text-slate-900 py-4 rounded-xl font-bold shadow-lg shadow-neon-blue/20 hover:scale-[1.01] active:scale-95 transition-all"
                  >
                    {isSubmitting ? "Finalizing AI Dispatch..." : "Confirm & Create Shipment"}
                  </button>
                )}
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between mt-12 pt-6 border-t border-white/5">
              <button 
                onClick={prevStep} 
                disabled={currentStep === 1 || submittedData} 
                className="px-6 py-2 bg-white/5 rounded-lg text-sm disabled:opacity-20 hover:bg-white/10 transition-colors"
              >
                Back
              </button>
              {currentStep < 4 && (
                <button 
                  onClick={nextStep} 
                  disabled={!canProceed()} 
                  className="px-8 py-2 bg-neon-blue text-black rounded-lg text-sm font-bold disabled:opacity-20 flex items-center gap-2 hover:bg-cyan-400 transition-colors"
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