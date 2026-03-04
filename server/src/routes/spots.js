import { Router } from 'express';
import crypto from 'crypto';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

export const spotRoutes = Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load default spots from JSON
let spotsGeoJSON = JSON.parse(
  readFileSync(join(__dirname, '..', 'data', 'defaultSpots.json'), 'utf-8')
);

/** Get the current spots GeoJSON (used by other modules) */
export function getSpots() {
  return spotsGeoJSON;
}

// ──────────────────────────────────────────────
// Festival area definitions
// ──────────────────────────────────────────────

// Beach St: long east-west strip
const BEACH = {
  south: 29.2080,
  north: 29.2098,
  west: -81.0278,
  east: -81.0195,
};

// Magnolia Ave: north-south strip
const MAGNOLIA = {
  south: 29.2055,
  north: 29.2080,
  west: -81.0222,
  east: -81.0212,
};

// Spot size in degrees (~3m)
const SPOT_LAT = 0.00003;
const SPOT_LNG = 0.00004;

// Gap between spots in degrees (~1m)
const GAP_LAT = 0.00001;
const GAP_LNG = 0.000013;

// Street half-width offset (push rows apart)
const STREET_OFFSET = 0.00006;

/**
 * Create a rectangular GeoJSON polygon for a single spot.
 */
function makeSpotPolygon(lat, lng) {
  // Coordinates in [lng, lat] GeoJSON order
  return {
    type: 'Polygon',
    coordinates: [
      [
        [lng, lat],
        [lng + SPOT_LNG, lat],
        [lng + SPOT_LNG, lat + SPOT_LAT],
        [lng, lat + SPOT_LAT],
        [lng, lat], // close ring
      ],
    ],
  };
}

/**
 * Generate spots for Beach St (east-west strip, 2 rows: north side & south side).
 */
function generateBeachSpots(rows) {
  const features = [];

  // Center lat of the street
  const centerLat = (BEACH.south + BEACH.north) / 2;
  const lngRange = BEACH.east - BEACH.west;
  const step = SPOT_LNG + GAP_LNG;
  const cols = Math.floor(lngRange / step);

  const sides = ['north', 'south'];
  const offsets = {
    north: centerLat + STREET_OFFSET,
    south: centerLat - STREET_OFFSET - SPOT_LAT,
  };

  for (const side of sides) {
    const baseLat = offsets[side];
    for (let r = 0; r < rows; r++) {
      const latOffset = side === 'north' ? r * (SPOT_LAT + GAP_LAT) : -r * (SPOT_LAT + GAP_LAT);
      const lat = baseLat + latOffset;

      for (let c = 0; c < cols; c++) {
        const lng = BEACH.west + c * step;
        const isCorner = c === 0 || c === cols - 1;
        const trafficScore = isCorner ? 9 : Math.max(1, Math.round(5 - Math.abs(c - cols / 2) / (cols / 10)));
        const label = `B-${side.charAt(0).toUpperCase()}-${r + 1}-${c + 1}`;

        features.push({
          type: 'Feature',
          geometry: makeSpotPolygon(lat, lng),
          properties: {
            id: crypto.randomUUID(),
            label,
            isCorner,
            trafficScore: Math.min(10, trafficScore),
            side,
            row: r + 1,
            col: c + 1,
            area: 'beach',
            assignedVendorId: null,
          },
        });
      }
    }
  }

  return features;
}

/**
 * Generate spots for Magnolia Ave (north-south strip, 2 rows: east & west).
 */
function generateMagnoliaSpots(rows) {
  const features = [];

  const centerLng = (MAGNOLIA.west + MAGNOLIA.east) / 2;
  const latRange = MAGNOLIA.north - MAGNOLIA.south;
  const step = SPOT_LAT + GAP_LAT;
  const rowCount = Math.floor(latRange / step);

  const sides = ['east', 'west'];
  const offsets = {
    east: centerLng + STREET_OFFSET,
    west: centerLng - STREET_OFFSET - SPOT_LNG,
  };

  for (const side of sides) {
    const baseLng = offsets[side];
    for (let r = 0; r < rows; r++) {
      const lngOffset = side === 'east' ? r * (SPOT_LNG + GAP_LNG) : -r * (SPOT_LNG + GAP_LNG);
      const lng = baseLng + lngOffset;

      for (let c = 0; c < rowCount; c++) {
        const lat = MAGNOLIA.south + c * step;
        const isCorner = c === 0 || c === rowCount - 1;

        // Spots near Beach St intersection get higher traffic
        const distToBeach = Math.abs(lat - BEACH.south);
        const intersectionBonus = distToBeach < 0.0003 ? 4 : 0;
        const isIntersection = distToBeach < 0.0001;
        const trafficScore = Math.min(
          10,
          (isCorner ? 7 : 3) + intersectionBonus + (isIntersection ? 2 : 0)
        );

        const label = `M-${side.charAt(0).toUpperCase()}-${r + 1}-${c + 1}`;

        features.push({
          type: 'Feature',
          geometry: makeSpotPolygon(lat, lng),
          properties: {
            id: crypto.randomUUID(),
            label,
            isCorner: isCorner || isIntersection,
            trafficScore,
            side,
            row: r + 1,
            col: c + 1,
            area: 'magnolia',
            assignedVendorId: null,
          },
        });
      }
    }
  }

  return features;
}

// ──────────────────────────────────────────────
// Routes
// ──────────────────────────────────────────────

// GET /api/spots
spotRoutes.get('/', (_req, res) => {
  return res.json(spotsGeoJSON);
});

// PUT /api/spots — replace entire collection
spotRoutes.put('/', (req, res) => {
  const body = req.body;
  if (!body || body.type !== 'FeatureCollection') {
    return res.status(400).json({ error: 'Body must be a GeoJSON FeatureCollection' });
  }
  spotsGeoJSON = body;
  return res.json({
    message: `Replaced spots collection (${spotsGeoJSON.features.length} spots)`,
    count: spotsGeoJSON.features.length,
  });
});

// POST /api/spots/generate-grid
spotRoutes.post('/generate-grid', (req, res) => {
  const { area = 'both', rows = 2 } = req.body;
  let features = [];

  if (area === 'beach' || area === 'both') {
    features = features.concat(generateBeachSpots(rows));
  }
  if (area === 'magnolia' || area === 'both') {
    features = features.concat(generateMagnoliaSpots(rows));
  }

  spotsGeoJSON = {
    type: 'FeatureCollection',
    features,
    metadata: spotsGeoJSON.metadata || {},
  };

  return res.json({
    message: `Generated ${features.length} spots for area "${area}"`,
    count: features.length,
    spotsGeoJSON,
  });
});
