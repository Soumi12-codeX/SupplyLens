import React from 'react';
import HeroSection from '../components/HeroSection';
import FeaturesSection from '../components/FeaturesSection';
import Footer from '../components/Footer';
import Preloader from '../components/Preloader';
import { useNavigate, Link } from 'react-router-dom';

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="font-sans min-h-screen bg-brand-dark">
      <Preloader />

      {/* Navigation */}
      <nav className="absolute top-0 left-0 w-full z-40 px-8 py-6 flex justify-end items-center">
        <div className="hidden md:flex gap-8 text-sm font-medium text-slate-300">
          <Link to="/coming-soon" className="hover:text-white transition-colors">Platform</Link>
          <Link to="/coming-soon" className="hover:text-white transition-colors">Solutions</Link>
          <Link to="/coming-soon" className="hover:text-white transition-colors">Resources</Link>
          <Link to="/coming-soon" className="hover:text-white transition-colors">Company</Link>
        </div>
        <div className="hidden md:block ml-8">
          <button
            onClick={() => navigate('/login')}
            className="text-sm font-medium text-white px-5 py-2.5 rounded-lg border border-neon-blue/40 hover:bg-neon-blue/10 hover:border-neon-blue/70 transition-all duration-300 shadow-[0_0_15px_rgba(0,240,255,0.1)] hover:shadow-[0_0_20px_rgba(0,240,255,0.25)]"
          >
            Log In
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main>
        <HeroSection />
        <FeaturesSection />
      </main>
      <Footer />
    </div>
  );
}
