import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { MapContainer, TileLayer, Polygon, Tooltip } from 'react-leaflet';
import { fetchShareData } from '../api/index.js';
import { getSpotColor } from '../utils/tierColors.js';
import { GOOGLE_TILE_STYLES } from '../utils/constants.js';

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

export default function ShareView() {
  const { token } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchShareData(token)
      .then((d) => setData(d))
      .catch((err) => setError(err.response?.data?.error || 'Invalid or expired share link'))
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f172a', color: '#94a3b8' }}>
        Loading...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f172a', color: '#ef4444', flexDirection: 'column', gap: 12 }}>
        <div style={{ fontSize: 20, fontWeight: 700 }}>Share Link Error</div>
        <div>{error}</div>
      </div>
    );
  }

  const { project, vendor, assignedSpotIds, timeWindow } = data;
  const spots = project.spotsGeoJSON;
  const deadZones = project.deadZones || [];
  const assignedSet = new Set(assignedSpotIds || []);

  // Find center from assigned spot, or fallback to first spot
  let mapCenter = [29.2108, -81.0243];
  let mapZoom = 20;
  if (assignedSpotIds?.length && spots?.features) {
    const assignedFeature = spots.features.find((f) => f.properties?.id === assignedSpotIds[0]);
    if (assignedFeature) {
      mapCenter = featureCenter(assignedFeature);
    }
  }

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#0f172a' }}>
      {/* Info Panel */}
      <div style={{
        width: 280,
        padding: 20,
        background: '#16213e',
        color: '#e2e8f0',
        overflowY: 'auto',
        borderRight: '1px solid #334155',
      }}>
        <h2 style={{ margin: '0 0 4px', fontSize: 16 }}>{project.name}</h2>
        <p style={{ color: '#64748b', fontSize: 11, margin: '0 0 16px' }}>Shared vendor view</p>

        <div style={{
          background: '#0f172a',
          borderRadius: 8,
          padding: 14,
          marginBottom: 12,
        }}>
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 6 }}>{vendor.name}</div>
          <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 4, textTransform: 'capitalize' }}>
            Category: {vendor.category}
          </div>
          <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 4, textTransform: 'capitalize' }}>
            Tier: {vendor.tier}
          </div>
          {vendor.premium && (
            <div style={{ fontSize: 12, color: '#facc15', marginBottom: 4 }}>Premium Vendor</div>
          )}
          {(vendor.booths || 1) > 1 && (
            <div style={{ fontSize: 12, color: '#a78bfa', marginBottom: 4 }}>{vendor.booths} booths</div>
          )}
        </div>

        {assignedSpotIds?.length > 0 ? (
          <div style={{
            background: '#064e3b',
            border: '1px solid #34d399',
            borderRadius: 8,
            padding: 12,
            fontSize: 12,
          }}>
            <div style={{ fontWeight: 600, marginBottom: 4, color: '#34d399' }}>Your Spot{assignedSpotIds.length > 1 ? 's' : ''}</div>
            {spots?.features?.filter((f) => assignedSet.has(f.properties?.id)).map((f) => (
              <div key={f.properties.id} style={{ color: '#a7f3d0' }}>
                {f.properties.label || f.properties.id}
              </div>
            ))}
          </div>
        ) : (
          <div style={{
            background: '#7f1d1d',
            border: '1px solid #dc2626',
            borderRadius: 8,
            padding: 12,
            fontSize: 12,
            color: '#fca5a5',
          }}>
            No spot assigned yet
          </div>
        )}

        {timeWindow && (
          <div style={{
            background: '#1e3a5f',
            border: '1px solid #3b82f6',
            borderRadius: 8,
            padding: 12,
            fontSize: 12,
            marginTop: 12,
          }}>
            <div style={{ fontWeight: 600, marginBottom: 4, color: '#93c5fd' }}>Load-In Window</div>
            <div style={{ color: '#bfdbfe' }}>
              Area {timeWindow.area}: {timeWindow.start} - {timeWindow.end}
            </div>
          </div>
        )}

        {project.accessPoints?.length > 0 && (
          <div style={{
            background: '#064e3b',
            border: '1px solid #10b981',
            borderRadius: 8,
            padding: 12,
            fontSize: 12,
            marginTop: 12,
          }}>
            <div style={{ fontWeight: 600, marginBottom: 4, color: '#6ee7b7' }}>Vehicle Access Points</div>
            {project.accessPoints.map((ap, i) => (
              <div key={i} style={{ color: '#a7f3d0', marginBottom: 2 }}>
                {ap.label || 'Access Point'}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Map */}
      <div style={{ flex: 1 }}>
        <MapContainer
          center={mapCenter}
          zoom={mapZoom}
          minZoom={2}
          maxZoom={22}
          style={{ width: '100%', height: '100%' }}
          zoomControl={true}
        >
          <TileLayer
            attribution='&copy; Google Maps'
            url={GOOGLE_TILE_STYLES.streets.url}
            maxZoom={22}
          />

          {/* Dead zones */}
          {deadZones.map((dz, i) => {
            const coords = (dz.polygon || dz).map(([lng, lat]) => [lat, lng]);
            return (
              <Polygon
                key={`dz-${i}`}
                positions={coords}
                pathOptions={{ color: '#dc2626', fillColor: '#dc2626', fillOpacity: 0.3, dashArray: '6,4' }}
              />
            );
          })}

          {/* Spots */}
          {(spots?.features || []).map((feature, idx) => {
            if (!feature.geometry || feature.geometry.type !== 'Polygon') return null;
            const spotId = feature.properties?.id;
            const isAssigned = assignedSet.has(spotId);
            const isDeadZone = !!feature.properties?.deadZone;

            let positions;
            try {
              positions = featureToPositions(feature);
            } catch {
              return null;
            }

            const baseColor = isDeadZone ? '#dc2626' : '#475569';

            return (
              <Polygon
                key={spotId || idx}
                positions={positions}
                pathOptions={{
                  color: isAssigned ? '#22c55e' : baseColor,
                  weight: isAssigned ? 4 : 1.5,
                  fillColor: isAssigned ? '#22c55e' : baseColor,
                  fillOpacity: isAssigned ? 0.6 : 0.15,
                  dashArray: isDeadZone ? '6,4' : undefined,
                }}
              >
                <Tooltip sticky>
                  <div style={{ fontSize: 12 }}>
                    <strong>{feature.properties?.label || `Spot ${idx + 1}`}</strong>
                    {isAssigned && (
                      <>
                        <br />
                        <span style={{ color: '#22c55e', fontWeight: 600 }}>Your spot</span>
                      </>
                    )}
                  </div>
                </Tooltip>
              </Polygon>
            );
          })}
        </MapContainer>
      </div>
    </div>
  );
}
