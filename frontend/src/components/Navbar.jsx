import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, X, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const navLinks = [
  {
    name: 'Platform',
    items: [
      { label: 'AI Routing', path: '/coming-soon', desc: 'Intelligent path optimization' },
      { label: 'Fleet Tracking', path: '/coming-soon', desc: 'Real-time vehicle monitoring' },
      { label: 'Proactive Alerts', path: '/coming-soon', desc: 'AI-driven disruption detection' },
      { label: 'Driver App', path: '/coming-soon', desc: 'Mobile-first driver experience' },
    ],
  },
  {
    name: 'Solutions',
    items: [
      { label: 'Enterprise Logistics', path: '/coming-soon', desc: 'End-to-end supply chain' },
      { label: 'Last-Mile Delivery', path: '/coming-soon', desc: 'Optimized final delivery' },
      { label: 'Cold Chain', path: '/coming-soon', desc: 'Temperature-sensitive routing' },
    ],
  },
  {
    name: 'Resources',
    items: [
      { label: 'Documentation', path: '/coming-soon', desc: 'API references & guides' },
      { label: 'Changelog', path: '/coming-soon', desc: 'Latest updates & features' },
    ],
  },
  {
    name: 'Company',
    items: [
      { label: 'About Us', path: '/about', desc: 'Meet the team behind SupplyLens' },
      { label: 'Contact', path: '/contact', desc: 'Get in touch with us' },
    ],
  },
];

/* ───── Cool Floating Dropdown Panel ───── */
function DropdownPanel({ items, onClose }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15, scale: 0.95, filter: 'blur(10px)' }}
      animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
      exit={{ opacity: 0, y: 10, scale: 0.95, filter: 'blur(10px)' }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      className="absolute top-full left-1/2 -translate-x-1/2 pt-4"
      style={{ minWidth: '280px' }}
    >
      {/* Invisible bridge to prevent hover loss */}
      <div className="absolute top-0 left-0 w-full h-4 bg-transparent" />

      <div
        className="relative rounded-2xl overflow-hidden p-2"
        style={{
          background: 'rgba(10, 15, 30, 0.85)',
          backdropFilter: 'saturate(200%) blur(40px)',
          WebkitBackdropFilter: 'saturate(200%) blur(40px)',
          border: '1px solid rgba(0, 240, 255, 0.15)',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255,255,255,0.03), inset 0 0 20px rgba(0,240,255,0.05)',
        }}
      >
        {/* Glow behind items */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-32 bg-[#00f0ff] opacity-[0.03] blur-2xl pointer-events-none" />

        {items.map((item, i) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Link
              to={item.path}
              onClick={onClose}
              className="flex items-center justify-between px-4 py-3.5 rounded-xl transition-all duration-300 group relative overflow-hidden"
            >
              {/* Hover background gradient */}
              <div 
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                style={{
                  background: 'linear-gradient(90deg, rgba(0,240,255,0.1) 0%, transparent 100%)',
                }}
              />
              
              <div className="flex flex-col gap-0.5 relative z-10">
                <span
                  className="text-[14px] font-semibold text-white/80 group-hover:text-[#00f0ff] transition-colors duration-300"
                  style={{ fontFamily: "'SF Pro Display', 'Inter', -apple-system, sans-serif" }}
                >
                  {item.label}
                </span>
                <span
                  className="text-[11px] text-white/40 group-hover:text-white/60 transition-colors duration-300"
                  style={{ fontFamily: "'SF Pro Text', 'Inter', -apple-system, sans-serif" }}
                >
                  {item.desc}
                </span>
              </div>

              <ArrowRight 
                size={16} 
                strokeWidth={2}
                className="text-[#00f0ff] opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 relative z-10" 
              />
            </Link>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

export default function Navbar() {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [expandedMobile, setExpandedMobile] = useState(null);
  const navRef = useRef(null);
  const timeoutRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (navRef.current && !navRef.current.contains(e.target)) {
        setActiveDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNavEnter = (index) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setActiveDropdown(index);
  };

  const handleNavLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setActiveDropdown(null);
    }, 200); // Slight delay so mouse can cross the gap
  };

  const handleDropdownEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  };

  const handleDropdownLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setActiveDropdown(null);
    }, 200);
  };

  return (
    <>
      <nav
        ref={navRef}
        className="fixed top-0 left-0 w-full z-[100] transition-all duration-500 ease-out py-5"
        style={{
          background: 'transparent',
          backdropFilter: isScrolled ? 'saturate(200%) blur(24px)' : 'none',
          WebkitBackdropFilter: isScrolled ? 'saturate(200%) blur(24px)' : 'none',
        }}
      >
        <div className="w-full px-6 md:px-12 flex items-center justify-between h-[44px]">

          {/* Logo */}
          <Link
            to="/"
            className="group flex items-center gap-0 shrink-0"
            style={{ fontFamily: "'SF Pro Display', 'Inter', -apple-system, sans-serif" }}
          >
            <span
              className="text-[22px] font-bold tracking-[-0.02em] text-white transition-all duration-500"
            >
              Supply
            </span>
            <span
              className="text-[22px] font-bold tracking-[-0.02em] transition-all duration-500 relative"
              style={{
                background: 'linear-gradient(135deg, #00f0ff 0%, #0ea5e9 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Lens
              {/* Subtle logo glow */}
              <div className="absolute inset-0 bg-[#00f0ff] opacity-20 blur-xl rounded-full group-hover:opacity-40 transition-opacity duration-500" />
            </span>
          </Link>

          {/* Center Nav Links with Floating Dropdowns */}
          <div className="hidden md:flex items-center gap-6 absolute left-1/2 -translate-x-1/2">
            {navLinks.map((link, index) => (
              <div
                key={link.name}
                className="relative"
                onMouseEnter={() => handleNavEnter(index)}
                onMouseLeave={handleNavLeave}
              >
                <button
                  className="relative py-2 text-[13px] font-medium tracking-[0.02em] transition-all duration-300 flex items-center gap-1.5 cursor-pointer bg-transparent border-none outline-none"
                  style={{
                    fontFamily: "'SF Pro Text', 'Inter', -apple-system, sans-serif",
                    color: activeDropdown === index ? '#fff' : 'rgba(255,255,255,0.6)',
                  }}
                >
                  {link.name}
                </button>

                <AnimatePresence>
                  {activeDropdown === index && (
                    <div
                      className="absolute z-[110]"
                      onMouseEnter={handleDropdownEnter}
                      onMouseLeave={handleDropdownLeave}
                    >
                      <DropdownPanel
                        items={link.items}
                        onClose={() => setActiveDropdown(null)}
                      />
                    </div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>

          {/* Login Button */}
          <div className="hidden md:flex items-center">
            <button
              onClick={() => navigate('/login')}
              className="relative px-6 py-2 text-[13px] font-semibold tracking-[0.02em] rounded-full transition-all duration-300 cursor-pointer overflow-hidden group"
              style={{
                fontFamily: "'SF Pro Text', 'Inter', -apple-system, sans-serif",
                color: '#fff',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(0,240,255,0.15)';
                e.currentTarget.style.borderColor = 'rgba(0,240,255,0.4)';
                e.currentTarget.style.color = '#00f0ff';
                e.currentTarget.style.boxShadow = '0 0 20px rgba(0,240,255,0.2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
                e.currentTarget.style.color = '#fff';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              Log In
              <div className="absolute inset-0 rounded-full border border-[#00f0ff] opacity-0 group-hover:opacity-100 group-hover:scale-105 transition-all duration-300 pointer-events-none" />
            </button>
          </div>

          {/* Mobile Toggle */}
          <button
            onClick={() => setIsMenuOpen(true)}
            className="md:hidden p-2 text-white/80 hover:text-white hover:bg-white/5 rounded-full transition-colors duration-300"
          >
            <Menu size={24} strokeWidth={1.5} />
          </button>
        </div>
      </nav>

      {/* ── Mobile Drawer ── */}
      <AnimatePresence>
        {isMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              onClick={() => setIsMenuOpen(false)}
              className="fixed inset-0 z-[110]"
              style={{
                background: 'rgba(0,0,0,0.6)',
                backdropFilter: 'saturate(180%) blur(20px)',
                WebkitBackdropFilter: 'saturate(180%) blur(20px)',
              }}
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 260 }}
              className="fixed top-0 right-0 h-full w-full max-w-sm z-[120] p-8 flex flex-col overflow-y-auto shadow-2xl"
              style={{
                background: 'rgba(15, 20, 35, 0.95)',
                backdropFilter: 'blur(40px)',
                WebkitBackdropFilter: 'blur(40px)',
                borderLeft: '1px solid rgba(0,240,255,0.1)',
              }}
            >
              <div className="flex justify-between items-center mb-10">
                <span
                  className="text-2xl font-bold tracking-[-0.02em] text-white"
                  style={{ fontFamily: "'SF Pro Display', 'Inter', -apple-system, sans-serif" }}
                >
                  Supply<span style={{
                    background: 'linear-gradient(135deg, #00f0ff, #0ea5e9)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}>Lens</span>
                </span>
                <button
                  onClick={() => setIsMenuOpen(false)}
                  className="p-2 text-white/50 hover:text-white hover:bg-white/10 rounded-full transition-all duration-300"
                >
                  <X size={24} strokeWidth={2} />
                </button>
              </div>

              {/* Mobile accordion nav */}
              <div className="flex flex-col gap-2">
                {navLinks.map((link, i) => (
                  <motion.div
                    key={link.name}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.08, ease: 'easeOut' }}
                    className="rounded-2xl overflow-hidden transition-all duration-300"
                    style={{
                      background: expandedMobile === i ? 'rgba(0,240,255,0.03)' : 'transparent',
                      border: expandedMobile === i ? '1px solid rgba(0,240,255,0.1)' : '1px solid transparent',
                    }}
                  >
                    {/* Section header */}
                    <button
                      onClick={() => setExpandedMobile(expandedMobile === i ? null : i)}
                      className="w-full flex items-center justify-between px-4 py-4 text-left bg-transparent border-none outline-none cursor-pointer"
                    >
                      <span
                        className="text-[20px] font-semibold transition-colors duration-300"
                        style={{
                          fontFamily: "'SF Pro Display', 'Inter', -apple-system, sans-serif",
                          color: expandedMobile === i ? '#fff' : 'rgba(255,255,255,0.7)',
                        }}
                      >
                        {link.name}
                      </span>
                      <ChevronDown
                        size={20}
                        strokeWidth={2}
                        className="transition-all duration-300"
                        style={{
                          transform: expandedMobile === i ? 'rotate(180deg)' : 'rotate(0)',
                          color: expandedMobile === i ? '#00f0ff' : 'rgba(255,255,255,0.3)',
                        }}
                      />
                    </button>

                    {/* Sub-items */}
                    <AnimatePresence>
                      {expandedMobile === i && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3, ease: 'easeInOut' }}
                          className="overflow-hidden"
                        >
                          <div className="px-3 pb-4 pt-1 flex flex-col gap-1.5">
                            {link.items.map((item) => (
                              <Link
                                key={item.label}
                                to={item.path}
                                onClick={() => { setIsMenuOpen(false); setExpandedMobile(null); }}
                                className="flex items-center justify-between py-3 px-4 rounded-xl transition-all duration-300 group"
                                style={{ background: 'rgba(255,255,255,0.03)' }}
                                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(0,240,255,0.08)'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}
                              >
                                <div className="flex flex-col">
                                  <span
                                    className="text-[15px] font-medium text-white/90 group-hover:text-[#00f0ff] transition-colors duration-200"
                                    style={{ fontFamily: "'SF Pro Text', 'Inter', -apple-system, sans-serif" }}
                                  >
                                    {item.label}
                                  </span>
                                  <span
                                    className="text-[12px] text-white/40 group-hover:text-white/60 transition-colors duration-200"
                                    style={{ fontFamily: "'SF Pro Text', 'Inter', -apple-system, sans-serif" }}
                                  >
                                    {item.desc}
                                  </span>
                                </div>
                                <ArrowRight
                                  size={16}
                                  strokeWidth={2}
                                  className="text-[#00f0ff] opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300"
                                />
                              </Link>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                ))}
              </div>

              <div className="mt-auto pt-8">
                <motion.button
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4, ease: 'easeOut' }}
                  onClick={() => { setIsMenuOpen(false); navigate('/login'); }}
                  className="w-full py-4 rounded-xl text-[16px] font-bold tracking-[0.02em] transition-all duration-300 cursor-pointer shadow-[0_0_30px_rgba(0,240,255,0.15)] hover:shadow-[0_0_40px_rgba(0,240,255,0.3)]"
                  style={{
                    fontFamily: "'SF Pro Text', 'Inter', -apple-system, sans-serif",
                    background: 'linear-gradient(135deg, rgba(0,240,255,0.2), rgba(14,165,233,0.2))',
                    border: '1px solid rgba(0,240,255,0.4)',
                    color: '#00f0ff',
                  }}
                >
                  Log In
                </motion.button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
