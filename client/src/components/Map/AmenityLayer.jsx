import React from 'react';
import { Marker, Tooltip, Popup } from 'react-leaflet';
import L from 'leaflet';

const AMENITY_CONFIG = {
  power: { icon: '\u26A1', color: '#f59e0b', label: 'Power' },
  water: { icon: '\uD83D\uDCA7', color: '#3b82f6', label: 'Water' },
  restroom: { icon: '\uD83D\uDEBB', color: '#8b5cf6', label: 'Restroom' },
  trash: { icon: '\uD83D\uDDD1\uFE0F', color: '#6b7280', label: 'Trash' },
  info_booth: { icon: '\u2139\uFE0F', color: '#3b82f6', label: 'Info Booth' },
  stage: { icon: '\uD83C\uDFAD', color: '#ec4899', label: 'Stage' },
  sponsor: { icon: '\uD83C\uDFF7\uFE0F', color: '#a855f7', label: 'Sponsor' },
};

function createIcon(type) {
  const cfg = AMENITY_CONFIG[type] || AMENITY_CONFIG.power;
  return L.divIcon({
    className: '',
    html: `<div style="font-size:20px;text-align:center;filter:drop-shadow(0 1px 2px rgba(0,0,0,0.5));">${cfg.icon}</div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
}

export default function AmenityLayer({ amenities, onDelete, visible }) {
  if (!visible || !amenities?.length) return null;

  return (
    <>
      {amenities.map((a) => (
        <Marker key={a.id} position={[a.lat, a.lng]} icon={createIcon(a.type)}>
          <Tooltip>
            {(AMENITY_CONFIG[a.type]?.label || a.type)}{a.notes ? `: ${a.notes}` : ''}
          </Tooltip>
          <Popup>
            <div style={{ textAlign: 'center', fontSize: 12 }}>
              <div style={{ fontWeight: 600, marginBottom: 4 }}>
                {AMENITY_CONFIG[a.type]?.icon} {AMENITY_CONFIG[a.type]?.label || a.type}
              </div>
              {a.notes && <div style={{ color: '#64748b', marginBottom: 4 }}>{a.notes}</div>}
              <button
                onClick={() => onDelete(a.id)}
                style={{
                  padding: '3px 10px', background: '#dc2626', color: '#fff',
                  border: 'none', borderRadius: 4, fontSize: 11, cursor: 'pointer',
                }}
              >
                Remove
              </button>
            </div>
          </Popup>
        </Marker>
      ))}
    </>
  );
}
