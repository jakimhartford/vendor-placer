export const DEFAULT_PRICING_CONFIG = {
  basePriceByType: { regular: 100, corner: 200, premium: 300 },
  tierMultipliers: { platinum: 2.0, gold: 1.5, silver: 1.0, bronze: 0.8 },
  categoryMultipliers: { food: 1.2, art: 1.0, craft: 1.0, jewelry: 1.0, clothing: 1.0, services: 0.9, other: 0.8 },
};

export function calculateSpotPrice(spotProps, vendor, config) {
  if (!config) return null;
  const typeKey = spotProps.premium ? 'premium' : spotProps.isCorner ? 'corner' : 'regular';
  const basePrice = config.basePriceByType?.[typeKey] || 100;
  const tierMult = vendor ? (config.tierMultipliers?.[vendor.tier] || 1) : 1;
  const catMult = vendor ? (config.categoryMultipliers?.[vendor.category] || 1) : 1;
  return Math.round(basePrice * tierMult * catMult);
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

    const tier = vendor.tier || 'bronze';
    byTier[tier] = (byTier[tier] || 0) + price;

    const cat = vendor.category || 'other';
    byCategory[cat] = (byCategory[cat] || 0) + price;
  }

  return { total, byTier, byCategory };
}
