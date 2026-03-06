import { Router } from 'express';
import crypto from 'crypto';
import { getSession } from '../state/sessionStore.js';
import { spotOverlapsDeadZone } from '../utils/geometry.js';
import { recalculateScores } from '../utils/spotScoring.js';

export const spotRoutes = Router();

/** Get the current spots GeoJSON for a user (used by other modules) */
export function getSpots(userId) {
  return getSession(userId).spotsGeoJSON;
}

/** Replace spots in-memory for a user (used by projects) */
export function setSpots(userId, geojson) {
  getSession(userId).spotsGeoJSON = geojson;
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
  return {
    type: 'Polygon',
    coordinates: [
      [
        [lng, lat],
        [lng + SPOT_LNG, lat],
        [lng + SPOT_LNG, lat + SPOT_LAT],
        [lng, lat + SPOT_LAT],
        [lng, lat],
      ],
    ],
  };
}

/**
 * Generate spots for Beach St (east-west strip, 2 rows: north side & south side).
 */
function generateBeachSpots(rows) {
  const features = [];
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

const FT_TO_LAT = 0.0000027;
const FT_TO_LNG = 0.0000034;

function distance(a, b) {
  const dlat = (b[1] - a[1]) / FT_TO_LAT;
  const dlng = (b[0] - a[0]) / FT_TO_LNG;
  return Math.sqrt(dlat * dlat + dlng * dlng);
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

function makeRotatedSpotRect(centerLng, centerLat, halfSizeFt, tangentLng, tangentLat, normalLng, normalLat) {
  const tLng = halfSizeFt * tangentLng;
  const tLat = halfSizeFt * tangentLat;
  const nLng = halfSizeFt * normalLng;
  const nLat = halfSizeFt * normalLat;

  return {
    type: 'Polygon',
    coordinates: [[
      [centerLng - tLng - nLng, centerLat - tLat - nLat],
      [centerLng + tLng - nLng, centerLat + tLat - nLat],
      [centerLng + tLng + nLng, centerLat + tLat + nLat],
      [centerLng - tLng + nLng, centerLat - tLat + nLat],
      [centerLng - tLng - nLng, centerLat - tLat - nLat],
    ]],
  };
}

function generateSpotsFromPath(path, { spotSizeFt = 12, spacingFt = 2, label = 'S' }) {
  const features = [];
  const stepFt = spotSizeFt + spacingFt;
  const halfSizeFt = spotSizeFt / 2;

  const positions = [];
  let accumulated = 0;
  let nextMark = halfSizeFt;

  for (let i = 0; i < path.length - 1; i++) {
    const segStart = path[i];
    const segEnd = path[i + 1];
    const segLen = distance(segStart, segEnd);
    if (segLen === 0) continue;

    const dx = segEnd[0] - segStart[0];
    const dy = segEnd[1] - segStart[1];

    const dxFt = dx / FT_TO_LNG;
    const dyFt = dy / FT_TO_LAT;
    const magFt = Math.sqrt(dxFt * dxFt + dyFt * dyFt);

    const tanLng = (dxFt / magFt) * FT_TO_LNG;
    const tanLat = (dyFt / magFt) * FT_TO_LAT;
    const normLng = (-dyFt / magFt) * FT_TO_LNG;
    const normLat = (dxFt / magFt) * FT_TO_LAT;

    let isVertexCorner = false;
    if (i > 0) {
      const bend = angleBetween(path[i - 1], path[i], path[i + 1]);
      if (bend > 30) isVertexCorner = true;
    }

    while (nextMark <= accumulated + segLen) {
      const t = (nextMark - accumulated) / segLen;
      const pt = interpolate(segStart, segEnd, t);

      const isFirst = positions.length === 0;
      positions.push({
        point: pt,
        tanLng, tanLat,
        normLng, normLat,
        isCorner: isFirst || isVertexCorner,
      });
      isVertexCorner = false;
      nextMark += stepFt;
    }
    accumulated += segLen;
  }

  if (positions.length > 0) {
    positions[positions.length - 1].isCorner = true;
  }

  for (let c = 0; c < positions.length; c++) {
    const { point, tanLng, tanLat, normLng, normLat, isCorner } = positions[c];

    const trafficScore = isCorner ? 9 : Math.max(1, Math.round(5 - Math.abs(c - positions.length / 2) / (positions.length / 10)));

    features.push({
      type: 'Feature',
      geometry: makeRotatedSpotRect(point[0], point[1], halfSizeFt, tanLng, tanLat, normLng, normLat),
      properties: {
        id: crypto.randomUUID(),
        label: `${label}${String(c + 1).padStart(2, '0')}`,
        isCorner,
        trafficScore: Math.min(10, trafficScore),
        side: label,
        row: 1,
        col: c + 1,
        area: 'path',
        assignedVendorId: null,
      },
    });
  }

  return features;
}

// ──────────────────────────────────────────────
// Routes
// ──────────────────────────────────────────────

// POST /api/spots/recalculate-scores
spotRoutes.post('/recalculate-scores', (req, res) => {
  const session = getSession(req.user.id);
  recalculateScores(session);
  return res.json({
    message: 'Scores recalculated',
    spotsGeoJSON: session.spotsGeoJSON,
  });
});

// GET /api/spots
spotRoutes.get('/', (req, res) => {
  return res.json(getSession(req.user.id).spotsGeoJSON);
});

// DELETE /api/spots — clear all spots
spotRoutes.delete('/', (req, res) => {
  const session = getSession(req.user.id);
  const count = session.spotsGeoJSON.features?.length || 0;
  session.spotsGeoJSON = { type: 'FeatureCollection', features: [], metadata: {} };
  return res.json({ message: `Cleared ${count} spots`, count: 0 });
});

// PUT /api/spots — replace entire collection
spotRoutes.put('/', (req, res) => {
  const body = req.body;
  if (!body || body.type !== 'FeatureCollection') {
    return res.status(400).json({ error: 'Body must be a GeoJSON FeatureCollection' });
  }
  const session = getSession(req.user.id);
  session.spotsGeoJSON = body;
  recalculateScores(session);
  return res.json({
    message: `Replaced spots collection (${session.spotsGeoJSON.features.length} spots)`,
    count: session.spotsGeoJSON.features.length,
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

  const session = getSession(req.user.id);
  // Filter out spots that overlap dead zones
  const filtered = features.filter((f) => !spotOverlapsDeadZone(f, session.deadZones));
  session.spotsGeoJSON = {
    type: 'FeatureCollection',
    features: filtered,
    metadata: session.spotsGeoJSON.metadata || {},
  };
  recalculateScores(session);

  return res.json({
    message: `Generated ${filtered.length} spots for area "${area}" (${features.length - filtered.length} in dead zones)`,
    count: filtered.length,
    spotsGeoJSON: session.spotsGeoJSON,
  });
});

// POST /api/spots/add-single
spotRoutes.post('/add-single', (req, res) => {
  const { lng, lat, label, deadZone } = req.body;
  if (typeof lng !== 'number' || typeof lat !== 'number') {
    return res.status(400).json({ error: 'lng and lat are required numbers' });
  }

  const session = getSession(req.user.id);
  const existingCount = session.spotsGeoJSON.features?.length || 0;
  const spotLabel = label || `P${String(existingCount + 1).padStart(2, '0')}`;

  const feature = {
    type: 'Feature',
    geometry: makeSpotPolygon(lat, lng),
    properties: {
      id: crypto.randomUUID(),
      label: spotLabel,
      isCorner: false,
      trafficScore: 5,
      side: 'manual',
      row: 1,
      col: existingCount + 1,
      area: 'manual',
      assignedVendorId: null,
    },
  };

  // Reject if spot overlaps a dead zone
  if (spotOverlapsDeadZone(feature, session.deadZones)) {
    return res.status(400).json({ error: 'Spot overlaps a dead zone' });
  }

  const existingFeatures = session.spotsGeoJSON?.features || [];
  session.spotsGeoJSON = {
    type: 'FeatureCollection',
    features: [...existingFeatures, feature],
    metadata: session.spotsGeoJSON.metadata || {},
  };
  recalculateScores(session);

  return res.json({
    message: `Added spot "${spotLabel}"`,
    spotsGeoJSON: session.spotsGeoJSON,
  });
});

// PATCH /api/spots/:id
spotRoutes.patch('/:id', (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  if (!updates || typeof updates !== 'object') {
    return res.status(400).json({ error: 'Body must be an object of properties to update' });
  }

  const session = getSession(req.user.id);
  const idx = session.spotsGeoJSON.features.findIndex((f) => f.properties?.id === id);
  if (idx === -1) {
    return res.status(404).json({ error: `Spot "${id}" not found` });
  }

  session.spotsGeoJSON.features[idx].properties = {
    ...session.spotsGeoJSON.features[idx].properties,
    ...updates,
    id,
  };
  recalculateScores(session);

  return res.json({
    message: `Updated spot "${id}"`,
    spotsGeoJSON: session.spotsGeoJSON,
  });
});

// DELETE /api/spots/:id
spotRoutes.delete('/:id', (req, res) => {
  const { id } = req.params;
  const session = getSession(req.user.id);
  const idx = session.spotsGeoJSON.features.findIndex((f) => f.properties?.id === id);
  if (idx === -1) {
    return res.status(404).json({ error: `Spot "${id}" not found` });
  }

  session.spotsGeoJSON = {
    ...session.spotsGeoJSON,
    features: session.spotsGeoJSON.features.filter((f) => f.properties?.id !== id),
  };

  return res.json({
    message: `Deleted spot "${id}"`,
    spotsGeoJSON: session.spotsGeoJSON,
  });
});

// POST /api/spots/delete-batch
spotRoutes.post('/delete-batch', (req, res) => {
  const { ids } = req.body;
  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ error: 'ids must be a non-empty array' });
  }
  const session = getSession(req.user.id);
  const idSet = new Set(ids);
  const before = session.spotsGeoJSON.features.length;
  session.spotsGeoJSON = {
    ...session.spotsGeoJSON,
    features: session.spotsGeoJSON.features.filter((f) => !idSet.has(f.properties?.id)),
  };
  const removed = before - session.spotsGeoJSON.features.length;
  return res.json({
    message: `Deleted ${removed} spots`,
    spotsGeoJSON: session.spotsGeoJSON,
  });
});

// POST /api/spots/update-batch — update properties on multiple spots
spotRoutes.post('/update-batch', (req, res) => {
  const { ids, updates } = req.body;
  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ error: 'ids must be a non-empty array' });
  }
  if (!updates || typeof updates !== 'object') {
    return res.status(400).json({ error: 'updates must be an object' });
  }

  const session = getSession(req.user.id);
  const idSet = new Set(ids);
  let updated = 0;

  for (const feature of session.spotsGeoJSON.features) {
    if (idSet.has(feature.properties?.id)) {
      feature.properties = { ...feature.properties, ...updates, id: feature.properties.id };
      updated++;
    }
  }

  return res.json({
    message: `Updated ${updated} spots`,
    spotsGeoJSON: session.spotsGeoJSON,
  });
});

// POST /api/spots/generate-from-path
spotRoutes.post('/generate-from-path', (req, res) => {
  const { path, spotSizeFt = 12, spacingFt = 2, label = 'S' } = req.body;

  if (!path || !Array.isArray(path) || path.length < 2) {
    return res.status(400).json({ error: 'path must be an array of at least 2 [lng, lat] coordinates' });
  }

  const newFeatures = generateSpotsFromPath(path, { spotSizeFt, spacingFt, label });

  const session = getSession(req.user.id);
  // Filter out spots that overlap dead zones
  const filtered = newFeatures.filter((f) => !spotOverlapsDeadZone(f, session.deadZones));
  const existingFeatures = session.spotsGeoJSON?.features || [];
  session.spotsGeoJSON = {
    type: 'FeatureCollection',
    features: [...existingFeatures, ...filtered],
    metadata: session.spotsGeoJSON.metadata || {},
  };
  recalculateScores(session);

  return res.json({
    message: `Generated ${filtered.length} spots along path (${newFeatures.length - filtered.length} in dead zones, total: ${session.spotsGeoJSON.features.length})`,
    count: filtered.length,
    totalCount: session.spotsGeoJSON.features.length,
    spotsGeoJSON: session.spotsGeoJSON,
  });
});
