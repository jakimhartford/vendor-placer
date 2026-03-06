import { Router } from 'express';
import Event from '../models/Event.js';
import Layout from '../models/Layout.js';
import { getSpots, setSpots } from './spots.js';
import { getVendors, setVendors } from './vendors.js';
import { getPlacements, setPlacements } from './placements.js';
import { getSession } from '../state/sessionStore.js';

export const layoutRoutes = Router({ mergeParams: true });

// GET /api/events/:eventId/layouts — list layouts for event
layoutRoutes.get('/', async (req, res) => {
  try {
    const event = await Event.findOne({ _id: req.params.eventId, owner: req.user.id });
    if (!event) return res.status(404).json({ error: 'Event not found' });

    const layouts = await Layout.find({ event: event._id })
      .select('name createdAt updatedAt')
      .sort({ updatedAt: -1 });

    return res.json(layouts.map((l) => ({
      id: l._id,
      name: l.name,
      createdAt: l.createdAt,
      updatedAt: l.updatedAt,
    })));
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// GET /api/events/:eventId/layouts/:id — load layout and restore session
layoutRoutes.get('/:id', async (req, res) => {
  try {
    const event = await Event.findOne({ _id: req.params.eventId, owner: req.user.id });
    if (!event) return res.status(404).json({ error: 'Event not found' });

    const layout = await Layout.findOne({ _id: req.params.id, event: event._id });
    if (!layout) return res.status(404).json({ error: 'Layout not found' });

    const userId = req.user.id;
    const session = getSession(userId);

    // Restore session state from layout
    if (layout.spotsGeoJSON) setSpots(userId, layout.spotsGeoJSON);
    if (layout.placements) setPlacements(userId, layout.placements);
    session.deadZones = layout.deadZones || [];
    session.amenities = layout.amenities || [];
    session.accessPoints = layout.accessPoints || [];
    session.timeWindows = layout.timeWindows || [];
    session.mapZones = layout.mapZones || [];
    session.currentEventId = event._id.toString();
    session.currentLayoutId = layout._id.toString();

    // Also load vendors from event into session
    setVendors(userId, event.vendors || []);

    // Update active layout on event
    event.activeLayoutId = layout._id;
    await event.save();

    return res.json({
      id: layout._id,
      name: layout.name,
      spotsGeoJSON: layout.spotsGeoJSON,
      placements: layout.placements,
      paths: layout.paths,
      deadZones: layout.deadZones || [],
      amenities: layout.amenities || [],
      accessPoints: layout.accessPoints || [],
      timeWindows: layout.timeWindows || [],
      mapZones: layout.mapZones || [],
      mapCenter: layout.mapCenter,
      zoom: layout.zoom,
      // Event-level data
      vendors: event.vendors,
      settings: event.settings,
      vendorPortal: event.vendorPortal || null,
      createdAt: layout.createdAt,
      updatedAt: layout.updatedAt,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// POST /api/events/:eventId/layouts — create new layout from current session
layoutRoutes.post('/', async (req, res) => {
  try {
    const event = await Event.findOne({ _id: req.params.eventId, owner: req.user.id });
    if (!event) return res.status(404).json({ error: 'Event not found' });

    const userId = req.user.id;
    const { name, mapCenter, zoom, paths } = req.body;
    const session = getSession(userId);

    const layout = await Layout.create({
      event: event._id,
      name: name || 'Untitled Layout',
      spotsGeoJSON: getSpots(userId),
      placements: getPlacements(userId),
      deadZones: session.deadZones,
      amenities: session.amenities,
      accessPoints: session.accessPoints,
      timeWindows: session.timeWindows,
      mapZones: session.mapZones,
      paths: paths || [],
      mapCenter: mapCenter || null,
      zoom: zoom || null,
    });

    // Set as active layout
    event.activeLayoutId = layout._id;
    await event.save();

    session.currentLayoutId = layout._id.toString();

    return res.json({
      id: layout._id,
      name: layout.name,
      createdAt: layout.createdAt,
      updatedAt: layout.updatedAt,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// POST /api/events/:eventId/layouts/:id/duplicate — duplicate a layout
layoutRoutes.post('/:id/duplicate', async (req, res) => {
  try {
    const event = await Event.findOne({ _id: req.params.eventId, owner: req.user.id });
    if (!event) return res.status(404).json({ error: 'Event not found' });

    const source = await Layout.findOne({ _id: req.params.id, event: event._id });
    if (!source) return res.status(404).json({ error: 'Layout not found' });

    const layout = await Layout.create({
      event: event._id,
      name: `${source.name} (copy)`,
      spotsGeoJSON: source.spotsGeoJSON,
      placements: source.placements,
      deadZones: source.deadZones,
      paths: source.paths,
      mapCenter: source.mapCenter,
      zoom: source.zoom,
      amenities: source.amenities,
      accessPoints: source.accessPoints,
      timeWindows: source.timeWindows,
      mapZones: source.mapZones,
    });

    return res.json({
      id: layout._id,
      name: layout.name,
      createdAt: layout.createdAt,
      updatedAt: layout.updatedAt,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// PUT /api/events/:eventId/layouts/:id — save current session to layout
layoutRoutes.put('/:id', async (req, res) => {
  try {
    const event = await Event.findOne({ _id: req.params.eventId, owner: req.user.id });
    if (!event) return res.status(404).json({ error: 'Event not found' });

    const layout = await Layout.findOne({ _id: req.params.id, event: event._id });
    if (!layout) return res.status(404).json({ error: 'Layout not found' });

    const userId = req.user.id;
    const { name, mapCenter, zoom, paths } = req.body;
    const session = getSession(userId);

    layout.name = name || layout.name;
    layout.mapCenter = mapCenter ?? layout.mapCenter;
    layout.zoom = zoom ?? layout.zoom;
    layout.spotsGeoJSON = getSpots(userId);
    layout.placements = getPlacements(userId);
    layout.deadZones = session.deadZones;
    layout.amenities = session.amenities;
    layout.accessPoints = session.accessPoints;
    layout.timeWindows = session.timeWindows;
    layout.mapZones = session.mapZones;
    layout.paths = paths ?? layout.paths;

    await layout.save();

    // Also persist vendors to event
    event.vendors = getVendors(userId);
    event.markModified('vendors');
    await event.save();

    return res.json({
      id: layout._id,
      name: layout.name,
      updatedAt: layout.updatedAt,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// DELETE /api/events/:eventId/layouts/:id
layoutRoutes.delete('/:id', async (req, res) => {
  try {
    const event = await Event.findOne({ _id: req.params.eventId, owner: req.user.id });
    if (!event) return res.status(404).json({ error: 'Event not found' });

    const result = await Layout.findOneAndDelete({ _id: req.params.id, event: event._id });
    if (!result) return res.status(404).json({ error: 'Layout not found' });

    // Clear active layout if it was this one
    if (event.activeLayoutId?.toString() === req.params.id) {
      event.activeLayoutId = null;
      await event.save();
    }

    const session = getSession(req.user.id);
    if (session.currentLayoutId === req.params.id) {
      session.currentLayoutId = null;
    }

    return res.json({ message: 'Layout deleted' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});
