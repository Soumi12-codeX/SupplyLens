import React, { useState, useEffect } from 'react';
import { Polyline, CircleMarker, Tooltip } from 'react-leaflet';

export default function RouteOverlay({ route, isActive = false }) {
  const [roadPath, setRoadPath] = useState(null);

  useEffect(() => {
    if (!route || route.length < 2) return;

    let isMounted = true;
    const fetchRoadPath = async () => {
      try {
        // OSRM expects longitude,latitude pairs separated by semi-colons
        const coordsStr = route.map(p => `${p.lng},${p.lat}`).join(';');
        const res = await fetch(
          `https://router.project-osrm.org/route/v1/driving/${coordsStr}?overview=full&geometries=geojson`
        );
        const data = await res.json();

        if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
          const geoJsonCoords = data.routes[0].geometry.coordinates;
          // GeoJSON is [lng, lat], Leaflet wants [lat, lng]
          const leafletPath = geoJsonCoords.map(coord => [coord[1], coord[0]]);
          if (isMounted) setRoadPath(leafletPath);
        } else {
          // Fallback to straight lines
          if (isMounted) setRoadPath(route.map(p => [p.lat, p.lng]));
        }
      } catch (err) {
        console.error("Failed to fetch road path:", err);
        // Fallback to straight lines
        if (isMounted) setRoadPath(route.map(p => [p.lat, p.lng]));
      }
    };

    fetchRoadPath();

    return () => { isMounted = false; };
  }, [route]);

  if (!route || route.length < 2) return null;

  const positions = roadPath || route.map((p) => [p.lat, p.lng]);

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
      
      {/* Render all intermediate nodes + start and end with different styles */}
      {route.map((p, idx) => {
        const isStart = idx === 0;
        const isEnd = idx === route.length - 1;
        const pos = [p.lat, p.lng];
        
        // Colors: green for start, red for end, blue for intermediate
        const color = isStart ? '#22c55e' : isEnd ? '#ef4444' : '#3b82f6';
        const opacity = isStart || isEnd ? 0.8 : 0.6;
        const radius = isStart || isEnd ? 5 : 3;

        return (
          <CircleMarker
            key={`route-node-${idx}-${p.name || ''}`}
            center={pos}
            radius={radius}
            pathOptions={{
              fillColor: color,
              fillOpacity: opacity,
              color: color,
              weight: 2,
              opacity: 0.5,
            }}
          >
            {p.name && (
              <Tooltip 
                direction="top" 
                offset={[0, -10]} 
                opacity={1} 
                permanent={true}
                className="custom-route-tooltip"
              >
                <div className="px-2 py-1 bg-slate-900/90 border border-white/10 rounded-md backdrop-blur-sm">
                  <span className="text-white font-bold text-[10px] whitespace-nowrap">
                    {p.name}
                  </span>
                </div>
              </Tooltip>
            )}
          </CircleMarker>
        );
      })}
    </>
  );
}
