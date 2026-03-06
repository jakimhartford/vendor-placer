import { useEffect, useRef, useCallback } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';

/**
 * Lucidchart-style selection handles for a polygon zone.
 * Corner handles scale the shape proportionally (opposite corner anchored).
 * Rotation handle (curved arrow) above the top edge.
 */
export default function ZoneHandles({ polygon, color, onUpdate, onClose }) {
  const map = useMap();
  const outlineRef = useRef(null);
  const cornersRef = useRef([...polygon]);
  const handleMarkersRef = useRef([]);
  const rotateMarkerRef = useRef(null);
  const rotatingRef = useRef(false);
  const baseAngleRef = useRef(0);
  const baseCornersRef = useRef(null);
  // For proportional corner scaling
  const dragAnchorRef = useRef(null);
  const dragBaseCornersRef = useRef(null);

  const getCenter = useCallback((pts) => {
    const lat = pts.reduce((s, p) => s + p[0], 0) / pts.length;
    const lng = pts.reduce((s, p) => s + p[1], 0) / pts.length;
    return [lat, lng];
  }, []);

  const getRotateHandlePos = useCallback((pts) => {
    const topIdx = pts.reduce((best, p, i) => (p[0] > pts[best][0] ? i : best), 0);
    const top = pts[topIdx];
    const center = getCenter(pts);
    const dist = Math.abs(top[0] - center[0]);
    // Small offset just above the top point
    return [top[0] + dist * 0.3 + 0.00008, top[1]];
  }, [getCenter]);

  const cornerIcon = L.divIcon({
    className: '',
    html: `<div style="width:10px;height:10px;background:#fff;border:2px solid ${color};cursor:nwse-resize;"></div>`,
    iconSize: [10, 10],
    iconAnchor: [5, 5],
  });

  // Curved double-sided arrow for rotation
  const rotateIcon = L.divIcon({
    className: '',
    html: `<div style="
      width:20px;height:20px;border-radius:50%;
      border:2px solid ${color};border-bottom-color:transparent;
      position:relative;cursor:grab;background:rgba(255,255,255,0.9);
    ">
      <div style="position:absolute;top:-2px;right:-1px;font-size:8px;line-height:1;color:${color};">▶</div>
      <div style="position:absolute;bottom:-2px;left:-1px;font-size:8px;line-height:1;color:${color};transform:rotate(180deg);">▶</div>
    </div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  });

  const updateVisuals = useCallback(() => {
    const pts = cornersRef.current;
    if (outlineRef.current) outlineRef.current.setLatLngs(pts);
    handleMarkersRef.current.forEach((m, i) => {
      if (pts[i]) m.setLatLng(pts[i]);
    });
    const rotPos = getRotateHandlePos(pts);
    if (rotateMarkerRef.current) rotateMarkerRef.current.setLatLng(rotPos);
  }, [getRotateHandlePos]);

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

  // Scale polygon proportionally: anchor is the opposite corner, dragged corner
  // moves to new position, all other corners scale relative to anchor.
  const scalePts = useCallback((basePts, anchorIdx, dragIdx, newDragPos) => {
    const anchor = basePts[anchorIdx];
    const oldDrag = basePts[dragIdx];
    const oldDx = oldDrag[1] - anchor[1];
    const oldDy = oldDrag[0] - anchor[0];
    const newDx = newDragPos[1] - anchor[1];
    const newDy = newDragPos[0] - anchor[0];
    const sx = oldDx !== 0 ? newDx / oldDx : 1;
    const sy = oldDy !== 0 ? newDy / oldDy : 1;
    return basePts.map(([lat, lng]) => [
      anchor[0] + (lat - anchor[0]) * sy,
      anchor[1] + (lng - anchor[1]) * sx,
    ]);
  }, []);

  useEffect(() => {
    if (!map || !polygon?.length) return;

    cornersRef.current = [...polygon];

    // Selection outline
    outlineRef.current = L.polygon(polygon, {
      color, weight: 1.5, fill: false, dashArray: '4,3', interactive: false,
    }).addTo(map);

    // Corner handles — proportional scaling
    polygon.forEach((pt, idx) => {
      const marker = L.marker(pt, {
        draggable: true,
        icon: cornerIcon,
        zIndexOffset: 1000,
      }).addTo(map);

      const oppositeIdx = (idx + 2) % polygon.length;

      marker.on('dragstart', () => {
        dragAnchorRef.current = oppositeIdx;
        dragBaseCornersRef.current = [...cornersRef.current];
      });

      marker.on('drag', (e) => {
        if (dragBaseCornersRef.current == null) return;
        const ll = e.target.getLatLng();
        cornersRef.current = scalePts(
          dragBaseCornersRef.current,
          dragAnchorRef.current,
          idx,
          [ll.lat, ll.lng],
        );
        updateVisuals();
      });

      marker.on('dragend', () => {
        dragAnchorRef.current = null;
        dragBaseCornersRef.current = null;
        onUpdate([...cornersRef.current]);
      });

      handleMarkersRef.current.push(marker);
    });

    // Rotation handle
    const rotPos = getRotateHandlePos(polygon);

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
    };
  }, [map, polygon]); // eslint-disable-line react-hooks/exhaustive-deps

  return null;
}
