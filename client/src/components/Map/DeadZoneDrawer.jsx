import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';

export default function DeadZoneDrawer({ active, spots, onMarkDeadZones, onDone }) {
  const map = useMap();
  const layerRef = useRef(null);
  const phaseRef = useRef('draw'); // 'draw' | 'adjust'

  useEffect(() => {
    if (!map || !active) return;

    phaseRef.current = 'draw';

    map.pm.enableDraw('Polygon', {
      pathOptions: { color: '#dc2626', weight: 2, fillColor: '#dc2626', fillOpacity: 0.2 },
      tooltips: true,
    });

    const handleCreate = (e) => {
      const layer = e.layer;
      layerRef.current = layer;
      phaseRef.current = 'adjust';

      // Enable edit + rotate on the shape
      layer.pm.enable({ allowSelfIntersection: false });
      if (layer.pm.enableRotate) layer.pm.enableRotate();

      map.pm.disableDraw('Polygon');
    };

    map.on('pm:create', handleCreate);
    return () => {
      map.off('pm:create', handleCreate);
      map.pm.disableDraw('Polygon');
      if (layerRef.current) {
        map.removeLayer(layerRef.current);
        layerRef.current = null;
      }
    };
  }, [map, active]);

  const handleConfirm = () => {
    const layer = layerRef.current;
    if (!layer) return;

    const layerLatLngs = layer.getLatLngs()[0];

    // Find spots whose centers fall within the drawn polygon
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
    map.pm.disableDraw('Polygon');
    if (onDone) onDone();
  };

  if (!active) return null;

  return (
    <div
      style={{
        position: 'absolute',
        top: 10,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 1000,
        display: 'flex',
        gap: 8,
        alignItems: 'center',
        pointerEvents: 'auto',
      }}
    >
      <div style={{
        background: '#dc2626',
        color: '#fff',
        padding: '6px 16px',
        borderRadius: 6,
        fontWeight: 600,
        fontSize: 13,
        boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
        pointerEvents: 'none',
      }}>
        Click points to draw dead zone shape — double-click to finish
      </div>
      <button
        onClick={handleConfirm}
        style={{
          padding: '6px 14px', background: '#dc2626', color: '#fff', border: 'none',
          borderRadius: 6, fontWeight: 600, fontSize: 12, cursor: 'pointer',
          boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
        }}
      >
        Confirm
      </button>
      <button
        onClick={handleCancel}
        style={{
          padding: '6px 14px', background: '#475569', color: '#fff', border: 'none',
          borderRadius: 6, fontWeight: 600, fontSize: 12, cursor: 'pointer',
          boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
        }}
      >
        Cancel
      </button>
    </div>
  );
}

function isPointInPolygon(point, polygon) {
  const x = point.lat;
  const y = point.lng;
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
