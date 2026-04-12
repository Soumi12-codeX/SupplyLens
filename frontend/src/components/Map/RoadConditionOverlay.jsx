import React from 'react';
import { Polyline, Tooltip } from 'react-leaflet';

// severity → colour mapping
const CONDITION_STYLE = {
  blocked: {
    color: '#ef4444',       // red
    glowColor: 'rgba(239,68,68,0.35)',
    weight: 6,
    glowWeight: 14,
    opacity: 0.95,
    label: '🚫 Road Blocked',
  },
  congested: {
    color: '#eab308',       // yellow
    glowColor: 'rgba(234,179,8,0.3)',
    weight: 5,
    glowWeight: 12,
    opacity: 0.9,
    label: '⚠ Heavy Congestion',
  },
  semi_congested: {
    color: '#f97316',       // orange
    glowColor: 'rgba(249,115,22,0.3)',
    weight: 4,
    glowWeight: 10,
    opacity: 0.85,
    label: '🟠 Semi-Congested',
  },
};

/**
 * Draws a highlighted segment on the map for a road condition.
 *
 * Props:
 *  - segment: { points: [{lat,lng},...], condition: 'blocked'|'congested'|'semi_congested', label }
 */
export function RoadConditionSegment({ segment }) {
  const style = CONDITION_STYLE[segment.condition] || CONDITION_STYLE.congested;
  const positions = segment.points.map((p) => [p.lat, p.lng]);

  return (
    <>
      {/* Outer glow */}
      <Polyline
        positions={positions}
        pathOptions={{
          color: style.glowColor,
          weight: style.glowWeight,
          opacity: 0.4,
          lineCap: 'round',
          lineJoin: 'round',
        }}
      />
      {/* Main line */}
      <Polyline
        positions={positions}
        pathOptions={{
          color: style.color,
          weight: style.weight,
          opacity: style.opacity,
          lineCap: 'round',
          lineJoin: 'round',
          dashArray: segment.condition === 'blocked' ? null : '10 6',
        }}
      >
        <Tooltip
          sticky
          className="road-condition-tooltip"
          direction="top"
        >
          <span style={{ fontSize: 12, fontWeight: 600, color: style.color }}>
            {style.label}
          </span>
          {segment.label && (
            <span style={{ display: 'block', fontSize: 11, color: '#94a3b8', marginTop: 2 }}>
              {segment.label}
            </span>
          )}
        </Tooltip>
      </Polyline>
    </>
  );
}

/**
 * Renders all active road condition segments on the map.
 *
 * Props:
 *  - conditions: array of segment objects (from alerts / WebSocket)
 */
export default function RoadConditionOverlay({ conditions = [] }) {
  return (
    <>
      {conditions.map((seg) => (
        <RoadConditionSegment key={seg.id} segment={seg} />
      ))}
    </>
  );
}
