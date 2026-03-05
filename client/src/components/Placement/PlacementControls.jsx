import React, { useState, useMemo } from 'react';

const ALL_CATEGORIES = ['food', 'art', 'craft', 'jewelry', 'clothing', 'services', 'other'];

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
  deadZoneDrawMode,
  onToggleDeadZoneDraw,
  deadZoneCount,
  onClearDeadZones,
  selectedSpotIds,
  onDeleteSelected,
  projectSettings,
  onSettingsChange,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  amenityPlaceMode,
  onToggleAmenityPlace,
  amenityType,
  onAmenityTypeChange,
  amenitiesVisible,
  onToggleAmenitiesVisible,
  amenityCount,
  onClearAmenities,
  accessPointPlaceMode,
  onToggleAccessPointPlace,
  accessPointCount,
}) {
  const [spotSizeFt, setSpotSizeFt] = useState(12);
  const [spacingFt, setSpacingFt] = useState(4);
  const [showRules, setShowRules] = useState(false);
  const [showStreetTools, setShowStreetTools] = useState(true);
  const [showZonesAmenities, setShowZonesAmenities] = useState(false);
  const vacantCount = spotCount - (filledCount || 0);

  const noSameAdj = projectSettings?.noSameAdjacentCategories || [];

  const toggleCategory = (cat) => {
    const next = noSameAdj.includes(cat)
      ? noSameAdj.filter((c) => c !== cat)
      : [...noSameAdj, cat];
    onSettingsChange?.({ ...projectSettings, noSameAdjacentCategories: next });
  };

  // Total booths needed by all vendors
  const totalBoothsNeeded = useMemo(() => {
    if (!vendors?.length) return 0;
    return vendors.reduce((sum, v) => sum + (v.booths || 1), 0);
  }, [vendors]);

  const spotsShortage = totalBoothsNeeded > 0 && spotCount > 0 && totalBoothsNeeded > spotCount;
  const unplacedCount = placements?.unplaced?.length || 0;

  const handleRunPlacement = () => {
    onRunPlacement({ noSameAdjacentCategories: noSameAdj });
  };

  return (
    <div>
      {/* Undo/Redo */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 8 }}>
        <button
          className="btn btn-secondary"
          disabled={!canUndo}
          onClick={onUndo}
          title="Undo (Ctrl+Z)"
          style={{ flex: 1, fontSize: 11, padding: '4px 8px', marginBottom: 0 }}
        >
          Undo
        </button>
        <button
          className="btn btn-secondary"
          disabled={!canRedo}
          onClick={onRedo}
          title="Redo (Ctrl+Shift+Z)"
          style={{ flex: 1, fontSize: 11, padding: '4px 8px', marginBottom: 0 }}
        >
          Redo
        </button>
      </div>

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

      {/* Street & Spot Tools (collapsible) */}
      <div style={{ marginBottom: 8 }}>
        <button
          onClick={() => setShowStreetTools(!showStreetTools)}
          style={{
            background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer',
            fontSize: 11, padding: 0, fontWeight: 600, marginBottom: 6, display: 'block',
          }}
        >
          {showStreetTools ? '▾' : '▸'} Street & Spot Tools
        </button>
        {showStreetTools && (
          <div>
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
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6, marginBottom: 6 }}>
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
                style={{ marginTop: 4, marginBottom: 0 }}
              >
                Clear All Spots
              </button>
            )}
          </div>
        )}
      </div>

      {/* Zones & Amenities (collapsible) */}
      <div style={{ marginBottom: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
          <button
            onClick={() => setShowZonesAmenities(!showZonesAmenities)}
            data-tour="dead-zones"
            style={{
              background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer',
              fontSize: 11, padding: 0, fontWeight: 600,
            }}
          >
            {showZonesAmenities ? '▾' : '▸'} Zones & Amenities
          </button>
          {deadZoneCount > 0 && !showZonesAmenities && (
            <button
              className="btn btn-secondary"
              style={{ padding: '1px 6px', fontSize: 9, width: 'auto', marginBottom: 0 }}
              onClick={onClearDeadZones}
            >
              Clear Dead Zones ({deadZoneCount})
            </button>
          )}
        </div>
        {showZonesAmenities && (
          <div>
            {/* Dead Zone tools */}
            <div style={{ display: 'flex', gap: 6, marginBottom: 0 }}>
              <button
                className="btn"
                disabled={loading}
                onClick={onToggleDeadZoneDraw}
                style={{
                  flex: 1,
                  background: deadZoneDrawMode ? '#991b1b' : '#dc2626',
                  color: '#fff',
                  fontWeight: 600,
                  fontSize: 11,
                }}
              >
                {deadZoneDrawMode ? 'Cancel Draw' : 'Draw Dead Zone'}
              </button>
              {deadZoneCount > 0 && (
                <button
                  className="btn"
                  disabled={loading}
                  onClick={onClearDeadZones}
                  style={{
                    background: '#7f1d1d',
                    color: '#fff',
                    fontWeight: 600,
                    fontSize: 11,
                  }}
                >
                  Clear ({deadZoneCount})
                </button>
              )}
            </div>

            {/* Amenity tools */}
            <div style={{ display: 'flex', gap: 6, marginTop: 6, marginBottom: 0 }}>
              <button
                className="btn"
                disabled={loading}
                onClick={onToggleAmenityPlace}
                data-tour="amenities"
                style={{
                  flex: 1,
                  background: amenityPlaceMode ? '#991b1b' : '#f59e0b',
                  color: amenityPlaceMode ? '#fff' : '#000',
                  fontWeight: 600,
                  fontSize: 11,
                }}
              >
                {amenityPlaceMode ? 'Stop Placing' : 'Place Amenity'}
              </button>
              {amenityPlaceMode && (
                <select
                  value={amenityType}
                  onChange={(e) => onAmenityTypeChange(e.target.value)}
                  style={{
                    padding: '4px 6px', fontSize: 10, background: '#0f172a', color: '#e2e8f0',
                    border: '1px solid #334155', borderRadius: 4, marginBottom: 0,
                  }}
                >
                  <option value="power">Power</option>
                  <option value="water">Water</option>
                  <option value="restroom">Restroom</option>
                  <option value="trash">Trash</option>
                </select>
              )}
            </div>
            <div style={{ display: 'flex', gap: 6, marginTop: 4, alignItems: 'center' }}>
              <label style={{ fontSize: 10, color: '#94a3b8', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                <input type="checkbox" checked={amenitiesVisible} onChange={onToggleAmenitiesVisible} />
                Show Amenities{amenityCount > 0 ? ` (${amenityCount})` : ''}
              </label>
              {amenityCount > 0 && (
                <button
                  className="btn btn-secondary"
                  style={{ padding: '2px 8px', fontSize: 10, width: 'auto', marginBottom: 0 }}
                  onClick={onClearAmenities}
                >
                  Clear
                </button>
              )}
            </div>

            {/* Access Point tools */}
            <div style={{ display: 'flex', gap: 6, marginTop: 6, marginBottom: 0 }}>
              <button
                className="btn"
                disabled={loading}
                onClick={onToggleAccessPointPlace}
                data-tour="access-points"
                style={{
                  flex: 1,
                  background: accessPointPlaceMode ? '#991b1b' : '#10b981',
                  color: '#fff',
                  fontWeight: 600,
                  fontSize: 11,
                }}
              >
                {accessPointPlaceMode ? 'Stop Placing' : 'Access Point'}
              </button>
              {accessPointCount > 0 && (
                <span style={{ fontSize: 10, color: '#94a3b8', alignSelf: 'center' }}>
                  {accessPointCount} point{accessPointCount !== 1 ? 's' : ''}
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      <hr style={{ border: 'none', borderTop: '1px solid #334155', margin: '10px 0' }} />

      {/* Adjacency Rules */}
      <div style={{ marginBottom: 8 }}>
        <button
          onClick={() => setShowRules(!showRules)}
          style={{
            background: 'none',
            border: 'none',
            color: '#94a3b8',
            cursor: 'pointer',
            fontSize: 11,
            padding: 0,
            fontWeight: 600,
          }}
        >
          {showRules ? '▾' : '▸'} Adjacency Rules
        </button>
        {showRules && (
          <div style={{ marginTop: 6, paddingLeft: 4 }}>
            <p style={{ fontSize: 10, color: '#64748b', margin: '0 0 6px' }}>
              Checked categories can't be placed next to same type:
            </p>
            {ALL_CATEGORIES.map((cat) => (
              <label
                key={cat}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  fontSize: 11,
                  color: '#e2e8f0',
                  marginBottom: 3,
                  cursor: 'pointer',
                  textTransform: 'capitalize',
                }}
              >
                <input
                  type="checkbox"
                  checked={noSameAdj.includes(cat)}
                  onChange={() => toggleCategory(cat)}
                  style={{ accentColor: '#3b82f6' }}
                />
                {cat}
              </label>
            ))}
          </div>
        )}
      </div>

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
        onClick={handleRunPlacement}
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
