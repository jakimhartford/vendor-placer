import React, { useState, useMemo } from 'react';
import ElementPalette from './ElementPalette.jsx';

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
  selectedSpotIds,
  onDeleteSelected,
  projectSettings,
  onSettingsChange,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  activeElement,
  onSelectElement,
  amenitiesVisible,
  onToggleAmenitiesVisible,
  amenityCount,
  onClearAmenities,
  accessPointCount,
  mapZonesVisible,
  onToggleMapZonesVisible,
  mapZoneCount,
  onClearMapZones,
  deadZoneCount,
  onClearDeadZones,
}) {
  const [spotSizeFt, setSpotSizeFt] = useState(12);
  const [spacingFt, setSpacingFt] = useState(4);
  const [showRules, setShowRules] = useState(false);
  const [showStreetTools, setShowStreetTools] = useState(true);
  const vacantCount = spotCount - (filledCount || 0);

  const noSameAdj = projectSettings?.noSameAdjacentCategories || [];

  const toggleCategory = (cat) => {
    const next = noSameAdj.includes(cat)
      ? noSameAdj.filter((c) => c !== cat)
      : [...noSameAdj, cat];
    onSettingsChange?.({ ...projectSettings, noSameAdjacentCategories: next });
  };

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
            background: 'none', border: 'none', color: '#cbd5e1', cursor: 'pointer',
            fontSize: 13, padding: 0, fontWeight: 600, marginBottom: 6, display: 'block',
            letterSpacing: '0.02em', textTransform: 'uppercase',
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
                title={streetDrawMode ? 'Cancel street drawing' : 'Draw a line on the map to generate vendor spots'}
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
                title={spotPlaceMode ? 'Stop placing individual spots' : 'Click on map to place individual spots'}
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
                title="Delete all selected spots"
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
                  title="Remove all drawn street lines"
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
                title="Remove all spots and drawn lines"
                style={{ marginTop: 4, marginBottom: 0 }}
              >
                Clear All Spots
              </button>
            )}
          </div>
        )}
      </div>

      {/* Map Elements Palette */}
      <div style={{ marginBottom: 8 }}>
        <div style={{
          fontSize: 13, color: '#cbd5e1', fontWeight: 600, marginBottom: 6,
          letterSpacing: '0.02em', textTransform: 'uppercase',
        }}
          data-tour="dead-zones"
        >
          Map Elements
        </div>
        <ElementPalette
          activeElementId={activeElement}
          onSelectElement={onSelectElement}
          amenitiesVisible={amenitiesVisible}
          onToggleAmenitiesVisible={onToggleAmenitiesVisible}
          amenityCount={amenityCount}
          onClearAmenities={onClearAmenities}
          mapZonesVisible={mapZonesVisible}
          onToggleMapZonesVisible={onToggleMapZonesVisible}
          mapZoneCount={mapZoneCount}
          onClearMapZones={onClearMapZones}
          deadZoneCount={deadZoneCount}
          onClearDeadZones={onClearDeadZones}
          accessPointCount={accessPointCount}
          loading={loading}
        />
      </div>

      <hr style={{ border: 'none', borderTop: '1px solid #334155', margin: '10px 0' }} />

      {/* Adjacency Rules */}
      <div style={{ marginBottom: 8 }}>
        <button
          onClick={() => setShowRules(!showRules)}
          style={{
            background: 'none',
            border: 'none',
            color: '#cbd5e1',
            cursor: 'pointer',
            fontSize: 13,
            padding: 0,
            fontWeight: 600,
            letterSpacing: '0.02em',
            textTransform: 'uppercase',
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
        title="Auto-assign vendors to spots using placement rules"
      >
        {loading ? 'Running...' : 'Run Placement'}
      </button>

      {/* Danger zone */}
      <div style={{ marginTop: 8 }}>
        <button
          className="btn btn-danger"
          disabled={loading}
          onClick={onClearVendors}
          title="Remove all vendors and their placements"
        >
          Clear Vendors
        </button>
      </div>
    </div>
  );
}
