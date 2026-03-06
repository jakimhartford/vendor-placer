import { Router } from 'express';
import jwt from 'jsonwebtoken';
import Event from '../models/Event.js';
import Layout from '../models/Layout.js';
import { requireAuth } from '../middleware/auth.js';

export const shareRoutes = Router();

// POST /api/events/:id/share-link — generate a share link (authenticated)
shareRoutes.post('/events/:id/share-link', requireAuth, async (req, res) => {
  try {
    const { vendorId, layoutId } = req.body;
    if (!vendorId) return res.status(400).json({ error: 'vendorId is required' });

    const event = await Event.findOne({ _id: req.params.id, owner: req.user.id });
    if (!event) return res.status(404).json({ error: 'Event not found' });

    const token = jwt.sign(
      {
        eventId: event._id.toString(),
        layoutId: (layoutId || event.activeLayoutId || '').toString(),
        vendorId,
        type: 'share',
      },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    return res.json({ token, url: `/share/${token}` });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// GET /api/share/:token — public, verify token and return data for vendor
shareRoutes.get('/share/:token', async (req, res) => {
  try {
    const payload = jwt.verify(req.params.token, process.env.JWT_SECRET);
    if (payload.type !== 'share') {
      return res.status(403).json({ error: 'Invalid share token' });
    }

    // Support legacy tokens with projectId
    const eventId = payload.eventId || payload.projectId;
    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ error: 'Event not found' });

    const vendor = (event.vendors || []).find((v) => v.id === payload.vendorId);
    if (!vendor) return res.status(404).json({ error: 'Vendor not found in event' });

    // Load layout (from token or active)
    const layoutId = payload.layoutId || event.activeLayoutId;
    let layout = null;
    if (layoutId) {
      layout = await Layout.findById(layoutId);
    }

    // Find which spot(s) this vendor is assigned to
    const assignments = layout?.placements?.assignments || {};
    const assignedSpotIds = Object.entries(assignments)
      .filter(([, vid]) => vid === payload.vendorId)
      .map(([spotId]) => spotId);

    // Find vendor's time window based on spot area label
    let timeWindow = null;
    if (assignedSpotIds.length > 0 && layout?.timeWindows?.length) {
      const spotFeature = (layout.spotsGeoJSON?.features || []).find(
        (f) => f.properties?.id === assignedSpotIds[0]
      );
      const areaLabel = spotFeature?.properties?.label?.charAt(0);
      if (areaLabel) {
        timeWindow = layout.timeWindows.find((tw) => tw.area === areaLabel) || null;
      }
    }

    return res.json({
      project: {
        name: event.name,
        spotsGeoJSON: layout?.spotsGeoJSON || { type: 'FeatureCollection', features: [] },
        deadZones: layout?.deadZones || [],
        accessPoints: layout?.accessPoints || [],
      },
      vendor,
      assignedSpotIds,
      timeWindow,
    });
  } catch (err) {
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
      return res.status(403).json({ error: 'Invalid or expired share link' });
    }
    return res.status(500).json({ error: err.message });
  }
});
