import React from 'react';
import { Polygon, Tooltip, Popup } from 'react-leaflet';

const ZONE_CONFIG = {
  barricade: { color: '#f97316', dash: null, weight: 2, label: 'Barricade' },
  loading: { color: '#eab308', dash: '8,6', weight: 2, label: 'Loading Zone' },
  accessible: { color: '#3b82f6', dash: null, weight: 3, label: 'Accessible Route' },
  sightline: { color: '#a855f7', dash: '4,4', weight: 2, label: 'Sight Line' },
};

export default function MapZoneLayer({ mapZones, onDelete, visible }) {
  if (!visible || !mapZones?.length) return null;

  return (
    <>
      {mapZones.map((zone) => {
        const cfg = ZONE_CONFIG[zone.type] || ZONE_CONFIG.barricade;
        return (
          <Polygon
            key={zone.id}
            positions={zone.polygon}
            pathOptions={{
              color: cfg.color,
              weight: cfg.weight,
              fillColor: cfg.color,
              fillOpacity: 0.2,
              dashArray: cfg.dash || undefined,
            }}
          >
            <Tooltip>{cfg.label}{zone.label ? `: ${zone.label}` : ''}</Tooltip>
            <Popup>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 6 }}>
                  {cfg.label}
                </div>
                {zone.label && <div style={{ fontSize: 11, color: '#64748b', marginBottom: 4 }}>{zone.label}</div>}
                {zone.notes && <div style={{ fontSize: 10, color: '#94a3b8', marginBottom: 4 }}>{zone.notes}</div>}
                <button
                  onClick={() => onDelete(zone.id)}
                  style={{
                    padding: '4px 12px', background: '#dc2626', color: '#fff',
                    border: 'none', borderRadius: 4, fontWeight: 600, fontSize: 12,
                    cursor: 'pointer',
                  }}
                >
                  Remove
                </button>
              </div>
            </Popup>
          </Polygon>
        );
      })}
    </>
  );
}
