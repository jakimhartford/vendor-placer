import React, { useMemo, useState } from 'react';
import { Polygon, Tooltip, Popup, Marker } from 'react-leaflet';
import L from 'leaflet';
import ZoneHandles from './ZoneHandles.jsx';

const ZONE_CONFIG = {
  barricade: { color: '#f97316', dash: null, weight: 2, label: 'Barricade', icon: '🚧' },
  loading: { color: '#eab308', dash: '8,6', weight: 2, label: 'Loading Zone', icon: '🚛' },
  accessible: { color: '#3b82f6', dash: null, weight: 3, label: 'Accessible Route', icon: '♿' },
  sightline: { color: '#a855f7', dash: '4,4', weight: 2, label: 'Sight Line', icon: '👁️' },
};

function polygonCenter(polygon) {
  const lat = polygon.reduce((s, p) => s + p[0], 0) / polygon.length;
  const lng = polygon.reduce((s, p) => s + p[1], 0) / polygon.length;
  return [lat, lng];
}

function ZoneItem({ zone, onDelete, onUpdate, selected, onSelect }) {
  const cfg = ZONE_CONFIG[zone.type] || ZONE_CONFIG.barricade;
  const center = useMemo(() => polygonCenter(zone.polygon), [zone.polygon]);

  const divIcon = useMemo(() => L.divIcon({
    className: '',
    html: `<div style="
      font-size: 22px; line-height: 1;
      filter: drop-shadow(0 1px 3px rgba(0,0,0,0.5));
      cursor: pointer;
    ">${cfg.icon}</div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  }), [cfg.icon]);

  return (
    <>
      <Polygon
        positions={zone.polygon}
        pathOptions={{
          color: cfg.color,
          weight: selected ? 0 : cfg.weight,
          fillColor: cfg.color,
          fillOpacity: 0.2,
          dashArray: cfg.dash || undefined,
        }}
        eventHandlers={{ click: () => onSelect(zone.id) }}
      >
        {!selected && <Tooltip>{cfg.label}{zone.label ? `: ${zone.label}` : ''}</Tooltip>}
      </Polygon>
      <Marker
        position={center}
        icon={divIcon}
        eventHandlers={{ click: () => onSelect(zone.id) }}
      >
        {!selected && (
          <Popup>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 6 }}>
                {cfg.icon} {cfg.label}
              </div>
              {zone.label && <div style={{ fontSize: 11, color: '#64748b', marginBottom: 4 }}>{zone.label}</div>}
              {zone.notes && <div style={{ fontSize: 10, color: '#94a3b8', marginBottom: 4 }}>{zone.notes}</div>}
              <button
                onClick={(e) => { e.stopPropagation(); onDelete(zone.id); }}
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
        )}
      </Marker>
      {selected && onUpdate && (
        <ZoneHandles
          polygon={zone.polygon}
          color={cfg.color}
          onUpdate={(newPolygon) => onUpdate(zone.id, { polygon: newPolygon })}
          onClose={() => onSelect(null)}
        />
      )}
    </>
  );
}

export default function MapZoneLayer({ mapZones, onDelete, onUpdate, visible }) {
  const [selectedId, setSelectedId] = useState(null);

  if (!visible || !mapZones?.length) return null;

  const handleSelect = (id) => {
    setSelectedId((prev) => (prev === id ? null : id));
  };

  return (
    <>
      {mapZones.map((zone) => (
        <ZoneItem
          key={zone.id}
          zone={zone}
          onDelete={onDelete}
          onUpdate={onUpdate}
          selected={selectedId === zone.id}
          onSelect={handleSelect}
        />
      ))}
    </>
  );
}
