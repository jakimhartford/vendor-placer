import { useEffect, useRef, useCallback } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';

/**
 * Lucidchart-style selection handles for a polygon zone.
 * Shows: bounding outline, 4 corner drag handles (squares),
 * and a rotation handle (circle above top edge).
 *
 * Props:
 *   polygon  – [[lat, lng], ...] (4 corners)
 *   color    – stroke color for the selection outline
 *   onUpdate – (newPolygon) => void
 *   onClose  – () => void  (called on Escape or click-away)
 */
export default function ZoneHandles({ polygon, color, onUpdate, onClose }) {
  const map = useMap();
  const outlineRef = useRef(null);
  const cornersRef = useRef([...polygon]);
  const handleMarkersRef = useRef([]);
  const rotateMarkerRef = useRef(null);
  const rotateLineRef = useRef(null);
  const rotatingRef = useRef(false);
  const rotateStartAngleRef = useRef(0);
  const baseAngleRef = useRef(0);
  const baseCornersRef = useRef(null);

  const getCenter = useCallback((pts) => {
    const lat = pts.reduce((s, p) => s + p[0], 0) / pts.length;
    const lng = pts.reduce((s, p) => s + p[1], 0) / pts.length;
    return [lat, lng];
  }, []);

  const getRotateHandlePos = useCallback((pts) => {
    // Position above the top-most point
    const topIdx = pts.reduce((best, p, i) => (p[0] > pts[best][0] ? i : best), 0);
    const top = pts[topIdx];
    const center = getCenter(pts);
    // Offset further from center, above the top point
    const offsetLat = (top[0] - center[0]) * 0.4;
    return [top[0] + Math.abs(offsetLat) + 0.00015, (pts[topIdx][1] + center[1]) / 2 + (top[1] - center[1]) * 0.2];
  }, [getCenter]);

  const cornerIcon = L.divIcon({
    className: '',
    html: `<div style="width:10px;height:10px;background:#fff;border:2px solid ${color};cursor:nwse-resize;"></div>`,
    iconSize: [10, 10],
    iconAnchor: [5, 5],
  });

  const rotateIcon = L.divIcon({
    className: '',
    html: `<div style="width:14px;height:14px;background:#fff;border:2px solid ${color};border-radius:50%;cursor:grab;display:flex;align-items:center;justify-content:center;font-size:9px;">↻</div>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7],
  });

  const updateVisuals = useCallback(() => {
    const pts = cornersRef.current;
    if (outlineRef.current) outlineRef.current.setLatLngs(pts);
    handleMarkersRef.current.forEach((m, i) => {
      if (pts[i]) m.setLatLng(pts[i]);
    });
    const rotPos = getRotateHandlePos(pts);
    if (rotateMarkerRef.current) rotateMarkerRef.current.setLatLng(rotPos);
    const center = getCenter(pts);
    const topIdx = pts.reduce((best, p, i) => (p[0] > pts[best][0] ? i : best), 0);
    if (rotateLineRef.current) rotateLineRef.current.setLatLngs([pts[topIdx], rotPos]);
  }, [getCenter, getRotateHandlePos]);

  const rotatePts = useCallback((pts, center, angleDeg) => {
    const rad = (angleDeg * Math.PI) / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);
    return pts.map(([lat, lng]) => {
      const dLat = lat - center[0];
      const dLng = lng - center[1];
      return [
        center[0] + dLat * cos - dLng * sin,
        center[1] + dLat * sin + dLng * cos,
      ];
    });
  }, []);

  useEffect(() => {
    if (!map || !polygon?.length) return;

    cornersRef.current = [...polygon];

    // Selection outline (dashed blue)
    outlineRef.current = L.polygon(polygon, {
      color, weight: 1.5, fill: false, dashArray: '4,3', interactive: false,
    }).addTo(map);

    // Corner handles
    polygon.forEach((pt, idx) => {
      const marker = L.marker(pt, {
        draggable: true,
        icon: cornerIcon,
        zIndexOffset: 1000,
      }).addTo(map);

      marker.on('drag', (e) => {
        const ll = e.target.getLatLng();
        cornersRef.current[idx] = [ll.lat, ll.lng];
        updateVisuals();
      });

      marker.on('dragend', () => {
        onUpdate([...cornersRef.current]);
      });

      handleMarkersRef.current.push(marker);
    });

    // Rotation handle
    const rotPos = getRotateHandlePos(polygon);
    const topIdx = polygon.reduce((best, p, i) => (p[0] > polygon[best][0] ? i : best), 0);

    rotateLineRef.current = L.polyline([polygon[topIdx], rotPos], {
      color, weight: 1, dashArray: '3,3', interactive: false,
    }).addTo(map);

    rotateMarkerRef.current = L.marker(rotPos, {
      draggable: true,
      icon: rotateIcon,
      zIndexOffset: 1001,
    }).addTo(map);

    rotateMarkerRef.current.on('dragstart', () => {
      rotatingRef.current = true;
      baseCornersRef.current = [...cornersRef.current];
      const center = getCenter(cornersRef.current);
      const handlePos = rotateMarkerRef.current.getLatLng();
      baseAngleRef.current = Math.atan2(handlePos.lng - center[1], handlePos.lat - center[0]);
    });

    rotateMarkerRef.current.on('drag', (e) => {
      if (!rotatingRef.current || !baseCornersRef.current) return;
      const center = getCenter(baseCornersRef.current);
      const handlePos = e.target.getLatLng();
      const currentAngle = Math.atan2(handlePos.lng - center[1], handlePos.lat - center[0]);
      const deltaRad = currentAngle - baseAngleRef.current;
      const deltaDeg = (deltaRad * 180) / Math.PI;
      cornersRef.current = rotatePts(baseCornersRef.current, center, deltaDeg);
      updateVisuals();
    });

    rotateMarkerRef.current.on('dragend', () => {
      rotatingRef.current = false;
      baseCornersRef.current = null;
      onUpdate([...cornersRef.current]);
    });

    // Escape to close
    const onKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      handleMarkersRef.current.forEach((m) => map.removeLayer(m));
      handleMarkersRef.current = [];
      if (outlineRef.current) map.removeLayer(outlineRef.current);
      outlineRef.current = null;
      if (rotateMarkerRef.current) map.removeLayer(rotateMarkerRef.current);
      rotateMarkerRef.current = null;
      if (rotateLineRef.current) map.removeLayer(rotateLineRef.current);
      rotateLineRef.current = null;
    };
  }, [map, polygon]); // eslint-disable-line react-hooks/exhaustive-deps

  return null;
}
