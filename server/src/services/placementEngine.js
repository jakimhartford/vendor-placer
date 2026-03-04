import { buildAdjacencyMap } from '../utils/adjacency.js';

const TIER_PRIORITY = { platinum: 4, gold: 3, silver: 2, bronze: 1 };

// Categories where same-category neighbours are forbidden
const NO_SAME_CATEGORY_NEIGHBOR = new Set(['art', 'craft', 'jewelry', 'clothing']);

/**
 * Build a name->vendor lookup for conflict resolution by name.
 */
function buildNameMap(vendors) {
  const map = new Map();
  for (const v of vendors) {
    map.set(v.name.toLowerCase(), v);
  }
  return map;
}

/**
 * Check whether placing `vendor` on `spot` violates any constraints.
 *
 * @param {object} vendor
 * @param {object} spot           - spot feature properties
 * @param {Map}    adjacencyMap   - spotId -> Set<spotId>
 * @param {Map}    assignmentMap  - spotId -> vendor
 * @param {Map}    nameMap        - vendorName (lowercase) -> vendor
 * @returns {{ allowed: boolean, reason?: string }}
 */
function canPlace(vendor, spot, adjacencyMap, assignmentMap, nameMap) {
  const neighborSpotIds = adjacencyMap.get(spot.id) || new Set();

  for (const nSpotId of neighborSpotIds) {
    const neighborVendor = assignmentMap.get(nSpotId);
    if (!neighborVendor) continue;

    // Check vendor's explicit exclusions
    for (const excl of vendor.exclusions) {
      if (excl.startsWith('cat:')) {
        const exclCat = excl.slice(4).toLowerCase();
        if (neighborVendor.category === exclCat) {
          return { allowed: false, reason: `${vendor.name} excludes category "${exclCat}" (neighbor: ${neighborVendor.name})` };
        }
      } else {
        if (neighborVendor.id === excl) {
          return { allowed: false, reason: `${vendor.name} excludes vendor ${neighborVendor.name}` };
        }
      }
    }

    // Check neighbour's exclusions against this vendor
    for (const excl of neighborVendor.exclusions) {
      if (excl.startsWith('cat:')) {
        const exclCat = excl.slice(4).toLowerCase();
        if (vendor.category === exclCat) {
          return { allowed: false, reason: `${neighborVendor.name} excludes category "${exclCat}" (vendor: ${vendor.name})` };
        }
      } else {
        if (vendor.id === excl) {
          return { allowed: false, reason: `${neighborVendor.name} excludes vendor ${vendor.name}` };
        }
      }
    }

    // Check name-based conflicts (bidirectional)
    const vendorConflicts = vendor.conflicts || [];
    for (const conflictName of vendorConflicts) {
      const conflictVendor = nameMap.get(conflictName.toLowerCase());
      if (conflictVendor && neighborVendor.id === conflictVendor.id) {
        return { allowed: false, reason: `${vendor.name} conflicts with ${neighborVendor.name}` };
      }
    }

    const neighborConflicts = neighborVendor.conflicts || [];
    for (const conflictName of neighborConflicts) {
      const conflictVendor = nameMap.get(conflictName.toLowerCase());
      if (conflictVendor && vendor.id === conflictVendor.id) {
        return { allowed: false, reason: `${neighborVendor.name} conflicts with ${vendor.name}` };
      }
    }

    // Same-category restriction (except food)
    if (
      NO_SAME_CATEGORY_NEIGHBOR.has(vendor.category) &&
      neighborVendor.category === vendor.category
    ) {
      return { allowed: false, reason: `Same category "${vendor.category}" adjacent: ${vendor.name} & ${neighborVendor.name}` };
    }
  }

  return { allowed: true };
}

/**
 * Run the placement algorithm.
 *
 * Priority order:
 *   1. Premium vendors -> corner/high-traffic spots (regardless of tier)
 *   2. Platinum/Gold vendors -> remaining corner spots
 *   3. All remaining vendors by tier -> remaining spots by score
 *
 * @param {object[]} vendors         - array of vendor objects
 * @param {object}   spotsGeoJSON    - GeoJSON FeatureCollection
 * @returns {{ assignments: object, unplaced: string[], conflicts: string[] }}
 */
export function runPlacement(vendors, spotsGeoJSON) {
  if (!vendors.length || !spotsGeoJSON.features.length) {
    return {
      assignments: {},
      unplaced: vendors.map((v) => v.id),
      conflicts: [],
    };
  }

  const adjacencyMap = buildAdjacencyMap(spotsGeoJSON);
  const nameMap = buildNameMap(vendors);

  // Build scored spot list — higher is more desirable
  const spotProps = spotsGeoJSON.features.map((f) => f.properties);
  const scoredSpots = spotProps
    .map((sp) => ({
      ...sp,
      score: (sp.isCorner ? 100 : 0) + (sp.trafficScore || 0) * 10,
    }))
    .sort((a, b) => b.score - a.score);

  const premiumSpots = scoredSpots.filter((s) => s.isCorner || (s.trafficScore || 0) >= 7);

  // Track state
  const usedSpotIds = new Set();
  const assignmentMap = new Map();  // spotId -> vendor
  const assignments = {};           // spotId -> vendorId
  const assignedVendorIds = new Set();
  const unplaced = [];
  const conflicts = [];

  function tryAssign(vendor, spotList) {
    const boothsNeeded = vendor.booths || 1;
    for (const spot of spotList) {
      if (usedSpotIds.has(spot.id)) continue;
      const result = canPlace(vendor, spot, adjacencyMap, assignmentMap, nameMap);
      if (result.allowed) {
        // Assign primary spot
        assignments[spot.id] = vendor.id;
        usedSpotIds.add(spot.id);
        assignmentMap.set(spot.id, vendor);
        assignedVendorIds.add(vendor.id);

        // For multi-booth vendors, claim adjacent spots
        if (boothsNeeded >= 2) {
          let extraAssigned = 0;
          const neighbors = adjacencyMap.get(spot.id) || new Set();
          for (const nId of neighbors) {
            if (extraAssigned >= boothsNeeded - 1) break;
            if (usedSpotIds.has(nId)) continue;
            // Find the neighbor spot properties
            const nSpot = spotProps.find((s) => s.id === nId);
            if (!nSpot) continue;
            const nResult = canPlace(vendor, nSpot, adjacencyMap, assignmentMap, nameMap);
            if (nResult.allowed) {
              assignments[nId] = vendor.id;
              usedSpotIds.add(nId);
              assignmentMap.set(nId, vendor);
              extraAssigned++;
            }
          }
        }
        return true;
      }
    }
    return false;
  }

  // Sort vendors by tier priority descending
  const sortedVendors = [...vendors].sort(
    (a, b) => (TIER_PRIORITY[b.tier] || 0) - (TIER_PRIORITY[a.tier] || 0)
  );

  // Phase 1: Premium vendors get first pick of corner/high-traffic spots
  const premiumVendors = sortedVendors.filter((v) => v.premium);
  for (const vendor of premiumVendors) {
    if (!tryAssign(vendor, premiumSpots)) {
      // Fallback: try any spot
      tryAssign(vendor, scoredSpots);
    }
  }

  // Phase 2: Platinum/Gold vendors get remaining corner spots
  const topTierVendors = sortedVendors.filter(
    (v) => !assignedVendorIds.has(v.id) && (v.tier === 'platinum' || v.tier === 'gold')
  );
  const cornerSpots = scoredSpots.filter((s) => s.isCorner);
  for (const vendor of topTierVendors) {
    if (!tryAssign(vendor, cornerSpots)) {
      // Will be handled in phase 3
    }
  }

  // Phase 3: All remaining vendors by tier priority
  for (const vendor of sortedVendors) {
    if (assignedVendorIds.has(vendor.id)) continue;
    if (!tryAssign(vendor, scoredSpots)) {
      unplaced.push(vendor.id);
      // Check why they couldn't be placed
      for (const spot of scoredSpots) {
        if (usedSpotIds.has(spot.id)) continue;
        const result = canPlace(vendor, spot, adjacencyMap, assignmentMap, nameMap);
        if (!result.allowed) {
          conflicts.push(result.reason);
          break;
        }
      }
    }
  }

  return { assignments, unplaced, conflicts };
}
