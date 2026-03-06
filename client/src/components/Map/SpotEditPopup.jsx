import React, { useState, useEffect, useMemo } from 'react';
import { Popup } from 'react-leaflet';
import { generateShareLink } from '../../api/index.js';
import { TIER_COLORS } from '../../utils/tierColors.js';

const CATEGORIES = ['food', 'art', 'craft', 'jewelry', 'clothing', 'services', 'other'];
const TIERS = ['platinum', 'gold', 'silver', 'bronze'];

function CheckboxGroup({ label, options, selected, onChange }) {
  return (
    <div style={{ marginBottom: 6 }}>
      <label style={{ fontSize: 10, color: '#64748b', display: 'block', marginBottom: 2 }}>{label}</label>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
        {options.map((opt) => (
          <label key={opt} style={{ fontSize: 11, color: '#1e293b', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 2 }}>
            <input
              type="checkbox"
              checked={selected.includes(opt)}
              onChange={(e) => {
                if (e.target.checked) onChange([...selected, opt]);
                else onChange(selected.filter((s) => s !== opt));
              }}
              style={{ margin: 0 }}
            />
            {opt}
          </label>
        ))}
      </div>
    </div>
  );
}

function Badge({ text, color }) {
  return (
    <span style={{
      display: 'inline-block', padding: '2px 8px', fontSize: 10, borderRadius: 9999,
      background: color || '#475569', color: '#fff', fontWeight: 600, textTransform: 'capitalize',
    }}>
      {text}
    </span>
  );
}

export default function SpotEditPopup({
  spot, position, onSave, onDelete, onClose, assignedVendorId, onStartMove,
  vendors, currentProjectId, pricingConfig, amenities,
}) {
  const props = spot?.properties || {};

  // Find assigned vendor
  const vendor = useMemo(() => {
    if (!assignedVendorId || !vendors?.length) return null;
    return vendors.find((v) => v.id === assignedVendorId) || null;
  }, [assignedVendorId, vendors]);

  // Nearby amenities (within ~50m)
  const nearbyAmenities = useMemo(() => {
    if (!amenities?.length || !spot?.geometry) return [];
    const coords = spot.geometry.coordinates[0];
    const n = coords.length - 1;
    let latSum = 0, lngSum = 0;
    for (let i = 0; i < n; i++) { lngSum += coords[i][0]; latSum += coords[i][1]; }
    const spotLat = latSum / n;
    const spotLng = lngSum / n;
    const threshold = 0.0005; // ~50m
    return amenities.filter((a) => {
      const dLat = a.lat - spotLat;
      const dLng = a.lng - spotLng;
      return Math.sqrt(dLat * dLat + dLng * dLng) < threshold;
    });
  }, [amenities, spot]);

  // Start in view mode if vendor is assigned, edit mode otherwise
  const [mode, setMode] = useState(vendor ? 'view' : 'edit');

  const [label, setLabel] = useState(props.label || '');
  const [isCorner, setIsCorner] = useState(!!props.isCorner);
  const [premium, setPremium] = useState(!!props.premium);
  const [trafficScore, setTrafficScore] = useState(props.trafficScore || 5);
  const [excludedCategories, setExcludedCategories] = useState(props.excludedCategories || []);
  const [excludedTiers, setExcludedTiers] = useState(props.excludedTiers || []);
  const [allowedCategories, setAllowedCategories] = useState(props.allowedCategories || []);
  const [allowedTiers, setAllowedTiers] = useState(props.allowedTiers || []);
  const [deadZone, setDeadZone] = useState(!!props.deadZone);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const p = spot?.properties || {};
    setLabel(p.label || '');
    setIsCorner(!!p.isCorner);
    setPremium(!!p.premium);
    setDeadZone(!!p.deadZone);
    setTrafficScore(p.trafficScore || 5);
    setExcludedCategories(p.excludedCategories || []);
    setExcludedTiers(p.excludedTiers || []);
    setAllowedCategories(p.allowedCategories || []);
    setAllowedTiers(p.allowedTiers || []);
    setConfirmDelete(false);
    setCopied(false);
    setMode(vendor ? 'view' : 'edit');
  }, [spot]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!spot || !position) return null;

  const handleSave = () => {
    onSave(props.id, {
      label, isCorner, premium, deadZone,
      trafficScore: Math.min(10, Math.max(1, trafficScore)),
      excludedCategories, excludedTiers, allowedCategories, allowedTiers,
    });
  };

  const handleDelete = () => {
    if (!confirmDelete) { setConfirmDelete(true); return; }
    onDelete(props.id);
  };

  const handleShare = async () => {
    if (!currentProjectId || !assignedVendorId) return;
    try {
      const { url } = await generateShareLink(currentProjectId, assignedVendorId);
      const fullUrl = `${window.location.origin}${url}`;
      await navigator.clipboard.writeText(fullUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* ignore */ }
  };

  // Calculate price if pricing config exists
  let spotPrice = null;
  if (pricingConfig) {
    const typeKey = props.premium ? 'premium' : props.isCorner ? 'corner' : 'regular';
    const basePrice = pricingConfig.basePriceByType?.[typeKey] || 100;
    const tierMult = vendor ? (pricingConfig.tierMultipliers?.[vendor.tier] || 1) : 1;
    const catMult = vendor ? (pricingConfig.categoryMultipliers?.[vendor.category] || 1) : 1;
    spotPrice = Math.round(basePrice * tierMult * catMult);
  }

  const inputStyle = {
    width: '100%', padding: '3px 6px', fontSize: 12,
    border: '1px solid #cbd5e1', borderRadius: 4, boxSizing: 'border-box',
  };

  const AMENITY_ICONS = { power: '\u26A1', water: '\uD83D\uDCA7', restroom: '\uD83D\uDEBB', trash: '\uD83D\uDDD1' };

  // ── VIEW MODE ──
  if (mode === 'view' && vendor) {
    return (
      <Popup position={position} maxWidth={320} minWidth={280} closeButton={true}
        eventHandlers={{ remove: onClose }}>
        <div style={{ fontSize: 12, color: '#1e293b', minWidth: 260 }}
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}>

          {/* Spot label + value score */}
          <div style={{ fontSize: 10, color: '#64748b', marginBottom: 2, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span>
              Spot {props.label}
              {props.isCorner && ' \u00B7 Corner'}
              {props.premium && ' \u00B7 Premium'}
            </span>
            {props.valueScore != null && (
              <span style={{
                padding: '1px 6px', borderRadius: 9999, fontSize: 9, fontWeight: 700, color: '#fff',
                background: props.valueScore >= 70 ? '#22c55e' : props.valueScore >= 40 ? '#eab308' : '#ef4444',
              }}>
                {props.valueScore}
              </span>
            )}
          </div>

          {/* Vendor name */}
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 6 }}>
            {vendor.name}
            {vendor.premium && <span style={{ color: '#facc15', marginLeft: 4 }} title="Premium">{'\u2605'}</span>}
          </div>

          {/* Badges */}
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 8 }}>
            <Badge text={vendor.category} color={TIER_COLORS[vendor.category] || '#475569'} />
            <Badge text={vendor.tier} color={TIER_COLORS[vendor.tier] || '#475569'} />
            {(vendor.booths || 1) > 1 && <Badge text={`${vendor.booths} booths`} color="#7c3aed" />}
          </div>

          {/* Bid */}
          {(vendor.bid || 0) > 0 && (
            <div style={{ fontSize: 11, color: '#059669', marginBottom: 4 }}>
              Bid: ${vendor.bid}
            </div>
          )}

          {/* Price */}
          {spotPrice !== null && (
            <div style={{ fontSize: 11, color: '#3b82f6', marginBottom: 4 }}>
              Price: ${spotPrice}
            </div>
          )}

          {/* Conflicts */}
          {vendor.conflicts?.length > 0 && (
            <div style={{ fontSize: 10, color: '#ef4444', marginBottom: 4 }}>
              Conflicts: {vendor.conflicts.join(', ')}
            </div>
          )}

          {/* Nearby Amenities */}
          {nearbyAmenities.length > 0 && (
            <div style={{ marginBottom: 6 }}>
              <div style={{ fontSize: 10, color: '#64748b', marginBottom: 2 }}>Nearby Amenities</div>
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                {nearbyAmenities.map((a) => (
                  <span key={a.id} style={{
                    fontSize: 10, background: '#f0f9ff', padding: '2px 6px', borderRadius: 4,
                  }}>
                    {AMENITY_ICONS[a.type] || ''} {a.type}{a.notes ? `: ${a.notes}` : ''}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: 4, marginTop: 8 }}>
            {currentProjectId && (
              <button onClick={handleShare} style={{
                flex: 1, padding: '5px 0', fontSize: 11, fontWeight: 600,
                background: '#3b82f6', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer',
              }}>
                {copied ? 'Copied!' : 'Share Link'}
              </button>
            )}
            {onStartMove && (
              <button onClick={() => onStartMove(props.id)} style={{
                flex: 1, padding: '5px 0', fontSize: 11, fontWeight: 600,
                background: '#8b5cf6', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer',
              }}>
                Move
              </button>
            )}
            <button onClick={() => setMode('edit')} style={{
              flex: 1, padding: '5px 0', fontSize: 11, fontWeight: 600,
              background: '#475569', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer',
            }}>
              Edit Spot
            </button>
          </div>
        </div>
      </Popup>
    );
  }

  // ── EDIT MODE ──
  return (
    <Popup position={position} maxWidth={320} minWidth={280} closeButton={true}
      eventHandlers={{ remove: onClose }}>
      <div style={{ fontSize: 12, color: '#1e293b', minWidth: 260 }}
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontWeight: 700, fontSize: 14 }}>Edit Spot</span>
            {props.valueScore != null && (
              <span style={{
                padding: '1px 6px', borderRadius: 9999, fontSize: 9, fontWeight: 700, color: '#fff',
                background: props.valueScore >= 70 ? '#22c55e' : props.valueScore >= 40 ? '#eab308' : '#ef4444',
              }}>
                {props.valueScore}
              </span>
            )}
          </div>
          {vendor && (
            <button onClick={() => setMode('view')} style={{
              background: 'none', border: 'none', color: '#3b82f6', fontSize: 11,
              cursor: 'pointer', fontWeight: 600,
            }}>
              View Info
            </button>
          )}
        </div>

        <div style={{ marginBottom: 6 }}>
          <label style={{ fontSize: 10, color: '#64748b', display: 'block', marginBottom: 2 }}>Label</label>
          <input type="text" value={label} onChange={(e) => setLabel(e.target.value)} style={inputStyle} />
        </div>

        <div style={{ display: 'flex', gap: 16, marginBottom: 6 }}>
          <label style={{ fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
            <input type="checkbox" checked={isCorner} onChange={(e) => setIsCorner(e.target.checked)} />
            Corner
          </label>
          <label style={{ fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
            <input type="checkbox" checked={premium} onChange={(e) => setPremium(e.target.checked)} />
            Premium
          </label>
          <label style={{ fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, color: deadZone ? '#dc2626' : undefined }}>
            <input type="checkbox" checked={deadZone} onChange={(e) => setDeadZone(e.target.checked)} />
            Dead Zone
          </label>
        </div>

        <div style={{ marginBottom: 6 }}>
          <label style={{ fontSize: 10, color: '#64748b', display: 'block', marginBottom: 2 }}>
            Traffic Score ({trafficScore})
          </label>
          <input type="range" min={1} max={10} value={trafficScore}
            onChange={(e) => setTrafficScore(Number(e.target.value))}
            style={{ width: '100%' }} />
        </div>

        <CheckboxGroup label="Excluded Categories" options={CATEGORIES}
          selected={excludedCategories} onChange={setExcludedCategories} />
        <CheckboxGroup label="Excluded Tiers" options={TIERS}
          selected={excludedTiers} onChange={setExcludedTiers} />
        <CheckboxGroup label="Allowed Categories (empty = all)" options={CATEGORIES}
          selected={allowedCategories} onChange={setAllowedCategories} />
        <CheckboxGroup label="Allowed Tiers (empty = all)" options={TIERS}
          selected={allowedTiers} onChange={setAllowedTiers} />

        {assignedVendorId && onStartMove && (
          <button onClick={() => onStartMove(props.id)} style={{
            width: '100%', padding: '5px 0', fontSize: 12, fontWeight: 600, marginTop: 6,
            background: '#8b5cf6', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer',
          }}>
            Move Vendor
          </button>
        )}

        <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
          <button onClick={handleSave} style={{
            flex: 1, padding: '5px 0', fontSize: 12, fontWeight: 600,
            background: '#3b82f6', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer',
          }}>
            Save
          </button>
          <button onClick={handleDelete} style={{
            flex: 1, padding: '5px 0', fontSize: 12, fontWeight: 600,
            background: confirmDelete ? '#991b1b' : '#dc2626', color: '#fff',
            border: 'none', borderRadius: 4, cursor: 'pointer',
          }}>
            {confirmDelete ? 'Confirm Delete' : 'Delete'}
          </button>
        </div>
      </div>
    </Popup>
  );
}
