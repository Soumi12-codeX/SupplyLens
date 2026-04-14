import React, { useState } from 'react';
import HeroSection from '../components/HeroSection';
import FeaturesSection from '../components/FeaturesSection';
import Footer from '../components/Footer';
import Preloader from '../components/Preloader';
import { useNavigate, Link } from 'react-router-dom';
import { Menu, X, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function LandingPage() {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navLinks = [
    { name: 'Platform', path: '/coming-soon' },
    { name: 'Solutions', path: '/coming-soon' },
    { name: 'Resources', path: '/coming-soon' },
    { name: 'Company', path: '/coming-soon' },
  ];

  return (
    <div className="font-sans min-h-screen bg-brand-dark overflow-x-hidden">
      <Preloader />

      {/* Navigation */}
      <nav className="absolute top-0 left-0 w-full z-50 px-6 md:px-12 py-6 flex justify-between items-center bg-gradient-to-b from-black/20 to-transparent">
        {/* Logo - Placeholder for branded look */}
        <Link to="/" className="text-xl font-hero font-bold text-white tracking-widest flex items-center gap-2">
          <span className="text-neon-blue">SUPPLY</span>LENS
        </Link>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center">
          <div className="flex gap-8 text-sm font-medium text-slate-300 mr-12">
            {navLinks.map(link => (
              <Link key={link.name} to={link.path} className="hover:text-white transition-colors duration-300">
                {link.name}
              </Link>
            ))}
          </div>
          <button
            onClick={() => navigate('/login')}
            className="text-sm font-medium text-white px-6 py-2.5 rounded-lg border border-neon-blue/40 hover:bg-neon-blue/10 hover:border-neon-blue/70 transition-all duration-300 shadow-[0_0_15px_rgba(0,240,255,0.1)] hover:shadow-[0_0_20px_rgba(0,240,255,0.25)]"
          >
            Log In
          </button>
        </div>

        {/* Mobile Toggle */}
        <button 
          onClick={() => setIsMenuOpen(true)}
          className="md:hidden p-2 text-white hover:text-neon-blue transition-colors"
        >
          <Menu size={28} />
        </button>
      </nav>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {isMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMenuOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-md z-[60]"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 h-full w-[80%] max-w-sm bg-slate-900/90 border-l border-white/10 shadow-2xl z-[70] p-8 flex flex-col"
            >
              <div className="flex justify-between items-center mb-12">
                <span className="text-lg font-hero font-bold text-white">
                  <span className="text-neon-blue">SUP</span>LENS
                </span>
                <button onClick={() => setIsMenuOpen(false)} className="text-slate-400 hover:text-white">
                  <X size={28} />
                </button>
              </div>

              <div className="flex flex-col gap-6 mb-12">
                {navLinks.map((link, i) => (
                  <motion.div
                    key={link.name}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                  >
                    <Link 
                      to={link.path} 
                      onClick={() => setIsMenuOpen(false)}
                      className="text-2xl font-semibold text-slate-300 hover:text-white transition-colors flex items-center justify-between"
                    >
                      {link.name}
                      <ArrowRight size={20} className="text-neon-blue/50" />
                    </Link>
                  </motion.div>
                ))}
              </div>

              <div className="mt-auto">
                <button
                  onClick={() => { setIsMenuOpen(false); navigate('/login'); }}
                  className="w-full py-4 rounded-xl bg-neon-blue/10 border border-neon-blue/40 text-neon-blue font-bold flex items-center justify-center gap-2"
                >
                  Log In to Platform
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main>
        <HeroSection />
        <FeaturesSection />
      </main>
      <Footer />
    </div>
  );
}
