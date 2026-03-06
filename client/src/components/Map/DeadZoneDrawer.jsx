import { useEffect, useCallback } from 'react';
import { useMap } from 'react-leaflet';

const DEFAULT_SIZE_FT = 20;
const FT_TO_DEG_LAT = 0.0000027;
const FT_TO_DEG_LNG = 0.0000034;

/**
 * Click on the map to place a default dead zone rectangle.
 * User can then select it and resize/rotate via ZoneHandles.
 */
export default function DeadZoneDrawer({ active, onAddDeadZone, onDone }) {
  const map = useMap();

  const buildDefaultRect = useCallback((center) => {
    const halfLat = (DEFAULT_SIZE_FT / 2) * FT_TO_DEG_LAT;
    const halfLng = (DEFAULT_SIZE_FT / 2) * FT_TO_DEG_LNG;
    return [
      [center.lat + halfLat, center.lng - halfLng],
      [center.lat + halfLat, center.lng + halfLng],
      [center.lat - halfLat, center.lng + halfLng],
      [center.lat - halfLat, center.lng - halfLng],
    ];
  }, []);

  useEffect(() => {
    if (!map || !active) return;

    const container = map.getContainer();
    container.style.cursor = 'crosshair';
    map.dragging.disable();

    const onClick = async (e) => {
      const corners = buildDefaultRect(e.latlng);
      if (onAddDeadZone) await onAddDeadZone(corners);
      if (onDone) onDone();
    };

    const onKeyDown = (e) => {
      if (e.key === 'Escape' && onDone) onDone();
    };

    map.on('click', onClick);
    document.addEventListener('keydown', onKeyDown);

    return () => {
      map.off('click', onClick);
      document.removeEventListener('keydown', onKeyDown);
      container.style.cursor = '';
      map.dragging.enable();
    };
  }, [map, active, buildDefaultRect, onAddDeadZone, onDone]);

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
        Click to place dead zone — resize after
      </div>
    </div>
  );
}
