import React, { useMemo } from 'react';
import { Polygon, Tooltip, Popup, Marker } from 'react-leaflet';
import L from 'leaflet';

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

function ZoneItem({ zone, onDelete, onUpdate }) {
  const cfg = ZONE_CONFIG[zone.type] || ZONE_CONFIG.barricade;
  const center = useMemo(() => polygonCenter(zone.polygon), [zone.polygon]);

  const iconHtml = `<div style="
    font-size: 22px; line-height: 1;
    filter: drop-shadow(0 1px 3px rgba(0,0,0,0.5));
    cursor: ${onUpdate ? 'grab' : 'default'};
  ">${cfg.icon}</div>`;

  const divIcon = useMemo(() => L.divIcon({
    className: '',
    html: iconHtml,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  }), [iconHtml]);

  const handleDragEnd = (e) => {
    if (!onUpdate) return;
    const newCenter = e.target.getLatLng();
    const oldCenter = polygonCenter(zone.polygon);
    const dLat = newCenter.lat - oldCenter[0];
    const dLng = newCenter.lng - oldCenter[1];
    const newPolygon = zone.polygon.map(([lat, lng]) => [lat + dLat, lng + dLng]);
    onUpdate(zone.id, { polygon: newPolygon });
  };

  return (
    <>
      <Polygon
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
      </Polygon>
      <Marker
        position={center}
        icon={divIcon}
        draggable={!!onUpdate}
        eventHandlers={{ dragend: handleDragEnd }}
      >
        <Popup>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 6 }}>
              {cfg.icon} {cfg.label}
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
      </Marker>
    </>
  );
}

export default function MapZoneLayer({ mapZones, onDelete, onUpdate, visible }) {
  if (!visible || !mapZones?.length) return null;

  return (
    <>
      {mapZones.map((zone) => (
        <ZoneItem key={zone.id} zone={zone} onDelete={onDelete} onUpdate={onUpdate} />
      ))}
    </>
  );
}
