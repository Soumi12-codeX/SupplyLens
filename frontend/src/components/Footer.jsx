import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative bg-[#02050A] pt-32 overflow-hidden border-t border-white/5">
      
      {/* Background Ambience */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-[1px] bg-gradient-to-r from-transparent via-[#00f0ff]/50 to-transparent"></div>
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-[#00f0ff]/5 rounded-full blur-[150px] pointer-events-none"></div>

      <div className="container mx-auto px-6 lg:px-12 relative z-10">
        
        {/* Massive CTA Section */}
        <div className="flex flex-col items-center text-center mb-32">
          <h2 className="text-4xl md:text-6xl lg:text-7xl font-space font-bold text-white mb-8 tracking-tight max-w-4xl">
            Ready to optimize your <span className="text-transparent bg-clip-text bg-gradient-to-r from-neon-blue to-neon-purple">supply chain?</span>
          </h2>
          <p className="text-lg md:text-xl text-slate-400 font-outfit max-w-2xl mb-12">
            Join industry leaders who are reducing delivery times and cutting operational costs with next-generation AI routing and field logistics.
          </p>
          
          <Link to="/register" className="group relative inline-flex items-center justify-center px-10 py-5 font-space font-bold text-white transition-all duration-300 bg-white/5 border border-white/10 rounded-full hover:bg-white/10 hover:shadow-[0_0_60px_rgba(0,240,255,0.2)] hover:border-neon-blue/50 overflow-hidden">
            <span className="relative z-10 flex items-center gap-3 text-lg tracking-wide uppercase">
              Start Building Now
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </span>
            <div className="absolute inset-0 block w-full h-full bg-gradient-to-r from-neon-blue/20 to-neon-purple/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          </Link>
        </div>

        {/* Links Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-12 mb-16 border-t border-white/5 pt-16">
          
          {/* Column 1 */}
          <div className="flex flex-col gap-4">
            <h4 className="text-white font-space font-semibold tracking-wider uppercase text-sm mb-4">Platform</h4>
            <Link to="/" className="text-slate-400 font-outfit hover:text-neon-blue transition-colors text-base">AI Routing</Link>
            <Link to="/" className="text-slate-400 font-outfit hover:text-neon-blue transition-colors text-base">Fleet Tracking</Link>
            <Link to="/" className="text-slate-400 font-outfit hover:text-neon-blue transition-colors text-base">Proactive Alerts</Link>
            <Link to="/" className="text-slate-400 font-outfit hover:text-neon-blue transition-colors text-base">Driver App</Link>
          </div>

          {/* Column 2 */}
          <div className="flex flex-col gap-4">
            <h4 className="text-white font-space font-semibold tracking-wider uppercase text-sm mb-4">Solutions</h4>
            <Link to="/" className="text-slate-400 font-outfit hover:text-neon-purple transition-colors text-base">Enterprise Logistics</Link>
            <Link to="/" className="text-slate-400 font-outfit hover:text-neon-purple transition-colors text-base">Last-Mile Delivery</Link>
            <Link to="/" className="text-slate-400 font-outfit hover:text-neon-purple transition-colors text-base">Cold Chain</Link>
          </div>

          {/* Column 3 */}
          <div className="flex flex-col gap-4">
            <h4 className="text-white font-space font-semibold tracking-wider uppercase text-sm mb-4">Company</h4>
            <Link to="/" className="text-slate-400 font-outfit hover:text-white transition-colors text-base">About Us</Link>
            <Link to="/" className="text-slate-400 font-outfit hover:text-white transition-colors text-base">Careers</Link>
            <Link to="/" className="text-slate-400 font-outfit hover:text-white transition-colors text-base">Contact</Link>
          </div>

          {/* Column 4: Socials */}
          <div className="flex flex-col gap-4">
            <h4 className="text-white font-space font-semibold tracking-wider uppercase text-sm mb-4">Connect</h4>
            <div className="flex gap-4">
              <a href="#" className="p-3 rounded-full bg-white/5 border border-white/10 text-slate-400 hover:text-[#00f0ff] hover:border-[#00f0ff] hover:bg-[#00f0ff]/10 transition-all shadow-sm">
                <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/></svg>
              </a>
              <a href="#" className="p-3 rounded-full bg-white/5 border border-white/10 text-slate-400 hover:text-[#00f0ff] hover:border-[#00f0ff] hover:bg-[#00f0ff]/10 transition-all shadow-sm">
                <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>
              </a>
              <a href="#" className="p-3 rounded-full bg-white/5 border border-white/10 text-slate-400 hover:text-[#00f0ff] hover:border-[#00f0ff] hover:bg-[#00f0ff]/10 transition-all shadow-sm">
                <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
              </a>
            </div>
          </div>


        </div>
      </div>

      {/* Massive Watermark */}
      <div className="w-full relative overflow-hidden flex flex-col items-center select-none pt-4 pb-2">
        {/* Subtle glow underneath text */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full h-full bg-gradient-to-t from-neon-blue/10 to-transparent pointer-events-none"></div>
        
        {/* Watermark text */}
        <h1 className="text-[14vw] font-space font-bold text-white/[0.03] leading-none tracking-tighter whitespace-nowrap m-0 -mb-[2vw]">
          SUPPLYLENS
        </h1>
        
        {/* Copyright */}
        <div className="absolute left-1/2 -translate-x-1/2 bottom-[3vw] w-full text-center px-6">
          <p className="text-xs text-slate-600 font-outfit tracking-widest uppercase font-semibold">
            &copy; {currentYear} SupplyLens Logistics AI. All rights reserved.
          </p>
        </div>
      </div>

    </footer>
  );
}
