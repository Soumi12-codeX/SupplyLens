import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, CheckCircle, X, ArrowRight } from 'lucide-react';

export default function AINotification({ alert, onApprove, onDismiss, isDriver = false }) {
  const [status, setStatus] = React.useState('pending'); // 'pending' | 'approved'
  if (!alert) return null;

  const severityColors = {
    critical: { border: 'border-red-500/40', bg: 'bg-red-500/5', text: 'text-red-400', glow: 'shadow-[0_0_30px_rgba(239,68,68,0.15)]' },
    high: { border: 'border-orange-500/40', bg: 'bg-orange-500/5', text: 'text-orange-400', glow: 'shadow-[0_0_30px_rgba(249,115,22,0.15)]' },
    medium: { border: 'border-yellow-500/40', bg: 'bg-yellow-500/5', text: 'text-yellow-400', glow: 'shadow-[0_0_30px_rgba(234,179,8,0.15)]' },
  };

  const colors = severityColors[alert.severity] || severityColors.medium;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.95 }}
        transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
        className={`rounded-xl border ${colors.border} ${colors.bg} ${colors.glow} backdrop-blur-md p-5 max-w-md w-full`}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{alert.icon}</span>
            <div>
              <h4 className={`font-semibold text-sm ${colors.text}`}>{alert.title}</h4>
              <p className="text-slate-500 text-xs">{alert.truckId} • {alert.driverName}</p>
            </div>
          </div>
          <button
            onClick={onDismiss}
            className="text-slate-500 hover:text-slate-300 transition-colors p-1"
          >
            <X size={16} />
          </button>
        </div>

        {/* Description */}
        <p className="text-slate-300 text-sm mb-3 leading-relaxed">{alert.description}</p>
        <p className="text-slate-400 text-xs mb-4">{alert.affectedArea}</p>

        {/* Suggested Routes from AI */}
        {alert.routeOptions && alert.routeOptions.length > 0 ? (
          <div className="space-y-3 mb-4">
            <p className="text-xs text-slate-400 font-medium tracking-wider uppercase">AI Suggested Detours</p>
            {alert.routeOptions.map((opt, idx) => (
              <div key={idx} className={`p-3 rounded-lg border transition-all ${idx === 0 ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-white/5 border-white/5'}`}>
                <div className="flex justify-between items-start mb-1">
                  <span className={`text-xs font-bold uppercase ${idx === 0 ? 'text-emerald-400' : 'text-slate-400'}`}>{opt.label}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-slate-400">{opt.riskLevel} Risk</span>
                </div>
                <p className="text-xs text-slate-300 font-mono mb-1">{opt.path}</p>
                <div className="flex items-center gap-3 mt-2 text-[10px]">
                  <span className="text-white">ETA: {opt.estimatedHours}h</span>
                  <span className="text-slate-500 italic">{opt.tradeoff}</span>
                </div>
              </div>
            ))}
          </div>
        ) : alert.suggestedRoute && (
          <div className="bg-white/5 rounded-lg p-3 mb-4 border border-white/5">
            <p className="text-xs text-slate-400 mb-1">AI Suggested Route</p>
            <p className="text-sm text-white font-medium">{alert.suggestedRoute.description}</p>
            <div className="flex gap-4 mt-2">
              <span className="text-xs text-emerald-400">⏱ Saves {alert.suggestedRoute.timeSaved}</span>
              <span className="text-xs text-slate-400">📏 +{alert.suggestedRoute.additionalDistance}</span>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={async () => {
              if (status === 'approved') return;
              await onApprove?.(alert);
              setStatus('approved');
            }}
            disabled={status === 'approved'}
            className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${
              status === 'approved' 
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 cursor-default'
                : 'bg-neon-blue/15 text-neon-blue border border-neon-blue/25 hover:bg-neon-blue/25'
            }`}
          >
            {status === 'approved' ? (
              <>
                <CheckCircle size={14} />
                Message sent to driver
              </>
            ) : (
              <>
                {isDriver ? 'Accept Route' : 'Approve Change'}
                <ArrowRight size={14} />
              </>
            )}
          </button>
          <button
            onClick={onDismiss}
            className="py-2.5 px-4 rounded-lg bg-white/5 text-slate-400 border border-white/10 text-sm hover:bg-white/10 transition-all"
          >
            Dismiss
          </button>
        </div>

        {/* Timestamp */}
        <p className="text-xs text-slate-600 mt-3">
          {new Date(alert.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })} • AI Analysis
        </p>
      </motion.div>
    </AnimatePresence>
  );
}
