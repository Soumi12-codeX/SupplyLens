import React from 'react';
import Navbar from '../components/Navbar';
import HeroSection from '../components/HeroSection';
import FeaturesSection from '../components/FeaturesSection';
import Footer from '../components/Footer';
import Preloader from '../components/Preloader';

export default function LandingPage() {
  return (
    <div className="font-sans min-h-screen bg-brand-dark overflow-x-hidden">
      <Preloader />
      <Navbar />

      {/* Main Content */}

      <main>
        <HeroSection />
        <FeaturesSection />
      </main>
      <Footer />
    </div>
  );
}
