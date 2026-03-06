import React, { useEffect, useRef } from 'react';
import { Polygon, Polyline, Tooltip, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import { getSpotColor, getAssignedVendor, CATEGORY_SHORT, CATEGORY_COLORS, EMPTY_COLOR } from '../../utils/tierColors.js';

function featureToPositions(feature) {
  const coords = feature.geometry.coordinates[0];
  return coords.map(([lng, lat]) => [lat, lng]);
}

function featureCenter(feature) {
  const coords = feature.geometry.coordinates[0];
  const n = coords.length - 1;
  let latSum = 0, lngSum = 0;
  for (let i = 0; i < n; i++) {
    lngSum += coords[i][0];
    latSum += coords[i][1];
  }
  return [latSum / n, lngSum / n];
}

function createCategoryIcon(shortLabel, color) {
  return L.divIcon({
    className: '',
    html: `<div style="
      font-size:9px;
      font-weight:700;
      color:#fff;
      background:${color};
      border-radius:3px;
      padding:1px 3px;
      text-align:center;
      white-space:nowrap;
      line-height:1.2;
      border:1px solid rgba(255,255,255,0.3);
      text-shadow:0 1px 1px rgba(0,0,0,0.5);
      pointer-events:none;
    ">${shortLabel}</div>`,
    iconSize: [0, 0],
    iconAnchor: [0, 0],
  });
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
        const isEmpty = !assignedVendorId && !isDeadZone;

        let positions;
        try {
          positions = featureToPositions(feature);
        } catch {
          return null;
        }

        let strokeColor = color;
        let strokeWeight = 2;
        let fill = color;
        let fillOp = assignedVendor ? 0.55 : 0.15;
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
        } else if (isEmpty) {
          strokeColor = '#475569';
          fill = EMPTY_COLOR;
          fillOp = 0.12;
          dashArray = '3,3';
        }

        // Category label marker for assigned spots
        let categoryMarker = null;
        if (assignedVendor && !isMoveSource && !isSelected && !isMultiSelected) {
          const shortLabel = CATEGORY_SHORT[assignedVendor.category] || assignedVendor.category?.slice(0, 3)?.toUpperCase() || '?';
          const catColor = CATEGORY_COLORS[assignedVendor.category] || color;
          try {
            const center = featureCenter(feature);
            categoryMarker = (
              <Marker
                key={`label-${spotId}`}
                position={center}
                icon={createCategoryIcon(shortLabel, catColor)}
                interactive={false}
              />
            );
          } catch {
            // ignore
          }
        }

        return (
          <React.Fragment key={spotId}>
            <Polygon
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
                  {assignedVendor ? (
                    <>
                      <br />
                      {assignedVendor.name}
                      {assignedVendor.boothSize >= 2 && <span style={{ color: '#f59e0b' }}> (Double)</span>}
                      <br />
                      <span style={{ color: CATEGORY_COLORS[assignedVendor.category] || '#94a3b8' }}>
                        {assignedVendor.category}
                      </span>
                      {' \u00B7 '}
                      <span style={{ textTransform: 'capitalize' }}>
                        {assignedVendor.tier}
                      </span>
                    </>
                  ) : isDeadZone ? (
                    <><br /><span style={{ color: '#ef4444' }}>Dead Zone</span></>
                  ) : (
                    <><br /><span style={{ color: '#94a3b8' }}>Empty</span>
                    {feature.properties?.valueScore != null && (
                      <span style={{ color: '#64748b' }}> &middot; Score: {feature.properties.valueScore}</span>
                    )}
                    </>
                  )}
                </div>
              </Tooltip>
            </Polygon>
            {categoryMarker}
          </React.Fragment>
        );
      })}
    </>
  );
}
