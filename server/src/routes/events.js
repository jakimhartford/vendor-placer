import { Router } from 'express';
import Event from '../models/Event.js';
import Layout from '../models/Layout.js';
import { getSession } from '../state/sessionStore.js';
import { setVendors } from './vendors.js';

export const eventRoutes = Router();

// GET /api/events — list events for current user
eventRoutes.get('/', async (req, res) => {
  try {
    const events = await Event.find({ owner: req.user.id })
      .select('name startDate endDate location createdAt updatedAt activeLayoutId vendors')
      .sort({ updatedAt: -1 });

    const summaries = await Promise.all(events.map(async (e) => {
      const layoutCount = await Layout.countDocuments({ event: e._id });
      return {
        id: e._id,
        name: e.name,
        startDate: e.startDate,
        endDate: e.endDate,
        location: e.location,
        vendorCount: e.vendors?.length || 0,
        layoutCount,
        activeLayoutId: e.activeLayoutId,
        createdAt: e.createdAt,
        updatedAt: e.updatedAt,
      };
    }));

    return res.json(summaries);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// GET /api/events/:id — get event details
eventRoutes.get('/:id', async (req, res) => {
  try {
    const event = await Event.findOne({ _id: req.params.id, owner: req.user.id });
    if (!event) return res.status(404).json({ error: 'Event not found' });

    const layouts = await Layout.find({ event: event._id })
      .select('name createdAt updatedAt')
      .sort({ updatedAt: -1 });

    // Load vendors into session
    const session = getSession(req.user.id);
    session.currentEventId = event._id.toString();
    setVendors(req.user.id, event.vendors || []);

    return res.json({
      id: event._id,
      name: event.name,
      startDate: event.startDate,
      endDate: event.endDate,
      location: event.location,
      vendors: event.vendors,
      vendorPortal: event.vendorPortal || null,
      settings: event.settings,
      categories: event.categories || [],
      infoSections: event.infoSections || [],
      fees: event.fees || [],
      keyDates: event.keyDates || [],
      activeLayoutId: event.activeLayoutId,
      layouts: layouts.map((l) => ({
        id: l._id,
        name: l.name,
        createdAt: l.createdAt,
        updatedAt: l.updatedAt,
      })),
      createdAt: event.createdAt,
      updatedAt: event.updatedAt,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// POST /api/events — create event
eventRoutes.post('/', async (req, res) => {
  try {
    const { name, settings } = req.body;
    const event = await Event.create({
      owner: req.user.id,
      name: name || 'Untitled Event',
      settings: settings || undefined,
    });

    return res.json({
      id: event._id,
      name: event.name,
      createdAt: event.createdAt,
      updatedAt: event.updatedAt,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// PUT /api/events/:id — update event
eventRoutes.put('/:id', async (req, res) => {
  try {
    const event = await Event.findOne({ _id: req.params.id, owner: req.user.id });
    if (!event) return res.status(404).json({ error: 'Event not found' });

    const { name, settings, infoSections, startDate, endDate, location, keyDates } = req.body;
    if (name) event.name = name;
    if (settings) event.settings = settings;
    if (infoSections) event.infoSections = infoSections;
    if (startDate !== undefined) event.startDate = startDate || null;
    if (endDate !== undefined) event.endDate = endDate || null;
    if (location !== undefined) event.location = location;
    if (req.body.categories) event.categories = req.body.categories;
    if (keyDates !== undefined) event.keyDates = keyDates;
    if (req.body.fees !== undefined) event.fees = req.body.fees;
    await event.save();

    return res.json({
      id: event._id,
      name: event.name,
      updatedAt: event.updatedAt,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// POST /api/events/:id/duplicate — duplicate event for next year
eventRoutes.post('/:id/duplicate', async (req, res) => {
  try {
    const source = await Event.findOne({ _id: req.params.id, owner: req.user.id });
    if (!source) return res.status(404).json({ error: 'Event not found' });

    const { includeVendors, includeLayouts } = req.body || {};

    const newName = req.body.name || `${source.name} (Copy)`;

    const duplicate = await Event.create({
      owner: req.user.id,
      name: newName,
      location: source.location,
      categories: source.categories,
      infoSections: source.infoSections,
      fees: source.fees || [],
      keyDates: source.keyDates || [],
      settings: source.settings,
      vendors: includeVendors ? source.vendors.map((v) => ({
        ...v,
        status: 'approved',
        spotPreferences: [],
        appliedAt: null,
      })) : [],
      vendorPortal: {
        enabled: false,
        inviteToken: null,
        maxSpotChoices: source.vendorPortal?.maxSpotChoices || 3,
        signupDeadline: null,
        instructions: source.vendorPortal?.instructions || '',
        requirePayment: source.vendorPortal?.requirePayment || false,
      },
    });

    // Copy layouts if requested
    if (includeLayouts) {
      const sourceLayouts = await Layout.find({ event: source._id });
      for (const sl of sourceLayouts) {
        await Layout.create({
          event: duplicate._id,
          name: sl.name,
          spotsGeoJSON: sl.spotsGeoJSON,
          deadZones: sl.deadZones,
          paths: sl.paths,
          mapCenter: sl.mapCenter,
          zoom: sl.zoom,
          amenities: sl.amenities,
          accessPoints: sl.accessPoints,
          timeWindows: sl.timeWindows,
          mapZones: sl.mapZones,
          // Don't copy placements since vendors may differ
        });
      }
    }

    return res.json({
      id: duplicate._id,
      name: duplicate.name,
      createdAt: duplicate.createdAt,
      updatedAt: duplicate.updatedAt,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// DELETE /api/events/:id — delete event + all layouts
eventRoutes.delete('/:id', async (req, res) => {
  try {
    const event = await Event.findOneAndDelete({ _id: req.params.id, owner: req.user.id });
    if (!event) return res.status(404).json({ error: 'Event not found' });

    await Layout.deleteMany({ event: event._id });

    const session = getSession(req.user.id);
    if (session.currentEventId === event._id.toString()) {
      session.currentEventId = null;
      session.currentLayoutId = null;
    }

    return res.json({ message: 'Event deleted' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});
