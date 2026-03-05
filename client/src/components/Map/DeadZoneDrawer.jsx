import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';

export default function DeadZoneDrawer({ active, spots, onMarkDeadZones, onDone }) {
  const map = useMap();

  useEffect(() => {
    if (!map || !active) return;

    // Enable rectangle draw with rotation support
    map.pm.enableDraw('Rectangle', {
      pathOptions: { color: '#dc2626', weight: 2, fillColor: '#dc2626', fillOpacity: 0.2 },
    });

    const handleCreate = (e) => {
      const layer = e.layer;

      // Enable rotation on the drawn shape
      if (layer.pm) {
        layer.pm.enableRotate();
      }

      // Add a confirm button overlay
      const confirmBtn = L.DomUtil.create('div');
      confirmBtn.innerHTML = `
        <div style="display:flex;gap:6px;">
          <button id="dz-confirm" style="padding:5px 12px;background:#dc2626;color:#fff;border:none;border-radius:4px;font-weight:600;font-size:12px;cursor:pointer;">
            Confirm Dead Zone
          </button>
          <button id="dz-cancel" style="padding:5px 12px;background:#475569;color:#fff;border:none;border-radius:4px;font-weight:600;font-size:12px;cursor:pointer;">
            Cancel
          </button>
        </div>
      `;

      const popup = L.popup({ closeButton: false, autoClose: false, closeOnClick: false })
        .setLatLng(layer.getBounds().getCenter())
        .setContent(confirmBtn)
        .openOn(map);

      const cleanup = () => {
        map.removeLayer(layer);
        map.closePopup(popup);
        map.pm.disableDraw('Rectangle');
      };

      // Use setTimeout to allow DOM to render before attaching listeners
      setTimeout(() => {
        const confirmEl = document.getElementById('dz-confirm');
        const cancelEl = document.getElementById('dz-cancel');

        if (confirmEl) {
          confirmEl.addEventListener('click', () => {
            // Get the final bounds (possibly rotated)
            const bounds = layer.getBounds();

            // Find spots whose centers fall within the shape
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

              // Check if center is inside the drawn layer
              // For rotated shapes, use point-in-polygon check
              const layerLatLngs = layer.getLatLngs()[0];
              if (isPointInPolygon(center, layerLatLngs)) {
                ids.push(feature.properties?.id);
              }
            }

            cleanup();
            if (ids.length > 0 && onMarkDeadZones) {
              onMarkDeadZones(ids);
            }
            if (onDone) onDone();
          });
        }

        if (cancelEl) {
          cancelEl.addEventListener('click', () => {
            cleanup();
            if (onDone) onDone();
          });
        }
      }, 0);
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
      Draw rectangle over spots — rotate if needed, then confirm
    </div>
  );
}

/** Ray-casting point-in-polygon test */
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
