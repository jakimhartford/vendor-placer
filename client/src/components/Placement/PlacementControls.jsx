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
  onClearGrid,
  loading,
  spotCount,
  filledCount,
  streetDrawMode,
  onToggleStreetDraw,
  onClearPaths,
  pathCount,
}) {
  const [gridArea, setGridArea] = useState('both');
  const [rows, setRows] = useState(1);
  const [spotSizeFt, setSpotSizeFt] = useState(12);

  const vacantCount = spotCount - (filledCount || 0);

  return (
    <div>
      {/* Spot stats */}
      {spotCount > 0 && (
        <div style={{
          display: 'flex', gap: 8, marginBottom: 10,
          background: '#0f172a', borderRadius: 6, padding: '8px 10px',
        }}>
          <div style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#e2e8f0' }}>{spotCount}</div>
            <div style={{ fontSize: 9, color: '#64748b', textTransform: 'uppercase' }}>Total</div>
          </div>
          <div style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#34d399' }}>{filledCount || 0}</div>
            <div style={{ fontSize: 9, color: '#64748b', textTransform: 'uppercase' }}>Filled</div>
          </div>
          <div style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: vacantCount > 0 ? '#facc15' : '#64748b' }}>{vacantCount}</div>
            <div style={{ fontSize: 9, color: '#64748b', textTransform: 'uppercase' }}>Vacant</div>
          </div>
        </div>
      )}

      {/* Draw Street section */}
      <label style={{ fontSize: 11, color: '#94a3b8', display: 'block', marginBottom: 4 }}>
        Draw a line for each row of vendor spots
      </label>

      <div style={{ marginBottom: 6 }}>
        <label style={{ fontSize: 10, color: '#64748b', display: 'block', marginBottom: 2 }}>
          Spot size (ft)
        </label>
        <input
          type="number"
          value={spotSizeFt}
          onChange={(e) => setSpotSizeFt(Number(e.target.value) || 12)}
          min={6}
          max={20}
          style={{ width: 80, padding: '3px 6px', fontSize: 12, boxSizing: 'border-box' }}
        />
      </div>

      <button
        className="btn"
        disabled={loading}
        onClick={() => onToggleStreetDraw({ spotSizeFt, rows: 1 })}
        style={{
          background: streetDrawMode ? '#dc2626' : '#facc15',
          color: streetDrawMode ? '#fff' : '#000',
          fontWeight: 600,
        }}
      >
        {streetDrawMode ? 'Cancel Street Draw' : 'Draw Street'}
      </button>

      {pathCount > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
          <span style={{ fontSize: 11, color: '#94a3b8' }}>
            {pathCount} line{pathCount !== 1 ? 's' : ''} drawn
          </span>
          <button
            className="btn btn-secondary"
            style={{ padding: '2px 8px', fontSize: 11, width: 'auto', marginBottom: 0 }}
            onClick={onClearPaths}
          >
            Clear
          </button>
        </div>
      )}

      <hr style={{ border: 'none', borderTop: '1px solid #334155', margin: '10px 0' }} />

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
        Rows per side
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

      <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
        <button
          className="btn btn-gold"
          disabled={loading}
          onClick={() => onGenerateGrid({ area: gridArea, rows })}
          style={{ flex: 1, marginBottom: 0 }}
        >
          {loading ? 'Generating...' : 'Generate Grid'}
        </button>
        {spotCount > 0 && (
          <button
            className="btn btn-secondary"
            disabled={loading}
            onClick={onClearGrid}
            style={{ flex: 0, width: 'auto', padding: '8px 12px', marginBottom: 0 }}
          >
            Clear
          </button>
        )}
      </div>

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
