import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { Code2, Brain, Server, Layers, ExternalLink } from 'lucide-react';

// Team member images
import arkaImg from '../assets/images/team/Arka.jpg';
import sudiptaImg from '../assets/images/team/Sudipta.jpg';
import soumiImg from '../assets/images/team/Soumi.jpg';
import aritraImg from '../assets/images/team/Aritra.jpg';

const teamMembers = [
  {
    name: 'Soumi Das',
    role: 'Backend & AI Engineer',
    tagline: 'Designs core architecture and integrates AI intelligence for predictive alerting.',
    image: soumiImg,
    icon: Server,
    accent: '#34d399',
    accentRgb: '52, 211, 153',
  },
  {
    name: 'Sudipta Maity',
    role: 'Full Stack Developer',
    tagline: 'Builds seamless experiences and connects them to powerful backend services.',
    image: sudiptaImg,
    icon: Code2,
    accent: '#a855f7',
    accentRgb: '168, 85, 247',
  },
  {
    name: 'Arka Roy',
    role: 'Full Stack Developer',
    tagline: 'Architects the end-to-end platform — from pixel-perfect UI to robust backend systems.',
    image: arkaImg,
    icon: Layers,
    accent: '#00f0ff',
    accentRgb: '0, 240, 255',
  },
  {
    name: 'Aritra Dhuan',
    role: 'AI Engineer',
    tagline: 'Develops ML models and graph algorithms powering real-time disruption rerouting.',
    image: aritraImg,
    icon: Brain,
    accent: '#fb923c',
    accentRgb: '251, 146, 60',
  },
];

/* ───── Floating particles background ───── */
function ParticleField() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animId;
    let particles = [];

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight * 3;
    };
    resize();
    window.addEventListener('resize', resize);

    for (let i = 0; i < 60; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: Math.random() * 1.2 + 0.3,
        dx: (Math.random() - 0.5) * 0.3,
        dy: (Math.random() - 0.5) * 0.15,
        opacity: Math.random() * 0.3 + 0.05,
      });
    }

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0, 240, 255, ${p.opacity})`;
        ctx.fill();
        p.x += p.dx;
        p.y += p.dy;
        if (p.x < 0 || p.x > canvas.width) p.dx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.dy *= -1;
      });
      animId = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      style={{ opacity: 0.6 }}
    />
  );
}

/* ───── Single team card ───── */
function TeamCard({ member, index }) {
  const cardRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setIsVisible(true); },
      { threshold: 0.2 }
    );
    if (cardRef.current) observer.observe(cardRef.current);
    return () => observer.disconnect();
  }, []);

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  const IconComponent = member.icon;
  const initials = member.name.split(' ').map(n => n[0]).join('');

  return (
    <div
      ref={cardRef}
      className="relative group"
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0)' : 'translateY(50px)',
        transition: `all 0.8s cubic-bezier(0.16, 1, 0.3, 1) ${index * 150}ms`,
      }}
    >
      {/* Spotlight follow cursor */}
      <div
        className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none z-0"
        style={{
          background: `radial-gradient(400px circle at ${mousePos.x}px ${mousePos.y}px, rgba(${member.accentRgb}, 0.06), transparent 60%)`,
        }}
      />

      {/* Card */}
      <div
        className="relative z-10 rounded-3xl p-[1px] overflow-hidden transition-all duration-700"
        style={{
          background: isHovered
            ? `linear-gradient(135deg, rgba(${member.accentRgb}, 0.3), transparent 50%, rgba(${member.accentRgb}, 0.1))`
            : 'linear-gradient(135deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))',
        }}
      >
        <div
          className="rounded-3xl p-8 h-full transition-all duration-700"
          style={{
            background: isHovered
              ? 'rgba(10, 15, 30, 0.85)'
              : 'rgba(10, 15, 30, 0.6)',
            backdropFilter: 'blur(40px)',
          }}
        >
          {/* Top row: Icon badge */}
          <div className="flex justify-between items-start mb-8">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-500"
              style={{
                background: `rgba(${member.accentRgb}, ${isHovered ? 0.15 : 0.08})`,
                border: `1px solid rgba(${member.accentRgb}, ${isHovered ? 0.3 : 0.1})`,
              }}
            >
              <IconComponent size={18} style={{ color: member.accent }} />
            </div>
            <div
              className="text-[10px] font-semibold uppercase tracking-[0.2em] px-3 py-1 rounded-full transition-all duration-500"
              style={{
                color: member.accent,
                background: `rgba(${member.accentRgb}, 0.08)`,
                border: `1px solid rgba(${member.accentRgb}, 0.12)`,
                fontFamily: "'SF Pro Text', 'Inter', -apple-system, sans-serif",
              }}
            >
              {member.role.split(' ').pop()}
            </div>
          </div>

          {/* Avatar */}
          <div className="flex justify-center mb-7">
            <div className="relative">
              {/* Glow ring */}
              <div
                className="absolute -inset-1 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-700 blur-md"
                style={{ background: `rgba(${member.accentRgb}, 0.25)` }}
              />

              {member.image ? (
                <div
                  className="relative w-32 h-32 rounded-full overflow-hidden transition-all duration-700"
                  style={{
                    border: `2px solid rgba(${member.accentRgb}, ${isHovered ? 0.5 : 0.15})`,
                    boxShadow: isHovered ? `0 0 40px rgba(${member.accentRgb}, 0.15)` : 'none',
                  }}
                >
                  <img
                    src={member.image}
                    alt={member.name}
                    className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                  />
                  {/* Overlay shimmer */}
                  <div
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700"
                    style={{
                      background: `linear-gradient(135deg, transparent 30%, rgba(${member.accentRgb}, 0.1) 50%, transparent 70%)`,
                    }}
                  />
                </div>
              ) : (
                <div
                  className="relative w-32 h-32 rounded-full flex items-center justify-center transition-all duration-700"
                  style={{
                    border: `2px solid rgba(${member.accentRgb}, ${isHovered ? 0.5 : 0.15})`,
                    background: `radial-gradient(circle at 30% 30%, rgba(${member.accentRgb}, 0.12), rgba(${member.accentRgb}, 0.03))`,
                    boxShadow: isHovered ? `0 0 40px rgba(${member.accentRgb}, 0.15)` : 'none',
                  }}
                >
                  <span
                    className="text-3xl font-light tracking-wider transition-all duration-500"
                    style={{
                      color: `rgba(${member.accentRgb}, ${isHovered ? 0.9 : 0.5})`,
                      fontFamily: "'SF Pro Display', 'Inter', -apple-system, sans-serif",
                    }}
                  >
                    {initials}
                  </span>
                </div>
              )}

              {/* Status dot */}
              <div
                className="absolute bottom-1 right-1 w-4 h-4 rounded-full border-[3px] transition-all duration-500"
                style={{
                  borderColor: 'rgba(10, 15, 30, 1)',
                  background: member.accent,
                  boxShadow: isHovered ? `0 0 10px rgba(${member.accentRgb}, 0.6)` : 'none',
                }}
              />
            </div>
          </div>

          {/* Name & Role */}
          <div className="text-center mb-5">
            <h3
              className="text-xl font-semibold text-white mb-1.5 tracking-[-0.02em] transition-all duration-500"
              style={{
                fontFamily: "'SF Pro Display', 'Inter', -apple-system, sans-serif",
                textShadow: isHovered ? `0 0 30px rgba(${member.accentRgb}, 0.2)` : 'none',
              }}
            >
              {member.name}
            </h3>
            <p
              className="text-[13px] font-medium tracking-[0.05em] uppercase"
              style={{
                color: member.accent,
                fontFamily: "'SF Pro Text', 'Inter', -apple-system, sans-serif",
              }}
            >
              {member.role}
            </p>
          </div>

          {/* Tagline */}
          <p
            className="text-center text-[13px] leading-[1.7] text-white/35 group-hover:text-white/55 transition-colors duration-500"
            style={{ fontFamily: "'SF Pro Text', 'Inter', -apple-system, sans-serif" }}
          >
            {member.tagline}
          </p>

          {/* Bottom decoration line */}
          <div className="mt-7 flex justify-center">
            <div
              className="h-[2px] rounded-full transition-all duration-700"
              style={{
                width: isHovered ? '60px' : '30px',
                background: `linear-gradient(90deg, transparent, rgba(${member.accentRgb}, ${isHovered ? 0.5 : 0.15}), transparent)`,
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ───── Main page ───── */
export default function AboutPage() {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="font-sans min-h-screen bg-brand-dark overflow-x-hidden relative">
      <ParticleField />
      <Navbar />

      {/* ── Hero Section ── */}
      <section className="relative pt-40 pb-24 px-6 overflow-hidden">
        {/* Massive gradient orbs */}
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[600px] pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse at center, rgba(0,240,255,0.04) 0%, transparent 60%)',
            transform: `translate(-50%, ${scrollY * -0.1}px)`,
          }}
        />
        <div
          className="absolute top-32 right-[10%] w-[400px] h-[400px] pointer-events-none"
          style={{
            background: 'radial-gradient(circle, rgba(168,85,247,0.03) 0%, transparent 60%)',
            transform: `translateY(${scrollY * -0.05}px)`,
          }}
        />

        <div className="max-w-5xl mx-auto text-center relative z-10">
          {/* Eyebrow */}
          <div
            className="inline-flex items-center gap-2.5 px-5 py-2 rounded-full mb-10"
            style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.06)',
              backdropFilter: 'blur(10px)',
            }}
          >
            <div className="relative flex items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-[#00f0ff]" />
              <div className="absolute w-2 h-2 rounded-full bg-[#00f0ff] animate-ping" />
            </div>
            <span
              className="text-[11px] font-medium text-white/50 uppercase tracking-[0.2em]"
              style={{ fontFamily: "'SF Pro Text', 'Inter', -apple-system, sans-serif" }}
            >
              Meet the team
            </span>
          </div>

          {/* Main heading */}
          <h1
            className="text-5xl md:text-7xl lg:text-8xl font-bold text-white mb-8 leading-[0.95]"
            style={{
              fontFamily: "'SF Pro Display', 'HeroFont', -apple-system, sans-serif",
              letterSpacing: '-0.04em',
            }}
          >
            <span className="block text-white/90">We build the</span>
            <span
              className="block mt-2"
              style={{
                background: 'linear-gradient(135deg, #00f0ff 0%, #a855f7 40%, #fb923c 70%, #34d399 100%)',
                backgroundSize: '200% 200%',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                animation: 'gradientShift 6s ease-in-out infinite',
              }}
            >
              future of logistics.
            </span>
          </h1>

          {/* Subtitle */}
          <p
            className="text-lg md:text-xl text-white/30 max-w-2xl mx-auto leading-relaxed font-light"
            style={{
              fontFamily: "'SF Pro Text', 'Inter', -apple-system, sans-serif",
              letterSpacing: '-0.01em',
            }}
          >
            Four engineers. One mission. Making supply chains intelligent, resilient, and self-healing.
          </p>

          {/* Scroll indicator */}
          <div className="mt-16 flex flex-col items-center gap-2 opacity-30">
            <div className="w-[1px] h-12 bg-gradient-to-b from-transparent via-white/40 to-transparent" />
          </div>
        </div>
      </section>

      {/* ── Team Grid ── */}
      <section className="relative px-6 pb-32 z-10">
        <div className="max-w-6xl mx-auto">
          {/* Section label */}
          <div className="flex items-center gap-4 mb-14">
            <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent to-white/[0.06]" />
            <span
              className="text-[11px] font-medium text-white/25 uppercase tracking-[0.25em]"
              style={{ fontFamily: "'SF Pro Text', 'Inter', -apple-system, sans-serif" }}
            >
              Core Team
            </span>
            <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent to-white/[0.06]" />
          </div>

          {/* Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {teamMembers.map((member, i) => (
              <TeamCard key={member.name} member={member} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* ── Philosophy Section ── */}
      <section className="relative px-6 pb-32 z-10">
        <div className="max-w-4xl mx-auto">
          <div
            className="relative rounded-3xl p-[1px] overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, rgba(0,240,255,0.12), rgba(168,85,247,0.08), rgba(251,146,60,0.06))',
            }}
          >
            <div
              className="rounded-3xl px-10 py-16 md:px-20 md:py-20 text-center"
              style={{
                background: 'rgba(8, 12, 24, 0.9)',
                backdropFilter: 'blur(60px)',
              }}
            >
              {/* Decorative quotes */}
              <div
                className="text-7xl md:text-8xl font-serif leading-none mb-6 select-none"
                style={{
                  background: 'linear-gradient(180deg, rgba(0,240,255,0.15), transparent)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                "
              </div>

              <blockquote
                className="text-xl md:text-3xl text-white/60 font-light leading-relaxed tracking-[-0.02em] mb-8"
                style={{ fontFamily: "'SF Pro Display', 'Inter', -apple-system, sans-serif" }}
              >
                Logistics should be intelligent by default —
                <br className="hidden md:block" />
                <span className="text-white/80"> not reactive, but predictive.</span>
              </blockquote>

              <div className="flex items-center justify-center gap-3">
                <div className="w-8 h-[1px] bg-gradient-to-r from-transparent to-white/20" />
                <span
                  className="text-[12px] text-white/25 uppercase tracking-[0.2em] font-medium"
                  style={{ fontFamily: "'SF Pro Text', 'Inter', -apple-system, sans-serif" }}
                >
                  Team SupplyLens
                </span>
                <div className="w-8 h-[1px] bg-gradient-to-l from-transparent to-white/20" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Tech Stack Strip ── */}
      <section className="relative px-6 pb-32 z-10">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-4 mb-10">
            <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent to-white/[0.06]" />
            <span
              className="text-[11px] font-medium text-white/25 uppercase tracking-[0.25em]"
              style={{ fontFamily: "'SF Pro Text', 'Inter', -apple-system, sans-serif" }}
            >
              Built With
            </span>
            <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent to-white/[0.06]" />
          </div>

          <div className="flex flex-wrap justify-center gap-3">
            {['React', 'Spring Boot', 'PostgreSQL', 'Python', 'NetworkX', 'Gemini AI', 'WebSocket', 'Leaflet', 'TailwindCSS'].map((tech, i) => (
              <div
                key={tech}
                className="px-5 py-2.5 rounded-full text-[12px] font-medium text-white/40 hover:text-white/70 transition-all duration-500 cursor-default hover:scale-105"
                style={{
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.05)',
                  fontFamily: "'SF Pro Text', 'Inter', -apple-system, sans-serif",
                  transitionDelay: `${i * 30}ms`,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(0,240,255,0.06)';
                  e.currentTarget.style.borderColor = 'rgba(0,240,255,0.15)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.02)';
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)';
                }}
              >
                {tech}
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />

      {/* Gradient shift animation */}
      <style>{`
        @keyframes gradientShift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
      `}</style>
    </div>
  );
}
