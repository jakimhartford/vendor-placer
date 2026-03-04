import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';

export default function DeadZoneDrawer({ active, spots, onMarkDeadZones, onDone }) {
  const map = useMap();

  useEffect(() => {
    if (!map || !active) return;

    map.pm.enableDraw('Rectangle', {
      pathOptions: { color: '#dc2626', weight: 2, fillColor: '#dc2626', fillOpacity: 0.2 },
    });

    const handleCreate = (e) => {
      const bounds = e.layer.getBounds();
      map.removeLayer(e.layer);
      map.pm.disableDraw('Rectangle');

      // Find spots whose centers fall within the drawn rectangle
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

      if (ids.length > 0 && onMarkDeadZones) {
        onMarkDeadZones(ids);
      }
      if (onDone) onDone();
    };

    map.on('pm:create', handleCreate);
    return () => {
      map.off('pm:create', handleCreate);
      map.pm.disableDraw('Rectangle');
    };
  }, [map, active, spots, onMarkDeadZones, onDone]);

  if (!active) return null;

  return (
    <div
      style={{
        position: 'absolute',
        top: 10,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 1000,
        background: '#dc2626',
        color: '#fff',
        padding: '6px 16px',
        borderRadius: 6,
        fontWeight: 600,
        fontSize: 13,
        boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
        pointerEvents: 'none',
      }}
    >
      Draw rectangle over spots to mark as dead zones
    </div>
  );
}
