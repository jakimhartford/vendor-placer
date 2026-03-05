import { useEffect, useRef, useState, useCallback } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';

const DEFAULT_WIDTH_FT = 20;
const FT_TO_DEG_LAT = 0.0000027;
const FT_TO_DEG_LNG = 0.0000034;

export default function DeadZoneDrawer({ active, spots, onMarkDeadZones, onDone }) {
  const map = useMap();
  const pointsRef = useRef([]);
  const markersRef = useRef([]);
  const previewRef = useRef(null);
  const lineRef = useRef(null);
  const [phase, setPhase] = useState('idle'); // 'idle' | 'first' | 'second' | 'confirm'
  const [widthFt, setWidthFt] = useState(DEFAULT_WIDTH_FT);

  const clearAll = useCallback(() => {
    markersRef.current.forEach((m) => map?.removeLayer(m));
    markersRef.current = [];
    if (previewRef.current && map) map.removeLayer(previewRef.current);
    previewRef.current = null;
    if (lineRef.current && map) map.removeLayer(lineRef.current);
    lineRef.current = null;
    pointsRef.current = [];
  }, [map]);

  const buildRotatedRect = useCallback((p1, p2, wFt) => {
    const dx = p2.lng - p1.lng;
    const dy = p2.lat - p1.lat;
    const len = Math.sqrt(dx * dx + dy * dy);
    if (len === 0) return null;

    // Normal vector (perpendicular) scaled to half-width
    const halfW_lat = (wFt / 2) * FT_TO_DEG_LAT;
    const halfW_lng = (wFt / 2) * FT_TO_DEG_LNG;
    const nx = -dy / len * halfW_lng;
    const ny = dx / len * halfW_lat;

    return [
      [p1.lat + ny, p1.lng + nx],
      [p2.lat + ny, p2.lng + nx],
      [p2.lat - ny, p2.lng - nx],
      [p1.lat - ny, p1.lng - nx],
    ];
  }, []);

  const updatePreview = useCallback((wFt) => {
    if (pointsRef.current.length < 2) return;
    const [p1, p2] = pointsRef.current;
    const corners = buildRotatedRect(p1, p2, wFt || widthFt);
    if (!corners) return;

    if (previewRef.current) {
      previewRef.current.setLatLngs(corners);
    } else {
      previewRef.current = L.polygon(corners, {
        color: '#dc2626', weight: 2, fillColor: '#dc2626', fillOpacity: 0.25,
        dashArray: '6,4',
      }).addTo(map);
    }
  }, [map, widthFt, buildRotatedRect]);

  useEffect(() => {
    if (!map || !active) {
      clearAll();
      setPhase('idle');
      return;
    }

    setPhase('first');
    map.getContainer().style.cursor = 'crosshair';

    const onClick = (e) => {
      if (pointsRef.current.length >= 2) return;

      const latlng = e.latlng;
      pointsRef.current.push(latlng);

      // Add marker
      const marker = L.circleMarker(latlng, {
        radius: 5, color: '#dc2626', fillColor: '#fff', fillOpacity: 1, weight: 2,
      }).addTo(map);
      markersRef.current.push(marker);

      if (pointsRef.current.length === 1) {
        setPhase('second');
      } else if (pointsRef.current.length === 2) {
        // Draw the centerline
        lineRef.current = L.polyline(pointsRef.current, {
          color: '#dc2626', weight: 1, dashArray: '4,4',
        }).addTo(map);
        updatePreview();
        map.getContainer().style.cursor = '';
        setPhase('confirm');
      }
    };

    map.on('click', onClick);
    return () => {
      map.off('click', onClick);
      map.getContainer().style.cursor = '';
    };
  }, [map, active]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleWidthChange = (e) => {
    const val = parseInt(e.target.value) || DEFAULT_WIDTH_FT;
    setWidthFt(val);
    updatePreview(val);
  };

  const handleConfirm = () => {
    if (pointsRef.current.length < 2) return;
    const [p1, p2] = pointsRef.current;
    const corners = buildRotatedRect(p1, p2, widthFt);
    if (!corners) return;

    const polyLatLngs = corners.map(([lat, lng]) => L.latLng(lat, lng));

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
      if (isPointInPolygon(center, polyLatLngs)) {
        ids.push(feature.properties?.id);
      }
    }

    clearAll();
    setPhase('idle');

    if (ids.length > 0 && onMarkDeadZones) {
      onMarkDeadZones(ids);
    }
    if (onDone) onDone();
  };

  const handleCancel = () => {
    clearAll();
    setPhase('idle');
    if (onDone) onDone();
  };

  if (!active) return null;

  const instructions = {
    first: 'Click the START of the dead zone line',
    second: 'Click the END of the dead zone line',
    confirm: 'Adjust width, then confirm',
  };

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
        {instructions[phase] || ''}
      </div>
      {phase === 'confirm' && (
        <>
          <label style={{
            display: 'flex', alignItems: 'center', gap: 4, color: '#fff',
            fontSize: 12, fontWeight: 600, background: '#1e293b', padding: '4px 8px',
            borderRadius: 6, boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
          }}>
            Width:
            <input
              type="number"
              value={widthFt}
              onChange={handleWidthChange}
              min={5}
              max={200}
              style={{
                width: 50, padding: '2px 4px', border: '1px solid #475569',
                borderRadius: 4, background: '#0f172a', color: '#fff', fontSize: 12,
                textAlign: 'center',
              }}
            />
            ft
          </label>
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
