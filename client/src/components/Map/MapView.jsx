import React, { useState } from 'react';
import { MapContainer, TileLayer, Polygon } from 'react-leaflet';
import { MAP_CENTER, DEFAULT_ZOOM, GOOGLE_TILE_STYLES } from '../../utils/constants.js';
import SpotLayer, { featureCenter } from './SpotLayer.jsx';
import DrawToolbar from './DrawToolbar.jsx';
import FitBounds from './FitBounds.jsx';
import SpotPlacer from './SpotPlacer.jsx';
import LocationSearch from './LocationSearch.jsx';
import SpotEditPopup from './SpotEditPopup.jsx';
import DeadZoneDrawer from './DeadZoneDrawer.jsx';

export default function MapView({
  spots, vendors, assignments, selectedSpotId, paths,
  onPathDrawn, streetDrawMode, spotPlaceMode, onSpotPlaced,
  onSpotClick, editingSpot, onSpotSave, onSpotDelete, onSpotEditClose,
  movingVendor, selectedSpotIds, deadZones, deadZoneDrawMode, onAddDeadZone, onDeadZoneDrawDone,
  onStartMove,
}) {
  const [mapStyle, setMapStyle] = useState('streets');

  // Compute popup position from the editing spot
  const editPosition = editingSpot
    ? featureCenter(editingSpot)
    : null;

  const tileConfig = GOOGLE_TILE_STYLES[mapStyle];

  return (
    <MapContainer
      center={MAP_CENTER}
      zoom={DEFAULT_ZOOM}
      minZoom={2}
      maxZoom={22}
      style={{ width: '100%', height: '100%' }}
      zoomControl={true}
      data-tour="map-area"
    >
      <TileLayer
        key={mapStyle}
        attribution='&copy; Google Maps'
        url={tileConfig.url}
        maxZoom={22}
      />
      <div style={{
        position: 'absolute', top: 10, right: 10, zIndex: 1000,
        display: 'flex', gap: 4, background: '#1e293b', borderRadius: 6, padding: 3,
        boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
      }}>
        {Object.entries(GOOGLE_TILE_STYLES).map(([key, style]) => (
          <button
            key={key}
            onClick={() => setMapStyle(key)}
            style={{
              padding: '4px 10px', border: 'none', borderRadius: 4, cursor: 'pointer',
              fontSize: 12, fontWeight: 600,
              background: mapStyle === key ? '#3b82f6' : 'transparent',
              color: mapStyle === key ? '#fff' : '#94a3b8',
            }}
          >{style.label}</button>
        ))}
      </div>
      <FitBounds spots={spots} />
      {/* Render dead zone polygons */}
      {(deadZones || []).map((dz) => (
        <Polygon
          key={dz.id}
          positions={dz.polygon}
          pathOptions={{
            color: '#dc2626',
            weight: 2,
            fillColor: '#dc2626',
            fillOpacity: 0.3,
            dashArray: '8,4',
          }}
        />
      ))}
      <SpotLayer
        spots={spots}
        vendors={vendors}
        assignments={assignments}
        selectedSpotId={selectedSpotId}
        paths={paths}
        onSpotClick={onSpotClick}
        movingVendor={movingVendor}
        selectedSpotIds={selectedSpotIds}
      />
      <DrawToolbar
        onPathDrawn={onPathDrawn}
        streetDrawMode={streetDrawMode}
      />
      <SpotPlacer active={spotPlaceMode} onSpotPlaced={onSpotPlaced} />
      <DeadZoneDrawer
        active={deadZoneDrawMode}
        onAddDeadZone={onAddDeadZone}
        onDone={onDeadZoneDrawDone}
      />
      <LocationSearch />
      {movingVendor && (
        <div style={{
          position: 'absolute', top: 10, left: '50%', transform: 'translateX(-50%)',
          zIndex: 1000, background: '#8b5cf6', color: '#fff', padding: '6px 16px',
          borderRadius: 6, fontWeight: 600, fontSize: 13, boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
          pointerEvents: 'none',
        }}>
          Click a spot to move vendor here (Esc to cancel)
        </div>
      )}
      {editingSpot && editPosition && (
        <SpotEditPopup
          spot={editingSpot}
          position={editPosition}
          onSave={onSpotSave}
          onDelete={onSpotDelete}
          onClose={onSpotEditClose}
          assignedVendorId={assignments?.[editingSpot?.properties?.id]}
          onStartMove={onStartMove}
        />
      )}
    </MapContainer>
  );
}
