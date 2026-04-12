import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

export default function HeroSection() {
  const navigate = useNavigate();
  return (
    <section className="relative h-screen w-full overflow-hidden flex items-center justify-center bg-black">
      {/* Background Video */}
      <div className="absolute inset-0 z-0">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-cover opacity-60"
        >
          <source src="/hero-video.mp4" type="video/mp4" />
        </video>
        {/* Gradient Overlay for better readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/40 to-[#111827]"></div>
      </div>

      {/* Hero Content */}
      <div className="relative z-10 container mx-auto px-6 lg:px-12 h-screen flex flex-col justify-center pointer-events-none">
        <div className="flex flex-col items-start text-left max-w-3xl pointer-events-auto">
          {/* Main Heading */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="text-5xl md:text-7xl lg:text-[84px] font-space font-bold leading-[1.05] mb-6 tracking-tight"
          >
            <div className="text-white">AI-Powered</div>
            <div className="text-transparent bg-clip-text bg-gradient-to-r from-[#88f0ff] to-[#4fcdfc] drop-shadow-[0_0_10px_rgba(136,240,255,0.4)]">
              Supply Chain
            </div>
            <div className="text-white flex items-center">
              Intelligence
              <svg 
                className="w-12 h-12 md:w-16 md:h-16 lg:w-20 lg:h-20 ml-2 text-[#4fcdfc] drop-shadow-[0_0_12px_rgba(79,205,252,0.6)] animate-[pulse_3s_ease-in-out_infinite]" 
                viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
              >
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
            </div>
          </motion.h1>

          {/* Subheading */}
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
            className="text-lg md:text-2xl font-outfit text-gray-300 max-w-[500px] mb-10 leading-relaxed"
          >
            Real-time tracking, optimization, and<br className="hidden sm:block" />
            insights across every delivery.
          </motion.p>

          {/* CTA Button */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
          >
            <button 
              onClick={() => navigate('/register')}
              className="px-8 py-3 rounded-full font-outfit font-semibold text-[#00f0ff] text-base border border-[#00f0ff]/60 bg-[#00f0ff]/10 shadow-[0_0_20px_rgba(0,240,255,0.35),0_0_40px_rgba(0,240,255,0.15),inset_0_0_15px_rgba(0,240,255,0.1)] hover:shadow-[0_0_30px_rgba(0,240,255,0.5),0_0_60px_rgba(0,240,255,0.25),inset_0_0_20px_rgba(0,240,255,0.15)] hover:bg-[#00f0ff]/20 hover:border-[#00f0ff] transition-all duration-300 hover:scale-105 active:scale-95 animate-[glow-pulse_2.5s_ease-in-out_infinite]"
            >
              Register Now
            </button>
          </motion.div>
        </div>
      </div>

    </section>
  );
}
