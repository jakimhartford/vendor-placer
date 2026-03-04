import Papa from 'papaparse';

const VALID_CATEGORIES = ['food', 'art', 'craft', 'jewelry', 'clothing', 'services', 'other'];
const VALID_TIERS = ['platinum', 'gold', 'silver', 'bronze'];

/**
 * Parse a CSV string into an array of vendor objects.
 * Expected CSV columns: name, category, tier, exclusions (pipe-separated)
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

    return { name, category, tier, exclusions };
  });

  return vendors;
}
