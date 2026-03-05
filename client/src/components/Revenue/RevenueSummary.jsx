import React, { useMemo } from 'react';
import { calculateRevenueSummary } from '../../utils/pricing.js';
import { TIER_COLORS } from '../../utils/tierColors.js';

const CAT_COLORS = {
  food: '#ef4444', art: '#8b5cf6', craft: '#f59e0b', jewelry: '#ec4899',
  clothing: '#3b82f6', services: '#10b981', other: '#6b7280',
};

export default function RevenueSummary({ spots, vendors, assignments, pricingConfig }) {
  const summary = useMemo(() =>
    calculateRevenueSummary(spots, vendors, assignments, pricingConfig),
    [spots, vendors, assignments, pricingConfig]
  );

  if (!pricingConfig || summary.total === 0) return null;

  const maxTierVal = Math.max(...Object.values(summary.byTier), 1);

  return (
    <div>
      <div style={{
        fontSize: 22, fontWeight: 700, color: '#34d399', marginBottom: 8,
      }}>
        ${summary.total.toLocaleString()}
      </div>

      {Object.keys(summary.byTier).length > 0 && (
        <div style={{ marginBottom: 8 }}>
          <div style={{ fontSize: 10, color: '#64748b', marginBottom: 4 }}>By Tier</div>
          {Object.entries(summary.byTier).map(([tier, amount]) => (
            <div key={tier} style={{ marginBottom: 3 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 1 }}>
                <span style={{ textTransform: 'capitalize' }}>{tier}</span>
                <span style={{ color: '#94a3b8' }}>${amount.toLocaleString()}</span>
              </div>
              <div style={{ height: 6, background: '#1e293b', borderRadius: 3, overflow: 'hidden' }}>
                <div style={{
                  height: '100%', borderRadius: 3,
                  width: `${(amount / maxTierVal) * 100}%`,
                  background: TIER_COLORS[tier] || '#475569',
                }} />
              </div>
            </div>
          ))}
        </div>
      )}

      {Object.keys(summary.byCategory).length > 0 && (
        <div>
          <div style={{ fontSize: 10, color: '#64748b', marginBottom: 4 }}>By Category</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {Object.entries(summary.byCategory).map(([cat, amount]) => (
              <span key={cat} style={{
                fontSize: 10, padding: '2px 6px', borderRadius: 4,
                background: CAT_COLORS[cat] || '#475569', color: '#fff',
              }}>
                {cat}: ${amount.toLocaleString()}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
