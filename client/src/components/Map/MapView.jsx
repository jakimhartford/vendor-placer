import React from 'react';
import { MapContainer, TileLayer } from 'react-leaflet';
import { MAP_CENTER, DEFAULT_ZOOM } from '../../utils/constants.js';
import SpotLayer from './SpotLayer.jsx';
import FitBounds from './FitBounds.jsx';

export default function MapView({ spots, vendors, assignments, selectedSpotId }) {
  return (
    <MapContainer
      center={MAP_CENTER}
      zoom={DEFAULT_ZOOM}
      minZoom={16}
      maxZoom={22}
      style={{ width: '100%', height: '100%' }}
      zoomControl={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        maxZoom={22}
      />
      <FitBounds spots={spots} />
      <SpotLayer
        spots={spots}
        vendors={vendors}
        assignments={assignments}
        selectedSpotId={selectedSpotId}
      />
    </MapContainer>
  );
}
