import React from 'react';
import { Rectangle, Tooltip } from 'react-leaflet';
import { getSpotColor } from '../../utils/tierColors.js';

/**
 * Converts a GeoJSON Polygon feature to Leaflet LatLngBounds.
 * Expects the first ring of a rectangular polygon.
 */
function featureToBounds(feature) {
  const coords = feature.geometry.coordinates[0]; // outer ring
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

export default function SpotLayer({ spots, vendors, assignments }) {
  if (!spots?.features?.length) return null;

  const vendorMap = {};
  (vendors || []).forEach((v) => {
    vendorMap[v.id || v._id] = v;
  });

  return (
    <>
      {spots.features.map((feature, idx) => {
        if (!feature.geometry || feature.geometry.type !== 'Polygon') {
          return null;
        }

        const spotId = feature.properties?.id || feature.properties?.label || idx;
        const color = getSpotColor(feature, vendors || [], assignments || {});
        const assignedVendorId = assignments?.[spotId];
        const assignedVendor = assignedVendorId ? vendorMap[assignedVendorId] : null;

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
              color,
              weight: 2,
              fillColor: color,
              fillOpacity: 0.35,
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
