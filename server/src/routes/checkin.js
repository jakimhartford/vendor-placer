import { Router } from 'express';
import Event from '../models/Event.js';
import Layout from '../models/Layout.js';
import { requireAuth } from '../middleware/auth.js';

export const checkinRoutes = Router();

// GET /api/events/:id/checkin — event + layout data + check-in state
checkinRoutes.get('/:id/checkin', requireAuth, async (req, res) => {
  try {
    const event = await Event.findOne({ _id: req.params.id, owner: req.user.id });
    if (!event) return res.status(404).json({ error: 'Event not found' });

    // Load active layout for spots/placements
    let layout = null;
    if (event.activeLayoutId) {
      layout = await Layout.findById(event.activeLayoutId);
    }

    const checkIns = event.checkIns ? Object.fromEntries(event.checkIns) : {};

    return res.json({
      project: {
        id: event._id,
        name: event.name,
        spotsGeoJSON: layout?.spotsGeoJSON || { type: 'FeatureCollection', features: [] },
        vendors: event.vendors,
        placements: layout?.placements || null,
        deadZones: layout?.deadZones || [],
        accessPoints: layout?.accessPoints || [],
      },
      checkIns,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// PATCH /api/events/:id/checkin/:vendorId — toggle arrival/setup
checkinRoutes.patch('/:id/checkin/:vendorId', requireAuth, async (req, res) => {
  try {
    const event = await Event.findOne({ _id: req.params.id, owner: req.user.id });
    if (!event) return res.status(404).json({ error: 'Event not found' });

    const { arrived, setupComplete } = req.body;
    const vendorId = req.params.vendorId;

    if (!event.checkIns) event.checkIns = new Map();

    const existing = event.checkIns.get(vendorId) || {};
    if (arrived !== undefined) {
      existing.arrivedAt = arrived ? new Date() : null;
    }
    if (setupComplete !== undefined) {
      existing.setupComplete = setupComplete;
    }
    event.checkIns.set(vendorId, existing);

    await event.save();

    return res.json({
      vendorId,
      checkIn: existing,
      checkIns: Object.fromEntries(event.checkIns),
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// GET /api/events/:id/checkin/summary
checkinRoutes.get('/:id/checkin/summary', requireAuth, async (req, res) => {
  try {
    const event = await Event.findOne({ _id: req.params.id, owner: req.user.id });
    if (!event) return res.status(404).json({ error: 'Event not found' });

    // Load active layout for placements
    let layout = null;
    if (event.activeLayoutId) {
      layout = await Layout.findById(event.activeLayoutId);
    }

    const assignments = layout?.placements?.assignments || {};
    const assignedVendorIds = new Set(Object.values(assignments));
    const total = assignedVendorIds.size;

    const checkIns = event.checkIns ? Object.fromEntries(event.checkIns) : {};
    let arrived = 0;
    let setup = 0;

    for (const vendorId of assignedVendorIds) {
      const ci = checkIns[vendorId];
      if (ci?.arrivedAt) arrived++;
      if (ci?.setupComplete) setup++;
    }

    return res.json({
      total,
      arrived,
      setup,
      missing: total - arrived,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});
