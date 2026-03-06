import { Router } from 'express';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import Event from '../models/Event.js';
import Layout from '../models/Layout.js';
import { requireAuth } from '../middleware/auth.js';
import { featureCenter } from '../utils/geometry.js';

export const vendorPortalRoutes = Router();

const JWT_SECRET = process.env.JWT_SECRET || 'vendor-placer-secret';

function generateVendorToken(eventId, vendorId) {
  return jwt.sign({ eventId, vendorId, type: 'vendor' }, JWT_SECRET, { expiresIn: '90d' });
}

function verifyVendorToken(token) {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    // Support legacy tokens with projectId
    if (decoded.projectId && !decoded.eventId) {
      decoded.eventId = decoded.projectId;
    }
    return decoded;
  } catch {
    return null;
  }
}

/**
 * Distance in meters between two [lat, lng] points (approximate).
 */
function distMeters(a, b) {
  const dLat = (b[0] - a[0]) * 111_320;
  const dLng = (b[1] - a[1]) * 111_320 * Math.cos((a[0] * Math.PI) / 180);
  return Math.sqrt(dLat * dLat + dLng * dLng);
}

/**
 * Compute setup info for an assigned vendor using event + active layout.
 */
function computeSetupInfo(vendor, layout) {
  const info = {};
  if (!layout) return info;

  const assignments = layout.placements?.assignments || {};
  const spotId = Object.entries(assignments).find(([, vid]) => vid === vendor.id)?.[0];
  if (!spotId) return info;

  const feature = (layout.spotsGeoJSON?.features || []).find((f) => f.properties?.id === spotId);
  if (!feature) return info;

  const center = featureCenter(feature);
  info.spotLabel = feature.properties.label;
  info.spotId = spotId;

  // Nearest access point
  const aps = layout.accessPoints || [];
  if (aps.length) {
    let nearest = null;
    let minDist = Infinity;
    for (const ap of aps) {
      const d = distMeters(center, [ap.lat, ap.lng]);
      if (d < minDist) { minDist = d; nearest = ap; }
    }
    if (nearest) {
      info.nearestAccessPoint = {
        label: nearest.label,
        distanceMeters: Math.round(minDist),
        vehicleAccess: !!nearest.vehicleAccess,
      };
    }
  }

  // Time windows
  const area = feature.properties.area;
  const timeWindows = (layout.timeWindows || []).filter((tw) => tw.area === area || tw.area === 'all');
  if (timeWindows.length) {
    info.timeWindows = timeWindows.map((tw) => ({ start: tw.start, end: tw.end }));
  }

  return info;
}

// ──────────────────────────────────────────────
// PUBLIC ROUTES (no auth)
// ──────────────────────────────────────────────

// GET /api/vendor-portal/:inviteToken — event info + available spots
vendorPortalRoutes.get('/:inviteToken', async (req, res) => {
  try {
    const event = await Event.findOne({ 'vendorPortal.inviteToken': req.params.inviteToken });
    if (!event || !event.vendorPortal?.enabled) {
      return res.status(404).json({ error: 'Portal not found or disabled' });
    }

    // Load active layout for spot data
    let layout = null;
    if (event.activeLayoutId) {
      layout = await Layout.findById(event.activeLayoutId);
    }

    const hasMap = layout?.spotsGeoJSON?.features?.length > 0;
    const assignedSpotIds = new Set(Object.keys(layout?.placements?.assignments || {}));

    // Only show unassigned spots
    const availableSpots = hasMap
      ? layout.spotsGeoJSON.features
          .filter((f) => !assignedSpotIds.has(f.properties?.id) && !f.properties?.deadZone)
          .map((f) => ({
            id: f.properties.id,
            label: f.properties.label,
            valueScore: f.properties.valueScore,
            isCorner: f.properties.isCorner,
            premium: f.properties.premium,
            geometry: f.geometry,
          }))
      : [];

    return res.json({
      eventName: event.name,
      projectName: event.name, // backward compat
      instructions: event.vendorPortal.instructions || '',
      categories: event.categories || [],
      infoSections: event.infoSections || [],
      fees: (event.fees || []).map((f) => ({ label: f.label, amount: f.amount, description: f.description, appliesTo: f.appliesTo })),
      keyDates: (event.keyDates || []).map((kd) => ({ label: kd.label, date: kd.date, description: kd.description })),
      maxSpotChoices: event.vendorPortal.maxSpotChoices || 3,
      signupDeadline: event.vendorPortal.signupDeadline,
      mapReady: hasMap,
      availableSpots,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// POST /api/vendor-portal/:inviteToken/apply — submit application
vendorPortalRoutes.post('/:inviteToken/apply', async (req, res) => {
  try {
    const event = await Event.findOne({ 'vendorPortal.inviteToken': req.params.inviteToken });
    if (!event || !event.vendorPortal?.enabled) {
      return res.status(404).json({ error: 'Portal not found or disabled' });
    }

    // Check deadline
    if (event.vendorPortal.signupDeadline && new Date() > new Date(event.vendorPortal.signupDeadline)) {
      return res.status(400).json({ error: 'Signup deadline has passed' });
    }

    const {
      name, category, email, phone, businessName, description,
      boothSize, powerNeeds, setupRequirements, spotPreferences,
    } = req.body;

    if (!name) return res.status(400).json({ error: 'Name is required' });

    const vendorId = crypto.randomUUID();
    const vendorToken = generateVendorToken(event._id.toString(), vendorId);

    const vendor = {
      id: vendorId,
      name,
      category: category || 'other',
      tier: 'bronze',
      premium: false,
      booths: boothSize || 1,
      bid: 0,
      exclusions: [],
      conflicts: [],
      status: 'applied',
      email: email || '',
      phone: phone || '',
      businessName: businessName || '',
      description: description || '',
      boothSize: boothSize || 1,
      powerNeeds: powerNeeds || '',
      setupRequirements: setupRequirements || '',
      insuranceStatus: 'none',
      spotPreferences: (spotPreferences || []).slice(0, event.vendorPortal.maxSpotChoices || 3),
      vendorToken,
      appliedAt: new Date().toISOString(),
      notes: '',
    };

    event.vendors.push(vendor);
    event.markModified('vendors');
    await event.save();

    return res.json({
      vendorToken,
      vendorId,
      status: 'applied',
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// GET /api/vendor-portal/vendor/:vendorToken — vendor status + setup info
vendorPortalRoutes.get('/vendor/:vendorToken', async (req, res) => {
  try {
    const decoded = verifyVendorToken(req.params.vendorToken);
    if (!decoded) return res.status(401).json({ error: 'Invalid or expired token' });

    const event = await Event.findById(decoded.eventId);
    if (!event) return res.status(404).json({ error: 'Event not found' });

    const vendor = event.vendors.find((v) => v.id === decoded.vendorId);
    if (!vendor) return res.status(404).json({ error: 'Vendor not found' });

    // Load active layout for setup info
    let layout = null;
    if (event.activeLayoutId) {
      layout = await Layout.findById(event.activeLayoutId);
    }
    const setupInfo = computeSetupInfo(vendor, layout);

    return res.json({
      vendor: {
        id: vendor.id,
        name: vendor.name,
        category: vendor.category,
        status: vendor.status || 'applied',
        email: vendor.email,
        phone: vendor.phone,
        businessName: vendor.businessName,
        description: vendor.description,
        boothSize: vendor.boothSize,
        powerNeeds: vendor.powerNeeds,
        setupRequirements: vendor.setupRequirements,
        spotPreferences: vendor.spotPreferences || [],
        appliedAt: vendor.appliedAt,
        approvedAt: vendor.approvedAt,
      },
      setupInfo,
      eventName: event.name,
      projectName: event.name, // backward compat
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// PATCH /api/vendor-portal/vendor/:vendorToken — update profile + spot preferences
vendorPortalRoutes.patch('/vendor/:vendorToken', async (req, res) => {
  try {
    const decoded = verifyVendorToken(req.params.vendorToken);
    if (!decoded) return res.status(401).json({ error: 'Invalid or expired token' });

    const event = await Event.findById(decoded.eventId);
    if (!event) return res.status(404).json({ error: 'Event not found' });

    const vendor = event.vendors.find((v) => v.id === decoded.vendorId);
    if (!vendor) return res.status(404).json({ error: 'Vendor not found' });

    // Don't allow updates if canceled
    if (vendor.status === 'canceled') {
      return res.status(400).json({ error: 'Cannot update a canceled application' });
    }

    const allowed = ['name', 'category', 'email', 'phone', 'businessName', 'description',
                      'boothSize', 'powerNeeds', 'setupRequirements', 'spotPreferences'];
    for (const key of Object.keys(req.body)) {
      if (allowed.includes(key)) {
        if (key === 'spotPreferences') {
          vendor.spotPreferences = (req.body.spotPreferences || []).slice(0, event.vendorPortal?.maxSpotChoices || 3);
        } else {
          vendor[key] = req.body[key];
        }
      }
    }

    event.markModified('vendors');
    await event.save();

    return res.json({ status: vendor.status, vendor });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// POST /api/vendor-portal/vendor/:vendorToken/cancel — cancel application
vendorPortalRoutes.post('/vendor/:vendorToken/cancel', async (req, res) => {
  try {
    const decoded = verifyVendorToken(req.params.vendorToken);
    if (!decoded) return res.status(401).json({ error: 'Invalid or expired token' });

    const event = await Event.findById(decoded.eventId);
    if (!event) return res.status(404).json({ error: 'Event not found' });

    const vendor = event.vendors.find((v) => v.id === decoded.vendorId);
    if (!vendor) return res.status(404).json({ error: 'Vendor not found' });

    // Free assigned spot in active layout if any
    if (event.activeLayoutId) {
      const layout = await Layout.findById(event.activeLayoutId);
      if (layout?.placements?.assignments) {
        for (const [spotId, vid] of Object.entries(layout.placements.assignments)) {
          if (vid === vendor.id) {
            delete layout.placements.assignments[spotId];
            break;
          }
        }
        layout.markModified('placements');
        await layout.save();
      }
    }

    vendor.status = 'canceled';
    vendor.canceledAt = new Date().toISOString();
    vendor.cancelReason = req.body.reason || 'Vendor canceled';

    // Promote next waitlisted vendor
    const waitlisted = event.vendors
      .filter((v) => v.status === 'waitlisted')
      .sort((a, b) => new Date(a.appliedAt) - new Date(b.appliedAt));
    if (waitlisted.length > 0) {
      waitlisted[0].status = 'approved';
      waitlisted[0].approvedAt = new Date().toISOString();
    }

    event.markModified('vendors');
    await event.save();

    return res.json({ status: 'canceled' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// ──────────────────────────────────────────────
// PROTECTED ROUTES (organizer auth)
// ──────────────────────────────────────────────

// POST /api/events/:id/vendor-portal/enable
vendorPortalRoutes.post('/events/:id/vendor-portal/enable', requireAuth, async (req, res) => {
  try {
    const event = await Event.findOne({ _id: req.params.id, owner: req.user.id });
    if (!event) return res.status(404).json({ error: 'Event not found' });

    event.vendorPortal = {
      ...event.vendorPortal,
      enabled: true,
      inviteToken: event.vendorPortal?.inviteToken || crypto.randomUUID(),
      maxSpotChoices: req.body.maxSpotChoices || event.vendorPortal?.maxSpotChoices || 3,
      signupDeadline: req.body.signupDeadline || event.vendorPortal?.signupDeadline || null,
      instructions: req.body.instructions ?? event.vendorPortal?.instructions ?? '',
    };
    event.markModified('vendorPortal');
    await event.save();

    return res.json({
      enabled: true,
      inviteToken: event.vendorPortal.inviteToken,
      inviteUrl: `/vendor/${event.vendorPortal.inviteToken}`,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// POST /api/events/:id/vendor-portal/disable
vendorPortalRoutes.post('/events/:id/vendor-portal/disable', requireAuth, async (req, res) => {
  try {
    const event = await Event.findOne({ _id: req.params.id, owner: req.user.id });
    if (!event) return res.status(404).json({ error: 'Event not found' });

    if (event.vendorPortal) {
      event.vendorPortal.enabled = false;
      event.markModified('vendorPortal');
      await event.save();
    }

    return res.json({ enabled: false });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// PATCH /api/events/:id/vendor-portal/config — update portal settings
vendorPortalRoutes.patch('/events/:id/vendor-portal/config', requireAuth, async (req, res) => {
  try {
    const event = await Event.findOne({ _id: req.params.id, owner: req.user.id });
    if (!event) return res.status(404).json({ error: 'Event not found' });

    const { maxSpotChoices, signupDeadline, instructions } = req.body;
    if (!event.vendorPortal) event.vendorPortal = {};
    if (maxSpotChoices != null) event.vendorPortal.maxSpotChoices = maxSpotChoices;
    if (signupDeadline !== undefined) event.vendorPortal.signupDeadline = signupDeadline;
    if (instructions !== undefined) event.vendorPortal.instructions = instructions;
    event.markModified('vendorPortal');
    await event.save();

    return res.json({ vendorPortal: event.vendorPortal });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// PATCH /api/vendors/:vendorId/status — approve / waitlist / cancel vendor
vendorPortalRoutes.patch('/vendors/:vendorId/status', requireAuth, async (req, res) => {
  try {
    const { eventId, status } = req.body;
    if (!eventId || !status) return res.status(400).json({ error: 'eventId and status are required' });

    const validStatuses = ['approved', 'waitlisted', 'canceled', 'applied'];
    if (!validStatuses.includes(status)) return res.status(400).json({ error: 'Invalid status' });

    const event = await Event.findOne({ _id: eventId, owner: req.user.id });
    if (!event) return res.status(404).json({ error: 'Event not found' });

    const vendor = event.vendors.find((v) => v.id === req.params.vendorId);
    if (!vendor) return res.status(404).json({ error: 'Vendor not found' });

    vendor.status = status;
    if (status === 'approved') vendor.approvedAt = new Date().toISOString();
    if (status === 'canceled') {
      vendor.canceledAt = new Date().toISOString();
      vendor.cancelReason = req.body.reason || 'Organizer canceled';
      // Free assigned spot in active layout
      if (event.activeLayoutId) {
        const layout = await Layout.findById(event.activeLayoutId);
        if (layout?.placements?.assignments) {
          for (const [spotId, vid] of Object.entries(layout.placements.assignments)) {
            if (vid === vendor.id) {
              delete layout.placements.assignments[spotId];
              break;
            }
          }
          layout.markModified('placements');
          await layout.save();
        }
      }
    }

    if (req.body.notes !== undefined) vendor.notes = req.body.notes;

    event.markModified('vendors');
    await event.save();

    return res.json({ vendor });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// POST /api/vendors/approve-batch — batch approve
vendorPortalRoutes.post('/vendors/approve-batch', requireAuth, async (req, res) => {
  try {
    const { eventId, vendorIds } = req.body;
    if (!eventId || !Array.isArray(vendorIds)) {
      return res.status(400).json({ error: 'eventId and vendorIds array required' });
    }

    const event = await Event.findOne({ _id: eventId, owner: req.user.id });
    if (!event) return res.status(404).json({ error: 'Event not found' });

    const idSet = new Set(vendorIds);
    let count = 0;
    for (const vendor of event.vendors) {
      if (idSet.has(vendor.id) && vendor.status === 'applied') {
        vendor.status = 'approved';
        vendor.approvedAt = new Date().toISOString();
        count++;
      }
    }

    event.markModified('vendors');
    await event.save();

    return res.json({ approved: count });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});
