import { useEffect, useState } from 'react';
import { useMap } from 'react-leaflet';
import '@geoman-io/leaflet-geoman-free';

let idCounter = Date.now();

function layerToGeoJSONFeature(layer) {
  const geojson = layer.toGeoJSON();
  idCounter += 1;
  return {
    type: 'Feature',
    properties: {
      id: `spot-${idCounter}`,
      label: `Spot ${idCounter}`,
      area: 'custom',
    },
    geometry: geojson.geometry,
  };
}

export default function DrawToolbar({ spots, onSpotsChange }) {
  const map = useMap();
  const [drawEnabled, setDrawEnabled] = useState(false);

  useEffect(() => {
    if (!map) return;

    // Configure Geoman controls
    map.pm.addControls({
      position: 'topright',
      drawMarker: false,
      drawCircle: false,
      drawCircleMarker: false,
      drawPolyline: false,
      drawPolygon: false,
      drawRectangle: true,
      drawText: false,
      editMode: true,
      dragMode: false,
      cutPolygon: false,
      removalMode: true,
      rotateMode: false,
    });

    // Hide controls initially — we toggle via our own button
    map.pm.removeControls();

    const handleCreate = (e) => {
      const feature = layerToGeoJSONFeature(e.layer);
      // Remove the drawn layer; we render via React
      map.removeLayer(e.layer);

      const updated = {
        type: 'FeatureCollection',
        features: [...(spots?.features || []), feature],
      };
      onSpotsChange(updated);
    };

    const handleRemove = (e) => {
      const removedGeo = e.layer.toGeoJSON();
      const updated = {
        type: 'FeatureCollection',
        features: (spots?.features || []).filter((f) => {
          const fCoords = JSON.stringify(f.geometry.coordinates);
          const rCoords = JSON.stringify(removedGeo.geometry.coordinates);
          return fCoords !== rCoords;
        }),
      };
      onSpotsChange(updated);
    };

    map.on('pm:create', handleCreate);
    map.on('pm:remove', handleRemove);

    return () => {
      map.off('pm:create', handleCreate);
      map.off('pm:remove', handleRemove);
      map.pm.removeControls();
    };
  }, [map, spots, onSpotsChange]);

  const toggleDraw = () => {
    if (drawEnabled) {
      map.pm.removeControls();
      map.pm.disableDraw();
    } else {
      map.pm.addControls({
        position: 'topright',
        drawMarker: false,
        drawCircle: false,
        drawCircleMarker: false,
        drawPolyline: false,
        drawPolygon: false,
        drawRectangle: true,
        drawText: false,
        editMode: true,
        dragMode: false,
        cutPolygon: false,
        removalMode: true,
        rotateMode: false,
      });
    }
    setDrawEnabled(!drawEnabled);
  };

  return (
    <div
      style={{
        position: 'absolute',
        top: 10,
        left: 10,
        zIndex: 1000,
      }}
    >
      <button
        onClick={toggleDraw}
        style={{
          padding: '8px 14px',
          background: drawEnabled ? '#dc2626' : '#7c3aed',
          color: '#fff',
          border: 'none',
          borderRadius: 6,
          fontWeight: 600,
          fontSize: 13,
          cursor: 'pointer',
          boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
        }}
      >
        {drawEnabled ? 'Exit Draw Mode' : 'Draw Spots'}
      </button>
    </div>
  );
}
