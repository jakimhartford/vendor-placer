import React from 'react';
import { ELEMENT_CATALOG, ELEMENT_GROUPS } from './elementCatalog.js';

export default function ElementPalette({
  activeElementId,
  onSelectElement,
  amenitiesVisible,
  onToggleAmenitiesVisible,
  amenityCount,
  onClearAmenities,
  mapZonesVisible,
  onToggleMapZonesVisible,
  mapZoneCount,
  onClearMapZones,
  deadZoneCount,
  onClearDeadZones,
  accessPointCount,
  loading,
}) {
  return (
    <div className="element-palette">
      {ELEMENT_GROUPS.map((group) => {
        const items = ELEMENT_CATALOG.filter((e) => e.group === group.id);
        return (
          <div key={group.id}>
            <div style={{ fontSize: 9, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>
              {group.label}
            </div>
            <div className="palette-grid">
              {items.map((el) => {
                const isActive = activeElementId === el.id;
                return (
                  <button
                    key={el.id}
                    className={`palette-tile${isActive ? ' palette-tile--active' : ''}`}
                    style={isActive ? { borderColor: el.color, boxShadow: `0 0 0 1px ${el.color}` } : undefined}
                    disabled={loading}
                    onClick={() => onSelectElement(isActive ? null : el.id)}
                    title={el.label}
                  >
                    <span style={{ fontSize: 18, lineHeight: 1 }}>{el.icon}</span>
                    <span className="palette-tile-label">{el.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Visibility toggles & clear buttons */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
        <label style={{ fontSize: 10, color: '#94a3b8', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }} title="Toggle amenity layer visibility">
          <input type="checkbox" checked={amenitiesVisible} onChange={onToggleAmenitiesVisible} />
          Amenities{amenityCount > 0 ? ` (${amenityCount})` : ''}
        </label>
        {amenityCount > 0 && (
          <button className="btn btn-secondary" title="Remove all amenities" style={{ padding: '2px 6px', fontSize: 9, width: 'auto', marginBottom: 0 }} onClick={onClearAmenities}>
            Clear
          </button>
        )}

        <label data-tour="map-zones" style={{ fontSize: 10, color: '#94a3b8', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }} title="Toggle zone layer visibility">
          <input type="checkbox" checked={mapZonesVisible} onChange={onToggleMapZonesVisible} />
          Zones{mapZoneCount > 0 ? ` (${mapZoneCount})` : ''}
        </label>
        {mapZoneCount > 0 && (
          <button className="btn btn-secondary" title="Remove all map zones" style={{ padding: '2px 6px', fontSize: 9, width: 'auto', marginBottom: 0 }} onClick={onClearMapZones}>
            Clear
          </button>
        )}

        {deadZoneCount > 0 && (
          <button className="btn btn-secondary" title="Remove all dead zones" style={{ padding: '2px 6px', fontSize: 9, width: 'auto', marginBottom: 0 }} onClick={onClearDeadZones}>
            Clear Dead Zones ({deadZoneCount})
          </button>
        )}

        {accessPointCount > 0 && (
          <span style={{ fontSize: 10, color: '#94a3b8', alignSelf: 'center' }}>
            {accessPointCount} access pt{accessPointCount !== 1 ? 's' : ''}
          </span>
        )}
      </div>
    </div>
  );
}
