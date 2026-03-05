/**
 * Check if a point [lat, lng] is inside a polygon [[lat, lng], ...]
 */
export function pointInPolygon(lat, lng, polygon) {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i][0], yi = polygon[i][1];
    const xj = polygon[j][0], yj = polygon[j][1];
    const intersect = ((yi > lng) !== (yj > lng)) &&
      (lat < (xj - xi) * (lng - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

/**
 * Check if two line segments intersect.
 * Segment 1: (p1, p2), Segment 2: (p3, p4), each as [lat, lng]
 */
function segmentsIntersect(p1, p2, p3, p4) {
  const d1 = direction(p3, p4, p1);
  const d2 = direction(p3, p4, p2);
  const d3 = direction(p1, p2, p3);
  const d4 = direction(p1, p2, p4);

  if (((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) &&
      ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0))) {
    return true;
  }

  if (d1 === 0 && onSegment(p3, p4, p1)) return true;
  if (d2 === 0 && onSegment(p3, p4, p2)) return true;
  if (d3 === 0 && onSegment(p1, p2, p3)) return true;
  if (d4 === 0 && onSegment(p1, p2, p4)) return true;

  return false;
}

function direction(a, b, c) {
  return (c[0] - a[0]) * (b[1] - a[1]) - (b[0] - a[0]) * (c[1] - a[1]);
}

function onSegment(a, b, c) {
  return Math.min(a[0], b[0]) <= c[0] && c[0] <= Math.max(a[0], b[0]) &&
         Math.min(a[1], b[1]) <= c[1] && c[1] <= Math.max(a[1], b[1]);
}

/**
 * Check if two polygons overlap (any vertex inside, or edges intersect).
 * polyA and polyB are [[lat, lng], ...]
 */
function polygonsOverlap(polyA, polyB) {
  // Check if any vertex of A is inside B
  for (const [lat, lng] of polyA) {
    if (pointInPolygon(lat, lng, polyB)) return true;
  }
  // Check if any vertex of B is inside A
  for (const [lat, lng] of polyB) {
    if (pointInPolygon(lat, lng, polyA)) return true;
  }
  // Check if any edges intersect
  for (let i = 0; i < polyA.length; i++) {
    const a1 = polyA[i];
    const a2 = polyA[(i + 1) % polyA.length];
    for (let j = 0; j < polyB.length; j++) {
      const b1 = polyB[j];
      const b2 = polyB[(j + 1) % polyB.length];
      if (segmentsIntersect(a1, a2, b1, b2)) return true;
    }
  }
  return false;
}

/**
 * Get the vertices of a GeoJSON Polygon feature as [[lat, lng], ...]
 */
export function featureVertices(feature) {
  const coords = feature.geometry.coordinates[0];
  // GeoJSON is [lng, lat], convert to [lat, lng]. Exclude closing point.
  const n = coords.length - 1;
  const verts = [];
  for (let i = 0; i < n; i++) {
    verts.push([coords[i][1], coords[i][0]]);
  }
  return verts;
}

/**
 * Get the center [lat, lng] of a GeoJSON Polygon feature
 */
export function featureCenter(feature) {
  const verts = featureVertices(feature);
  let latSum = 0, lngSum = 0;
  for (const [lat, lng] of verts) {
    latSum += lat;
    lngSum += lng;
  }
  return [latSum / verts.length, lngSum / verts.length];
}

/**
 * Check if a spot feature overlaps ANY dead zone polygon.
 * Any vertex of the spot inside the zone, or any edge crossing = overlap.
 */
export function spotOverlapsDeadZone(feature, deadZones) {
  if (!deadZones || deadZones.length === 0) return false;
  const spotPoly = featureVertices(feature);
  return deadZones.some((dz) => polygonsOverlap(spotPoly, dz.polygon));
}

/**
 * Remove spots that overlap any dead zone
 */
export function filterSpotsOutsideDeadZones(spotsGeoJSON, deadZones) {
  if (!deadZones || deadZones.length === 0) return spotsGeoJSON;
  return {
    ...spotsGeoJSON,
    features: spotsGeoJSON.features.filter((f) => !spotOverlapsDeadZone(f, deadZones)),
  };
}
