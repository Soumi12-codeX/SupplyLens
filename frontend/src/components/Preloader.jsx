import React, { useState, useEffect } from 'react';

export default function Preloader() {
  const [invert, setInvert] = useState(false);
  const [visible, setVisible] = useState(true);

  // Automatically hide the loader after one animation cycle
  useEffect(() => {
    const timer = setTimeout(() => setVisible(false), 2500);
    return () => clearTimeout(timer);
  }, []);

  if (!visible) return null;

  return (
    // Body replacement wrapper to mimic the CSS you provided exactly
    <div
      onClick={() => setInvert(!invert)}
      className={`fixed inset-0 z-[9999] flex justify-center items-center ${
        invert ? 'invert-theme' : 'default-theme'
      }`}
      style={{ margin: 0, padding: 0, minHeight: '100vh', cursor: 'pointer' }}
    >
      {/* 
        Your EXACT CSS wrapped in a style tag.
        (Classes .default-theme and .invert-theme acts as "body" and "body.invert") 
      */}
      <style>{`
        .default-theme {
          --foreground-col: #fff;
          --background-col: #000;
          background: var(--background-col);
        }
        .invert-theme {
          --foreground-col: #000;
          --background-col: #fff;
          background: var(--background-col);
        }
        svg {
          width: 50vw;
        }
        #outline text {
          fill: none;
          stroke: var(--foreground-col);
          stroke-width: 0.1px;
        }
        #load {
          fill: var(--foreground-col);
          stroke-width: 0px;
          animation: loading 3s linear infinite;
        }
        #mask {
          fill: var(--background-col);
          stroke-width: 0px;
        }
        @keyframes loading {
          from { y: 11.5px; }
          to { y: -6px; }
        }
      `}</style>

      {/* Your exact SVG viewBox parameters and structure */}
      <svg xmlns="http://www.w3.org/2000/svg" id="svg8" version="1.1" viewBox="0 0 40 14">
        {/* The loading liquid rectangle */}
        <rect id="load" strokeWidth="0" x="0" y="0" height="9" width="40" />

        {/* 
          Since your original code had raw path vectors (M... L...) strictly for the word "LOADING", 
          the only way to dynamically say "SupplyLens" in standard SVG is using a <mask/> tag with <text/> 
          instead of hardcoded vector holes. This behaves identically to your original path structure.
        */}
        <mask id="cutout">
          <rect width="40" height="14" fill="white" />
          <text 
            x="20" 
            y="9" 
            textAnchor="middle" 
            fill="black" 
            fontSize="5.5" 
            fontFamily="'Outfit', sans-serif" 
            fontWeight="800"
            letterSpacing="-0.1"
          >
            SupplyLens
          </text>
        </mask>

        {/* The main solid layer blocking out the liquid, heavily masked by the text */}
        <rect id="mask" x="0" y="0" width="40" height="14" mask="url(#cutout)" />

        {/* The outline drawn around the cutout */}
        <g id="outline">
          <text 
            x="20" 
            y="9" 
            textAnchor="middle" 
            fontSize="5.5" 
            fontFamily="'Outfit', sans-serif" 
            fontWeight="800"
            letterSpacing="-0.1"
          >
            SupplyLens
          </text>
        </g>
      </svg>
    </div>
  );
}
