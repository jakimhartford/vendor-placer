import React, { useState, useMemo } from 'react';

export default function PlacementControls({
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
  spotPlaceMode,
  onToggleSpotPlace,
  vendors,
  placements,
  deadZonePlaceMode,
  onToggleDeadZonePlace,
  deadZoneDrawMode,
  onToggleDeadZoneDraw,
  selectedSpotIds,
  onDeleteSelected,
}) {
  const [spotSizeFt, setSpotSizeFt] = useState(12);
  const [spacingFt, setSpacingFt] = useState(4);
  const vacantCount = spotCount - (filledCount || 0);

  // Total booths needed by all vendors
  const totalBoothsNeeded = useMemo(() => {
    if (!vendors?.length) return 0;
    return vendors.reduce((sum, v) => sum + (v.booths || 1), 0);
  }, [vendors]);

  const spotsShortage = totalBoothsNeeded > 0 && spotCount > 0 && totalBoothsNeeded > spotCount;
  const unplacedCount = placements?.unplaced?.length || 0;

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

      <div style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
        <div style={{ flex: 1 }}>
          <label style={{ fontSize: 10, color: '#64748b', display: 'block', marginBottom: 2 }}>
            Spot size (ft)
          </label>
          <input
            type="number"
            value={spotSizeFt}
            onChange={(e) => setSpotSizeFt(Number(e.target.value) || 12)}
            min={6}
            max={20}
            style={{ width: '100%', padding: '3px 6px', fontSize: 12, boxSizing: 'border-box' }}
          />
        </div>
        <div style={{ flex: 1 }}>
          <label style={{ fontSize: 10, color: '#64748b', display: 'block', marginBottom: 2 }}>
            Spacing (ft)
          </label>
          <input
            type="number"
            value={spacingFt}
            onChange={(e) => setSpacingFt(Number(e.target.value) || 4)}
            min={0}
            max={20}
            style={{ width: '100%', padding: '3px 6px', fontSize: 12, boxSizing: 'border-box' }}
          />
        </div>
      </div>

      <div style={{ display: 'flex', gap: 6, marginBottom: 0 }}>
        <button
          className="btn"
          disabled={loading}
          onClick={() => onToggleStreetDraw({ spotSizeFt, spacingFt })}
          data-tour="draw-street"
          style={{
            flex: 1,
            background: streetDrawMode ? '#dc2626' : '#facc15',
            color: streetDrawMode ? '#fff' : '#000',
            fontWeight: 600,
          }}
        >
          {streetDrawMode ? 'Cancel Drawing' : 'Draw Street'}
        </button>
        <button
          className="btn"
          disabled={loading}
          onClick={onToggleSpotPlace}
          data-tour="place-spot"
          style={{
            flex: 1,
            background: spotPlaceMode ? '#dc2626' : '#22d3ee',
            color: spotPlaceMode ? '#fff' : '#000',
            fontWeight: 600,
          }}
        >
          {spotPlaceMode ? 'Stop Placing' : 'Place Spot'}
        </button>
      </div>

      {/* Dead Zone tools */}
      <div style={{ display: 'flex', gap: 6, marginTop: 6, marginBottom: 0 }}>
        <button
          className="btn"
          disabled={loading}
          onClick={onToggleDeadZonePlace}
          style={{
            flex: 1,
            background: deadZonePlaceMode ? '#991b1b' : '#dc2626',
            color: '#fff',
            fontWeight: 600,
            fontSize: 11,
          }}
        >
          {deadZonePlaceMode ? 'Stop Placing' : 'Place Dead Zone'}
        </button>
        <button
          className="btn"
          disabled={loading}
          onClick={onToggleDeadZoneDraw}
          style={{
            flex: 1,
            background: deadZoneDrawMode ? '#991b1b' : '#b91c1c',
            color: '#fff',
            fontWeight: 600,
            fontSize: 11,
          }}
        >
          {deadZoneDrawMode ? 'Cancel Draw' : 'Draw Dead Zone'}
        </button>
      </div>

      {/* Multi-select delete */}
      {selectedSpotIds?.size > 0 && (
        <button
          className="btn"
          onClick={onDeleteSelected}
          style={{
            marginTop: 6,
            background: '#f97316',
            color: '#fff',
            fontWeight: 600,
          }}
        >
          Delete Selected ({selectedSpotIds.size})
        </button>
      )}

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
            Clear Lines
          </button>
        </div>
      )}

      {spotCount > 0 && (
        <button
          className="btn btn-secondary"
          disabled={loading}
          onClick={onClearGrid}
          style={{ marginBottom: 4 }}
        >
          Clear All Spots
        </button>
      )}

      <hr style={{ border: 'none', borderTop: '1px solid #334155', margin: '10px 0' }} />

      {/* Warnings */}
      {spotsShortage && (
        <div style={{
          background: '#7f1d1d',
          border: '1px solid #dc2626',
          borderRadius: 6,
          padding: '6px 10px',
          marginBottom: 8,
          fontSize: 11,
          color: '#fca5a5',
        }}>
          Not enough spots: {totalBoothsNeeded} booths needed, only {spotCount} spot{spotCount !== 1 ? 's' : ''} available
        </div>
      )}

      {unplacedCount > 0 && (
        <div style={{
          background: '#78350f',
          border: '1px solid #f59e0b',
          borderRadius: 6,
          padding: '6px 10px',
          marginBottom: 8,
          fontSize: 11,
          color: '#fde68a',
        }}>
          {unplacedCount} vendor{unplacedCount !== 1 ? 's' : ''} could not be placed
        </div>
      )}

      {/* Placement */}
      <button
        className="btn btn-primary"
        disabled={loading}
        onClick={onRunPlacement}
        data-tour="run-placement"
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
