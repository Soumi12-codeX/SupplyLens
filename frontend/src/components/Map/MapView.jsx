import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, useMap, ZoomControl, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

// Component to programmatically set map center and manage auto-pan
function MapController({ center, zoom, route }) {
  const map = useMap();
  const [autoPan, setAutoPan] = useState(true);
  const hasFittedBounds = React.useRef(false);

  useMapEvents({
    dragstart: () => setAutoPan(false),
    zoomstart: () => {
      // Only disable autoPan if the user is manually zooming (not programmatic)
      // We detect this by checking if the zoom was triggered by scroll/pinch
    },
  });

  // Fit bounds ONCE when a route first appears (preview mode)
  useEffect(() => {
    if (route && route.length >= 2 && map && !hasFittedBounds.current) {
      const bounds = route.map(p => [p.lat, p.lng]);
      map.fitBounds(bounds, { padding: [50, 50], animate: true, duration: 2 });
      hasFittedBounds.current = true;
    }
    // Reset the flag when route disappears (trip delivered, back to idle)
    if (!route) {
      hasFittedBounds.current = false;
    }
  }, [route?.length, map]);

  // Smoothly follow the truck position (auto-pan)
  useEffect(() => {
    if (center && autoPan) {
      map.setView(center, map.getZoom(), { animate: true, duration: 1 });
    }
  }, [center?.[0], center?.[1], autoPan, map]);

  return (
    !autoPan ? (
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[1000]">
        <button 
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (center) {
              map.setView(center, map.getZoom(), { animate: true, duration: 1.5 });
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

export default function MapView({ center = [20.5937, 78.9629], zoom = 5, route = null, children, className = '' }) {
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
      <MapController center={center} zoom={zoom} route={route} />
      {children}
    </MapContainer>
  );
}
