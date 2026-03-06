import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';

/**
 * BoxSelect — Shift+drag on the map to draw a selection rectangle.
 * All spots whose center falls within the box get added to selectedSpotIds.
 */
export default function BoxSelect({ spots, onSelect }) {
  const map = useMap();
  const boxRef = useRef(null);
  const startRef = useRef(null);

  useEffect(() => {
    if (!map || !onSelect) return;

    const container = map.getContainer();

    // Create the visual box overlay
    const box = document.createElement('div');
    box.style.cssText = 'position:absolute;border:2px dashed #f97316;background:rgba(249,115,22,0.15);pointer-events:none;z-index:1000;display:none;';
    container.appendChild(box);
    boxRef.current = box;

    const onMouseDown = (e) => {
      if (!e.shiftKey) return;
      // Disable map dragging while box-selecting
      map.dragging.disable();
      const rect = container.getBoundingClientRect();
      startRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
      box.style.display = 'block';
      box.style.left = startRef.current.x + 'px';
      box.style.top = startRef.current.y + 'px';
      box.style.width = '0px';
      box.style.height = '0px';
    };

    const onMouseMove = (e) => {
      if (!startRef.current) return;
      const rect = container.getBoundingClientRect();
      const cx = e.clientX - rect.left;
      const cy = e.clientY - rect.top;
      const x = Math.min(startRef.current.x, cx);
      const y = Math.min(startRef.current.y, cy);
      const w = Math.abs(cx - startRef.current.x);
      const h = Math.abs(cy - startRef.current.y);
      box.style.left = x + 'px';
      box.style.top = y + 'px';
      box.style.width = w + 'px';
      box.style.height = h + 'px';
    };

    const onMouseUp = (e) => {
      if (!startRef.current) return;
      map.dragging.enable();
      box.style.display = 'none';

      const rect = container.getBoundingClientRect();
      const endX = e.clientX - rect.left;
      const endY = e.clientY - rect.top;

      const x1 = Math.min(startRef.current.x, endX);
      const y1 = Math.min(startRef.current.y, endY);
      const x2 = Math.max(startRef.current.x, endX);
      const y2 = Math.max(startRef.current.y, endY);
      startRef.current = null;

      // Only trigger if dragged at least 10px
      if (x2 - x1 < 10 && y2 - y1 < 10) return;

      // Convert pixel bounds to lat/lng
      const topLeft = map.containerPointToLatLng(L.point(x1, y1));
      const bottomRight = map.containerPointToLatLng(L.point(x2, y2));
      const bounds = L.latLngBounds(topLeft, bottomRight);

      // Find all spot centers within the box
      const ids = [];
      for (const feature of (spots?.features || [])) {
        if (!feature.properties?.id || feature.properties?.deadZone) continue;
        const coords = feature.geometry?.coordinates?.[0];
        if (!coords || coords.length < 2) continue;
        // Compute center
        const n = coords.length - 1;
        let latSum = 0, lngSum = 0;
        for (let i = 0; i < n; i++) {
          lngSum += coords[i][0];
          latSum += coords[i][1];
        }
        const center = L.latLng(latSum / n, lngSum / n);
        if (bounds.contains(center)) {
          ids.push(feature.properties.id);
        }
      }

      if (ids.length > 0) {
        onSelect(ids);
      }
    };

    container.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);

    return () => {
      container.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      if (box.parentNode) box.parentNode.removeChild(box);
    };
  }, [map, spots, onSelect]);

  return null;
}
