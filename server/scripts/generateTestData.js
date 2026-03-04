/**
 * Generate test CSV files with realistic vendor data.
 * Run:  node scripts/generateTestData.js
 */

import { writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DATA_DIR = join(__dirname, '..', 'src', 'data');
mkdirSync(DATA_DIR, { recursive: true });

// ── Name pools by category ──────────────────────

const NAMES = {
  food: [
    "Joe's BBQ", "Mama Rosa's Kitchen", "Sunrise Tacos", "The Smoky Pit",
    "Coastal Creamery", "Beachside Bites", "Grill & Chill", "Noodle Shack",
    "Fryin' Saucer", "The Waffle House", "Sweet Corn Stand", "Bayou Boil",
    "Lemon Drop Lemonade", "Pizza Planet Cart", "Island Jerk Hut",
    "Funnel Cake Factory", "Boardwalk Burgers", "Pho Real", "Crab Cake Cove",
    "Kettle Corn King", "Curry Up Now", "Taco Libre", "Sushi Roll Wagon",
    "Hot Dog Haven", "Crepe Escape", "The Pretzel Twist", "Mango Tango Smoothies",
    "Empanada Express", "Lobster Roll Co", "Brisket Boss",
  ],
  art: [
    "Sunset Paintings", "Color Splash Studio", "Ocean Brush Art",
    "The Canvas Collective", "Driftwood Gallery", "Palette Knife Works",
    "Watercolor Wonders", "Abstract Horizons", "Coastal Impressions",
    "Seascape Studio", "Vivid Visions Art", "Spectrum Fine Art",
    "Gallery on the Green", "Tidal Art Co", "Brushstroke Boutique",
  ],
  craft: [
    "Handmade Haven", "Knotty by Nature", "The Craft Barn",
    "Stitch & Stone", "Woodwork Wonders", "Paper & Thread",
    "The Potters Wheel", "Candle Cove Crafts", "Woven Winds",
    "Leather & Lace Co", "Soap Suds Studio", "Glassblown Treasures",
    "Macrame Magic", "Dye Hard Crafts", "Rustic Revival",
  ],
  jewelry: [
    "Silver Moon Jewelry", "Coastal Gems", "Bead & Wire Studio",
    "Sea Glass Designs", "Twisted Metal Co", "Pearl Cove Jewelry",
    "Stone & Spark", "Amber Wave Designs", "Crystal Clear Jewelry",
    "Bohemian Baubles", "The Ring Smith", "Charm School Jewelry",
  ],
  clothing: [
    "Tie Dye Dreams", "Thread & Needle", "Boho Beach Wear",
    "Sun Kissed Apparel", "The Hat Shack", "Vintage Vibes Clothing",
    "Coastal Threads", "Island Wear Co", "Breeze Boutique",
    "Festival Fashion", "Stitched Up Style", "Linen & Sea",
    "Palm Print Co", "Wave Rider Apparel", "Sandal City",
  ],
  services: [
    "Quick Caricatures", "Face Paint Fantasy", "Henna by Hannah",
    "Palm Reading Palace", "Photo Booth Fun", "Airbrush Alley",
    "Balloon Twist Co", "Tarot by the Sea", "Hair Wrap Haven",
    "Temp Tattoo Studio", "Portrait Sketches", "Glitter Bar",
  ],
  other: [
    "Festival Maps & More", "Sunscreen Station", "Pet Bandana Booth",
    "Eco Straw Co", "Plant Pals", "Magnet Mania", "Sticker Shock",
    "Keychain Corner", "Phone Case Place",
  ],
};

// ── Distribution tables ─────────────────────────

// Category weights (sum = 100)
const CATEGORY_DIST = [
  { category: 'food', weight: 30 },
  { category: 'art', weight: 15 },
  { category: 'craft', weight: 15 },
  { category: 'jewelry', weight: 10 },
  { category: 'clothing', weight: 15 },
  { category: 'services', weight: 10 },
  { category: 'other', weight: 5 },
];

// Tier weights (sum = 100)
const TIER_DIST = [
  { tier: 'platinum', weight: 10 },
  { tier: 'gold', weight: 20 },
  { tier: 'silver', weight: 35 },
  { tier: 'bronze', weight: 35 },
];

// ── Helpers ─────────────────────────────────────

function weightedPick(items, weightKey) {
  const total = items.reduce((s, i) => s + i[weightKey], 0);
  let r = Math.random() * total;
  for (const item of items) {
    r -= item[weightKey];
    if (r <= 0) return item;
  }
  return items[items.length - 1];
}

function pickName(category, index) {
  const pool = NAMES[category];
  if (index < pool.length) return pool[index];
  // Generate a numbered variant when pool is exhausted
  return `${pool[index % pool.length]} #${Math.floor(index / pool.length) + 1}`;
}

function generateVendors(count) {
  // Track how many names we've used per category
  const nameCounters = {};
  for (const cat of Object.keys(NAMES)) nameCounters[cat] = 0;

  const categories = ['art', 'craft'];
  const vendors = [];

  for (let i = 0; i < count; i++) {
    const { category } = weightedPick(CATEGORY_DIST, 'weight');
    const { tier } = weightedPick(TIER_DIST, 'weight');
    const name = pickName(category, nameCounters[category]++);

    let exclusions = '';

    // ~20% of art/craft vendors get exclusions
    if (categories.includes(category) && Math.random() < 0.2) {
      if (Math.random() < 0.5) {
        // Exclude a category
        const otherCat = categories[Math.floor(Math.random() * categories.length)];
        exclusions = `cat:${otherCat}`;
      } else {
        // Would normally reference a specific vendor ID, but at CSV-generation
        // time we don't have IDs yet. Use a placeholder pattern that the parser
        // will store and the engine will compare against assigned vendor IDs.
        exclusions = `cat:${category === 'art' ? 'jewelry' : 'art'}`;
      }
    }

    vendors.push({ name, category, tier, exclusions });
  }

  return vendors;
}

function toCsv(vendors) {
  const header = 'name,category,tier,exclusions';
  const rows = vendors.map((v) => {
    // Escape commas in name by quoting
    const name = v.name.includes(',') ? `"${v.name}"` : v.name;
    return `${name},${v.category},${v.tier},${v.exclusions}`;
  });
  return [header, ...rows].join('\n');
}

// ── Main ────────────────────────────────────────

const SIZES = [10, 50, 100, 200, 500, 1000];

for (const size of SIZES) {
  const vendors = generateVendors(size);
  const csv = toCsv(vendors);
  const filePath = join(DATA_DIR, `vendors-${size}.csv`);
  writeFileSync(filePath, csv, 'utf-8');
  console.log(`Wrote ${filePath} (${vendors.length} vendors)`);
}

console.log('Done.');
