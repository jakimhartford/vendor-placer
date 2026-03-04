import { useEffect } from 'react';
import { useMap, useMapEvents } from 'react-leaflet';

export default function SpotPlacer({ active, onSpotPlaced }) {
  const map = useMap();

  useEffect(() => {
    if (active) {
      map.getContainer().style.cursor = 'crosshair';
    } else {
      map.getContainer().style.cursor = '';
    }
    return () => {
      map.getContainer().style.cursor = '';
    };
  }, [active, map]);

  useMapEvents({
    click(e) {
      if (!active) return;
      onSpotPlaced({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });

  if (!active) return null;

  return (
    <div
      style={{
        position: 'absolute',
        top: 10,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 1000,
        background: '#facc15',
        color: '#000',
        padding: '6px 16px',
        borderRadius: 6,
        fontWeight: 600,
        fontSize: 13,
        boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
        pointerEvents: 'none',
      }}
    >
      Click map to place a spot
    </div>
  );
}
