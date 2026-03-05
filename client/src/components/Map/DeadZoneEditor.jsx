import { useEffect, useRef, useState, useCallback } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';

const FT_TO_DEG_LAT = 0.0000027;
const FT_TO_DEG_LNG = 0.0000034;

export default function DeadZoneEditor({ deadZone, onUpdate, onClose }) {
  const map = useMap();
  const markersRef = useRef([]);
  const previewRef = useRef(null);
  const cornersRef = useRef(deadZone?.polygon || []);
  const [rotation, setRotation] = useState(0);
  const rotationRef = useRef(0);

  const getMidpoint = useCallback(() => {
    const pts = cornersRef.current;
    if (!pts.length) return [0, 0];
    const lat = pts.reduce((s, p) => s + p[0], 0) / pts.length;
    const lng = pts.reduce((s, p) => s + p[1], 0) / pts.length;
    return [lat, lng];
  }, []);

  const rotateCorners = useCallback((corners, angleDeg) => {
    if (angleDeg === 0) return corners;
    const [midLat, midLng] = getMidpoint();
    const rad = (angleDeg * Math.PI) / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);
    return corners.map(([lat, lng]) => {
      const dLat = lat - midLat;
      const dLng = lng - midLng;
      return [midLat + dLat * cos - dLng * sin, midLng + dLat * sin + dLng * cos];
    });
  }, [getMidpoint]);

  const updatePreview = useCallback(() => {
    const corners = rotateCorners(cornersRef.current, rotationRef.current);
    if (previewRef.current) {
      previewRef.current.setLatLngs(corners);
    }
  }, [rotateCorners]);

  const cleanup = useCallback(() => {
    markersRef.current.forEach((m) => map?.removeLayer(m));
    markersRef.current = [];
    if (previewRef.current && map) map.removeLayer(previewRef.current);
    previewRef.current = null;
  }, [map]);

  useEffect(() => {
    if (!map || !deadZone) return;

    cornersRef.current = [...deadZone.polygon];
    previewRef.current = L.polygon(deadZone.polygon, {
      color: '#f59e0b', weight: 2, fillColor: '#f59e0b', fillOpacity: 0.3, dashArray: '6,4',
    }).addTo(map);

    // Add draggable markers at each corner
    deadZone.polygon.forEach((pt, idx) => {
      const marker = L.marker(pt, {
        draggable: true,
        icon: L.divIcon({
          className: '',
          html: '<div style="width:12px;height:12px;background:#f59e0b;border:2px solid #fff;border-radius:50%;box-shadow:0 1px 4px rgba(0,0,0,0.4);"></div>',
          iconSize: [12, 12],
          iconAnchor: [6, 6],
        }),
      }).addTo(map);

      marker.on('drag', (e) => {
        const ll = e.target.getLatLng();
        cornersRef.current[idx] = [ll.lat, ll.lng];
        updatePreview();
      });

      markersRef.current.push(marker);
    });

    return cleanup;
  }, [map, deadZone]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSave = (e) => {
    e.stopPropagation();
    const finalCorners = rotateCorners(cornersRef.current, rotationRef.current);
    onUpdate(deadZone.id, { polygon: finalCorners });
    cleanup();
    onClose();
  };

  const handleCancel = (e) => {
    e.stopPropagation();
    cleanup();
    onClose();
  };

  if (!deadZone) return null;

  return (
    <div
      style={{
        position: 'absolute', bottom: 20, left: '50%', transform: 'translateX(-50%)',
        zIndex: 1000, display: 'flex', gap: 8, alignItems: 'center', pointerEvents: 'auto',
      }}
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <div style={{
        background: '#f59e0b', color: '#000', padding: '6px 16px', borderRadius: 6,
        fontWeight: 600, fontSize: 13, boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
      }}>
        Editing Dead Zone
      </div>
      <label style={{
        display: 'flex', alignItems: 'center', gap: 4, color: '#fff',
        fontSize: 12, fontWeight: 600, background: '#1e293b', padding: '4px 8px',
        borderRadius: 6, boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
      }}>
        Rot: {rotation}°
        <input
          type="range"
          value={rotation}
          onChange={(e) => {
            const val = Number(e.target.value);
            setRotation(val);
            rotationRef.current = val;
            updatePreview();
          }}
          min={-180}
          max={180}
          style={{ width: 80 }}
        />
      </label>
      <button onClick={handleSave} style={{
        padding: '6px 14px', background: '#059669', color: '#fff', border: 'none',
        borderRadius: 6, fontWeight: 600, fontSize: 12, cursor: 'pointer',
        boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
      }}>Save</button>
      <button onClick={handleCancel} style={{
        padding: '6px 14px', background: '#475569', color: '#fff', border: 'none',
        borderRadius: 6, fontWeight: 600, fontSize: 12, cursor: 'pointer',
        boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
      }}>Cancel</button>
    </div>
  );
}
