import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, useMap, ZoomControl, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

// Component to programmatically set map center and manage auto-pan
function MapController({ center, zoom }) {
  const map = useMap();
  const [autoPan, setAutoPan] = useState(true);

  useMapEvents({
    dragstart: () => {
      setAutoPan(false);
    }
  });

  useEffect(() => {
    if (center && autoPan) {
      map.setView(center, zoom || map.getZoom(), { animate: true, duration: 1.5 });
    }
  }, [center?.[0], center?.[1], autoPan, map, zoom]);

  return (
    !autoPan ? (
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[1000]">
        <button 
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (center) {
              map.setView(center, zoom || map.getZoom(), { animate: true, duration: 1.5 });
              setAutoPan(true);
            }
          }}
          className="px-5 py-2.5 bg-slate-900/95 border border-neon-blue/40 text-neon-blue rounded-full shadow-[0_0_20px_rgba(0,240,255,0.2)] text-xs font-bold uppercase tracking-wider backdrop-blur-md hover:bg-neon-blue/10 transition-all cursor-pointer"
        >
          Resume Tracking
        </button>
      </div>
    ) : null
  );
}

export default function MapView({ center = [20.5937, 78.9629], zoom = 5, children, className = '' }) {
  return (
    <MapContainer
      center={center}
      zoom={zoom}
      className={`w-full h-full ${className}`}
      zoomControl={false} // Disable default top-left control
      scrollWheelZoom={true}
      wheelPxPerZoomLevel={60}
      zoomAnimation={true}
      fadeAnimation={true}
      markerZoomAnimation={true}
      style={{ background: '#0f172a' }}
    >
      <TileLayer
        attribution='&copy; <a href="https://carto.com/">CARTO</a>'
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
      />
      <ZoomControl position="bottomright" />
      <MapController center={center} zoom={zoom} />
      {children}
    </MapContainer>
  );
}
