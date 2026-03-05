import { useEffect, useRef, useState, useCallback } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';

const DEFAULT_WIDTH_FT = 20;
const FT_TO_DEG_LAT = 0.0000027;
const FT_TO_DEG_LNG = 0.0000034;

export default function DeadZoneDrawer({ active, onAddDeadZone, onDone }) {
  const map = useMap();
  const markersRef = useRef([]);
  const previewRef = useRef(null);
  const lineRef = useRef(null);
  const pointsRef = useRef([]);
  const widthRef = useRef(DEFAULT_WIDTH_FT);
  const [phase, setPhase] = useState('idle');
  const [widthFt, setWidthFt] = useState(DEFAULT_WIDTH_FT);

  const buildRotatedRect = useCallback((p1, p2, wFt) => {
    const dx = p2.lng - p1.lng;
    const dy = p2.lat - p1.lat;
    const len = Math.sqrt(dx * dx + dy * dy);
    if (len === 0) return null;

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

  const updatePreview = useCallback(() => {
    if (pointsRef.current.length < 2) return;
    const [p1, p2] = pointsRef.current;
    const corners = buildRotatedRect(p1, p2, widthRef.current);
    if (!corners) return;

    if (previewRef.current) {
      previewRef.current.setLatLngs(corners);
    } else {
      previewRef.current = L.polygon(corners, {
        color: '#dc2626', weight: 2, fillColor: '#dc2626', fillOpacity: 0.25,
        dashArray: '6,4',
      }).addTo(map);
    }

    if (lineRef.current) {
      lineRef.current.setLatLngs(pointsRef.current);
    }
  }, [map, buildRotatedRect]);

  const clearAll = useCallback(() => {
    markersRef.current.forEach((m) => map?.removeLayer(m));
    markersRef.current = [];
    if (previewRef.current && map) map.removeLayer(previewRef.current);
    previewRef.current = null;
    if (lineRef.current && map) map.removeLayer(lineRef.current);
    lineRef.current = null;
    pointsRef.current = [];
  }, [map]);

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

      const marker = L.circleMarker(latlng, {
        radius: 7, color: '#dc2626', fillColor: '#fff', fillOpacity: 1, weight: 2,
        interactive: true,
      }).addTo(map);
      markersRef.current.push(marker);

      if (pointsRef.current.length === 1) {
        setPhase('second');
      } else if (pointsRef.current.length === 2) {
        lineRef.current = L.polyline(pointsRef.current, {
          color: '#dc2626', weight: 1, dashArray: '4,4', opacity: 0.5,
        }).addTo(map);
        updatePreview();
        map.getContainer().style.cursor = '';
        setPhase('confirm');

        // Replace circle markers with draggable markers
        markersRef.current.forEach((m) => map.removeLayer(m));
        markersRef.current = [];

        pointsRef.current.forEach((pt, idx) => {
          const dragMarker = L.marker(pt, {
            draggable: true,
            icon: L.divIcon({
              className: '',
              html: `<div style="width:14px;height:14px;background:#dc2626;border:2px solid #fff;border-radius:50%;box-shadow:0 1px 4px rgba(0,0,0,0.4);"></div>`,
              iconSize: [14, 14],
              iconAnchor: [7, 7],
            }),
          }).addTo(map);

          dragMarker.on('drag', (e) => {
            pointsRef.current[idx] = e.target.getLatLng();
            updatePreview();
          });

          markersRef.current.push(dragMarker);
        });
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
    widthRef.current = val;
    updatePreview();
  };

  const handleConfirm = async (e) => {
    e.stopPropagation();
    if (pointsRef.current.length < 2) return;
    const [p1, p2] = pointsRef.current;
    const corners = buildRotatedRect(p1, p2, widthRef.current);
    if (!corners) return;

    clearAll();
    setPhase('idle');

    // Send polygon coordinates to server — server handles overlap detection & spot removal
    if (onAddDeadZone) {
      await onAddDeadZone(corners);
    }
    if (onDone) onDone();
  };

  const handleCancel = (e) => {
    e.stopPropagation();
    clearAll();
    setPhase('idle');
    if (onDone) onDone();
  };

  if (!active) return null;

  const instructions = {
    first: 'Click the START of the dead zone',
    second: 'Click the END of the dead zone',
    confirm: 'Drag markers to adjust, then confirm',
  };

  return (
    <div
      style={{
        position: 'absolute', top: 10, left: '50%', transform: 'translateX(-50%)',
        zIndex: 1000, display: 'flex', gap: 8, alignItems: 'center', pointerEvents: 'auto',
      }}
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <div style={{
        background: '#dc2626', color: '#fff', padding: '6px 16px', borderRadius: 6,
        fontWeight: 600, fontSize: 13, boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
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
