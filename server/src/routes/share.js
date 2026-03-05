import { Router } from 'express';
import jwt from 'jsonwebtoken';
import Project from '../models/Project.js';
import { requireAuth } from '../middleware/auth.js';

export const shareRoutes = Router();

// POST /api/projects/:id/share-link — generate a share link (authenticated)
shareRoutes.post('/projects/:id/share-link', requireAuth, async (req, res) => {
  try {
    const { vendorId } = req.body;
    if (!vendorId) return res.status(400).json({ error: 'vendorId is required' });

    const project = await Project.findOne({ _id: req.params.id, owner: req.user.id });
    if (!project) return res.status(404).json({ error: 'Project not found' });

    const token = jwt.sign(
      { projectId: project._id.toString(), vendorId, type: 'share' },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    return res.json({ token, url: `/share/${token}` });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// GET /api/share/:token — public, verify token and return project data for vendor
shareRoutes.get('/share/:token', async (req, res) => {
  try {
    const payload = jwt.verify(req.params.token, process.env.JWT_SECRET);
    if (payload.type !== 'share') {
      return res.status(403).json({ error: 'Invalid share token' });
    }

    const project = await Project.findById(payload.projectId);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    const vendor = (project.vendors || []).find((v) => v.id === payload.vendorId);
    if (!vendor) return res.status(404).json({ error: 'Vendor not found in project' });

    // Find which spot(s) this vendor is assigned to
    const assignments = project.placements?.assignments || {};
    const assignedSpotIds = Object.entries(assignments)
      .filter(([, vid]) => vid === payload.vendorId)
      .map(([spotId]) => spotId);

    return res.json({
      project: {
        name: project.name,
        spotsGeoJSON: project.spotsGeoJSON,
        deadZones: project.deadZones || [],
      },
      vendor,
      assignedSpotIds,
    });
  } catch (err) {
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
      return res.status(403).json({ error: 'Invalid or expired share link' });
    }
    return res.status(500).json({ error: err.message });
  }
});
