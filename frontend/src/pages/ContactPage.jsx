import React, { useEffect, useRef, useState } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { Mail, MapPin, ExternalLink } from 'lucide-react';

const teamGithub = [
  {
    name: 'Soumi Das',
    role: 'Backend & AI Engineer',
    github: 'https://github.com/Soumi12-codeX',
    username: 'Soumi12-codeX',
    accent: '#34d399',
    accentRgb: '52, 211, 153',
  },
  {
    name: 'Sudipta Maity',
    role: 'Full Stack Developer',
    github: 'https://github.com/Sudiptaa03',
    username: 'Sudiptaa03',
    accent: '#a855f7',
    accentRgb: '168, 85, 247',
  },
  {
    name: 'Arka Roy',
    role: 'Full Stack Developer',
    github: 'https://github.com/Arka-ui001',
    username: 'Arka-ui001',
    accent: '#00f0ff',
    accentRgb: '0, 240, 255',
  },
  {
    name: 'Aritra Dhuan',
    role: 'AI Engineer',
    github: 'https://github.com/aritra-dhuan',
    username: 'aritra-dhuan',
    accent: '#fb923c',
    accentRgb: '251, 146, 60',
  },
];

function GithubIcon({ size = 20 }) {
  return (
    <svg width={size} height={size} fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
    </svg>
  );
}

function ContactCard({ member, index }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true); }, { threshold: 0.2 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  return (
    <a
      ref={ref}
      href={member.github}
      target="_blank"
      rel="noopener noreferrer"
      className="block group"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(30px)',
        transition: `all 0.7s cubic-bezier(0.16, 1, 0.3, 1) ${index * 100}ms`,
      }}
    >
      <div
        className="rounded-2xl p-[1px] transition-all duration-500"
        style={{
          background: hovered
            ? `linear-gradient(135deg, rgba(${member.accentRgb}, 0.35), transparent 60%)`
            : 'linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))',
        }}
      >
        <div
          className="rounded-2xl px-6 py-5 flex items-center justify-between transition-all duration-500"
          style={{
            background: hovered ? 'rgba(10, 15, 30, 0.85)' : 'rgba(10, 15, 30, 0.5)',
            backdropFilter: 'blur(30px)',
          }}
        >
          <div className="flex items-center gap-4">
            {/* GitHub avatar */}
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center transition-all duration-500"
              style={{
                background: `rgba(${member.accentRgb}, ${hovered ? 0.15 : 0.07})`,
                border: `1px solid rgba(${member.accentRgb}, ${hovered ? 0.3 : 0.1})`,
              }}
            >
              <GithubIcon size={20} />
            </div>

            <div>
              <h3
                className="text-[15px] font-semibold text-white/90 mb-0.5"
                style={{ fontFamily: "'SF Pro Display', 'Inter', -apple-system, sans-serif" }}
              >
                {member.name}
              </h3>
              <div className="flex items-center gap-2">
                <span
                  className="text-[12px] font-medium"
                  style={{
                    color: member.accent,
                    fontFamily: "'SF Pro Text', 'Inter', -apple-system, sans-serif",
                  }}
                >
                  @{member.username}
                </span>
                <span className="text-white/15">·</span>
                <span
                  className="text-[11px] text-white/35"
                  style={{ fontFamily: "'SF Pro Text', 'Inter', -apple-system, sans-serif" }}
                >
                  {member.role}
                </span>
              </div>
            </div>
          </div>

          <ExternalLink
            size={16}
            strokeWidth={1.5}
            className="transition-all duration-300"
            style={{
              color: hovered ? member.accent : 'rgba(255,255,255,0.2)',
              transform: hovered ? 'translate(2px, -2px)' : 'translate(0, 0)',
            }}
          />
        </div>
      </div>
    </a>
  );
}

export default function ContactPage() {
  return (
    <div className="font-sans min-h-screen bg-brand-dark overflow-x-hidden">
      <Navbar />

      {/* Hero */}
      <section className="relative pt-40 pb-16 px-6 overflow-hidden">
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-[#00f0ff]/[0.03] rounded-full blur-[120px] pointer-events-none" />

        <div className="max-w-3xl mx-auto text-center relative z-10">
          <div
            className="inline-flex items-center gap-2.5 px-5 py-2 rounded-full mb-10"
            style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.06)',
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
              Contact
            </span>
          </div>

          <h1
            className="text-4xl md:text-6xl font-bold text-white mb-6 tracking-tight"
            style={{
              fontFamily: "'SF Pro Display', 'HeroFont', -apple-system, sans-serif",
              letterSpacing: '-0.04em',
              lineHeight: 1.08,
            }}
          >
            Get in touch
          </h1>
          <p
            className="text-base md:text-lg text-white/35 max-w-xl mx-auto leading-relaxed"
            style={{ fontFamily: "'SF Pro Text', 'Inter', -apple-system, sans-serif" }}
          >
            Find us on GitHub. Every line of SupplyLens is open to collaboration.
          </p>
        </div>
      </section>

      {/* GitHub Links */}
      <section className="px-6 pb-20">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-4 mb-10">
            <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent to-white/[0.06]" />
            <span
              className="text-[11px] font-medium text-white/25 uppercase tracking-[0.25em]"
              style={{ fontFamily: "'SF Pro Text', 'Inter', -apple-system, sans-serif" }}
            >
              Team on GitHub
            </span>
            <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent to-white/[0.06]" />
          </div>

          <div className="flex flex-col gap-3">
            {teamGithub.map((member, i) => (
              <ContactCard key={member.username} member={member} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* Project repo */}
      <section className="px-6 pb-32">
        <div className="max-w-2xl mx-auto">
          <a
            href="https://github.com/Soumi12-codeX/SupplyLens"
            target="_blank"
            rel="noopener noreferrer"
            className="block group"
          >
            <div
              className="rounded-2xl p-[1px] transition-all duration-500"
              style={{
                background: 'linear-gradient(135deg, rgba(0,240,255,0.15), rgba(168,85,247,0.1), rgba(251,146,60,0.08))',
              }}
            >
              <div
                className="rounded-2xl px-8 py-8 flex items-center justify-between transition-all duration-500 group-hover:bg-[rgba(0,240,255,0.03)]"
                style={{
                  background: 'rgba(8, 12, 24, 0.85)',
                  backdropFilter: 'blur(40px)',
                }}
              >
                <div className="flex items-center gap-5">
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500"
                    style={{
                      background: 'rgba(0,240,255,0.08)',
                      border: '1px solid rgba(0,240,255,0.15)',
                    }}
                  >
                    <GithubIcon size={26} />
                  </div>
                  <div>
                    <h3
                      className="text-[17px] font-semibold text-white mb-1"
                      style={{ fontFamily: "'SF Pro Display', 'Inter', -apple-system, sans-serif" }}
                    >
                      Soumi12-codeX/SupplyLens
                    </h3>
                    <p
                      className="text-[13px] text-white/35"
                      style={{ fontFamily: "'SF Pro Text', 'Inter', -apple-system, sans-serif" }}
                    >
                      The main project repository — star it if you like what we're building ⭐
                    </p>
                  </div>
                </div>

                <ExternalLink
                  size={18}
                  strokeWidth={1.5}
                  className="text-white/20 group-hover:text-[#00f0ff] transition-all duration-300 group-hover:translate-x-1 group-hover:-translate-y-1 shrink-0"
                />
              </div>
            </div>
          </a>
        </div>
      </section>

      <Footer />
    </div>
  );
}
