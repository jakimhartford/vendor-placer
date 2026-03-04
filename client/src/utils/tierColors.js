export const TIER_COLORS = {
  platinum: '#7c3aed',
  gold: '#d97706',
  silver: '#64748b',
  bronze: '#92400e',
};

export const EMPTY_COLOR = '#6b7280';
export const DEAD_ZONE_COLOR = '#dc2626';

/**
 * Returns the display color for a spot based on its assignment status.
 * @param {object} spot - A GeoJSON feature representing a spot
 * @param {Array} vendors - Array of vendor objects
 * @param {object} assignments - Map of spotId -> vendorId
 * @returns {string} Hex color string
 */
export function getSpotColor(spot, vendors, assignments) {
  if (spot?.properties?.deadZone) {
    return DEAD_ZONE_COLOR;
  }

  if (!assignments || !spot?.properties?.id) {
    return EMPTY_COLOR;
  }

  const vendorId = assignments[spot.properties.id];
  if (!vendorId) {
    return EMPTY_COLOR;
  }

  const vendor = vendors.find(
    (v) => v.id === vendorId || v._id === vendorId
  );
  if (!vendor || !vendor.tier) {
    return EMPTY_COLOR;
  }

  return TIER_COLORS[vendor.tier.toLowerCase()] || EMPTY_COLOR;
}
