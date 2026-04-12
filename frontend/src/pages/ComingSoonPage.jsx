import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Construction, ArrowLeft } from 'lucide-react';

export default function ComingSoonPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-brand-dark flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-neon-blue/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-neon-purple/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Content */}
      <div className="relative z-10 w-full max-w-md p-8 rounded-2xl bg-slate-900/50 border border-white/10 backdrop-blur-xl shadow-2xl flex flex-col items-center text-center">
        <div className="w-16 h-16 rounded-2xl bg-neon-blue/15 border border-neon-blue/30 flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(0,240,255,0.2)]">
          <Construction size={32} className="text-neon-blue" />
        </div>
        
        <h1 className="text-2xl font-bold text-white mb-3">Under Construction</h1>
        <p className="text-slate-400 text-sm mb-8 leading-relaxed">
          This section of the SupplyLens platform is currently being forged by our developers. Check back soon!
        </p>

        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 px-6 py-3 rounded-lg text-white font-medium bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all duration-300"
        >
          <ArrowLeft size={18} />
          Back to Home
        </button>
      </div>
    </div>
  );
}
