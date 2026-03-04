import React from 'react';
import { TIERS } from '../../utils/constants.js';
import { TIER_COLORS } from '../../utils/tierColors.js';

export default function PlacementStats({ placements, vendors }) {
  const { assignments = {}, unplaced = [], conflicts = [] } = placements || {};
  const assignedCount = Object.keys(assignments).length;
  const totalVendors = vendors?.length || 0;
  const placedVendorIds = new Set(Object.values(assignments));

  // Tier breakdown — count placed vendors per tier
  const tierBreakdown = {};
  TIERS.forEach((t) => {
    tierBreakdown[t] = 0;
  });
  (vendors || []).forEach((v) => {
    const id = v.id || v._id;
    if (placedVendorIds.has(id) && v.tier) {
      const tier = v.tier.toLowerCase();
      if (tierBreakdown[tier] !== undefined) {
        tierBreakdown[tier] += 1;
      }
    }
  });

  const pct =
    totalVendors > 0 ? Math.round((placedVendorIds.size / totalVendors) * 100) : 0;

  if (totalVendors === 0 && assignedCount === 0) {
    return (
      <p style={{ color: '#64748b', fontSize: 12 }}>
        No placement data yet.
      </p>
    );
  }

  return (
    <div>
      <div className="stat-row">
        <span className="label">Total vendors</span>
        <span className="value">{totalVendors}</span>
      </div>
      <div className="stat-row">
        <span className="label">Placed</span>
        <span className="value">{placedVendorIds.size}</span>
      </div>
      <div className="stat-row">
        <span className="label">Unplaced</span>
        <span className="value">{unplaced.length}</span>
      </div>

      <div className="progress-bar">
        <div className="progress-bar-fill" style={{ width: `${pct}%` }} />
      </div>
      <p style={{ fontSize: 12, color: '#94a3b8', textAlign: 'center' }}>
        {pct}% placed
      </p>

      <div style={{ marginTop: 10 }}>
        {TIERS.map((tier) => (
          <div className="stat-row" key={tier}>
            <span className="label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span
                style={{
                  display: 'inline-block',
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  background: TIER_COLORS[tier],
                }}
              />
              <span style={{ textTransform: 'capitalize' }}>{tier}</span>
            </span>
            <span className="value">{tierBreakdown[tier]}</span>
          </div>
        ))}
      </div>

      {conflicts.length > 0 && (
        <div style={{ marginTop: 10, padding: '6px 8px', background: '#451a03', borderRadius: 6 }}>
          <p style={{ fontSize: 11, color: '#fbbf24', fontWeight: 600, marginBottom: 4 }}>
            Conflicts ({conflicts.length})
          </p>
          {conflicts.slice(0, 5).map((c, i) => (
            <p key={i} style={{ fontSize: 10, color: '#f59e0b', margin: '2px 0' }}>{c}</p>
          ))}
          {conflicts.length > 5 && (
            <p style={{ fontSize: 10, color: '#92400e' }}>+{conflicts.length - 5} more</p>
          )}
        </div>
      )}
    </div>
  );
}
