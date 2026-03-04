import { Router } from 'express';
import Project from '../models/Project.js';
import { getSpots, setSpots } from './spots.js';
import { getVendors, setVendors } from './vendors.js';
import { getPlacements, setPlacements } from './placements.js';

export const projectRoutes = Router();

// GET /api/projects — list project summaries for current user
projectRoutes.get('/', async (req, res) => {
  try {
    const projects = await Project.find({ owner: req.user.id })
      .select('name createdAt updatedAt')
      .sort({ updatedAt: -1 });

    const summaries = projects.map((p) => ({
      id: p._id,
      name: p.name,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
    }));

    return res.json(summaries);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// GET /api/projects/:id — load a full project and restore in-memory state
projectRoutes.get('/:id', async (req, res) => {
  try {
    const project = await Project.findOne({ _id: req.params.id, owner: req.user.id });
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const userId = req.user.id;

    // Restore in-memory state for this user
    if (project.spotsGeoJSON) setSpots(userId, project.spotsGeoJSON);
    if (project.vendors) setVendors(userId, project.vendors);
    if (project.placements) setPlacements(userId, project.placements);

    return res.json({
      id: project._id,
      name: project.name,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
      spotsGeoJSON: project.spotsGeoJSON,
      vendors: project.vendors,
      placements: project.placements,
      paths: project.paths,
      mapCenter: project.mapCenter,
      zoom: project.zoom,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// POST /api/projects — create new project from current state
projectRoutes.post('/', async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, mapCenter, zoom, paths } = req.body;

    const project = await Project.create({
      owner: userId,
      name: name || 'Untitled Project',
      spotsGeoJSON: getSpots(userId),
      vendors: getVendors(userId),
      placements: getPlacements(userId),
      paths: paths || [],
      mapCenter: mapCenter || null,
      zoom: zoom || null,
    });

    return res.json({
      id: project._id,
      name: project.name,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// PUT /api/projects/:id — update/save current state to existing project
projectRoutes.put('/:id', async (req, res) => {
  try {
    const userId = req.user.id;
    const project = await Project.findOne({ _id: req.params.id, owner: userId });
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const { name, mapCenter, zoom, paths } = req.body;

    project.name = name || project.name;
    project.mapCenter = mapCenter ?? project.mapCenter;
    project.zoom = zoom ?? project.zoom;
    project.spotsGeoJSON = getSpots(userId);
    project.vendors = getVendors(userId);
    project.placements = getPlacements(userId);
    project.paths = paths ?? project.paths;

    await project.save();

    return res.json({
      id: project._id,
      name: project.name,
      updatedAt: project.updatedAt,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// DELETE /api/projects/:id
projectRoutes.delete('/:id', async (req, res) => {
  try {
    const result = await Project.findOneAndDelete({ _id: req.params.id, owner: req.user.id });
    if (!result) {
      return res.status(404).json({ error: 'Project not found' });
    }
    return res.json({ message: 'Project deleted' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});
