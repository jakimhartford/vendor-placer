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

export default function DrawToolbar({ spots, onSpotsChange, onPathDrawn, streetDrawMode, onStreetDrawModeChange }) {
  const map = useMap();
  const [drawEnabled, setDrawEnabled] = useState(false);

  useEffect(() => {
    if (!map) return;

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

    map.pm.removeControls();

    const handleCreate = (e) => {
      const geojson = e.layer.toGeoJSON();
      map.removeLayer(e.layer);

      // If it's a LineString, it came from street draw mode
      if (geojson.geometry.type === 'LineString') {
        const coords = geojson.geometry.coordinates; // [[lng, lat], ...]
        if (onPathDrawn && coords.length >= 2) {
          onPathDrawn(coords);
        }
        return;
      }

      // Otherwise it's a rectangle spot
      const feature = layerToGeoJSONFeature(e.layer);
      // Reconstruct from geojson since layer was already removed
      feature.geometry = geojson.geometry;
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
  }, [map, spots, onSpotsChange, onPathDrawn]);

  // Handle street draw mode changes from sidebar
  useEffect(() => {
    if (!map) return;
    if (streetDrawMode) {
      // Disable spot draw if active
      if (drawEnabled) {
        map.pm.removeControls();
        map.pm.disableDraw();
        setDrawEnabled(false);
      }
      map.pm.enableDraw('Line', {
        snappable: true,
        snapDistance: 10,
        templineStyle: { color: '#facc15', dashArray: '8,6' },
        hintlineStyle: { color: '#facc15', dashArray: '4,4' },
        pathOptions: { color: '#facc15', weight: 3 },
      });
    } else {
      map.pm.disableDraw('Line');
    }
  }, [map, streetDrawMode, drawEnabled]);

  const toggleDraw = () => {
    // Exit street draw mode if active
    if (streetDrawMode && onStreetDrawModeChange) {
      onStreetDrawModeChange(false);
    }

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
        display: 'flex',
        gap: 6,
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
      {streetDrawMode && (
        <div
          style={{
            padding: '8px 14px',
            background: '#facc15',
            color: '#000',
            borderRadius: 6,
            fontWeight: 600,
            fontSize: 13,
            boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
          }}
        >
          Drawing Street...
        </div>
      )}
    </div>
  );
}
