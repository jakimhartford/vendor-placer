import { Router } from 'express';
import { runPlacement } from '../services/placementEngine.js';
import { getVendors } from './vendors.js';
import { getSpots } from './spots.js';
import { getSession } from '../state/sessionStore.js';

export const placementRoutes = Router();

/** Get last placement result for a user (used by projects) */
export function getPlacements(userId) {
  return getSession(userId).lastPlacement;
}

/** Set placement result for a user (used by projects) */
export function setPlacements(userId, result) {
  getSession(userId).lastPlacement = result;
}

// POST /api/placements/run — run placement engine
placementRoutes.post('/run', (req, res) => {
  try {
    const userId = req.user.id;
    const vendors = getVendors(userId);
    const spots = getSpots(userId);

    if (!vendors.length) {
      return res.status(400).json({ error: 'No vendors loaded. Upload a CSV first.' });
    }
    if (!spots.features || !spots.features.length) {
      return res.status(400).json({ error: 'No spots available. Generate a grid first.' });
    }

    const result = runPlacement(vendors, spots);
    const lastResult = {
      ...result,
      timestamp: new Date().toISOString(),
      vendorCount: vendors.length,
      spotCount: spots.features.length,
    };

    getSession(userId).lastPlacement = lastResult;
    return res.json(lastResult);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// GET /api/placements — return last result
placementRoutes.get('/', (req, res) => {
  const lastResult = getSession(req.user.id).lastPlacement;
  if (!lastResult) {
    return res.status(404).json({ error: 'No placement has been run yet' });
  }
  return res.json(lastResult);
});
