import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Polygon, Popup, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import { MAP_CENTER, DEFAULT_ZOOM, GOOGLE_TILE_STYLES } from '../../utils/constants.js';
import SpotLayer, { featureCenter } from './SpotLayer.jsx';
import DrawToolbar from './DrawToolbar.jsx';
import FitBounds from './FitBounds.jsx';
import SpotPlacer from './SpotPlacer.jsx';
import LocationSearch from './LocationSearch.jsx';
import SpotEditPopup from './SpotEditPopup.jsx';
import DeadZoneDrawer from './DeadZoneDrawer.jsx';
import AmenityLayer from './AmenityLayer.jsx';
import AmenityPlacer from './AmenityPlacer.jsx';
import AccessPointLayer from './AccessPointLayer.jsx';
import MapZoneLayer from './MapZoneLayer.jsx';
import MapZoneDrawer from './MapZoneDrawer.jsx';
import ZoneHandles from './ZoneHandles.jsx';

function MapSizeInvalidator() {
  const map = useMap();
  useEffect(() => {
    const container = map.getContainer();
    // Use ResizeObserver to catch any container size change (sidebar toggle, window resize, etc.)
    const observer = new ResizeObserver(() => {
      map.invalidateSize({ animate: false });
    });
    observer.observe(container);
    // Also invalidate immediately in case layout already settled
    map.invalidateSize({ animate: false });
    return () => observer.disconnect();
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
  mapZones, mapZoneDrawMode, mapZoneType, onAddMapZone, onDeleteMapZone, onUpdateMapZone, onMapZoneDrawDone, mapZonesVisible,
  mapContainerRef,
}) {
  const [mapStyle, setMapStyle] = useState('streets');
  const [selectedDeadZoneId, setSelectedDeadZoneId] = useState(null);

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
      {/* Render dead zone polygons with icon — click to select & show handles */}
      {(deadZones || []).map((dz) => {
        const center = [
          dz.polygon.reduce((s, p) => s + p[0], 0) / dz.polygon.length,
          dz.polygon.reduce((s, p) => s + p[1], 0) / dz.polygon.length,
        ];
        const isSelected = selectedDeadZoneId === dz.id;
        return (
          <React.Fragment key={dz.id}>
            <Polygon
              positions={dz.polygon}
              pathOptions={{
                color: '#dc2626',
                weight: isSelected ? 0 : 2,
                fillColor: '#dc2626',
                fillOpacity: 0.3,
                dashArray: '8,4',
              }}
              eventHandlers={{ click: () => setSelectedDeadZoneId(isSelected ? null : dz.id) }}
            />
            <Marker
              position={center}
              icon={L.divIcon({
                className: '',
                html: '<div style="font-size:22px;line-height:1;filter:drop-shadow(0 1px 3px rgba(0,0,0,0.5));cursor:pointer;">⛔</div>',
                iconSize: [28, 28],
                iconAnchor: [14, 14],
              })}
              eventHandlers={{ click: () => setSelectedDeadZoneId(isSelected ? null : dz.id) }}
            >
              {!isSelected && (
                <Popup>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 6 }}>⛔ Dead Zone</div>
                    <div style={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
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
              )}
            </Marker>
            {isSelected && (
              <>
                <ZoneHandles
                  polygon={dz.polygon}
                  color="#dc2626"
                  onUpdate={(newPolygon) => {
                    if (onUpdateDeadZone) onUpdateDeadZone(dz.id, { polygon: newPolygon });
                  }}
                  onClose={() => setSelectedDeadZoneId(null)}
                />
                <Marker
                  position={center}
                  icon={L.divIcon({
                    className: '',
                    html: `<div style="
                      background:#dc2626;color:#fff;padding:4px 12px;border-radius:4px;
                      font-size:11px;font-weight:600;cursor:pointer;white-space:nowrap;
                      box-shadow:0 2px 6px rgba(0,0,0,0.3);text-align:center;
                    ">🗑 Remove</div>`,
                    iconSize: [80, 24],
                    iconAnchor: [40, -8],
                  })}
                  zIndexOffset={2000}
                  eventHandlers={{
                    click: (e) => {
                      L.DomEvent.stopPropagation(e);
                      setSelectedDeadZoneId(null);
                      onRemoveDeadZone(dz.id);
                    },
                  }}
                />
              </>
            )}
          </React.Fragment>
        );
      })}
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
      <MapZoneLayer mapZones={mapZones} onDelete={onDeleteMapZone} onUpdate={onUpdateMapZone} visible={mapZonesVisible} />
      <MapZoneDrawer active={mapZoneDrawMode} zoneType={mapZoneType} onAddMapZone={onAddMapZone} onDone={onMapZoneDrawDone} />
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
