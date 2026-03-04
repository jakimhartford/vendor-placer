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
}) {
  const [gridArea, setGridArea] = useState('both');

  return (
    <div>
      {/* Grid generation */}
      <select value={gridArea} onChange={(e) => setGridArea(e.target.value)}>
        {GRID_AREAS.map((a) => (
          <option key={a.value} value={a.value}>
            {a.label}
          </option>
        ))}
      </select>

      <button
        className="btn btn-gold"
        disabled={loading}
        onClick={() => onGenerateGrid({ area: gridArea })}
      >
        {loading ? 'Generating...' : 'Generate Grid'}
      </button>

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
