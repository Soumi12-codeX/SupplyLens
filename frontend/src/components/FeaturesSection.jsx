import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Map, Activity, Bell, Smartphone } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

const services = [
  {
    title: 'Fleet &\nDistribution',
    tags: ['Fleet Management', 'Dock Scheduling', 'Optimization'],
    desc: 'Unify your distribution center operations. From yard management to dock scheduling, streamline every incoming and outgoing shipment with precision.',
    cta: 'Explore Distribution',
    bg: '#080F1E',
    accent: '#00f0ff', // neon-blue
    orbGradient: 'linear-gradient(145deg, #88f0ff 0%, #00f0ff 60%, #00b3cc 100%)',
    icon: <Map size={60} color="#00f0ff" strokeWidth={1.5} />,
  },
  {
    title: 'Long-Haul\nLogistics',
    tags: ['Freight Transport', 'Highway Tracking', 'ETAs'],
    desc: 'Monitor cross-country freight with real-time GPS tracking. Predictive ETAs ensure your long-haul deliveries stay on schedule, no matter the distance.',
    cta: 'Live Tracking',
    bg: '#0B0515', 
    accent: '#a855f7', // neon-purple
    orbGradient: 'linear-gradient(145deg, #d8b4fe 0%, #a855f7 60%, #7e22ce 100%)',
    icon: <Activity size={60} color="#a855f7" strokeWidth={1.5} />,
  },
  {
    title: 'Intelligent\nWarehousing',
    tags: ['Inventory', 'Scanning', 'Fulfillment'],
    desc: 'Empower your warehouse staff with robust digital scanning and automated inventory logic. Fulfill internal orders faster with minimal errors.',
    cta: 'View Operations',
    bg: '#051214',
    accent: '#22d3ee', // cyan
    orbGradient: 'linear-gradient(145deg, #a5f3fc 0%, #22d3ee 60%, #0891b2 100%)',
    icon: <Bell size={60} color="#22d3ee" strokeWidth={1.5} />,
  },
  {
    title: 'Last-Mile\nDelivery',
    tags: ['Local Dispatch', 'Proof of Delivery', 'Routing'],
    desc: 'Perfect the final step of the supply chain. Optimize multi-stop local routes and capture instant digital proof of delivery directly at the doorstep.',
    cta: 'Local Dispatch',
    bg: '#120510',
    accent: '#d946ef', // fuchsia
    orbGradient: 'linear-gradient(145deg, #f0abfc 0%, #d946ef 60%, #a21caf 100%)',
    icon: <Smartphone size={60} color="#d946ef" strokeWidth={1.5} />,
  },
];

export default function FeaturesSection() {
  const wrapperRef = useRef(null);

  useEffect(() => {
    if (!wrapperRef.current) return;

    const ctx = gsap.context(() => {
      const wrappers = gsap.utils.toArray('.dhero-card-wrapper');

      wrappers.forEach((wrapper, i) => {
        const inner = wrapper.querySelector('.dhero-card-inner');
        const overlay = wrapper.querySelector('.dim-overlay');

        // Entrance slide-in
        gsap.fromTo(wrapper,
          { y: 60, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.9,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: wrapper,
              start: 'top 90%',
              once: true,
            }
          }
        );

        // Dim + shrink as scroll goes past — CSS sticky handles stacking
        if (i < wrappers.length - 1) {
          gsap.to(inner, {
            scale: 0.93,
            transformOrigin: 'top center',
            ease: 'none',
            scrollTrigger: {
              trigger: wrapper,
              start: 'top 100px',
              end: () => `+=${wrapper.offsetHeight}`,
              scrub: true,
            }
          });
          
          if (overlay) {
            gsap.to(overlay, {
              opacity: 0.75,
              ease: 'none',
              scrollTrigger: {
                trigger: wrapper,
                start: 'top 100px',
                end: () => `+=${wrapper.offsetHeight}`,
                scrub: true,
              }
            });
          }
        }
      });
    }, wrapperRef);

    return () => ctx.revert();
  }, []);

  return (
    <section id="services" style={{ padding: '140px 0 0', background: '#02050A' }}>

      {/* Section header */}
      <div style={{ textAlign: 'center', maxWidth: '700px', margin: '0 auto 100px', padding: '0 24px' }}>
        <p style={{
          color: '#8b9bb4',
          fontSize: '0.8rem',
          fontWeight: 700,
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          marginBottom: '20px',
          fontFamily: 'Outfit, sans-serif'
        }}>Capabilities</p>
        <h2 style={{
          color: '#fff',
          fontSize: 'clamp(2.8rem, 5.5vw, 4.5rem)',
          marginBottom: '24px',
          lineHeight: 1.05,
          letterSpacing: '-0.025em',
          fontFamily: 'Space Grotesk, sans-serif',
          fontWeight: 'bold'
        }}>
          Next-Gen Logistics
        </h2>
        <p style={{ color: '#8b9bb4', fontSize: '1.15rem', lineHeight: 1.75, fontFamily: 'Outfit, sans-serif' }}>
          A full spectrum of AI intelligence — from global route mapping to proactive field operations.
        </p>
      </div>

      {/* Stacking cards */}
      <div ref={wrapperRef} style={{ padding: '0 1rem', maxWidth: '1280px', margin: '0 auto' }}>
        {services.map((svc, i) => (
          <div
            key={i}
            className="dhero-card-wrapper"
            style={{
              marginTop: i === 0 ? 0 : '-32px',
              position: 'sticky',
              top: '100px',
              zIndex: i,
            }}
          >
            <div
              className="dhero-card-inner"
              style={{
                background: svc.bg,
                willChange: 'transform',
                borderRadius: '32px 32px 0 0',
                position: 'relative',
                overflow: 'hidden',
                borderTop: `1px solid ${svc.accent}33`,
                boxShadow: `0 -8px 60px rgba(0,0,0,0.6), inset 0 1px 0 ${svc.accent}22`,
              }}
            >
              {/* Dim overlay */}
              <div 
                className="dim-overlay"
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: '#02050A',
                  opacity: 0,
                  zIndex: 10,
                  pointerEvents: 'none',
                  willChange: 'opacity',
                }}
              />

            <div className="dhero-card-flex" style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              padding: 'clamp(64px, 8vw, 110px) 24px',
              minHeight: 'clamp(420px, 58vh, 640px)',
              position: 'relative',
            }}>

              {/* Background glow sweep */}
              <div style={{
                position: 'absolute', inset: 0,
                background: `radial-gradient(ellipse 50% 60% at 50% 20%, ${svc.accent}12 0%, transparent 65%)`,
                pointerEvents: 'none',
              }} />
              
              {/* Top accent line */}
              <div style={{
                position: 'absolute', top: 0, left: '50%',
                transform: 'translateX(-50%)',
                width: '300px', height: '2px',
                background: `linear-gradient(90deg, transparent, ${svc.accent}80, transparent)`,
                pointerEvents: 'none',
              }} />

              {/* Main Centered Content */}
              <div style={{ position: 'relative', zIndex: 1, maxWidth: '800px', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>

                {/* Small Glowing Icon Placed Top Center */}
                <div style={{
                  width: '72px',
                  height: '72px',
                  borderRadius: '50%',
                  background: 'rgba(2,5,10,0.6)',
                  backdropFilter: 'blur(10px)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: `0 0 30px ${svc.accent}30, inset 0 0 15px ${svc.accent}20`,
                  border: `1px solid ${svc.accent}40`,
                  marginBottom: '32px',
                }}>
                  {React.cloneElement(svc.icon, { size: 32 })}
                </div>



                {/* Title */}
                <h3 style={{
                  fontSize: 'clamp(3rem, 6vw, 5.5rem)',
                  fontWeight: 800,
                  color: '#fff',
                  marginBottom: '32px',
                  lineHeight: 1.05,
                  letterSpacing: '-0.02em',
                  whiteSpace: 'pre-line',
                  fontFamily: 'Space Grotesk, sans-serif'
                }}>
                  {svc.title}
                </h3>

                {/* Tag pills */}
                <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '12px', marginBottom: '40px' }}>
                  {svc.tags.map((tag, t) => (
                    <span key={t} style={{
                      padding: '8px 24px',
                      borderRadius: '100px',
                      border: `1px solid ${svc.accent}40`,
                      color: svc.accent,
                      fontSize: '0.9rem',
                      fontWeight: 600,
                      letterSpacing: '0.02em',
                      background: `${svc.accent}10`,
                      fontFamily: 'Outfit, sans-serif',
                      backdropFilter: 'blur(10px)',
                    }}>{tag}</span>
                  ))}
                </div>

                {/* Description */}
                <p style={{
                  color: '#9ba9be',
                  fontSize: 'clamp(1.05rem, 1.5vw, 1.25rem)',
                  lineHeight: 1.85,
                  maxWidth: '560px',
                  marginBottom: '50px',
                  fontFamily: 'Outfit, sans-serif'
                }}>
                  {svc.desc}
                </p>

                {/* CTA Box */}
                <div
                  className={`dhero-cta-${i}`}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '16px 36px',
                    borderRadius: '100px',
                    background: `${svc.accent}15`,
                    border: `1px solid ${svc.accent}60`,
                    color: svc.accent,
                    fontSize: '1rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    fontFamily: 'Space Grotesk, sans-serif',
                    letterSpacing: '0.01em',
                  }}
                  onMouseEnter={e => {
                    const btn = e.currentTarget;
                    btn.style.background = svc.accent;
                    btn.style.color = '#000';
                    btn.style.borderColor = svc.accent;
                    btn.style.transform = 'translateY(-3px)';
                  }}
                  onMouseLeave={e => {
                    const btn = e.currentTarget;
                    btn.style.background = `${svc.accent}15`;
                    btn.style.color = svc.accent;
                    btn.style.borderColor = `${svc.accent}60`;
                    btn.style.transform = 'translateY(0)';
                  }}
                >
                  {svc.cta}
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14M12 5l7 7-7 7"/>
                  </svg>
                </div>

              </div>
            </div>
          </div>
        </div>
        ))}
      </div>
      {/* Spacer */}
      <div style={{ height: '200px', background: '#02050A' }} />

      <style>{`
      `}</style>
    </section>
  );
}
