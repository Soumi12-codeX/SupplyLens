import React from 'react';
import { Polyline, CircleMarker } from 'react-leaflet';

export default function RouteOverlay({ route, isActive = false }) {
  if (!route || route.length < 2) return null;

  const positions = route.map((p) => [p.lat, p.lng]);

  return (
    <>
      {/* Glow layer */}
      <Polyline
        positions={positions}
        pathOptions={{
          color: isActive ? '#00f0ff' : '#3b82f6',
          weight: isActive ? 6 : 4,
          opacity: 0.15,
          lineCap: 'round',
        }}
      />
      {/* Main line */}
      <Polyline
        positions={positions}
        pathOptions={{
          color: isActive ? '#00f0ff' : '#3b82f6',
          weight: isActive ? 3 : 2,
          opacity: isActive ? 0.8 : 0.4,
          dashArray: isActive ? null : '8 12',
          lineCap: 'round',
        }}
      />
      {/* Origin marker */}
      <CircleMarker
        center={positions[0]}
        radius={5}
        pathOptions={{
          fillColor: '#22c55e',
          fillOpacity: 0.8,
          color: '#22c55e',
          weight: 2,
          opacity: 0.5,
        }}
      />
      {/* Destination marker */}
      <CircleMarker
        center={positions[positions.length - 1]}
        radius={5}
        pathOptions={{
          fillColor: '#ef4444',
          fillOpacity: 0.8,
          color: '#ef4444',
          weight: 2,
          opacity: 0.5,
        }}
      />
    </>
  );
}
