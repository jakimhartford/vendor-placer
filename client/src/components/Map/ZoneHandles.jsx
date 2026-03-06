import { useEffect, useRef, useCallback } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';

/**
 * Lucidchart-style selection handles for a polygon zone.
 * Corner handles scale width & height independently along the rectangle's own axes.
 * Edge midpoint handles scale a single axis only.
 * Rotation handle (curved arrow) above the top edge.
 */
export default function ZoneHandles({ polygon, color, onUpdate, onClose }) {
  const map = useMap();
  const outlineRef = useRef(null);
  const cornersRef = useRef([...polygon]);
  const handleMarkersRef = useRef([]);
  const edgeMarkersRef = useRef([]);
  const rotateMarkerRef = useRef(null);
  const rotatingRef = useRef(false);
  const baseAngleRef = useRef(0);
  const baseCornersRef = useRef(null);
  const dragAnchorRef = useRef(null);
  const dragBaseCornersRef = useRef(null);
  const dragAxisModeRef = useRef(null); // 'both', 'edge1', 'edge2'

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
    return [top[0] + dist * 0.3 + 0.00008, top[1]];
  }, [getCenter]);

  const cornerIcon = L.divIcon({
    className: '',
    html: `<div style="width:10px;height:10px;background:#fff;border:2px solid ${color};cursor:nwse-resize;"></div>`,
    iconSize: [10, 10],
    iconAnchor: [5, 5],
  });

  const edgeIcon = L.divIcon({
    className: '',
    html: `<div style="width:8px;height:8px;background:${color};border:1px solid #fff;cursor:pointer;border-radius:1px;"></div>`,
    iconSize: [8, 8],
    iconAnchor: [4, 4],
  });

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

  // Get the rectangle's local axes from the anchor corner
  const getLocalAxes = useCallback((basePts, anchorIdx) => {
    const anchor = basePts[anchorIdx];
    const adj1 = basePts[(anchorIdx + 1) % 4];
    const adj2 = basePts[(anchorIdx + 3) % 4];
    // axis1: anchor → adj1, axis2: anchor → adj2
    const len1 = Math.sqrt((adj1[0] - anchor[0]) ** 2 + (adj1[1] - anchor[1]) ** 2);
    const len2 = Math.sqrt((adj2[0] - anchor[0]) ** 2 + (adj2[1] - anchor[1]) ** 2);
    const ax1 = len1 > 0 ? [(adj1[0] - anchor[0]) / len1, (adj1[1] - anchor[1]) / len1] : [1, 0];
    const ax2 = len2 > 0 ? [(adj2[0] - anchor[0]) / len2, (adj2[1] - anchor[1]) / len2] : [0, 1];
    return { ax1, ax2 };
  }, []);

  const dot = (a, b) => a[0] * b[0] + a[1] * b[1];

  // Scale along rectangle's local axes — keeps rectangles as rectangles
  // axisMode: 'both' (corner), 'edge1' (scale along ax1 only), 'edge2' (scale along ax2 only)
  const scalePts = useCallback((basePts, anchorIdx, dragIdx, newDragPos, axisMode) => {
    const anchor = basePts[anchorIdx];
    const oldDrag = basePts[dragIdx];
    const { ax1, ax2 } = getLocalAxes(basePts, anchorIdx);

    const oldVec = [oldDrag[0] - anchor[0], oldDrag[1] - anchor[1]];
    const newVec = [newDragPos[0] - anchor[0], newDragPos[1] - anchor[1]];

    const oldProj1 = dot(oldVec, ax1);
    const oldProj2 = dot(oldVec, ax2);
    const newProj1 = dot(newVec, ax1);
    const newProj2 = dot(newVec, ax2);

    let sx = oldProj1 !== 0 ? newProj1 / oldProj1 : 1;
    let sy = oldProj2 !== 0 ? newProj2 / oldProj2 : 1;

    // Constrain axis based on mode
    if (axisMode === 'edge1') sy = 1;
    if (axisMode === 'edge2') sx = 1;

    return basePts.map(([lat, lng]) => {
      const v = [lat - anchor[0], lng - anchor[1]];
      const p1 = dot(v, ax1);
      const p2 = dot(v, ax2);
      return [
        anchor[0] + sx * p1 * ax1[0] + sy * p2 * ax2[0],
        anchor[1] + sx * p1 * ax1[1] + sy * p2 * ax2[1],
      ];
    });
  }, [getLocalAxes]);

  const getMidpoint = (p1, p2) => [(p1[0] + p2[0]) / 2, (p1[1] + p2[1]) / 2];

  const updateVisuals = useCallback(() => {
    const pts = cornersRef.current;
    if (outlineRef.current) outlineRef.current.setLatLngs(pts);
    handleMarkersRef.current.forEach((m, i) => {
      if (pts[i]) m.setLatLng(pts[i]);
    });
    // Update edge midpoint markers
    edgeMarkersRef.current.forEach((m, i) => {
      const p1 = pts[i];
      const p2 = pts[(i + 1) % 4];
      if (p1 && p2) m.setLatLng(getMidpoint(p1, p2));
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

  useEffect(() => {
    if (!map || !polygon?.length) return;

    cornersRef.current = [...polygon];

    // Selection outline
    outlineRef.current = L.polygon(polygon, {
      color, weight: 1.5, fill: false, dashArray: '4,3', interactive: false,
    }).addTo(map);

    // Corner handles — independent scaling along local axes
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
        dragAxisModeRef.current = 'both';
      });

      marker.on('drag', (e) => {
        if (dragBaseCornersRef.current == null) return;
        const ll = e.target.getLatLng();
        cornersRef.current = scalePts(
          dragBaseCornersRef.current,
          dragAnchorRef.current,
          idx,
          [ll.lat, ll.lng],
          dragAxisModeRef.current,
        );
        updateVisuals();
      });

      marker.on('dragend', () => {
        dragAnchorRef.current = null;
        dragBaseCornersRef.current = null;
        dragAxisModeRef.current = null;
        onUpdate([...cornersRef.current]);
      });

      handleMarkersRef.current.push(marker);
    });

    // Edge midpoint handles — single-axis scaling
    for (let i = 0; i < 4; i++) {
      const p1 = polygon[i];
      const p2 = polygon[(i + 1) % 4];
      const mid = getMidpoint(p1, p2);

      const edgeMarker = L.marker(mid, {
        draggable: true,
        icon: edgeIcon,
        zIndexOffset: 999,
      }).addTo(map);

      // Opposite edge midpoint index: edge i has opposite edge (i+2)%4
      // Anchor is the midpoint of the opposite edge
      // For edge between corners [i, i+1], the opposite edge is between [(i+2), (i+3)]
      // The axis to scale along is perpendicular to this edge (i.e. the other axis)
      const edgeIdx = i;

      edgeMarker.on('dragstart', () => {
        dragBaseCornersRef.current = [...cornersRef.current];
        // For edge between corners i and i+1:
        // The anchor is the opposite corner (i+2)
        // Scale only along axis2 (perpendicular to the edge being dragged)
        const oppIdx = (edgeIdx + 2) % 4;
        dragAnchorRef.current = oppIdx;
        // Edge between i and i+1 lies along ax1 from corner i's perspective
        // So dragging this edge should scale along ax2 (perpendicular)
        // But from opposite corner's perspective, the naming flips:
        // anchor is oppIdx, adj1 is (oppIdx+1)%4, so ax1 is the edge direction of opposite edge
        // We want to scale perpendicular to the dragged edge = along ax2 from anchor's frame
        // Actually: edge i..i+1 is parallel to edge (i+2)..(i+3)
        // From anchor (i+2), ax1 goes to (i+3), ax2 goes to (i+1)
        // The edge we're dragging (i..i+1) is perpendicular to ax2 from anchor
        // So we scale along ax2 only
        dragAxisModeRef.current = 'edge2';
      });

      edgeMarker.on('drag', (e) => {
        if (dragBaseCornersRef.current == null) return;
        const ll = e.target.getLatLng();
        // Use the dragged corner index closest to this edge as the drag reference
        const dragRefIdx = edgeIdx;
        cornersRef.current = scalePts(
          dragBaseCornersRef.current,
          dragAnchorRef.current,
          dragRefIdx,
          [ll.lat, ll.lng],
          dragAxisModeRef.current,
        );
        updateVisuals();
      });

      edgeMarker.on('dragend', () => {
        dragAnchorRef.current = null;
        dragBaseCornersRef.current = null;
        dragAxisModeRef.current = null;
        onUpdate([...cornersRef.current]);
      });

      edgeMarkersRef.current.push(edgeMarker);
    }

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
      edgeMarkersRef.current.forEach((m) => map.removeLayer(m));
      edgeMarkersRef.current = [];
      if (outlineRef.current) map.removeLayer(outlineRef.current);
      outlineRef.current = null;
      if (rotateMarkerRef.current) map.removeLayer(rotateMarkerRef.current);
      rotateMarkerRef.current = null;
    };
  }, [map, polygon]); // eslint-disable-line react-hooks/exhaustive-deps

  return null;
}
