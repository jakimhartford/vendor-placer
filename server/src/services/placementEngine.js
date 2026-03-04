import { buildAdjacencyMap } from '../utils/adjacency.js';

const TIER_PRIORITY = { platinum: 4, gold: 3, silver: 2, bronze: 1 };

// Categories where same-category neighbours are forbidden
const NO_SAME_CATEGORY_NEIGHBOR = new Set(['art', 'craft', 'jewelry', 'clothing']);

/**
 * Check whether placing `vendor` on `spot` violates any constraints.
 *
 * @param {object} vendor
 * @param {object} spot           - spot feature properties
 * @param {Map}    adjacencyMap   - spotId -> Set<spotId>
 * @param {Map}    assignmentMap  - spotId -> vendor
 * @returns {boolean} true if placement is allowed
 */
function canPlace(vendor, spot, adjacencyMap, assignmentMap) {
  const neighborSpotIds = adjacencyMap.get(spot.id) || new Set();

  for (const nSpotId of neighborSpotIds) {
    const neighborVendor = assignmentMap.get(nSpotId);
    if (!neighborVendor) continue;

    // Check vendor's explicit exclusions
    for (const excl of vendor.exclusions) {
      if (excl.startsWith('cat:')) {
        const exclCat = excl.slice(4).toLowerCase();
        if (neighborVendor.category === exclCat) return false;
      } else {
        // Exclusion by vendor id
        if (neighborVendor.id === excl) return false;
      }
    }

    // Check neighbour's exclusions against this vendor
    for (const excl of neighborVendor.exclusions) {
      if (excl.startsWith('cat:')) {
        const exclCat = excl.slice(4).toLowerCase();
        if (vendor.category === exclCat) return false;
      } else {
        if (vendor.id === excl) return false;
      }
    }

    // Same-category restriction (except food)
    if (
      NO_SAME_CATEGORY_NEIGHBOR.has(vendor.category) &&
      neighborVendor.category === vendor.category
    ) {
      return false;
    }
  }

  return true;
}

/**
 * Run the placement algorithm.
 *
 * @param {object[]} vendors         - array of vendor objects
 * @param {object}   spotsGeoJSON    - GeoJSON FeatureCollection
 * @returns {{ assignments: {vendorId: string, spotId: string}[], unplaced: string[], conflicts: any[] }}
 */
export function runPlacement(vendors, spotsGeoJSON) {
  if (!vendors.length || !spotsGeoJSON.features.length) {
    return {
      assignments: [],
      unplaced: vendors.map((v) => v.id),
      conflicts: [],
    };
  }

  const adjacencyMap = buildAdjacencyMap(spotsGeoJSON);

  // Sort vendors by tier priority descending
  const sortedVendors = [...vendors].sort(
    (a, b) => (TIER_PRIORITY[b.tier] || 0) - (TIER_PRIORITY[a.tier] || 0)
  );

  // Build scored spot list — higher is more desirable
  const spotProps = spotsGeoJSON.features.map((f) => f.properties);
  const scoredSpots = spotProps
    .map((sp) => ({
      ...sp,
      score: (sp.isCorner ? 100 : 0) + (sp.trafficScore || 0) * 10,
    }))
    .sort((a, b) => b.score - a.score);

  // Track which spots are taken
  const usedSpotIds = new Set();
  // spotId -> vendor  (for adjacency constraint checks)
  const assignmentMap = new Map();

  const assignments = [];
  const unplaced = [];

  // Phase 1 — assign corner spots to top-tier vendors
  const cornerSpots = scoredSpots.filter((s) => s.isCorner);
  const phase1Vendors = sortedVendors.filter(
    (v) => v.tier === 'platinum' || v.tier === 'gold'
  );

  let vendorIdx = 0;
  for (const spot of cornerSpots) {
    if (vendorIdx >= phase1Vendors.length) break;
    const vendor = phase1Vendors[vendorIdx];
    if (canPlace(vendor, spot, adjacencyMap, assignmentMap)) {
      assignments.push({ vendorId: vendor.id, spotId: spot.id });
      usedSpotIds.add(spot.id);
      assignmentMap.set(spot.id, vendor);
      vendorIdx++;
    }
  }

  const assignedVendorIds = new Set(assignments.map((a) => a.vendorId));

  // Phase 2 — assign remaining vendors to remaining spots
  for (const vendor of sortedVendors) {
    if (assignedVendorIds.has(vendor.id)) continue;

    let placed = false;
    for (const spot of scoredSpots) {
      if (usedSpotIds.has(spot.id)) continue;
      if (canPlace(vendor, spot, adjacencyMap, assignmentMap)) {
        assignments.push({ vendorId: vendor.id, spotId: spot.id });
        usedSpotIds.add(spot.id);
        assignmentMap.set(spot.id, vendor);
        assignedVendorIds.add(vendor.id);
        placed = true;
        break;
      }
    }

    if (!placed) {
      unplaced.push(vendor.id);
    }
  }

  return { assignments, unplaced, conflicts: [] };
}
