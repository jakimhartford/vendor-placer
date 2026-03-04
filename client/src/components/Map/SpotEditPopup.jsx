import React, { useState, useEffect } from 'react';
import { Popup } from 'react-leaflet';

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

export default function SpotEditPopup({ spot, position, onSave, onDelete, onClose, assignedVendorId, onStartMove }) {
  const props = spot?.properties || {};

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

  // Reset form when spot changes
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
  }, [spot]);

  if (!spot || !position) return null;

  const handleSave = () => {
    onSave(props.id, {
      label,
      isCorner,
      premium,
      deadZone,
      trafficScore: Math.min(10, Math.max(1, trafficScore)),
      excludedCategories,
      excludedTiers,
      allowedCategories,
      allowedTiers,
    });
  };

  const handleDelete = () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    onDelete(props.id);
  };

  const inputStyle = {
    width: '100%',
    padding: '3px 6px',
    fontSize: 12,
    border: '1px solid #cbd5e1',
    borderRadius: 4,
    boxSizing: 'border-box',
  };

  return (
    <Popup position={position} maxWidth={320} minWidth={280} closeButton={true}
      eventHandlers={{ remove: onClose }}>
      <div style={{ fontSize: 12, color: '#1e293b', minWidth: 260 }}
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}>
        <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 8 }}>Edit Spot</div>

        {/* Label */}
        <div style={{ marginBottom: 6 }}>
          <label style={{ fontSize: 10, color: '#64748b', display: 'block', marginBottom: 2 }}>Label</label>
          <input type="text" value={label} onChange={(e) => setLabel(e.target.value)} style={inputStyle} />
        </div>

        {/* Corner + Premium */}
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

        {/* Traffic Score */}
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

        {/* Move vendor */}
        {assignedVendorId && onStartMove && (
          <button onClick={() => onStartMove(props.id)} style={{
            width: '100%', padding: '5px 0', fontSize: 12, fontWeight: 600, marginTop: 6,
            background: '#8b5cf6', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer',
          }}>
            Move Vendor
          </button>
        )}

        {/* Actions */}
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
