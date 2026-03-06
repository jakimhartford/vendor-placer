import React, { useState } from 'react';
import { DEFAULT_PRICING_CONFIG } from '../../utils/pricing.js';

const inputStyle = {
  width: 70, padding: '3px 6px', fontSize: 11,
  background: '#0f172a', color: '#e2e8f0', border: '1px solid #334155',
  borderRadius: 4, textAlign: 'center',
};

const labelStyle = { fontSize: 9, color: '#64748b', display: 'block', textTransform: 'capitalize', marginBottom: 2 };

export default function PricingConfig({ config, onChange }) {
  const [expanded, setExpanded] = useState(false);
  const cfg = config || DEFAULT_PRICING_CONFIG;
  const mode = cfg.mode || 'multiplier';

  const update = (changes) => onChange({ ...cfg, ...changes });

  const updateFlatFee = (tier, field, value) => {
    const fees = { ...cfg.flatFees };
    fees[tier] = { ...fees[tier], [field]: field === 'label' ? value : (parseFloat(value) || 0) };
    update({ flatFees: fees });
  };

  const addFlatTier = () => {
    const key = prompt('Tier key (e.g., "juried", "emergent"):');
    if (!key?.trim()) return;
    const fees = { ...cfg.flatFees };
    fees[key.trim().toLowerCase()] = { single: 0, double: 0, label: key.trim() };
    update({ flatFees: fees });
  };

  const removeFlatTier = (tier) => {
    const fees = { ...cfg.flatFees };
    delete fees[tier];
    update({ flatFees: fees });
  };

  const updateField = (section, key, value) => {
    update({ [section]: { ...cfg[section], [key]: parseFloat(value) || 0 } });
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
          {/* Mode toggle */}
          <div style={{ display: 'flex', gap: 0, marginBottom: 10, borderRadius: 4, overflow: 'hidden', border: '1px solid #334155', width: 'fit-content' }}>
            <button
              onClick={() => update({ mode: 'flat' })}
              style={{
                padding: '3px 10px', fontSize: 10, fontWeight: 600, border: 'none', cursor: 'pointer',
                background: mode === 'flat' ? '#3b82f6' : '#1e293b',
                color: mode === 'flat' ? '#fff' : '#64748b',
              }}
            >
              Flat Fee
            </button>
            <button
              onClick={() => update({ mode: 'multiplier' })}
              style={{
                padding: '3px 10px', fontSize: 10, fontWeight: 600, border: 'none', cursor: 'pointer',
                background: mode === 'multiplier' ? '#3b82f6' : '#1e293b',
                color: mode === 'multiplier' ? '#fff' : '#64748b',
              }}
            >
              Multiplier
            </button>
          </div>

          {mode === 'flat' ? (
            <>
              <div style={{ fontSize: 10, color: '#64748b', marginBottom: 6 }}>
                Booth fees by vendor tier (matches vendor's tier field)
              </div>
              {Object.entries(cfg.flatFees || {}).map(([tier, entry]) => (
                <div key={tier} style={{
                  display: 'flex', gap: 6, alignItems: 'flex-end', marginBottom: 8,
                  padding: '6px 8px', background: '#16213e', borderRadius: 4,
                }}>
                  <div style={{ flex: 1 }}>
                    <label style={labelStyle}>Tier: {tier}</label>
                    <input
                      value={entry.label || tier}
                      onChange={(e) => updateFlatFee(tier, 'label', e.target.value)}
                      style={{ ...inputStyle, width: '100%', textAlign: 'left' }}
                      placeholder="Display label"
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Single $</label>
                    <input
                      type="number"
                      value={entry.single || 0}
                      onChange={(e) => updateFlatFee(tier, 'single', e.target.value)}
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Double $</label>
                    <input
                      type="number"
                      value={entry.double || 0}
                      onChange={(e) => updateFlatFee(tier, 'double', e.target.value)}
                      style={inputStyle}
                    />
                  </div>
                  <button
                    onClick={() => removeFlatTier(tier)}
                    style={{
                      padding: '2px 6px', fontSize: 9, background: 'transparent',
                      color: '#ef4444', border: '1px solid #ef4444', borderRadius: 3,
                      cursor: 'pointer', marginBottom: 1,
                    }}
                    title="Remove tier"
                  >
                    x
                  </button>
                </div>
              ))}
              <button
                onClick={addFlatTier}
                style={{
                  fontSize: 10, padding: '3px 10px', background: '#334155', color: '#e2e8f0',
                  border: 'none', borderRadius: 4, cursor: 'pointer',
                }}
              >
                + Add Tier
              </button>
            </>
          ) : (
            <>
              <div style={{ fontSize: 10, color: '#64748b', marginBottom: 4 }}>Base Price by Spot Type ($)</div>
              <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                {Object.entries(cfg.basePriceByType || {}).map(([key, val]) => (
                  <div key={key}>
                    <label style={labelStyle}>{key}</label>
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
                {Object.entries(cfg.tierMultipliers || {}).map(([key, val]) => (
                  <div key={key}>
                    <label style={labelStyle}>{key}</label>
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
                {Object.entries(cfg.categoryMultipliers || {}).map(([key, val]) => (
                  <div key={key}>
                    <label style={labelStyle}>{key}</label>
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
            </>
          )}
        </div>
      )}
    </div>
  );
}
