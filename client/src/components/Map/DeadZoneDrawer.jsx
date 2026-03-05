import { useEffect, useRef, useState } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';

export default function DeadZoneDrawer({ active, spots, onMarkDeadZones, onDone }) {
  const map = useMap();
  const startRef = useRef(null);
  const rectRef = useRef(null);
  const [hasRect, setHasRect] = useState(false);

  useEffect(() => {
    if (!map || !active) return;

    startRef.current = null;
    rectRef.current = null;
    setHasRect(false);
    map.getContainer().style.cursor = 'crosshair';

    const onMouseDown = (e) => {
      if (hasRect) return;
      startRef.current = e.latlng;
      map.dragging.disable();
    };

    const onMouseMove = (e) => {
      if (!startRef.current) return;
      const bounds = L.latLngBounds(startRef.current, e.latlng);
      if (rectRef.current) {
        rectRef.current.setBounds(bounds);
      } else {
        rectRef.current = L.rectangle(bounds, {
          color: '#dc2626', weight: 2, fillColor: '#dc2626', fillOpacity: 0.2,
        }).addTo(map);
      }
    };

    const onMouseUp = () => {
      if (!startRef.current) return;
      startRef.current = null;
      map.dragging.enable();
      if (rectRef.current) {
        setHasRect(true);
        // Enable editing so user can adjust corners
        if (rectRef.current.pm) {
          rectRef.current.pm.enable();
          if (rectRef.current.pm.enableRotate) rectRef.current.pm.enableRotate();
        }
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
      if (rectRef.current) {
        map.removeLayer(rectRef.current);
        rectRef.current = null;
      }
    };
  }, [map, active]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleConfirm = () => {
    const layer = rectRef.current;
    if (!layer) return;

    const layerLatLngs = layer.getLatLngs()[0];

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
      if (isPointInPolygon(center, layerLatLngs)) {
        ids.push(feature.properties?.id);
      }
    }

    map.removeLayer(layer);
    rectRef.current = null;
    setHasRect(false);

    if (ids.length > 0 && onMarkDeadZones) {
      onMarkDeadZones(ids);
    }
    if (onDone) onDone();
  };

  const handleCancel = () => {
    if (rectRef.current) {
      map.removeLayer(rectRef.current);
      rectRef.current = null;
    }
    setHasRect(false);
    if (onDone) onDone();
  };

  if (!active) return null;

  return (
    <div
      style={{
        position: 'absolute',
        top: 10,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 1000,
        display: 'flex',
        gap: 8,
        alignItems: 'center',
        pointerEvents: 'auto',
      }}
    >
      <div style={{
        background: '#dc2626',
        color: '#fff',
        padding: '6px 16px',
        borderRadius: 6,
        fontWeight: 600,
        fontSize: 13,
        boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
        pointerEvents: 'none',
      }}>
        {hasRect ? 'Adjust shape, then confirm' : 'Click and drag to draw dead zone'}
      </div>
      {hasRect && (
        <>
          <button
            onClick={handleConfirm}
            style={{
              padding: '6px 14px', background: '#dc2626', color: '#fff', border: 'none',
              borderRadius: 6, fontWeight: 600, fontSize: 12, cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
            }}
          >
            Confirm
          </button>
          <button
            onClick={handleCancel}
            style={{
              padding: '6px 14px', background: '#475569', color: '#fff', border: 'none',
              borderRadius: 6, fontWeight: 600, fontSize: 12, cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
            }}
          >
            Cancel
          </button>
        </>
      )}
    </div>
  );
}

function isPointInPolygon(point, polygon) {
  const x = point.lat;
  const y = point.lng;
  let inside = false;

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].lat, yi = polygon[i].lng;
    const xj = polygon[j].lat, yj = polygon[j].lng;

    const intersect = ((yi > y) !== (yj > y)) &&
      (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }

  return inside;
}
