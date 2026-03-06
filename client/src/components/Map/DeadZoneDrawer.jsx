import { useEffect, useRef, useCallback } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';

const MIN_DRAG_PX = 5;

export default function DeadZoneDrawer({ active, onAddDeadZone, onDone }) {
  const map = useMap();
  const drawingRef = useRef(false);
  const p1Ref = useRef(null);
  const startScreenRef = useRef(null);
  const previewRef = useRef(null);

  const buildRect = useCallback((c1, c2) => {
    return [
      [c1.lat, c1.lng],
      [c1.lat, c2.lng],
      [c2.lat, c2.lng],
      [c2.lat, c1.lng],
    ];
  }, []);

  const clearPreview = useCallback(() => {
    if (previewRef.current && map) map.removeLayer(previewRef.current);
    previewRef.current = null;
  }, [map]);

  const cancelDraw = useCallback(() => {
    drawingRef.current = false;
    p1Ref.current = null;
    startScreenRef.current = null;
    clearPreview();
  }, [clearPreview]);

  useEffect(() => {
    if (!map || !active) {
      cancelDraw();
      return;
    }

    const container = map.getContainer();
    container.style.cursor = 'crosshair';
    map.dragging.disable();

    const onMouseDown = (e) => {
      if (drawingRef.current) return;
      drawingRef.current = true;
      p1Ref.current = e.latlng;
      startScreenRef.current = e.containerPoint;
    };

    const onMouseMove = (e) => {
      if (!drawingRef.current || !p1Ref.current) return;

      const corners = buildRect(p1Ref.current, e.latlng);

      if (previewRef.current) {
        previewRef.current.setLatLngs(corners);
      } else {
        previewRef.current = L.polygon(corners, {
          color: '#dc2626', weight: 2, fillColor: '#dc2626', fillOpacity: 0.25,
          dashArray: '6,4',
        }).addTo(map);
      }
    };

    const onMouseUp = async (e) => {
      if (!drawingRef.current || !p1Ref.current) return;

      const dx = e.containerPoint.x - startScreenRef.current.x;
      const dy = e.containerPoint.y - startScreenRef.current.y;
      if (Math.sqrt(dx * dx + dy * dy) < MIN_DRAG_PX) {
        cancelDraw();
        return;
      }

      const corners = buildRect(p1Ref.current, e.latlng);

      clearPreview();
      drawingRef.current = false;
      p1Ref.current = null;
      startScreenRef.current = null;

      if (onAddDeadZone) await onAddDeadZone(corners);
      if (onDone) onDone();
    };

    const onKeyDown = (e) => {
      if (e.key === 'Escape' && drawingRef.current) {
        cancelDraw();
      }
    };

    map.on('mousedown', onMouseDown);
    map.on('mousemove', onMouseMove);
    map.on('mouseup', onMouseUp);
    document.addEventListener('keydown', onKeyDown);

    return () => {
      map.off('mousedown', onMouseDown);
      map.off('mousemove', onMouseMove);
      map.off('mouseup', onMouseUp);
      document.removeEventListener('keydown', onKeyDown);
      container.style.cursor = '';
      map.dragging.enable();
    };
  }, [map, active]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!active) return null;

  return (
    <div
      style={{
        position: 'absolute', top: 10, left: '50%', transform: 'translateX(-50%)',
        zIndex: 1000, pointerEvents: 'none',
      }}
    >
      <div style={{
        background: '#dc2626', color: '#fff', padding: '6px 16px', borderRadius: 6,
        fontWeight: 600, fontSize: 13, boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
      }}>
        Click and drag to draw dead zone
      </div>
    </div>
  );
}
