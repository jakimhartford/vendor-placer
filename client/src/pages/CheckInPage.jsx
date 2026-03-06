import React, { useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { MapContainer, TileLayer, Polygon, Tooltip } from 'react-leaflet';
import useCheckIn from '../hooks/useCheckIn.js';
import { GOOGLE_TILE_STYLES } from '../utils/constants.js';

function featureToPositions(feature) {
  const coords = feature.geometry.coordinates[0];
  return coords.map(([lng, lat]) => [lat, lng]);
}

function featureCenter(feature) {
  const coords = feature.geometry.coordinates[0];
  const n = coords.length - 1;
  let latSum = 0, lngSum = 0;
  for (let i = 0; i < n; i++) { lngSum += coords[i][0]; latSum += coords[i][1]; }
  return [latSum / n, lngSum / n];
}

export default function CheckInPage() {
  const { eventId } = useParams();
  const { project, checkIns, loading, error, updateCheckIn } = useCheckIn(eventId);
  const [search, setSearch] = useState('');
  const [showMissing, setShowMissing] = useState(false);

  const vendorMap = useMemo(() => {
    const m = {};
    (project?.vendors || []).forEach((v) => { m[v.id] = v; });
    return m;
  }, [project]);

  const assignments = project?.placements?.assignments || {};
  const assignedVendorIds = useMemo(() => new Set(Object.values(assignments)), [assignments]);

  const vendorList = useMemo(() => {
    let list = (project?.vendors || []).filter((v) => assignedVendorIds.has(v.id));

    if (showMissing) {
      list = list.filter((v) => !checkIns[v.id]?.arrivedAt);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((v) => v.name.toLowerCase().includes(q) || v.category.toLowerCase().includes(q));
    }
    return list;
  }, [project, assignedVendorIds, checkIns, search, showMissing]);

  const summary = useMemo(() => {
    let arrived = 0, setup = 0;
    for (const vid of assignedVendorIds) {
      const ci = checkIns[vid];
      if (ci?.arrivedAt) arrived++;
      if (ci?.setupComplete) setup++;
    }
    return { total: assignedVendorIds.size, arrived, setup, missing: assignedVendorIds.size - arrived };
  }, [assignedVendorIds, checkIns]);

  // Map center from first spot
  const mapCenter = useMemo(() => {
    const feats = project?.spotsGeoJSON?.features;
    if (feats?.length) return featureCenter(feats[0]);
    return [29.2108, -81.0243];
  }, [project]);

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
        <div style={{ fontSize: 20, fontWeight: 700 }}>Check-In Error</div>
        <div>{error}</div>
      </div>
    );
  }

  const progressPct = summary.total > 0 ? Math.round((summary.arrived / summary.total) * 100) : 0;

  // Spot color based on check-in status
  const getSpotColor = (spotId) => {
    const vendorId = assignments[spotId];
    if (!vendorId) return '#475569'; // unassigned = gray
    const ci = checkIns[vendorId];
    if (ci?.setupComplete) return '#22c55e'; // complete = green
    if (ci?.arrivedAt) return '#facc15'; // arrived = yellow
    return '#ef4444'; // missing = red
  };

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#0f172a' }}>
      {/* Sidebar */}
      <div style={{
        width: 360, minWidth: 360, background: '#1a1a2e', color: '#e2e8f0',
        display: 'flex', flexDirection: 'column', borderRight: '1px solid #2d2d44',
        overflow: 'hidden',
      }}>
        <div style={{ padding: '16px 16px 12px', borderBottom: '1px solid #2d2d44' }}>
          <h2 style={{ margin: '0 0 4px', fontSize: 16 }}>{project?.name || 'Check-In'}</h2>
          <p style={{ color: '#64748b', fontSize: 11, margin: 0 }}>Day-of Vendor Check-In</p>
        </div>

        {/* Progress */}
        <div style={{ padding: '12px 16px', borderBottom: '1px solid #2d2d44' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: 11, color: '#94a3b8' }}>Progress</span>
            <span style={{ fontSize: 11, color: '#e2e8f0', fontWeight: 600 }}>{progressPct}%</span>
          </div>
          <div style={{ height: 8, background: '#334155', borderRadius: 4, overflow: 'hidden' }}>
            <div style={{ height: '100%', background: 'linear-gradient(90deg, #7c3aed, #059669)', width: `${progressPct}%`, borderRadius: 4, transition: 'width 0.4s' }} />
          </div>
          <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
            {[
              { label: 'Total', value: summary.total, color: '#e2e8f0' },
              { label: 'Arrived', value: summary.arrived, color: '#facc15' },
              { label: 'Setup', value: summary.setup, color: '#22c55e' },
              { label: 'Missing', value: summary.missing, color: '#ef4444' },
            ].map((s) => (
              <div key={s.label} style={{ textAlign: 'center', flex: 1 }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: s.color }}>{s.value}</div>
                <div style={{ fontSize: 9, color: '#64748b', textTransform: 'uppercase' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Search + Filter */}
        <div style={{ padding: '8px 16px', borderBottom: '1px solid #2d2d44' }}>
          <input
            type="text"
            placeholder="Search vendors..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: '100%', padding: '6px 10px', background: '#16213e', border: '1px solid #334155',
              borderRadius: 6, color: '#e2e8f0', fontSize: 12, boxSizing: 'border-box', marginBottom: 6,
            }}
          />
          <button
            onClick={() => setShowMissing(!showMissing)}
            style={{
              background: showMissing ? '#dc2626' : '#334155', color: '#fff', border: 'none',
              borderRadius: 4, padding: '3px 10px', fontSize: 10, cursor: 'pointer', fontWeight: 600,
            }}
          >
            {showMissing ? 'Show All' : "Who's Missing"}
          </button>
        </div>

        {/* Vendor list */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
          {vendorList.map((v) => {
            const ci = checkIns[v.id] || {};
            const arrived = !!ci.arrivedAt;
            const setup = !!ci.setupComplete;

            return (
              <div key={v.id} style={{
                padding: '8px 16px', borderBottom: '1px solid #1e293b',
                display: 'flex', alignItems: 'center', gap: 10,
              }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 600 }}>{v.name}</div>
                  <div style={{ fontSize: 10, color: '#64748b', textTransform: 'capitalize' }}>
                    {v.category} / {v.tier}
                  </div>
                </div>
                <label style={{ fontSize: 10, display: 'flex', alignItems: 'center', gap: 3, color: arrived ? '#facc15' : '#64748b', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={arrived}
                    onChange={() => updateCheckIn(v.id, { arrived: !arrived })}
                  />
                  In
                </label>
                <label style={{ fontSize: 10, display: 'flex', alignItems: 'center', gap: 3, color: setup ? '#22c55e' : '#64748b', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={setup}
                    onChange={() => updateCheckIn(v.id, { setupComplete: !setup })}
                  />
                  Set
                </label>
              </div>
            );
          })}
        </div>
      </div>

      {/* Map */}
      <div style={{ flex: 1 }}>
        <MapContainer
          center={mapCenter}
          zoom={20}
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
          {(project?.deadZones || []).map((dz, i) => (
            <Polygon
              key={`dz-${i}`}
              positions={dz.polygon}
              pathOptions={{ color: '#dc2626', fillColor: '#dc2626', fillOpacity: 0.2, dashArray: '6,4' }}
            />
          ))}

          {/* Spots colored by check-in status */}
          {(project?.spotsGeoJSON?.features || []).map((feature, idx) => {
            if (!feature.geometry || feature.geometry.type !== 'Polygon') return null;
            const spotId = feature.properties?.id;
            const color = getSpotColor(spotId);
            let positions;
            try { positions = featureToPositions(feature); } catch { return null; }

            const vendorId = assignments[spotId];
            const vendor = vendorId ? vendorMap[vendorId] : null;
            const ci = vendorId ? (checkIns[vendorId] || {}) : {};
            const statusText = ci.setupComplete ? 'Setup Complete' : ci.arrivedAt ? 'Arrived' : vendorId ? 'Missing' : 'Unassigned';

            return (
              <Polygon
                key={spotId || idx}
                positions={positions}
                pathOptions={{
                  color, weight: 2, fillColor: color, fillOpacity: 0.5,
                }}
              >
                <Tooltip sticky>
                  <div style={{ fontSize: 12 }}>
                    <strong>{feature.properties?.label || `Spot ${idx + 1}`}</strong>
                    {vendor && <><br />{vendor.name}</>}
                    <br /><span style={{ color }}>{statusText}</span>
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
