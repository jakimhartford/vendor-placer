import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';

export default function FitBounds({ spots, paths }) {
  const map = useMap();
  const prevCount = useRef(0);

  useEffect(() => {
    const spotCount = spots?.features?.length || 0;
    const pathCount = paths?.length || 0;
    const totalCount = spotCount + pathCount;

    // Only fit when new spots/paths are added
    if (totalCount <= prevCount.current) {
      prevCount.current = totalCount;
      return;
    }
    prevCount.current = totalCount;

    // Collect all coordinates
    const lats = [];
    const lngs = [];

    // From spot polygons
    (spots?.features || []).forEach((f) => {
      if (f.geometry?.coordinates?.[0]) {
        for (const [lng, lat] of f.geometry.coordinates[0]) {
          lats.push(lat);
          lngs.push(lng);
        }
      }
    });

    // From drawn paths
    (paths || []).forEach((path) => {
      for (const [lng, lat] of path) {
        lats.push(lat);
        lngs.push(lng);
      }
    });

    if (lats.length === 0) return;

    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);

    map.fitBounds(
      [[minLat, minLng], [maxLat, maxLng]],
      { padding: [40, 40], maxZoom: 20, animate: true, duration: 0.5 }
    );
  }, [spots, paths, map]);

  return null;
}
