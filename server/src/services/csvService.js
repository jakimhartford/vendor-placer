import Papa from 'papaparse';

const VALID_CATEGORIES = ['food', 'art', 'craft', 'jewelry', 'clothing', 'services', 'other'];
const VALID_TIERS = ['platinum', 'gold', 'silver', 'bronze'];

/**
 * Parse a CSV string into an array of vendor objects.
 * Expected CSV columns: name, category, tier, exclusions (pipe-separated)
 * Optional columns: conflicts (pipe-separated vendor names), premium (yes/no)
 */
export function parseVendorCsv(csvString) {
  const result = Papa.parse(csvString.trim(), {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim().toLowerCase(),
  });

  if (result.errors.length > 0) {
    const critical = result.errors.filter((e) => e.type !== 'FieldMismatch');
    if (critical.length > 0) {
      throw new Error(`CSV parse errors: ${critical.map((e) => e.message).join('; ')}`);
    }
  }

  const vendors = result.data.map((row, idx) => {
    const name = (row.name || '').trim();
    if (!name) {
      throw new Error(`Row ${idx + 1}: missing vendor name`);
    }

    const category = (row.category || '').trim().toLowerCase();
    if (!VALID_CATEGORIES.includes(category)) {
      throw new Error(
        `Row ${idx + 1} ("${name}"): invalid category "${category}". Must be one of: ${VALID_CATEGORIES.join(', ')}`
      );
    }

    const tier = (row.tier || '').trim().toLowerCase();
    if (!VALID_TIERS.includes(tier)) {
      throw new Error(
        `Row ${idx + 1} ("${name}"): invalid tier "${tier}". Must be one of: ${VALID_TIERS.join(', ')}`
      );
    }

    const exclusionsRaw = (row.exclusions || '').trim();
    const exclusions = exclusionsRaw
      ? exclusionsRaw.split('|').map((e) => e.trim()).filter(Boolean)
      : [];

    // Conflicts: pipe-separated vendor names who should NOT be placed adjacent
    const conflictsRaw = (row.conflicts || '').trim();
    const conflicts = conflictsRaw
      ? conflictsRaw.split('|').map((c) => c.trim()).filter(Boolean)
      : [];

    // Premium: vendor paid for a corner/high-traffic spot
    const premiumRaw = (row.premium || '').trim().toLowerCase();
    const premium = premiumRaw === 'yes' || premiumRaw === 'true' || premiumRaw === '1';

    // Booths: number of spots this vendor needs (default 1)
    const booths = Math.max(1, parseInt(row.booths, 10) || 1);

    return { name, category, tier, exclusions, conflicts, premium, booths };
  });

  return vendors;
}
