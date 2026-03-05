import { useEffect, useRef, useState } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';

export default function DeadZoneDrawer({ active, spots, onMarkDeadZones, onDone }) {
  const map = useMap();
  const layerRef = useRef(null);
  const [drawn, setDrawn] = useState(false);

  // Listen for pm:create once
  useEffect(() => {
    if (!map) return;

    const handleCreate = (e) => {
      if (e.shape !== 'Rectangle') return;
      layerRef.current = e.layer;
      setDrawn(true);
    };

    map.on('pm:create', handleCreate);
    return () => {
      map.off('pm:create', handleCreate);
    };
  }, [map]);

  // Toggle draw mode
  useEffect(() => {
    if (!map) return;

    if (active && !drawn) {
      map.pm.enableDraw('Rectangle', {
        pathOptions: { color: '#dc2626', weight: 2, fillColor: '#dc2626', fillOpacity: 0.2 },
      });
    } else {
      map.pm.disableDraw('Rectangle');
    }

    return () => {
      map.pm.disableDraw('Rectangle');
    };
  }, [map, active, drawn]);

  // Clean up on deactivate
  useEffect(() => {
    if (!active) {
      if (layerRef.current && map) {
        map.removeLayer(layerRef.current);
        layerRef.current = null;
      }
      setDrawn(false);
    }
  }, [active, map]);

  const handleConfirm = () => {
    const layer = layerRef.current;
    if (!layer) return;

    const layerLatLngs = layer.getLatLngs()[0];

    const ids = [];
    for (const feature of (spots?.features || [])) {
      if (!feature.geometry || feature.geometry.type !== 'Polygon') continue;
      const coords = feature.geometry.coordinates[0];
      const n = coords.length - 1;
      let latSum = 0, lngSum = 0;
      for (let i = 0; i < n; i++) {
        lngSum += coords[i][0];
        latSum += coords[i][1];
      }
      const center = L.latLng(latSum / n, lngSum / n);
      if (isPointInPolygon(center, layerLatLngs)) {
        ids.push(feature.properties?.id);
      }
    }

    map.removeLayer(layer);
    layerRef.current = null;
    setDrawn(false);

    if (ids.length > 0 && onMarkDeadZones) {
      onMarkDeadZones(ids);
    }
    if (onDone) onDone();
  };

  const handleCancel = () => {
    if (layerRef.current) {
      map.removeLayer(layerRef.current);
      layerRef.current = null;
    }
    setDrawn(false);
    if (onDone) onDone();
  };

  if (!active) return null;

  return (
    <div style={{
      position: 'absolute', top: 10, left: '50%', transform: 'translateX(-50%)',
      zIndex: 1000, display: 'flex', gap: 8, alignItems: 'center', pointerEvents: 'auto',
    }}>
      <div style={{
        background: '#dc2626', color: '#fff', padding: '6px 16px', borderRadius: 6,
        fontWeight: 600, fontSize: 13, boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
        pointerEvents: 'none',
      }}>
        {drawn ? 'Adjust if needed, then confirm' : 'Click and drag to draw dead zone rectangle'}
      </div>
      {drawn && (
        <>
          <button onClick={handleConfirm} style={{
            padding: '6px 14px', background: '#dc2626', color: '#fff', border: 'none',
            borderRadius: 6, fontWeight: 600, fontSize: 12, cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
          }}>Confirm</button>
          <button onClick={handleCancel} style={{
            padding: '6px 14px', background: '#475569', color: '#fff', border: 'none',
            borderRadius: 6, fontWeight: 600, fontSize: 12, cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
          }}>Cancel</button>
        </>
      )}
    </div>
  );
}

function isPointInPolygon(point, polygon) {
  const x = point.lat, y = point.lng;
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].lat, yi = polygon[i].lng;
    const xj = polygon[j].lat, yj = polygon[j].lng;
    const intersect = ((yi > y) !== (yj > y)) &&
      (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}
