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
      .select('name createdAt updatedAt activeLayoutId vendors')
      .sort({ updatedAt: -1 });

    const summaries = await Promise.all(events.map(async (e) => {
      const layoutCount = await Layout.countDocuments({ event: e._id });
      return {
        id: e._id,
        name: e.name,
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
      vendors: event.vendors,
      vendorPortal: event.vendorPortal || null,
      settings: event.settings,
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

    const { name, settings } = req.body;
    if (name) event.name = name;
    if (settings) event.settings = settings;
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
