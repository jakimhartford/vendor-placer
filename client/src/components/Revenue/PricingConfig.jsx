import React, { useState } from 'react';
import { DEFAULT_PRICING_CONFIG } from '../../utils/pricing.js';

export default function PricingConfig({ config, onChange }) {
  const [expanded, setExpanded] = useState(false);
  const cfg = config || DEFAULT_PRICING_CONFIG;

  const updateField = (section, key, value) => {
    const updated = {
      ...cfg,
      [section]: { ...cfg[section], [key]: parseFloat(value) || 0 },
    };
    onChange(updated);
  };

  const inputStyle = {
    width: 60, padding: '2px 4px', fontSize: 11,
    background: '#0f172a', color: '#e2e8f0', border: '1px solid #334155',
    borderRadius: 4, textAlign: 'center',
  };

  return (
    <div>
      <button
        onClick={() => setExpanded(!expanded)}
        style={{
          background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer',
          fontSize: 11, padding: 0, fontWeight: 600,
        }}
      >
        {expanded ? '\u25BE' : '\u25B8'} Pricing Config
      </button>
      {expanded && (
        <div style={{ marginTop: 8, paddingLeft: 4 }}>
          <div style={{ fontSize: 10, color: '#64748b', marginBottom: 4 }}>Base Price by Type ($)</div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
            {Object.entries(cfg.basePriceByType).map(([key, val]) => (
              <div key={key}>
                <label style={{ fontSize: 9, color: '#64748b', display: 'block', textTransform: 'capitalize' }}>{key}</label>
                <input
                  type="number"
                  value={val}
                  onChange={(e) => updateField('basePriceByType', key, e.target.value)}
                  style={inputStyle}
                />
              </div>
            ))}
          </div>

          <div style={{ fontSize: 10, color: '#64748b', marginBottom: 4 }}>Tier Multipliers</div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
            {Object.entries(cfg.tierMultipliers).map(([key, val]) => (
              <div key={key}>
                <label style={{ fontSize: 9, color: '#64748b', display: 'block', textTransform: 'capitalize' }}>{key}</label>
                <input
                  type="number"
                  step="0.1"
                  value={val}
                  onChange={(e) => updateField('tierMultipliers', key, e.target.value)}
                  style={inputStyle}
                />
              </div>
            ))}
          </div>

          <div style={{ fontSize: 10, color: '#64748b', marginBottom: 4 }}>Category Multipliers</div>
          <div style={{ display: 'flex', gap: 6, marginBottom: 4, flexWrap: 'wrap' }}>
            {Object.entries(cfg.categoryMultipliers).map(([key, val]) => (
              <div key={key}>
                <label style={{ fontSize: 9, color: '#64748b', display: 'block', textTransform: 'capitalize' }}>{key}</label>
                <input
                  type="number"
                  step="0.1"
                  value={val}
                  onChange={(e) => updateField('categoryMultipliers', key, e.target.value)}
                  style={inputStyle}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
