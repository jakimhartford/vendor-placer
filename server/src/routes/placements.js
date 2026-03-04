import { Router } from 'express';
import { runPlacement } from '../services/placementEngine.js';
import { getVendors } from './vendors.js';
import { getSpots } from './spots.js';

export const placementRoutes = Router();

// Store last placement result
let lastResult = null;

// POST /api/placements/run — run placement engine
placementRoutes.post('/run', (_req, res) => {
  try {
    const vendors = getVendors();
    const spots = getSpots();

    if (!vendors.length) {
      return res.status(400).json({ error: 'No vendors loaded. Upload a CSV first.' });
    }
    if (!spots.features || !spots.features.length) {
      return res.status(400).json({ error: 'No spots available. Generate a grid first.' });
    }

    const result = runPlacement(vendors, spots);
    lastResult = {
      ...result,
      timestamp: new Date().toISOString(),
      vendorCount: vendors.length,
      spotCount: spots.features.length,
    };

    return res.json(lastResult);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// GET /api/placements — return last result
placementRoutes.get('/', (_req, res) => {
  if (!lastResult) {
    return res.status(404).json({ error: 'No placement has been run yet' });
  }
  return res.json(lastResult);
});
