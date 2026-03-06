import { useEffect, useRef, useCallback, useState } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';

const DEFAULT_WIDTH_FT = 20;
const WIDTH_STEP = 5;
const MIN_WIDTH = 5;
const MAX_WIDTH = 200;
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
  const p2Ref = useRef(null);
  const startScreenRef = useRef(null);
  const widthRef = useRef(DEFAULT_WIDTH_FT);
  const previewRef = useRef(null);
  const [widthFt, setWidthFt] = useState(DEFAULT_WIDTH_FT);

  const color = ZONE_COLORS[zoneType] || '#f97316';

  const buildRect = useCallback((p1, p2, wFt) => {
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
    if (!p1Ref.current || !p2Ref.current) return;
    const corners = buildRect(p1Ref.current, p2Ref.current, widthRef.current);
    if (!corners) return;

    if (previewRef.current) {
      previewRef.current.setLatLngs(corners);
    } else {
      previewRef.current = L.polygon(corners, {
        color, weight: 2, fillColor: color, fillOpacity: 0.25,
        dashArray: '6,4',
      }).addTo(map);
    }
  }, [map, buildRect, color]);

  const clearPreview = useCallback(() => {
    if (previewRef.current && map) map.removeLayer(previewRef.current);
    previewRef.current = null;
  }, [map]);

  const cancelDraw = useCallback(() => {
    drawingRef.current = false;
    p1Ref.current = null;
    p2Ref.current = null;
    startScreenRef.current = null;
    widthRef.current = DEFAULT_WIDTH_FT;
    setWidthFt(DEFAULT_WIDTH_FT);
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
    map.scrollWheelZoom.disable();

    const onMouseDown = (e) => {
      if (drawingRef.current) return;
      drawingRef.current = true;
      p1Ref.current = e.latlng;
      p2Ref.current = e.latlng;
      startScreenRef.current = e.containerPoint;
      widthRef.current = DEFAULT_WIDTH_FT;
      setWidthFt(DEFAULT_WIDTH_FT);
    };

    const onMouseMove = (e) => {
      if (!drawingRef.current || !p1Ref.current) return;
      p2Ref.current = e.latlng;
      updatePreview();
    };

    const onWheel = (e) => {
      if (!drawingRef.current) return;
      e.preventDefault();
      e.stopPropagation();
      const delta = e.deltaY < 0 ? WIDTH_STEP : -WIDTH_STEP;
      widthRef.current = Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, widthRef.current + delta));
      setWidthFt(widthRef.current);
      updatePreview();
    };

    const onMouseUp = async (e) => {
      if (!drawingRef.current || !p1Ref.current) return;

      const dx = e.containerPoint.x - startScreenRef.current.x;
      const dy = e.containerPoint.y - startScreenRef.current.y;
      if (Math.sqrt(dx * dx + dy * dy) < MIN_DRAG_PX) {
        cancelDraw();
        return;
      }

      const corners = buildRect(p1Ref.current, e.latlng, widthRef.current);

      clearPreview();
      drawingRef.current = false;
      p1Ref.current = null;
      p2Ref.current = null;
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
    container.addEventListener('wheel', onWheel, { passive: false });
    document.addEventListener('keydown', onKeyDown);

    return () => {
      map.off('mousedown', onMouseDown);
      map.off('mousemove', onMouseMove);
      map.off('mouseup', onMouseUp);
      container.removeEventListener('wheel', onWheel);
      document.removeEventListener('keydown', onKeyDown);
      container.style.cursor = '';
      map.dragging.enable();
      map.scrollWheelZoom.enable();
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
        {drawingRef.current
          ? `Width: ${widthFt}ft — scroll to adjust`
          : `Click and drag to draw ${typeLabels[zoneType] || 'zone'}`}
      </div>
    </div>
  );
}
