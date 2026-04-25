import React, { useState, useEffect } from 'react';
import { Polyline, CircleMarker, Tooltip } from 'react-leaflet';

export default function RouteOverlay({ route, isActive = false, progressIndex = 0 }) {
  const [roadPath, setRoadPath] = useState(null);

  useEffect(() => {
    if (!route || route.length < 2) return;

    let isMounted = true;
    const fetchRoadPath = async () => {
      try {
        // OSRM expects longitude,latitude pairs separated by semi-colons
        // For large routes, sample every Nth point to keep URL manageable
        let sampledRoute = route;
        if (route.length > 100) {
          const step = Math.max(1, Math.floor(route.length / 80));
          sampledRoute = route.filter((_, i) => i % step === 0 || i === route.length - 1);
        }
        const coordsStr = sampledRoute.map(p => `${p.lng},${p.lat}`).join(';');
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
  }, [route?.length]);

  if (!route || route.length < 2) return null;

  const positions = roadPath || route.map((p) => [p.lat, p.lng]);

  // Split the path into covered and remaining segments
  const splitRatio = route.length > 0 ? progressIndex / (route.length - 1) : 0;
  const splitIdx = Math.max(0, Math.min(positions.length - 1, Math.round(splitRatio * (positions.length - 1))));
  
  const coveredPath = positions.slice(0, splitIdx + 1);
  const remainingPath = positions.slice(splitIdx);

  return (
    <>
      {/* Covered path — grey/dim */}
      {isActive && coveredPath.length >= 2 && (
        <Polyline
          positions={coveredPath}
          pathOptions={{
            color: '#475569',
            weight: 4,
            opacity: 0.6,
            lineCap: 'round',
            lineJoin: 'round'
          }}
        />
      )}

      {/* Glow layer for remaining — Only show when active */}
      {isActive && remainingPath.length >= 2 && (
        <Polyline
          positions={remainingPath}
          pathOptions={{
            color: '#00f0ff',
            weight: 6,
            opacity: 0.15,
            lineCap: 'round',
          }}
        />
      )}
      
      {/* Main line — remaining (bright) or full preview (dotted) */}
      <Polyline
        positions={isActive ? (remainingPath.length >= 2 ? remainingPath : positions) : positions}
        pathOptions={{
          color: isActive ? '#00f0ff' : '#3b82f6',
          weight: isActive ? 4 : 3,
          opacity: isActive ? 0.8 : 0.7,
          dashArray: isActive ? null : '10, 15',
          lineCap: isActive ? 'round' : 'square',
          lineJoin: 'round'
        }}
      />
      
      
      {/* Only render node markers for hub-based routes (< 50 nodes), not OSRM high-fidelity paths */}
      {route.length < 50 && route.map((p, idx) => {
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
