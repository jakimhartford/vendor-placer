import { describe, it, expect } from 'vitest';
import { calculateSpotPrice, calculateRevenueSummary, DEFAULT_PRICING_CONFIG } from '../utils/pricing.js';

describe('calculateSpotPrice', () => {
  describe('flat fee mode', () => {
    const config = {
      mode: 'flat',
      flatFees: {
        competitive: { single: 350, double: 600, label: 'Competitive' },
        noncompetitive: { single: 225, double: 400, label: 'Non-Competitive' },
      },
    };

    it('returns single price for single-booth vendor', () => {
      const vendor = { tier: 'competitive', boothSize: 1 };
      expect(calculateSpotPrice({}, vendor, config)).toBe(350);
    });

    it('returns double price for double-booth vendor', () => {
      const vendor = { tier: 'competitive', boothSize: 2 };
      expect(calculateSpotPrice({}, vendor, config)).toBe(600);
    });

    it('returns noncompetitive price', () => {
      const vendor = { tier: 'noncompetitive', boothSize: 1 };
      expect(calculateSpotPrice({}, vendor, config)).toBe(225);
    });

    it('returns null for unknown tier', () => {
      const vendor = { tier: 'unknown', boothSize: 1 };
      expect(calculateSpotPrice({}, vendor, config)).toBeNull();
    });

    it('falls back to first tier if vendor has no tier', () => {
      const vendor = { boothSize: 1 };
      expect(calculateSpotPrice({}, vendor, config)).toBe(350);
    });
  });

  describe('multiplier mode', () => {
    const config = DEFAULT_PRICING_CONFIG;

    it('calculates price with tier and category multipliers', () => {
      const spotProps = { valueScore: 50 };
      const vendor = { tier: 'gold', category: 'food' };
      const price = calculateSpotPrice(spotProps, vendor, { ...config, mode: 'multiplier' });
      expect(price).toBeGreaterThan(0);
      expect(typeof price).toBe('number');
    });

    it('returns null with no config', () => {
      expect(calculateSpotPrice({}, {}, null)).toBeNull();
    });
  });
});

describe('calculateRevenueSummary', () => {
  const config = {
    mode: 'flat',
    flatFees: {
      juried: { single: 250, double: 425, label: 'Juried' },
    },
  };

  const spots = {
    features: [
      { properties: { id: 'S1' }, geometry: { type: 'Polygon', coordinates: [[[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]]] } },
      { properties: { id: 'S2' }, geometry: { type: 'Polygon', coordinates: [[[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]]] } },
    ],
  };

  const vendors = [
    { id: 'V1', tier: 'juried', category: 'Painting', boothSize: 1 },
    { id: 'V2', tier: 'juried', category: 'Jewelry', boothSize: 1 },
  ];

  it('sums revenue for assigned vendors', () => {
    const assignments = { S1: 'V1', S2: 'V2' };
    const result = calculateRevenueSummary(spots, vendors, assignments, config);
    expect(result.total).toBe(500);
    expect(result.byTier.juried).toBe(500);
    expect(result.byCategory.Painting).toBe(250);
    expect(result.byCategory.Jewelry).toBe(250);
  });

  it('returns zero when no assignments', () => {
    const result = calculateRevenueSummary(spots, vendors, {}, config);
    expect(result.total).toBe(0);
  });

  it('returns zero with no config', () => {
    const result = calculateRevenueSummary(spots, vendors, { S1: 'V1' }, null);
    expect(result.total).toBe(0);
  });
});
