import React, { useState } from 'react';

const GRID_AREAS = [
  { value: 'beach', label: 'Beach St' },
  { value: 'magnolia', label: 'Magnolia' },
  { value: 'both', label: 'Both' },
];

export default function PlacementControls({
  onGenerateGrid,
  onRunPlacement,
  onClearVendors,
  loading,
  spotCount,
}) {
  const [gridArea, setGridArea] = useState('both');
  const [rows, setRows] = useState(1);

  return (
    <div>
      {/* Grid generation */}
      <label style={{ fontSize: 11, color: '#94a3b8', display: 'block', marginBottom: 4 }}>
        Festival area
      </label>
      <select value={gridArea} onChange={(e) => setGridArea(e.target.value)}>
        {GRID_AREAS.map((a) => (
          <option key={a.value} value={a.value}>
            {a.label}
          </option>
        ))}
      </select>

      <label style={{ fontSize: 11, color: '#94a3b8', display: 'block', marginBottom: 4 }}>
        Rows per side (more rows = more spots)
      </label>
      <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
        {[1, 2, 3].map((n) => (
          <button
            key={n}
            className={`btn ${rows === n ? 'btn-primary' : 'btn-secondary'}`}
            style={{ width: 'auto', flex: 1, padding: '4px 8px', fontSize: 12, marginBottom: 0 }}
            onClick={() => setRows(n)}
          >
            {n}
          </button>
        ))}
      </div>

      <button
        className="btn btn-gold"
        disabled={loading}
        onClick={() => onGenerateGrid({ area: gridArea, rows })}
      >
        {loading ? 'Generating...' : 'Generate Grid'}
      </button>

      {spotCount > 0 && (
        <p style={{ fontSize: 11, color: '#94a3b8', marginBottom: 8, marginTop: -4 }}>
          {spotCount} spots on map
        </p>
      )}

      {/* Placement */}
      <button
        className="btn btn-primary"
        disabled={loading}
        onClick={onRunPlacement}
      >
        {loading ? 'Running...' : 'Run Placement'}
      </button>

      {/* Danger zone */}
      <div style={{ marginTop: 8 }}>
        <button
          className="btn btn-danger"
          disabled={loading}
          onClick={onClearVendors}
        >
          Clear Vendors
        </button>
      </div>
    </div>
  );
}
