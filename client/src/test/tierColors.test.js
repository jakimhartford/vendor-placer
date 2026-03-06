import { describe, it, expect } from 'vitest';
import { getSpotColor, getAssignedVendor, CATEGORY_COLORS, EMPTY_COLOR, DEAD_ZONE_COLOR } from '../utils/tierColors.js';

describe('getSpotColor', () => {
  const vendors = [
    { id: 'V1', category: 'Painting', tier: 'juried' },
    { id: 'V2', category: 'Jewelry', tier: 'nonjuried' },
    { id: 'V3', category: 'Unknown Category', tier: 'gold' },
  ];

  it('returns category color for assigned vendor', () => {
    const spot = { properties: { id: 'S1' } };
    const color = getSpotColor(spot, vendors, { S1: 'V1' });
    expect(color).toBe(CATEGORY_COLORS['Painting']);
  });

  it('returns different colors for different categories', () => {
    const spot1 = { properties: { id: 'S1' } };
    const spot2 = { properties: { id: 'S2' } };
    const c1 = getSpotColor(spot1, vendors, { S1: 'V1' });
    const c2 = getSpotColor(spot2, vendors, { S2: 'V2' });
    expect(c1).not.toBe(c2);
  });

  it('returns EMPTY_COLOR for unassigned spot', () => {
    const spot = { properties: { id: 'S1' } };
    expect(getSpotColor(spot, vendors, {})).toBe(EMPTY_COLOR);
  });

  it('returns DEAD_ZONE_COLOR for dead zone', () => {
    const spot = { properties: { id: 'S1', deadZone: true } };
    expect(getSpotColor(spot, vendors, { S1: 'V1' })).toBe(DEAD_ZONE_COLOR);
  });

  it('falls back to tier color if category not in map', () => {
    const spot = { properties: { id: 'S3' } };
    const color = getSpotColor(spot, vendors, { S3: 'V3' });
    // V3 has category 'Unknown Category' not in CATEGORY_COLORS, falls back to tier 'gold'
    expect(color).not.toBe(EMPTY_COLOR);
  });

  it('returns EMPTY_COLOR when no assignments object', () => {
    const spot = { properties: { id: 'S1' } };
    expect(getSpotColor(spot, vendors, null)).toBe(EMPTY_COLOR);
  });
});

describe('getAssignedVendor', () => {
  const vendors = [
    { id: 'V1', name: 'Maria', category: 'Painting' },
    { id: 'V2', name: 'Sofia', category: 'Jewelry' },
  ];

  it('returns vendor when assigned', () => {
    const spot = { properties: { id: 'S1' } };
    const v = getAssignedVendor(spot, vendors, { S1: 'V1' });
    expect(v.name).toBe('Maria');
  });

  it('returns null when not assigned', () => {
    const spot = { properties: { id: 'S1' } };
    expect(getAssignedVendor(spot, vendors, {})).toBeNull();
  });

  it('returns null with no spot id', () => {
    const spot = { properties: {} };
    expect(getAssignedVendor(spot, vendors, { S1: 'V1' })).toBeNull();
  });
});
