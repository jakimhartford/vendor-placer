/**
 * Build an adjacency map from a GeoJSON FeatureCollection of spot polygons.
 * Two spots are adjacent if their centroids are within ~5 meters (~0.00005 degrees).
 *
 * @param {object} spotsGeoJSON - GeoJSON FeatureCollection
 * @returns {Map<string, Set<string>>} spotId -> Set of adjacent spotIds
 */
export function buildAdjacencyMap(spotsGeoJSON) {
  const THRESHOLD = 0.00005; // ~5 meters in degrees

  const features = spotsGeoJSON.features || [];

  // Pre-compute centroids
  const centroids = features.map((f) => {
    const coords = f.geometry.coordinates[0]; // outer ring
    let latSum = 0;
    let lngSum = 0;
    // Exclude closing point (last === first)
    const n = coords.length - 1;
    for (let i = 0; i < n; i++) {
      lngSum += coords[i][0];
      latSum += coords[i][1];
    }
    return {
      id: f.properties.id,
      lat: latSum / n,
      lng: lngSum / n,
    };
  });

  const adjacency = new Map();
  for (const c of centroids) {
    adjacency.set(c.id, new Set());
  }

  // O(n^2) pairwise check — fine for a few hundred spots
  for (let i = 0; i < centroids.length; i++) {
    for (let j = i + 1; j < centroids.length; j++) {
      const a = centroids[i];
      const b = centroids[j];
      const dLat = Math.abs(a.lat - b.lat);
      const dLng = Math.abs(a.lng - b.lng);
      if (dLat < THRESHOLD && dLng < THRESHOLD) {
        adjacency.get(a.id).add(b.id);
        adjacency.get(b.id).add(a.id);
      }
    }
  }

  return adjacency;
}
