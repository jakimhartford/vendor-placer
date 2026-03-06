export const TIER_COLORS = {
  platinum: '#7c3aed',
  gold: '#d97706',
  silver: '#64748b',
  bronze: '#92400e',
};

// Distinct, high-contrast category colors — designed to be visually distinguishable on a dark map
export const CATEGORY_COLORS = {
  // DBAF categories
  'Bath & Body Products': '#f472b6', // pink
  'Drawing': '#a78bfa',              // purple
  'Edibles': '#fb923c',              // orange
  'Fashion and Wearable Art': '#e879f9', // magenta
  'Glass Art': '#22d3ee',            // cyan
  'Graphic Design / Digital Art': '#818cf8', // indigo
  'Jewelry': '#fbbf24',             // amber/gold
  'Mixed Media': '#34d399',          // emerald
  'Painting': '#3b82f6',            // blue
  'Photography': '#f87171',          // red
  'Sculpture': '#a3e635',            // lime
  'Textiles / Fiber Arts': '#c084fc', // violet
  // HAF categories
  'Clay/Ceramics': '#fb923c',        // orange
  'Digital': '#818cf8',              // indigo
  'Glass': '#22d3ee',               // cyan
  'Metal': '#94a3b8',               // slate
  'Printmaking/Drawing': '#a78bfa',  // purple
  'Textiles': '#c084fc',            // violet
  'Upcycled Arts': '#4ade80',        // green
  'Wood': '#d97706',                // amber
  // Generic/shared
  'food': '#fb923c',
  'art': '#3b82f6',
  'craft': '#34d399',
  'jewelry': '#fbbf24',
  'clothing': '#e879f9',
  'services': '#94a3b8',
  'other': '#6b7280',
  'Other': '#6b7280',
};

// Short labels for map display (2-3 chars)
export const CATEGORY_SHORT = {
  'Bath & Body Products': 'B&B',
  'Drawing': 'DRW',
  'Edibles': 'EAT',
  'Fashion and Wearable Art': 'FSH',
  'Glass Art': 'GLS',
  'Graphic Design / Digital Art': 'DIG',
  'Jewelry': 'JWL',
  'Mixed Media': 'MIX',
  'Painting': 'PNT',
  'Photography': 'PHO',
  'Sculpture': 'SCL',
  'Textiles / Fiber Arts': 'TXT',
  'Clay/Ceramics': 'CLY',
  'Digital': 'DIG',
  'Glass': 'GLS',
  'Metal': 'MTL',
  'Printmaking/Drawing': 'PRT',
  'Textiles': 'TXT',
  'Upcycled Arts': 'UPC',
  'Wood': 'WOD',
  'food': 'FD',
  'art': 'ART',
  'craft': 'CRF',
  'jewelry': 'JWL',
  'clothing': 'CLO',
  'services': 'SVC',
  'other': 'OTH',
  'Other': 'OTH',
};

export const EMPTY_COLOR = '#334155';    // dark slate — clearly unoccupied
export const DEAD_ZONE_COLOR = '#dc2626';

/**
 * Returns the display color for a spot based on its assigned vendor's category.
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
  if (!vendor) {
    return EMPTY_COLOR;
  }

  // Color by category first, fall back to tier
  if (vendor.category && CATEGORY_COLORS[vendor.category]) {
    return CATEGORY_COLORS[vendor.category];
  }

  return TIER_COLORS[vendor.tier?.toLowerCase()] || EMPTY_COLOR;
}

/**
 * Returns the assigned vendor for a spot, if any.
 */
export function getAssignedVendor(spot, vendors, assignments) {
  if (!assignments || !spot?.properties?.id) return null;
  const vendorId = assignments[spot.properties.id];
  if (!vendorId) return null;
  return vendors.find((v) => v.id === vendorId || v._id === vendorId) || null;
}
