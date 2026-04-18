import React from 'react';
import { Marker, Tooltip } from 'react-leaflet';
import L from 'leaflet';

function createWarehouseIcon(type) {
  // Green for origin (pickup), Yellow/Amber for destination (drop)
  const color = type === 'origin' ? '#10b981' : '#f59e0b';
  
  const iconHtml = `
    <div style="position: relative; display: flex; align-items: center; justify-content: center; width: 24px; height: 24px;">
      <div style="width: 16px; height: 16px; background-color: ${color}; border: 2px solid white; border-radius: 50%; box-shadow: 0 0 15px ${color};"></div>
    </div>
  `;

  return L.divIcon({
    html: iconHtml,
    className: 'warehouse-marker-icon',
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
}

export default function WarehouseMarker({ name, position, type }) {
  const icon = createWarehouseIcon(type);

  return (
    <Marker position={[position.lat, position.lng]} icon={icon}>
      <Tooltip direction="top" offset={[0, -12]} opacity={0.9} permanent className="warehouse-tooltip">
        <div style={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase' }}>
          <span style={{ color: type === 'origin' ? '#10b981' : '#f59e0b' }}>
            {type === 'origin' ? 'Pickup' : 'Drop'}: 
          </span>{' '}
          <span style={{ color: '#334155' }}>{name}</span>
        </div>
      </Tooltip>
    </Marker>
  );
}
