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
// Generate spots along a drawn path (LineString)
// ──────────────────────────────────────────────

// Conversion constants (approximate at ~29° latitude)
const FT_TO_LAT = 0.0000027;  // 1 ft in degrees latitude
const FT_TO_LNG = 0.0000034;  // 1 ft in degrees longitude

function distance(a, b) {
  const dlat = (b[1] - a[1]) / FT_TO_LAT;
  const dlng = (b[0] - a[0]) / FT_TO_LNG;
  return Math.sqrt(dlat * dlat + dlng * dlng); // in feet
}

function interpolate(a, b, t) {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
}

function angleBetween(a, b, c) {
  const v1 = [b[0] - a[0], b[1] - a[1]];
  const v2 = [c[0] - b[0], c[1] - b[1]];
  const dot = v1[0] * v2[0] + v1[1] * v2[1];
  const mag1 = Math.sqrt(v1[0] ** 2 + v1[1] ** 2);
  const mag2 = Math.sqrt(v2[0] ** 2 + v2[1] ** 2);
  if (mag1 === 0 || mag2 === 0) return 0;
  return Math.acos(Math.min(1, Math.max(-1, dot / (mag1 * mag2)))) * (180 / Math.PI);
}

function makeSpotRect(centerLat, centerLng, halfW, halfH) {
  return {
    type: 'Polygon',
    coordinates: [[
      [centerLng - halfW, centerLat - halfH],
      [centerLng + halfW, centerLat - halfH],
      [centerLng + halfW, centerLat + halfH],
      [centerLng - halfW, centerLat + halfH],
      [centerLng - halfW, centerLat - halfH],
    ]],
  };
}

function generateSpotsFromPath(path, { spotSizeFt = 12, spacingFt = 2, rows = 1, offsetFt = 15, label = 'S' }) {
  const features = [];
  const stepFt = spotSizeFt + spacingFt;
  const halfSpotLat = (spotSizeFt / 2) * FT_TO_LAT;
  const halfSpotLng = (spotSizeFt / 2) * FT_TO_LNG;

  // Walk the path at stepFt intervals, collecting positions and perpendicular directions
  const positions = [];
  let accumulated = 0;
  let nextMark = spotSizeFt / 2; // start half-spot in

  for (let i = 0; i < path.length - 1; i++) {
    const segStart = path[i];
    const segEnd = path[i + 1];
    const segLen = distance(segStart, segEnd);
    if (segLen === 0) continue;

    // Direction along segment
    const dx = segEnd[0] - segStart[0];
    const dy = segEnd[1] - segStart[1];
    // Perpendicular (right-hand normal)
    const perpLng = -dy;
    const perpLat = dx;
    const perpMag = Math.sqrt((perpLng / FT_TO_LNG) ** 2 + (perpLat / FT_TO_LAT) ** 2);
    const normLng = perpLng / perpMag; // per foot in lng
    const normLat = perpLat / perpMag; // per foot in lat

    // Check for corner (bend) at this vertex
    let isVertexCorner = false;
    if (i > 0) {
      const bend = angleBetween(path[i - 1], path[i], path[i + 1]);
      if (bend > 30) isVertexCorner = true;
    }

    let pos = accumulated;
    while (pos + (stepFt - spotSizeFt / 2) <= accumulated + segLen && nextMark <= accumulated + segLen) {
      const t = (nextMark - accumulated) / segLen;
      const pt = interpolate(segStart, segEnd, t);

      const isFirst = positions.length === 0;
      positions.push({
        point: pt,
        normLng: normLng * FT_TO_LNG,
        normLat: normLat * FT_TO_LAT,
        isCorner: isFirst || isVertexCorner,
      });
      isVertexCorner = false; // only mark once

      nextMark += stepFt;
    }
    accumulated += segLen;
  }

  // Mark last position as corner
  if (positions.length > 0) {
    positions[positions.length - 1].isCorner = true;
  }

  // Determine dominant direction for labeling (E/W or N/S)
  const first = path[0];
  const last = path[path.length - 1];
  const dLat = Math.abs(last[1] - first[1]) / FT_TO_LAT;
  const dLng = Math.abs(last[0] - first[0]) / FT_TO_LNG;
  const isNorthSouth = dLat > dLng;
  const sideLabels = isNorthSouth ? ['E', 'W'] : ['N', 'S'];
  const sideMultipliers = [1, -1]; // right side, left side

  for (let sideIdx = 0; sideIdx < 2; sideIdx++) {
    const sideLabel = sideLabels[sideIdx];
    const mult = sideMultipliers[sideIdx];

    for (let r = 0; r < rows; r++) {
      const rowOffsetFt = offsetFt + r * stepFt;

      for (let c = 0; c < positions.length; c++) {
        const { point, normLng, normLat, isCorner } = positions[c];
        const centerLng = point[0] + mult * rowOffsetFt * normLng;
        const centerLat = point[1] + mult * rowOffsetFt * normLat;

        const trafficScore = isCorner ? 9 : Math.max(1, Math.round(5 - Math.abs(c - positions.length / 2) / (positions.length / 10)));

        features.push({
          type: 'Feature',
          geometry: makeSpotRect(centerLat, centerLng, halfSpotLng, halfSpotLat),
          properties: {
            id: crypto.randomUUID(),
            label: `${label}${sideLabel}${r + 1}${String(c + 1).padStart(2, '0')}`,
            isCorner,
            trafficScore: Math.min(10, trafficScore),
            side: sideLabel,
            row: r + 1,
            col: c + 1,
            area: 'path',
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

// DELETE /api/spots — clear all spots
spotRoutes.delete('/', (_req, res) => {
  const count = spotsGeoJSON.features?.length || 0;
  spotsGeoJSON = { type: 'FeatureCollection', features: [], metadata: {} };
  return res.json({ message: `Cleared ${count} spots`, count: 0 });
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

// POST /api/spots/generate-from-path
spotRoutes.post('/generate-from-path', (req, res) => {
  const { path, spotSizeFt = 12, spacingFt = 2, rows = 1, offsetFt = 15, label = 'S' } = req.body;

  if (!path || !Array.isArray(path) || path.length < 2) {
    return res.status(400).json({ error: 'path must be an array of at least 2 [lng, lat] coordinates' });
  }

  const newFeatures = generateSpotsFromPath(path, { spotSizeFt, spacingFt, rows, offsetFt, label });

  // Append to existing spots (don't replace)
  const existingFeatures = spotsGeoJSON?.features || [];
  spotsGeoJSON = {
    type: 'FeatureCollection',
    features: [...existingFeatures, ...newFeatures],
    metadata: spotsGeoJSON.metadata || {},
  };

  return res.json({
    message: `Generated ${newFeatures.length} spots along path (total: ${spotsGeoJSON.features.length})`,
    count: newFeatures.length,
    totalCount: spotsGeoJSON.features.length,
    spotsGeoJSON,
  });
});
