import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';

export default function FitBounds({ spots }) {
  const map = useMap();
  const prevCount = useRef(0);

  useEffect(() => {
    const spotCount = spots?.features?.length || 0;

    if (spotCount <= prevCount.current) {
      prevCount.current = spotCount;
      return;
    }
    prevCount.current = spotCount;

    const lats = [];
    const lngs = [];

    (spots?.features || []).forEach((f) => {
      if (f.geometry?.coordinates?.[0]) {
        for (const [lng, lat] of f.geometry.coordinates[0]) {
          lats.push(lat);
          lngs.push(lng);
        }
      }
    });

    if (lats.length === 0) return;

    map.fitBounds(
      [[Math.min(...lats), Math.min(...lngs)], [Math.max(...lats), Math.max(...lngs)]],
      { padding: [40, 40], maxZoom: 20, animate: true, duration: 0.5 }
    );
  }, [spots, map]);

  return null;
}
