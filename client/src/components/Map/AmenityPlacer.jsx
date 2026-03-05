import { useEffect } from 'react';
import { useMap } from 'react-leaflet';

export default function AmenityPlacer({ active, amenityType, onPlace }) {
  const map = useMap();

  useEffect(() => {
    if (!map || !active) return;

    map.getContainer().style.cursor = 'crosshair';

    const onClick = (e) => {
      if (onPlace) {
        onPlace({ type: amenityType || 'power', lat: e.latlng.lat, lng: e.latlng.lng });
      }
    };

    map.on('click', onClick);
    return () => {
      map.off('click', onClick);
      map.getContainer().style.cursor = '';
    };
  }, [map, active, amenityType, onPlace]);

  if (!active) return null;

  return (
    <div style={{
      position: 'absolute', top: 10, left: '50%', transform: 'translateX(-50%)',
      zIndex: 1000, background: '#f59e0b', color: '#000', padding: '6px 16px',
      borderRadius: 6, fontWeight: 600, fontSize: 13, boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
      pointerEvents: 'none',
    }}>
      Click map to place {amenityType || 'amenity'}
    </div>
  );
}
