import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Polygon, Popup, useMap } from 'react-leaflet';
import { MAP_CENTER, DEFAULT_ZOOM, GOOGLE_TILE_STYLES } from '../../utils/constants.js';
import SpotLayer, { featureCenter } from './SpotLayer.jsx';
import DrawToolbar from './DrawToolbar.jsx';
import FitBounds from './FitBounds.jsx';
import SpotPlacer from './SpotPlacer.jsx';
import LocationSearch from './LocationSearch.jsx';
import SpotEditPopup from './SpotEditPopup.jsx';
import DeadZoneDrawer from './DeadZoneDrawer.jsx';
import DeadZoneEditor from './DeadZoneEditor.jsx';
import AmenityLayer from './AmenityLayer.jsx';
import AmenityPlacer from './AmenityPlacer.jsx';
import AccessPointLayer from './AccessPointLayer.jsx';
import MapZoneLayer from './MapZoneLayer.jsx';
import MapZoneDrawer from './MapZoneDrawer.jsx';

function MapSizeInvalidator() {
  const map = useMap();
  useEffect(() => {
    // Invalidate immediately + after layout settles so Leaflet knows its true size
    map.invalidateSize();
    const timer = setTimeout(() => map.invalidateSize(), 200);
    const onResize = () => map.invalidateSize();
    window.addEventListener('resize', onResize);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', onResize);
    };
  }, [map]);
  return null;
}

export default function MapView({
  spots, vendors, assignments, selectedSpotId, paths,
  onPathDrawn, streetDrawMode, spotPlaceMode, onSpotPlaced,
  onSpotClick, editingSpot, onSpotSave, onSpotDelete, onSpotEditClose,
  movingVendor, selectedSpotIds, deadZones, deadZoneDrawMode, onAddDeadZone, onDeadZoneDrawDone,
  onRemoveDeadZone, onStartMove, onUpdateDeadZone, currentProjectId, pricingConfig,
  amenities, amenityPlaceMode, amenityType, onPlaceAmenity, onDeleteAmenity, amenitiesVisible,
  accessPoints, accessPointPlaceMode, onPlaceAccessPoint, onDeleteAccessPoint,
  mapZones, mapZoneDrawMode, mapZoneType, onAddMapZone, onDeleteMapZone, onMapZoneDrawDone, mapZonesVisible,
  mapContainerRef,
}) {
  const [mapStyle, setMapStyle] = useState('streets');
  const [editingDeadZone, setEditingDeadZone] = useState(null);

  // Compute popup position from the editing spot
  const editPosition = editingSpot
    ? featureCenter(editingSpot)
    : null;

  const tileConfig = GOOGLE_TILE_STYLES[mapStyle];

  return (
    <div ref={mapContainerRef} style={{ width: '100%', height: '100%' }}>
    <MapContainer
      center={MAP_CENTER}
      zoom={DEFAULT_ZOOM}
      minZoom={2}
      maxZoom={22}
      style={{ width: '100%', height: '100%' }}
      zoomControl={true}
      data-tour="map-area"
    >
      <MapSizeInvalidator />
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
      {/* Render dead zone polygons — click to delete */}
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
        >
          <Popup>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 6 }}>Dead Zone</div>
              <div style={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
                <button
                  onClick={() => setEditingDeadZone(dz)}
                  style={{
                    padding: '4px 12px', background: '#f59e0b', color: '#000',
                    border: 'none', borderRadius: 4, fontWeight: 600, fontSize: 12,
                    cursor: 'pointer',
                  }}
                >
                  Edit
                </button>
                <button
                  onClick={() => onRemoveDeadZone(dz.id)}
                  style={{
                    padding: '4px 12px', background: '#dc2626', color: '#fff',
                    border: 'none', borderRadius: 4, fontWeight: 600, fontSize: 12,
                    cursor: 'pointer',
                  }}
                >
                  Remove
                </button>
              </div>
            </div>
          </Popup>
        </Polygon>
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
      <AmenityLayer amenities={amenities} onDelete={onDeleteAmenity} visible={amenitiesVisible} />
      <AmenityPlacer active={amenityPlaceMode} amenityType={amenityType} onPlace={onPlaceAmenity} />
      <AccessPointLayer accessPoints={accessPoints} onDelete={onDeleteAccessPoint} active={accessPointPlaceMode} onPlace={onPlaceAccessPoint} />
      <MapZoneLayer mapZones={mapZones} onDelete={onDeleteMapZone} visible={mapZonesVisible} />
      <MapZoneDrawer active={mapZoneDrawMode} zoneType={mapZoneType} onAddMapZone={onAddMapZone} onDone={onMapZoneDrawDone} />
      {editingDeadZone && (
        <DeadZoneEditor
          deadZone={editingDeadZone}
          onUpdate={(id, data) => {
            if (onUpdateDeadZone) onUpdateDeadZone(id, data);
            setEditingDeadZone(null);
          }}
          onClose={() => setEditingDeadZone(null)}
        />
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
          vendors={vendors}
          currentProjectId={currentProjectId}
          pricingConfig={pricingConfig}
          amenities={amenities}
        />
      )}
    </MapContainer>
    </div>
  );
}
