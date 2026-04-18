import React from 'react';
import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';

// Create a custom truck icon using SVG and HTML for the label
function createTruckIcon(status = 'on-route', isSelected = false, truckId = '') {
  const color = status === 'delayed' ? '#ef4444' : status === 'idle' ? '#eab308' : '#00f0ff';
  const glowColor = status === 'delayed' ? 'rgba(239,68,68,0.4)' : 'rgba(0,240,255,0.4)';
  const size = isSelected ? 40 : 32;

  const htmlContent = `
    <div style="position: relative; display: flex; align-items: center; justify-content: center; width: ${size}px; height: ${size}px;">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40" width="${size}" height="${size}" style="position: absolute;">
        <defs>
          <filter id="glow">
            <feGaussianBlur stdDeviation="2" result="blur"/>
            <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
        </defs>
      <circle cx="20" cy="20" r="16" fill="${color}22" stroke="${color}" stroke-width="2" filter="url(#glow)"/>
      <circle cx="20" cy="20" r="8" fill="${color}" opacity="0.9"/>
      <circle cx="20" cy="20" r="4" fill="white" opacity="0.8"/>
      ${isSelected ? `<circle cx="20" cy="20" r="18" fill="none" stroke="${color}" stroke-width="1" opacity="0.5"><animate attributeName="r" values="18;22;18" dur="2s" repeatCount="indefinite"/><animate attributeName="opacity" values="0.5;0.1;0.5" dur="2s" repeatCount="indefinite"/></circle>` : ''}
      </svg>
      <div style="position: absolute; left: ${size + 4}px; background: rgba(15,23,42,0.9); color: ${color}; border: 1px solid ${color}40; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: 700; white-space: nowrap; box-shadow: 0 0 10px ${color}20;">
        ${truckId}
      </div>
    </div>
  `;

  return L.divIcon({
    html: htmlContent,
    className: 'truck-marker-icon',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
  });
}

export default function TruckMarker({ truck, isSelected, onClick }) {
  const icon = createTruckIcon(truck.status, isSelected, truck.id);

  return (
    <Marker
      position={[truck.currentPosition.lat, truck.currentPosition.lng]}
      icon={icon}
      eventHandlers={{
        click: () => onClick?.(truck),
      }}
    >
      <Popup className="truck-popup">
        <div className="text-xs">
          <p className="font-bold text-sm mb-1">{truck.id}</p>
          <p className="text-slate-600">{truck.driver}</p>
          <p className="text-slate-500">{truck.originName} → {truck.destinationName}</p>
          <p className="text-slate-500">{truck.cargo}</p>
          <p className={`mt-1 font-semibold ${truck.status === 'delayed' ? 'text-red-500' : 'text-emerald-500'}`}>
            {truck.status === 'delayed' ? '⚠ Delayed' : '● On Route'}
          </p>
        </div>
      </Popup>
    </Marker>
  );
}
