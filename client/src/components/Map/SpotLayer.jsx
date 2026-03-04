import React, { useEffect, useRef } from 'react';
import { Rectangle, Polyline, Tooltip, useMap } from 'react-leaflet';
import { getSpotColor } from '../../utils/tierColors.js';

function featureToBounds(feature) {
  const coords = feature.geometry.coordinates[0];
  let minLat = Infinity,
    maxLat = -Infinity,
    minLng = Infinity,
    maxLng = -Infinity;

  for (const [lng, lat] of coords) {
    if (lat < minLat) minLat = lat;
    if (lat > maxLat) maxLat = lat;
    if (lng < minLng) minLng = lng;
    if (lng > maxLng) maxLng = lng;
  }

  return [
    [minLat, minLng],
    [maxLat, maxLng],
  ];
}

function SelectedSpotPanner({ selectedSpotId, spots }) {
  const map = useMap();
  const prevId = useRef(null);

  useEffect(() => {
    if (!selectedSpotId || selectedSpotId === prevId.current) return;
    prevId.current = selectedSpotId;

    const feature = spots?.features?.find((f) => f.properties?.id === selectedSpotId);
    if (!feature) return;

    try {
      const bounds = featureToBounds(feature);
      const centerLat = (bounds[0][0] + bounds[1][0]) / 2;
      const centerLng = (bounds[0][1] + bounds[1][1]) / 2;
      map.flyTo([centerLat, centerLng], 19, { duration: 0.5 });
    } catch {
      // ignore
    }
  }, [selectedSpotId, spots, map]);

  return null;
}

export default function SpotLayer({ spots, vendors, assignments, selectedSpotId, paths }) {
  const hasSpots = spots?.features?.length > 0;
  const hasPaths = paths?.length > 0;
  if (!hasSpots && !hasPaths) return null;

  const vendorMap = {};
  (vendors || []).forEach((v) => {
    vendorMap[v.id || v._id] = v;
  });

  return (
    <>
      <SelectedSpotPanner selectedSpotId={selectedSpotId} spots={spots} />
      {/* Render drawn street paths as dashed lines */}
      {(paths || []).map((pathCoords, i) => (
        <Polyline
          key={`path-${i}`}
          positions={pathCoords.map(([lng, lat]) => [lat, lng])}
          pathOptions={{
            color: '#ffffff',
            weight: 2,
            dashArray: '8,6',
            opacity: 0.7,
          }}
        />
      ))}
      {(spots?.features || []).map((feature, idx) => {
        if (!feature.geometry || feature.geometry.type !== 'Polygon') {
          return null;
        }

        const spotId = feature.properties?.id || feature.properties?.label || idx;
        const color = getSpotColor(feature, vendors || [], assignments || {});
        const assignedVendorId = assignments?.[spotId];
        const assignedVendor = assignedVendorId ? vendorMap[assignedVendorId] : null;
        const isSelected = spotId === selectedSpotId;

        let bounds;
        try {
          bounds = featureToBounds(feature);
        } catch {
          return null;
        }

        return (
          <Rectangle
            key={spotId}
            bounds={bounds}
            pathOptions={{
              color: isSelected ? '#facc15' : color,
              weight: isSelected ? 4 : 2,
              fillColor: isSelected ? '#facc15' : color,
              fillOpacity: isSelected ? 0.6 : 0.35,
            }}
            eventHandlers={{
              click: () => {
                console.log('Spot clicked:', feature.properties, assignedVendor);
              },
            }}
          >
            <Tooltip sticky>
              <div style={{ fontSize: 12 }}>
                <strong>{feature.properties?.label || `Spot ${idx + 1}`}</strong>
                {assignedVendor && (
                  <>
                    <br />
                    {assignedVendor.name}
                    <br />
                    {assignedVendor.category} &middot;{' '}
                    <span style={{ textTransform: 'capitalize' }}>
                      {assignedVendor.tier}
                    </span>
                  </>
                )}
              </div>
            </Tooltip>
          </Rectangle>
        );
      })}
    </>
  );
}
