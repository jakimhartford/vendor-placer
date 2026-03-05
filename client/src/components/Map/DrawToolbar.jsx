import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import '@geoman-io/leaflet-geoman-free';

export default function DrawToolbar({ onPathDrawn, streetDrawMode }) {
  const map = useMap();

  useEffect(() => {
    if (!map) return;
    map.pm.removeControls();

    const handleCreate = (e) => {
      // Only handle Line shapes — let other handlers (e.g. DeadZoneDrawer) manage their own
      if (e.shape !== 'Line') return;

      const geojson = e.layer.toGeoJSON();
      map.removeLayer(e.layer);

      if (geojson.geometry.type === 'LineString') {
        const coords = geojson.geometry.coordinates;
        if (onPathDrawn && coords.length >= 2) {
          onPathDrawn(coords);
        }
      }
    };

    map.on('pm:create', handleCreate);
    return () => {
      map.off('pm:create', handleCreate);
      map.pm.removeControls();
    };
  }, [map, onPathDrawn]);

  useEffect(() => {
    if (!map) return;
    if (streetDrawMode) {
      map.pm.enableDraw('Line', {
        snappable: true,
        snapDistance: 10,
        templineStyle: { color: '#facc15', dashArray: '8,6' },
        hintlineStyle: { color: '#facc15', dashArray: '4,4' },
        pathOptions: { color: '#facc15', weight: 3 },
      });
    } else {
      map.pm.disableDraw('Line');
    }
  }, [map, streetDrawMode]);

  if (!streetDrawMode) return null;

  return (
    <div
      style={{
        position: 'absolute',
        top: 10,
        left: 10,
        zIndex: 1000,
      }}
    >
      <div
        style={{
          padding: '8px 14px',
          background: '#facc15',
          color: '#000',
          borderRadius: 6,
          fontWeight: 600,
          fontSize: 13,
          boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
        }}
      >
        Click to draw line, double-click to finish
      </div>
    </div>
  );
}
