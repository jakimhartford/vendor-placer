export const DEFAULT_PRICING_CONFIG = {
  mode: 'flat', // 'flat' or 'multiplier'
  // Flat fee mode: price per vendor tier, with optional double-space price
  flatFees: {
    competitive: { single: 350, double: 600, label: 'Competitive Fine Art' },
    noncompetitive: { single: 225, double: 400, label: 'Non-Competitive / Craft' },
  },
  // Multiplier mode (legacy)
  basePriceByType: { regular: 100, corner: 200, premium: 300 },
  tierMultipliers: { platinum: 2.0, gold: 1.5, silver: 1.0, bronze: 0.8 },
  categoryMultipliers: { food: 1.2, art: 1.0, craft: 1.0, jewelry: 1.0, clothing: 1.0, services: 0.9, other: 0.8 },
};

/**
 * Score-based multiplier: 0.8x at score 0, 1.5x at score 100, linear interpolation.
 */
function scoreMultiplier(valueScore) {
  if (valueScore == null) return 1;
  const clamped = Math.max(0, Math.min(100, valueScore));
  return 0.8 + (clamped / 100) * 0.7;
}

export function calculateSpotPrice(spotProps, vendor, config) {
  if (!config) return null;

  // Flat fee mode
  if (config.mode === 'flat' && config.flatFees) {
    const tier = vendor?.tier || Object.keys(config.flatFees)[0];
    const feeEntry = config.flatFees[tier];
    if (!feeEntry) {
      // Try to find a matching tier (case-insensitive)
      const match = Object.entries(config.flatFees).find(
        ([k]) => k.toLowerCase() === (tier || '').toLowerCase()
      );
      if (match) {
        const isDouble = (vendor?.boothSize || 1) >= 2;
        return isDouble && match[1].double ? match[1].double : match[1].single;
      }
      return null;
    }
    const isDouble = (vendor?.boothSize || 1) >= 2;
    return isDouble && feeEntry.double ? feeEntry.double : feeEntry.single;
  }

  // Multiplier mode (legacy)
  let typeKey;
  if (spotProps.valueScore != null) {
    typeKey = spotProps.valueScore >= 80 ? 'premium' : spotProps.valueScore >= 50 ? 'corner' : 'regular';
  } else {
    typeKey = spotProps.premium ? 'premium' : spotProps.isCorner ? 'corner' : 'regular';
  }
  const basePrice = config.basePriceByType?.[typeKey] || 100;
  const tierMult = vendor ? (config.tierMultipliers?.[vendor.tier] || 1) : 1;
  const catMult = vendor ? (config.categoryMultipliers?.[vendor.category] || 1) : 1;
  const scoreMult = scoreMultiplier(spotProps.valueScore);
  return Math.round(basePrice * tierMult * catMult * scoreMult);
}

export function calculateRevenueSummary(spots, vendors, assignments, config) {
  if (!config || !spots?.features?.length) {
    return { total: 0, byTier: {}, byCategory: {} };
  }

  const vendorMap = {};
  (vendors || []).forEach((v) => { vendorMap[v.id] = v; });

  let total = 0;
  const byTier = {};
  const byCategory = {};

  for (const feature of spots.features) {
    const p = feature.properties || {};
    const vendorId = assignments?.[p.id];
    if (!vendorId) continue;
    const vendor = vendorMap[vendorId];
    if (!vendor) continue;

    const price = calculateSpotPrice(p, vendor, config);
    if (!price) continue;

    total += price;

    const tier = vendor.tier || 'other';
    byTier[tier] = (byTier[tier] || 0) + price;

    const cat = vendor.category || 'other';
    byCategory[cat] = (byCategory[cat] || 0) + price;
  }

  return { total, byTier, byCategory };
}
