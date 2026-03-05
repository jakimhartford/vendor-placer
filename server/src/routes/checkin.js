import { Router } from 'express';
import Project from '../models/Project.js';
import { requireAuth } from '../middleware/auth.js';

export const checkinRoutes = Router();

// GET /api/projects/:id/checkin — project data + check-in state
checkinRoutes.get('/:id/checkin', requireAuth, async (req, res) => {
  try {
    const project = await Project.findOne({ _id: req.params.id, owner: req.user.id });
    if (!project) return res.status(404).json({ error: 'Project not found' });

    const checkIns = project.checkIns ? Object.fromEntries(project.checkIns) : {};

    return res.json({
      project: {
        id: project._id,
        name: project.name,
        spotsGeoJSON: project.spotsGeoJSON,
        vendors: project.vendors,
        placements: project.placements,
        deadZones: project.deadZones || [],
        accessPoints: project.accessPoints || [],
      },
      checkIns,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// PATCH /api/projects/:id/checkin/:vendorId — toggle arrival/setup
checkinRoutes.patch('/:id/checkin/:vendorId', requireAuth, async (req, res) => {
  try {
    const project = await Project.findOne({ _id: req.params.id, owner: req.user.id });
    if (!project) return res.status(404).json({ error: 'Project not found' });

    const { arrived, setupComplete } = req.body;
    const vendorId = req.params.vendorId;

    if (!project.checkIns) project.checkIns = new Map();

    const existing = project.checkIns.get(vendorId) || {};
    if (arrived !== undefined) {
      existing.arrivedAt = arrived ? new Date() : null;
    }
    if (setupComplete !== undefined) {
      existing.setupComplete = setupComplete;
    }
    project.checkIns.set(vendorId, existing);

    await project.save();

    return res.json({
      vendorId,
      checkIn: existing,
      checkIns: Object.fromEntries(project.checkIns),
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// GET /api/projects/:id/checkin/summary
checkinRoutes.get('/:id/checkin/summary', requireAuth, async (req, res) => {
  try {
    const project = await Project.findOne({ _id: req.params.id, owner: req.user.id });
    if (!project) return res.status(404).json({ error: 'Project not found' });

    const assignments = project.placements?.assignments || {};
    const assignedVendorIds = new Set(Object.values(assignments));
    const total = assignedVendorIds.size;

    const checkIns = project.checkIns ? Object.fromEntries(project.checkIns) : {};
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
