import React from 'react';
import { useEffect } from 'react';
import { Marker, Tooltip, Popup } from 'react-leaflet';
import { useMap } from 'react-leaflet';
import L from 'leaflet';

const vehicleIcon = L.divIcon({
  className: '',
  html: '<div style="font-size:22px;text-align:center;filter:drop-shadow(0 1px 2px rgba(0,0,0,0.5));">\uD83D\uDE9A</div>',
  iconSize: [26, 26],
  iconAnchor: [13, 13],
});

function AccessPointPlacer({ active, onPlace }) {
  const map = useMap();

  useEffect(() => {
    if (!map || !active) return;
    map.getContainer().style.cursor = 'crosshair';

    const onClick = (e) => {
      if (onPlace) onPlace({ lat: e.latlng.lat, lng: e.latlng.lng, label: 'Access Point' });
    };

    map.on('click', onClick);
    return () => {
      map.off('click', onClick);
      map.getContainer().style.cursor = '';
    };
  }, [map, active, onPlace]);

  if (!active) return null;

  return (
    <div style={{
      position: 'absolute', top: 10, left: '50%', transform: 'translateX(-50%)',
      zIndex: 1000, background: '#10b981', color: '#fff', padding: '6px 16px',
      borderRadius: 6, fontWeight: 600, fontSize: 13, boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
      pointerEvents: 'none',
    }}>
      Click map to place access point
    </div>
  );
}

export default function AccessPointLayer({ accessPoints, onDelete, active, onPlace }) {
  return (
    <>
      <AccessPointPlacer active={active} onPlace={onPlace} />
      {(accessPoints || []).map((ap) => (
        <Marker key={ap.id} position={[ap.lat, ap.lng]} icon={vehicleIcon}>
          <Tooltip>{ap.label || 'Access Point'}</Tooltip>
          <Popup>
            <div style={{ textAlign: 'center', fontSize: 12 }}>
              <div style={{ fontWeight: 600, marginBottom: 4 }}>{ap.label || 'Access Point'}</div>
              {ap.notes && <div style={{ color: '#64748b', marginBottom: 4 }}>{ap.notes}</div>}
              <button
                onClick={() => onDelete(ap.id)}
                style={{
                  padding: '3px 10px', background: '#dc2626', color: '#fff',
                  border: 'none', borderRadius: 4, fontSize: 11, cursor: 'pointer',
                }}
              >
                Remove
              </button>
            </div>
          </Popup>
        </Marker>
      ))}
    </>
  );
}
