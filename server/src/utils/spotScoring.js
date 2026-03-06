import { featureCenter, pointInPolygon } from './geometry.js';

/**
 * Haversine-approximated distance in meters between two [lat, lng] points.
 */
function distanceMeters(a, b) {
  const dLat = (b[0] - a[0]) * 111_320;
  const dLng = (b[1] - a[1]) * 111_320 * Math.cos((a[0] * Math.PI) / 180);
  return Math.sqrt(dLat * dLat + dLng * dLng);
}

/**
 * Distance decay: smoothly drops from 1 at dist=0 to 0 at dist=maxDist.
 */
function decay(dist, maxDist) {
  if (dist >= maxDist) return 0;
  return Math.max(0, 1 - Math.pow(dist / maxDist, 1.5));
}

/**
 * Centroid of a map zone polygon [[lat, lng], ...]
 */
function polygonCentroid(polygon) {
  let latSum = 0, lngSum = 0;
  for (const [lat, lng] of polygon) {
    latSum += lat;
    lngSum += lng;
  }
  return [latSum / polygon.length, lngSum / polygon.length];
}

/**
 * Score a single spot feature (0-100) based on proximity to
 * entrances, amenities, zones, and spot flags.
 *
 * @param {object} feature      - GeoJSON spot feature
 * @param {object[]} amenities  - [{ id, type, lat, lng }]
 * @param {object[]} accessPoints - [{ id, lat, lng, label }]
 * @param {object[]} mapZones   - [{ id, type, polygon: [[lat,lng],...] }]
 * @returns {number} 0-100
 */
export function scoreSpot(feature, amenities = [], accessPoints = [], mapZones = []) {
  const center = featureCenter(feature);
  const props = feature.properties || {};
  let score = 0;

  // 1. Near entrance/access point (weight 25, threshold 150m)
  if (accessPoints.length > 0) {
    let bestDecay = 0;
    for (const ap of accessPoints) {
      const d = distanceMeters(center, [ap.lat, ap.lng]);
      bestDecay = Math.max(bestDecay, decay(d, 150));
    }
    score += 25 * bestDecay;
  }

  // 2. Corner spot (weight 15, binary)
  if (props.isCorner) {
    score += 15;
  }

  // 3. Sightline zone (weight 15, inside polygon)
  const sightlineZones = mapZones.filter((z) => z.type === 'sightline');
  if (sightlineZones.length > 0) {
    const inside = sightlineZones.some((z) => pointInPolygon(center[0], center[1], z.polygon));
    if (inside) score += 15;
  }

  // 4. Organizer premium flag (weight 15, binary)
  if (props.premium) {
    score += 15;
  }

  // 5. Near loading zone (weight 10, threshold 80m to centroid)
  const loadingZones = mapZones.filter((z) => z.type === 'loading');
  if (loadingZones.length > 0) {
    let bestDecay = 0;
    for (const z of loadingZones) {
      const c = polygonCentroid(z.polygon);
      const d = distanceMeters(center, c);
      bestDecay = Math.max(bestDecay, decay(d, 80));
    }
    score += 10 * bestDecay;
  }

  // 6. Near parking (weight 10, access points with "parking" in label, 120m)
  const parkingPoints = accessPoints.filter((ap) => (ap.label || '').toLowerCase().includes('parking'));
  if (parkingPoints.length > 0) {
    let bestDecay = 0;
    for (const ap of parkingPoints) {
      const d = distanceMeters(center, [ap.lat, ap.lng]);
      bestDecay = Math.max(bestDecay, decay(d, 120));
    }
    score += 10 * bestDecay;
  }

  // 7. Near restrooms (weight 5, threshold 60m)
  const restrooms = amenities.filter((a) => a.type === 'restroom');
  if (restrooms.length > 0) {
    let bestDecay = 0;
    for (const a of restrooms) {
      const d = distanceMeters(center, [a.lat, a.lng]);
      bestDecay = Math.max(bestDecay, decay(d, 60));
    }
    score += 5 * bestDecay;
  }

  // 8. Accessible route (weight 5, inside polygon)
  const accessibleZones = mapZones.filter((z) => z.type === 'accessible');
  if (accessibleZones.length > 0) {
    const inside = accessibleZones.some((z) => pointInPolygon(center[0], center[1], z.polygon));
    if (inside) score += 5;
  }

  // 9. Near trash (penalty -5, threshold 40m)
  const trashAmenities = amenities.filter((a) => a.type === 'trash');
  if (trashAmenities.length > 0) {
    let bestDecay = 0;
    for (const a of trashAmenities) {
      const d = distanceMeters(center, [a.lat, a.lng]);
      bestDecay = Math.max(bestDecay, decay(d, 40));
    }
    score -= 5 * bestDecay;
  }

  return Math.round(Math.max(0, Math.min(100, score)));
}

/**
 * Recalculate valueScore for every spot in the session's spotsGeoJSON.
 *
 * @param {object} session - sessionStore session object
 */
export function recalculateScores(session) {
  const geojson = session.spotsGeoJSON;
  if (!geojson?.features?.length) return;

  const amenities = session.amenities || [];
  const accessPoints = session.accessPoints || [];
  const mapZones = session.mapZones || [];

  for (const feature of geojson.features) {
    feature.properties.valueScore = scoreSpot(feature, amenities, accessPoints, mapZones);
  }
}
