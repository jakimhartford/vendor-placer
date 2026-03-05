import { useEffect, useRef, useState, useCallback } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';

export default function DeadZoneDrawer({ active, spots, onMarkDeadZones, onDone }) {
  const map = useMap();
  const rectRef = useRef(null);
  const startRef = useRef(null);
  const drawingRef = useRef(false);
  const [phase, setPhase] = useState('idle'); // 'idle' | 'drawing' | 'adjusting'

  const cleanup = useCallback(() => {
    if (rectRef.current && map) {
      map.removeLayer(rectRef.current);
      rectRef.current = null;
    }
    startRef.current = null;
    drawingRef.current = false;
    setPhase('idle');
  }, [map]);

  useEffect(() => {
    if (!map || !active) {
      cleanup();
      return;
    }

    setPhase('drawing');
    map.getContainer().style.cursor = 'crosshair';

    const onMouseDown = (e) => {
      if (phase === 'adjusting') return;
      // Ignore clicks on UI elements
      if (e.originalEvent?.target !== map.getContainer() &&
          !map.getContainer().contains(e.originalEvent?.target)) return;

      startRef.current = e.latlng;
      drawingRef.current = true;
      map.dragging.disable();
    };

    const onMouseMove = (e) => {
      if (!drawingRef.current || !startRef.current) return;
      const bounds = L.latLngBounds(startRef.current, e.latlng);
      if (rectRef.current) {
        rectRef.current.setBounds(bounds);
      } else {
        rectRef.current = L.rectangle(bounds, {
          color: '#dc2626', weight: 2, fillColor: '#dc2626', fillOpacity: 0.25,
          dashArray: '6,4',
        }).addTo(map);
      }
    };

    const onMouseUp = () => {
      if (!drawingRef.current) return;
      drawingRef.current = false;
      map.dragging.enable();

      if (rectRef.current) {
        map.getContainer().style.cursor = '';
        setPhase('adjusting');
      }
    };

    map.on('mousedown', onMouseDown);
    map.on('mousemove', onMouseMove);
    map.on('mouseup', onMouseUp);

    return () => {
      map.off('mousedown', onMouseDown);
      map.off('mousemove', onMouseMove);
      map.off('mouseup', onMouseUp);
      map.dragging.enable();
      map.getContainer().style.cursor = '';
    };
  }, [map, active]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleConfirm = () => {
    const rect = rectRef.current;
    if (!rect) return;

    const bounds = rect.getBounds();

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
      if (bounds.contains(center)) {
        ids.push(feature.properties?.id);
      }
    }

    cleanup();
    map.getContainer().style.cursor = '';

    if (ids.length > 0 && onMarkDeadZones) {
      onMarkDeadZones(ids);
    }
    if (onDone) onDone();
  };

  const handleCancel = () => {
    cleanup();
    map.getContainer().style.cursor = '';
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
        {phase === 'adjusting'
          ? `Confirm to mark spots as dead zones`
          : 'Click and drag to draw dead zone rectangle'}
      </div>
      {phase === 'adjusting' && (
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
