import React from 'react';
import { MapContainer, TileLayer } from 'react-leaflet';
import { MAP_CENTER, DEFAULT_ZOOM } from '../../utils/constants.js';
import SpotLayer from './SpotLayer.jsx';
import DrawToolbar from './DrawToolbar.jsx';

export default function MapView({ spots, vendors, assignments, onSpotsChange, selectedSpotId }) {
  return (
    <MapContainer
      center={MAP_CENTER}
      zoom={DEFAULT_ZOOM}
      style={{ width: '100%', height: '100%' }}
      zoomControl={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <SpotLayer
        spots={spots}
        vendors={vendors}
        assignments={assignments}
        selectedSpotId={selectedSpotId}
      />
      <DrawToolbar spots={spots} onSpotsChange={onSpotsChange} />
    </MapContainer>
  );
}
