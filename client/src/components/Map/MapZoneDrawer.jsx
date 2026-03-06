import { useEffect, useRef, useCallback } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';

const DEFAULT_WIDTH_FT = 20;
const FT_TO_DEG_LAT = 0.0000027;
const FT_TO_DEG_LNG = 0.0000034;
const MIN_DRAG_PX = 5;

const ZONE_COLORS = {
  barricade: '#f97316',
  loading: '#eab308',
  accessible: '#3b82f6',
  sightline: '#a855f7',
};

export default function MapZoneDrawer({ active, zoneType, onAddMapZone, onDone }) {
  const map = useMap();
  const drawingRef = useRef(false);
  const p1Ref = useRef(null);
  const startScreenRef = useRef(null);
  const previewRef = useRef(null);
  const startMarkerRef = useRef(null);

  const color = ZONE_COLORS[zoneType] || '#f97316';

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

  const clearPreview = useCallback(() => {
    if (previewRef.current && map) map.removeLayer(previewRef.current);
    previewRef.current = null;
    if (startMarkerRef.current && map) map.removeLayer(startMarkerRef.current);
    startMarkerRef.current = null;
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

      startMarkerRef.current = L.circleMarker(e.latlng, {
        radius: 5, color, fillColor: '#fff', fillOpacity: 1, weight: 2,
      }).addTo(map);
    };

    const onMouseMove = (e) => {
      if (!drawingRef.current || !p1Ref.current) return;

      const corners = buildRotatedRect(p1Ref.current, e.latlng, DEFAULT_WIDTH_FT);
      if (!corners) return;

      if (previewRef.current) {
        previewRef.current.setLatLngs(corners);
      } else {
        previewRef.current = L.polygon(corners, {
          color, weight: 2, fillColor: color, fillOpacity: 0.25,
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

      const p1 = p1Ref.current;
      const p2 = e.latlng;
      const corners = buildRotatedRect(p1, p2, DEFAULT_WIDTH_FT);

      clearPreview();
      drawingRef.current = false;
      p1Ref.current = null;
      startScreenRef.current = null;

      if (!corners) return;

      if (onAddMapZone) await onAddMapZone({ type: zoneType, polygon: corners });
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

  const typeLabels = {
    barricade: 'Barricade',
    loading: 'Loading Zone',
    accessible: 'Accessible Route',
    sightline: 'Sight Line',
  };

  return (
    <div
      style={{
        position: 'absolute', top: 10, left: '50%', transform: 'translateX(-50%)',
        zIndex: 1000, pointerEvents: 'none',
      }}
    >
      <div style={{
        background: color, color: '#fff', padding: '6px 16px', borderRadius: 6,
        fontWeight: 600, fontSize: 13, boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
      }}>
        Click and drag to draw {typeLabels[zoneType] || 'zone'}
      </div>
    </div>
  );
}
