import React, { useState, useMemo } from 'react';
import { calculateSpotPrice } from '../../utils/pricing.js';

const BADGE_COLORS = {
  food: '#ef4444', art: '#8b5cf6', craft: '#f59e0b', jewelry: '#ec4899',
  clothing: '#3b82f6', services: '#10b981', other: '#6b7280',
  platinum: '#7c3aed', gold: '#d97706', silver: '#64748b', bronze: '#92400e',
};

function Badge({ text, color }) {
  return (
    <span style={{
      display: 'inline-block', padding: '1px 5px', fontSize: 9, borderRadius: 3,
      background: color || '#475569', color: '#fff', marginRight: 2, marginBottom: 2,
    }}>
      {text}
    </span>
  );
}

export default function SpotTable({ spots, vendors, assignments, onEditSpot, pricingConfig }) {
  const [search, setSearch] = useState('');

  const vendorMap = useMemo(() => {
    const m = {};
    (vendors || []).forEach((v) => { m[v.id || v._id] = v; });
    return m;
  }, [vendors]);

  const rows = useMemo(() => {
    const features = spots?.features || [];
    return features.map((f) => {
      const p = f.properties || {};
      const assignedVendorId = assignments?.[p.id];
      const vendor = assignedVendorId ? vendorMap[assignedVendorId] : null;
      return { feature: f, props: p, vendor };
    });
  }, [spots, assignments, vendorMap]);

  const filtered = useMemo(() => {
    if (!search.trim()) return rows;
    const q = search.toLowerCase();
    return rows.filter((r) =>
      r.props.label?.toLowerCase().includes(q) ||
      r.vendor?.name?.toLowerCase().includes(q) ||
      r.vendor?.category?.toLowerCase().includes(q)
    );
  }, [rows, search]);

  if (!rows.length) {
    return <div style={{ fontSize: 12, color: '#64748b' }}>No spots created yet.</div>;
  }

  return (
    <div>
      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search spots..."
        style={{
          width: '100%', padding: '5px 8px', fontSize: 12, marginBottom: 6,
          background: '#16213e', color: '#e2e8f0', border: '1px solid #334155',
          borderRadius: 4, boxSizing: 'border-box',
        }}
      />
      <div style={{ maxHeight: 300, overflowY: 'auto' }}>
        <table style={{ width: '100%', fontSize: 11, borderCollapse: 'collapse', color: '#e2e8f0' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #334155', textAlign: 'left' }}>
              <th style={{ padding: '4px 4px', color: '#94a3b8', fontWeight: 600 }}>Label</th>
              <th style={{ padding: '4px 4px', color: '#94a3b8', fontWeight: 600 }}>Flags</th>
              <th style={{ padding: '4px 4px', color: '#94a3b8', fontWeight: 600 }}>Score</th>
              <th style={{ padding: '4px 4px', color: '#94a3b8', fontWeight: 600 }}>Restrictions</th>
              {pricingConfig && <th style={{ padding: '4px 4px', color: '#94a3b8', fontWeight: 600 }}>Price</th>}
              <th style={{ padding: '4px 4px', color: '#94a3b8', fontWeight: 600 }}>Assigned</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => {
              const p = r.props;
              const restrictions = [
                ...(p.excludedCategories || []).map((c) => ({ text: `-${c}`, color: BADGE_COLORS[c] })),
                ...(p.excludedTiers || []).map((t) => ({ text: `-${t}`, color: BADGE_COLORS[t] })),
                ...(p.allowedCategories || []).map((c) => ({ text: `+${c}`, color: BADGE_COLORS[c] })),
                ...(p.allowedTiers || []).map((t) => ({ text: `+${t}`, color: BADGE_COLORS[t] })),
              ];

              return (
                <tr
                  key={p.id}
                  onClick={() => onEditSpot(p.id)}
                  style={{
                    borderBottom: '1px solid #1e293b', cursor: 'pointer',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = '#1e293b'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                >
                  <td style={{ padding: '4px 4px', fontWeight: 600 }}>{p.label}</td>
                  <td style={{ padding: '4px 4px' }}>
                    {p.isCorner && <Badge text="C" color="#f59e0b" />}
                    {p.premium && <Badge text="P" color="#7c3aed" />}
                  </td>
                  <td style={{ padding: '4px 4px', textAlign: 'center' }}>{p.trafficScore || '-'}</td>
                  <td style={{ padding: '4px 4px' }}>
                    {restrictions.length > 0
                      ? restrictions.map((r, i) => <Badge key={i} text={r.text} color={r.color} />)
                      : <span style={{ color: '#475569' }}>-</span>}
                  </td>
                  {pricingConfig && (
                    <td style={{ padding: '4px 4px', fontSize: 10, color: '#34d399' }}>
                      {r.vendor ? `$${calculateSpotPrice(p, r.vendor, pricingConfig)}` : '-'}
                    </td>
                  )}
                  <td style={{ padding: '4px 4px', fontSize: 10 }}>
                    {r.vendor ? r.vendor.name : <span style={{ color: '#475569' }}>-</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div style={{ fontSize: 10, color: '#64748b', marginTop: 4 }}>
        {filtered.length} of {rows.length} spots
      </div>
    </div>
  );
}
