import React, { useEffect, useRef } from 'react';
import { Polygon, Polyline, Tooltip, useMap } from 'react-leaflet';
import { getSpotColor } from '../../utils/tierColors.js';

function featureToPositions(feature) {
  // Convert GeoJSON [lng, lat] ring to Leaflet [lat, lng] positions
  const coords = feature.geometry.coordinates[0];
  return coords.map(([lng, lat]) => [lat, lng]);
}

function featureCenter(feature) {
  const coords = feature.geometry.coordinates[0];
  const n = coords.length - 1; // exclude closing point
  let latSum = 0, lngSum = 0;
  for (let i = 0; i < n; i++) {
    lngSum += coords[i][0];
    latSum += coords[i][1];
  }
  return [latSum / n, lngSum / n];
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
      const [lat, lng] = featureCenter(feature);
      map.flyTo([lat, lng], map.getZoom(), { duration: 0.5 });
    } catch {
      // ignore
    }
  }, [selectedSpotId, spots, map]);

  return null;
}

export { featureCenter };

export default function SpotLayer({ spots, vendors, assignments, selectedSpotId, paths, onSpotClick, movingVendor, selectedSpotIds }) {
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
        const isMultiSelected = selectedSpotIds?.has?.(spotId);
        const isDeadZone = !!feature.properties?.deadZone;
        const isMoveSource = movingVendor?.sourceSpotId === spotId;
        const isMoveTarget = movingVendor && !assignedVendorId && !isDeadZone;

        let positions;
        try {
          positions = featureToPositions(feature);
        } catch {
          return null;
        }

        let strokeColor = color;
        let strokeWeight = 2;
        let fill = color;
        let fillOp = 0.35;
        let dashArray = undefined;

        if (isMoveSource) {
          strokeColor = '#22c55e';
          fill = '#22c55e';
          fillOp = 0.5;
          strokeWeight = 4;
        } else if (isMoveTarget) {
          strokeColor = '#86efac';
          fill = color;
          fillOp = 0.25;
          strokeWeight = 2;
          dashArray = '4,4';
        } else if (isMultiSelected) {
          strokeColor = '#f97316';
          fill = '#f97316';
          fillOp = 0.5;
          strokeWeight = 3;
        } else if (isSelected) {
          strokeColor = '#facc15';
          fill = '#facc15';
          fillOp = 0.6;
          strokeWeight = 4;
        } else if (isDeadZone) {
          fillOp = 0.5;
          dashArray = '6,4';
        }

        return (
          <Polygon
            key={spotId}
            positions={positions}
            pathOptions={{
              color: strokeColor,
              weight: strokeWeight,
              fillColor: fill,
              fillOpacity: fillOp,
              dashArray,
            }}
            eventHandlers={{
              click: (e) => {
                if (onSpotClick) onSpotClick(feature, e.originalEvent);
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
          </Polygon>
        );
      })}
    </>
  );
}
