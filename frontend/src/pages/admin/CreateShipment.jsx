import React, { useState } from 'react';
import Sidebar from '../../components/Sidebar';
import { Package, MapPin, Truck, User, Weight, Hash, FileText, ChevronDown, CheckCircle, ArrowRight, Sparkles, Box, Send } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { WAREHOUSES, DELIVERY_LOCATIONS } from '../../services/mockData';
import api from '../../services/api';

const MOCK_DRIVERS = [
  { id: 'drv-001', name: 'Rajesh Kumar', phone: '+91 9812345678', status: 'available', trips: 142, rating: 4.8 },
  { id: 'drv-002', name: 'Amit Sharma', phone: '+91 9823456789', status: 'available', trips: 98, rating: 4.6 },
  { id: 'drv-003', name: 'Suresh Patel', phone: '+91 9834567890', status: 'on-route', trips: 214, rating: 4.9 },
  { id: 'drv-004', name: 'Vikram Singh', phone: '+91 9845678901', status: 'available', trips: 76, rating: 4.5 },
  { id: 'drv-005', name: 'Deepak Verma', phone: '+91 9856789012', status: 'on-route', trips: 167, rating: 4.7 },
  { id: 'drv-006', name: 'Arun Yadav', phone: '+91 9867890123', status: 'available', trips: 53, rating: 4.4 },
];

const CARGO_TYPES = [
  'Electronics', 'Textiles', 'Pharmaceuticals', 'Automotive Parts',
  'Food & Beverages', 'Machinery', 'Chemicals', 'FMCG', 'Furniture', 'Raw Materials',
];

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

  // Form state
  const [pickupWarehouse, setPickupWarehouse] = useState(
    user?.warehouse?.id || ''
  );
  const [deliveryLocation, setDeliveryLocation] = useState('');
  const [selectedDriver, setSelectedDriver] = useState('');
  const [cargoType, setCargoType] = useState('');
  const [weight, setWeight] = useState('');
  const [quantity, setQuantity] = useState('');
  const [priority, setPriority] = useState('standard');
  const [notes, setNotes] = useState('');

  const steps = [
    { num: 1, label: 'Route', icon: MapPin },
    { num: 2, label: 'Package', icon: Package },
    { num: 3, label: 'Driver', icon: User },
    { num: 4, label: 'Review', icon: CheckCircle },
  ];

  const canProceed = () => {
    switch (currentStep) {
      case 1: return pickupWarehouse && deliveryLocation;
      case 2: return cargoType && weight && quantity;
      case 3: return selectedDriver;
      case 4: return true;
      default: return false;
    }
  };

  const handleSubmit = async () => {
  try {
    setIsSubmitting(true);

    const payload = {
      transport: {
        type: cargoType,
        weight,
        quantity
      },
      route: {
        source: selectedPickup?.name,
        destination: selectedDelivery?.name
      },
      assignedDriverId: selectedDriver,
      status: "CREATED",
      assignmentStatus: "UNASSIGNED"
    };

    const res = await api.post(
      `/shipments/create?warehouseId=${user?.warehouse?.id}`, // 🔴 IMPORTANT
      payload
    );

    console.log("Shipment created:", res.data);

    setSubmitted(true);
  } catch (err) {
    console.error("Error creating shipment:", err);
  } finally {
    setIsSubmitting(false);
  }
};

  const resetForm = () => {
    setCurrentStep(1);
    setPickupWarehouse(user?.warehouseId || '');
    setDeliveryLocation('');
    setSelectedDriver('');
    setCargoType('');
    setWeight('');
    setQuantity('');
    setPriority('standard');
    setNotes('');
    setSubmitted(false);
  };

  const selectedPickup = {
    id: user?.warehouse?.id,
    name: user?.warehouse?.name,
    address: user?.warehouse?.address
  };
  const selectedDelivery = DELIVERY_LOCATIONS.find((d) => d.id === deliveryLocation);
  const selectedDriverData = MOCK_DRIVERS.find((d) => d.id === selectedDriver);
  const selectedPriority = PRIORITY_LEVELS.find((p) => p.value === priority);

  return (
    <div className="h-screen flex bg-brand-dark overflow-hidden">
      <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="border-b border-white/5 bg-slate-950/80 backdrop-blur-sm shrink-0">
          <div className="h-14 flex items-center justify-between px-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-neon-blue/10 border border-neon-blue/20 flex items-center justify-center">
                <Send size={16} className="text-neon-blue" />
              </div>
              <h1 className="text-white font-semibold text-base">Create Shipment</h1>
            </div>
            <div className="flex items-center gap-2">
              <Sparkles size={14} className="text-neon-blue" />
              <span className="text-xs text-slate-400">AI-optimized routing enabled</span>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-4xl mx-auto">
            {/* Step Indicator */}
            <div className="flex items-center justify-center mb-10">
              {steps.map((step, i) => {
                const Icon = step.icon;
                const isActive = currentStep === step.num;
                const isCompleted = currentStep > step.num;
                return (
                  <React.Fragment key={step.num}>
                    <button
                      onClick={() => isCompleted && setCurrentStep(step.num)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                        isActive
                          ? 'bg-neon-blue/15 text-neon-blue border border-neon-blue/30 shadow-[0_0_20px_rgba(0,240,255,0.1)]'
                          : isCompleted
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 cursor-pointer'
                          : 'bg-white/3 text-slate-500 border border-white/5'
                      }`}
                    >
                      {isCompleted ? <CheckCircle size={16} /> : <Icon size={16} />}
                      <span className="hidden sm:inline">{step.label}</span>
                    </button>
                    {i < steps.length - 1 && (
                      <div className={`w-12 h-px mx-2 transition-colors duration-300 ${
                        currentStep > step.num ? 'bg-emerald-500/40' : 'bg-white/10'
                      }`} />
                    )}
                  </React.Fragment>
                );
              })}
            </div>

            {submitted ? (
              /* Success State */
              <div className="text-center py-16 animate-fade-in-up">
                <div className="w-20 h-20 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-6">
                  <CheckCircle size={40} className="text-emerald-400" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-3">Shipment Created!</h2>
                <p className="text-slate-400 mb-2">
                  Shipment <span className="text-neon-blue font-mono">SHP-{Date.now().toString().slice(-6)}</span> has been created successfully.
                </p>
                <p className="text-slate-500 text-sm mb-8">
                  Driver {selectedDriverData?.name} has been notified and will begin pickup shortly.
                </p>
                <div className="flex items-center justify-center gap-4">
                  <button
                    onClick={resetForm}
                    className="px-6 py-3 rounded-lg bg-neon-blue/15 text-neon-blue border border-neon-blue/30 hover:bg-neon-blue/25 transition-all font-medium text-sm"
                  >
                    Create Another
                  </button>
                  <button
                    onClick={() => window.history.back()}
                    className="px-6 py-3 rounded-lg bg-white/5 text-slate-300 border border-white/10 hover:bg-white/10 transition-all font-medium text-sm"
                  >
                    Back to Dashboard
                  </button>
                </div>
              </div>
            ) : (
              /* Form Steps */
              <div className="animate-fade-in-up">
                {/* Step 1: Route Selection */}
                {currentStep === 1 && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-xl font-bold text-white mb-1">Select Route</h2>
                      <p className="text-slate-400 text-sm">Choose pickup warehouse and delivery destination</p>
                    </div>

                    {/* Pickup Warehouse (Read Only) */}
                    <div>
                      <label className="flex items-center gap-2 text-slate-300 text-sm font-medium mb-3">
                        <Box size={14} className="text-emerald-400" />
                        Origin Warehouse
                      </label>
                      <div className="p-4 rounded-xl border bg-emerald-500/10 border-emerald-500/30 shadow-[0_0_20px_rgba(16,185,129,0.1)] text-left">
                        <p className="text-sm font-semibold mb-1 text-emerald-400">
                          {selectedPickup?.name || 'Assigned Warehouse'}
                        </p>
                        <p className="text-xs text-slate-500">
                          {selectedPickup?.address || 'No warehouse assigned'}
                        </p>
                      </div>
                    </div>

                    {/* Delivery Location */}
                    <div>
                      <label className="flex items-center gap-2 text-slate-300 text-sm font-medium mb-3">
                        <MapPin size={14} className="text-red-400" />
                        Delivery Location
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {DELIVERY_LOCATIONS.map((dl) => (
                          <button
                            key={dl.id}
                            onClick={() => setDeliveryLocation(dl.id)}
                            className={`p-4 rounded-xl border text-left transition-all duration-300 ${
                              deliveryLocation === dl.id
                                ? 'bg-red-500/10 border-red-500/30 shadow-[0_0_20px_rgba(239,68,68,0.1)]'
                                : 'bg-white/3 border-white/8 hover:bg-white/5 hover:border-white/15'
                            }`}
                          >
                            <p className={`text-sm font-semibold mb-1 ${deliveryLocation === dl.id ? 'text-red-400' : 'text-white'}`}>
                              {dl.name}
                            </p>
                            <p className="text-xs text-slate-500">{dl.address}</p>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 2: Package Details */}
                {currentStep === 2 && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-xl font-bold text-white mb-1">Package Details</h2>
                      <p className="text-slate-400 text-sm">Describe the cargo being shipped</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      {/* Cargo Type */}
                      <div>
                        <label className="flex items-center gap-2 text-slate-300 text-sm font-medium mb-2">
                          <Package size={14} className="text-neon-blue" />
                          Cargo Type
                        </label>
                        <div className="relative">
                          <select
                            value={cargoType}
                            onChange={(e) => setCargoType(e.target.value)}
                            className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-neon-blue/50 focus:ring-1 focus:ring-neon-blue/25 transition-all text-sm appearance-none cursor-pointer"
                          >
                            <option value="" className="bg-slate-900">Select cargo type...</option>
                            {CARGO_TYPES.map((type) => (
                              <option key={type} value={type} className="bg-slate-900">{type}</option>
                            ))}
                          </select>
                          <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                        </div>
                      </div>

                      {/* Weight */}
                      <div>
                        <label className="flex items-center gap-2 text-slate-300 text-sm font-medium mb-2">
                          <Weight size={14} className="text-neon-blue" />
                          Weight (kg)
                        </label>
                        <input
                          type="number"
                          value={weight}
                          onChange={(e) => setWeight(e.target.value)}
                          placeholder="e.g. 5000"
                          className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-neon-blue/50 focus:ring-1 focus:ring-neon-blue/25 transition-all text-sm"
                        />
                      </div>

                      {/* Quantity */}
                      <div>
                        <label className="flex items-center gap-2 text-slate-300 text-sm font-medium mb-2">
                          <Hash size={14} className="text-neon-blue" />
                          Quantity (packages)
                        </label>
                        <input
                          type="number"
                          value={quantity}
                          onChange={(e) => setQuantity(e.target.value)}
                          placeholder="e.g. 120"
                          className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-neon-blue/50 focus:ring-1 focus:ring-neon-blue/25 transition-all text-sm"
                        />
                      </div>

                      {/* Priority */}
                      <div>
                        <label className="flex items-center gap-2 text-slate-300 text-sm font-medium mb-2">
                          <Sparkles size={14} className="text-neon-blue" />
                          Priority Level
                        </label>
                        <div className="flex gap-2">
                          {PRIORITY_LEVELS.map((p) => (
                            <button
                              key={p.value}
                              onClick={() => setPriority(p.value)}
                              className={`flex-1 py-2.5 rounded-lg text-xs font-medium border transition-all duration-300 ${
                                priority === p.value
                                  ? `${p.bg} ${p.border} ${p.color}`
                                  : 'bg-white/3 border-white/8 text-slate-500 hover:bg-white/5'
                              }`}
                            >
                              {p.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Notes */}
                    <div>
                      <label className="flex items-center gap-2 text-slate-300 text-sm font-medium mb-2">
                        <FileText size={14} className="text-neon-blue" />
                        Special Instructions (optional)
                      </label>
                      <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Fragile items, temperature-controlled, hazardous materials, etc."
                        rows={3}
                        className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-neon-blue/50 focus:ring-1 focus:ring-neon-blue/25 transition-all text-sm resize-none"
                      />
                    </div>
                  </div>
                )}

                {/* Step 3: Assign Driver */}
                {currentStep === 3 && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-xl font-bold text-white mb-1">Assign Driver</h2>
                      <p className="text-slate-400 text-sm">Choose an available driver for this shipment</p>
                    </div>

                    <div className="space-y-3">
                      {MOCK_DRIVERS.map((driver) => {
                        const isAvailable = driver.status === 'available';
                        const isSelected = selectedDriver === driver.id;
                        return (
                          <button
                            key={driver.id}
                            onClick={() => isAvailable && setSelectedDriver(driver.id)}
                            disabled={!isAvailable}
                            className={`w-full flex items-center gap-4 p-4 rounded-xl border text-left transition-all duration-300 ${
                              isSelected
                                ? 'bg-neon-blue/10 border-neon-blue/30 shadow-[0_0_20px_rgba(0,240,255,0.1)]'
                                : isAvailable
                                ? 'bg-white/3 border-white/8 hover:bg-white/5 hover:border-white/15'
                                : 'bg-white/2 border-white/5 opacity-50 cursor-not-allowed'
                            }`}
                          >
                            {/* Avatar */}
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold ${
                              isSelected
                                ? 'bg-neon-blue/20 text-neon-blue'
                                : isAvailable
                                ? 'bg-white/5 text-white'
                                : 'bg-white/3 text-slate-600'
                            }`}>
                              {driver.name.split(' ').map(n => n[0]).join('')}
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-0.5">
                                <p className={`text-sm font-semibold ${isSelected ? 'text-neon-blue' : 'text-white'}`}>
                                  {driver.name}
                                </p>
                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                                  isAvailable
                                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                    : 'bg-orange-500/10 text-orange-400 border border-orange-500/20'
                                }`}>
                                  {isAvailable ? 'Available' : 'On Route'}
                                </span>
                              </div>
                              <p className="text-xs text-slate-500">{driver.phone}</p>
                            </div>

                            <div className="text-right shrink-0">
                              <p className="text-xs text-slate-400">{driver.trips} trips</p>
                              <p className="text-xs text-yellow-400">★ {driver.rating}</p>
                            </div>

                            {isSelected && (
                              <CheckCircle size={20} className="text-neon-blue shrink-0" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Step 4: Review */}
                {currentStep === 4 && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-xl font-bold text-white mb-1">Review Shipment</h2>
                      <p className="text-slate-400 text-sm">Confirm all details before creating</p>
                    </div>

                    <div className="space-y-4">
                      {/* Route Summary */}
                      <div className="p-5 rounded-xl bg-white/3 border border-white/8">
                        <p className="text-xs text-slate-500 uppercase tracking-wider mb-3 font-medium">Route</p>
                        <div className="flex items-center gap-4">
                          <div className="flex-1">
                            <p className="text-emerald-400 text-sm font-semibold">{selectedPickup?.name}</p>
                            <p className="text-xs text-slate-500">{selectedPickup?.address}</p>
                          </div>
                          <ArrowRight size={18} className="text-slate-600 shrink-0" />
                          <div className="flex-1 text-right">
                            <p className="text-red-400 text-sm font-semibold">{selectedDelivery?.name}</p>
                            <p className="text-xs text-slate-500">{selectedDelivery?.address}</p>
                          </div>
                        </div>
                      </div>

                      {/* Package Summary */}
                      <div className="p-5 rounded-xl bg-white/3 border border-white/8">
                        <p className="text-xs text-slate-500 uppercase tracking-wider mb-3 font-medium">Package</p>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                          <div>
                            <p className="text-xs text-slate-500">Cargo</p>
                            <p className="text-sm text-white font-medium">{cargoType}</p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-500">Weight</p>
                            <p className="text-sm text-white font-medium">{weight} kg</p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-500">Quantity</p>
                            <p className="text-sm text-white font-medium">{quantity} pkgs</p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-500">Priority</p>
                            <p className={`text-sm font-medium ${selectedPriority?.color}`}>{selectedPriority?.label}</p>
                          </div>
                        </div>
                        {notes && (
                          <div className="mt-3 pt-3 border-t border-white/5">
                            <p className="text-xs text-slate-500">Notes</p>
                            <p className="text-sm text-slate-300">{notes}</p>
                          </div>
                        )}
                      </div>

                      {/* Driver Summary */}
                      <div className="p-5 rounded-xl bg-white/3 border border-white/8">
                        <p className="text-xs text-slate-500 uppercase tracking-wider mb-3 font-medium">Assigned Driver</p>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-neon-blue/10 flex items-center justify-center text-neon-blue font-bold text-sm">
                            {selectedDriverData?.name.split(' ').map(n => n[0]).join('')}
                          </div>
                          <div>
                            <p className="text-sm text-white font-semibold">{selectedDriverData?.name}</p>
                            <p className="text-xs text-slate-500">{selectedDriverData?.phone} • {selectedDriverData?.trips} trips • ★ {selectedDriverData?.rating}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Navigation Buttons */}
                <div className="flex items-center justify-between mt-8 pt-6 border-t border-white/5">
                  <button
                    onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
                    className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                      currentStep === 1
                        ? 'text-slate-600 cursor-not-allowed'
                        : 'text-slate-300 bg-white/5 border border-white/10 hover:bg-white/10'
                    }`}
                    disabled={currentStep === 1}
                  >
                    Back
                  </button>

                  {currentStep < 4 ? (
                    <button
                      onClick={() => setCurrentStep(currentStep + 1)}
                      disabled={!canProceed()}
                      className={`px-6 py-2.5 rounded-lg text-sm font-semibold flex items-center gap-2 transition-all duration-300 ${
                        canProceed()
                          ? 'bg-neon-blue/15 text-neon-blue border border-neon-blue/30 hover:bg-neon-blue/25 hover:shadow-[0_0_20px_rgba(0,240,255,0.15)]'
                          : 'bg-white/5 text-slate-600 border border-white/5 cursor-not-allowed'
                      }`}
                    >
                      Continue
                      <ArrowRight size={16} />
                    </button>
                  ) : (
                    <button
                      onClick={handleSubmit}
                      disabled={isSubmitting}
                      className="px-8 py-3 rounded-lg text-sm font-semibold flex items-center gap-2 bg-gradient-to-r from-neon-blue/20 to-neon-purple/20 text-neon-blue border border-neon-blue/30 hover:shadow-[0_0_30px_rgba(0,240,255,0.2)] transition-all duration-300"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="w-4 h-4 border-2 border-neon-blue border-t-transparent rounded-full animate-spin" />
                          Creating Shipment...
                        </>
                      ) : (
                        <>
                          <Send size={16} />
                          Create Shipment
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
