import { Router } from 'express';
import Project from '../models/Project.js';
import { getSpots, setSpots } from './spots.js';
import { getVendors, setVendors } from './vendors.js';
import { getPlacements, setPlacements } from './placements.js';
import { getSession } from '../state/sessionStore.js';

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
    const session = getSession(userId);
    if (project.spotsGeoJSON) setSpots(userId, project.spotsGeoJSON);
    if (project.vendors) setVendors(userId, project.vendors);
    if (project.placements) setPlacements(userId, project.placements);
    session.deadZones = project.deadZones || [];
    session.amenities = project.amenities || [];
    session.accessPoints = project.accessPoints || [];
    session.timeWindows = project.timeWindows || [];
    session.mapZones = project.mapZones || [];

    return res.json({
      id: project._id,
      name: project.name,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
      spotsGeoJSON: project.spotsGeoJSON,
      vendors: project.vendors,
      placements: project.placements,
      paths: project.paths,
      deadZones: project.deadZones || [],
      amenities: project.amenities || [],
      accessPoints: project.accessPoints || [],
      timeWindows: project.timeWindows || [],
      mapZones: project.mapZones || [],
      mapCenter: project.mapCenter,
      zoom: project.zoom,
      settings: project.settings,
      versions: (project.versions || []).map((v) => ({ _id: v._id, name: v.name, createdAt: v.createdAt })),
      activeVersionId: project.activeVersionId,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// POST /api/projects — create new project from current state
projectRoutes.post('/', async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, mapCenter, zoom, paths, settings } = req.body;

    const session = getSession(userId);
    const project = await Project.create({
      owner: userId,
      name: name || 'Untitled Project',
      spotsGeoJSON: getSpots(userId),
      vendors: getVendors(userId),
      placements: getPlacements(userId),
      deadZones: session.deadZones,
      amenities: session.amenities,
      accessPoints: session.accessPoints,
      timeWindows: session.timeWindows,
      mapZones: session.mapZones,
      paths: paths || [],
      mapCenter: mapCenter || null,
      zoom: zoom || null,
      settings: settings || undefined,
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

    const { name, mapCenter, zoom, paths, settings } = req.body;

    const session = getSession(userId);
    project.name = name || project.name;
    project.mapCenter = mapCenter ?? project.mapCenter;
    project.zoom = zoom ?? project.zoom;
    project.spotsGeoJSON = getSpots(userId);
    project.vendors = getVendors(userId);
    project.placements = getPlacements(userId);
    project.deadZones = session.deadZones;
    project.amenities = session.amenities;
    project.accessPoints = session.accessPoints;
    project.timeWindows = session.timeWindows;
    project.mapZones = session.mapZones;
    project.paths = paths ?? project.paths;
    if (settings) project.settings = settings;

    // If a version is active, update that version snapshot too
    if (project.activeVersionId) {
      const ver = project.versions.id(project.activeVersionId);
      if (ver) {
        ver.spotsGeoJSON = project.spotsGeoJSON;
        ver.vendors = project.vendors;
        ver.placements = project.placements;
        ver.deadZones = project.deadZones;
        ver.paths = project.paths;
        if (settings) ver.settings = settings;
      }
    }

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

// POST /api/projects/:id/versions — snapshot current state as a new version
projectRoutes.post('/:id/versions', async (req, res) => {
  try {
    const userId = req.user.id;
    const project = await Project.findOne({ _id: req.params.id, owner: userId });
    if (!project) return res.status(404).json({ error: 'Project not found' });

    const session = getSession(userId);
    const version = {
      name: req.body.name || 'Untitled Version',
      spotsGeoJSON: getSpots(userId),
      vendors: getVendors(userId),
      placements: getPlacements(userId),
      deadZones: session.deadZones,
      amenities: session.amenities,
      accessPoints: session.accessPoints,
      timeWindows: session.timeWindows,
      mapZones: session.mapZones,
      paths: project.paths,
      settings: project.settings,
    };

    project.versions.push(version);
    const saved = project.versions[project.versions.length - 1];
    project.activeVersionId = saved._id;
    await project.save();

    return res.json({ _id: saved._id, name: saved.name, createdAt: saved.createdAt });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// GET /api/projects/:id/versions — list version summaries
projectRoutes.get('/:id/versions', async (req, res) => {
  try {
    const project = await Project.findOne({ _id: req.params.id, owner: req.user.id });
    if (!project) return res.status(404).json({ error: 'Project not found' });

    const summaries = (project.versions || []).map((v) => ({
      _id: v._id,
      name: v.name,
      createdAt: v.createdAt,
    }));
    return res.json({ versions: summaries, activeVersionId: project.activeVersionId });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// POST /api/projects/:id/versions/:versionId/load — restore a version
projectRoutes.post('/:id/versions/:versionId/load', async (req, res) => {
  try {
    const userId = req.user.id;
    const project = await Project.findOne({ _id: req.params.id, owner: userId });
    if (!project) return res.status(404).json({ error: 'Project not found' });

    const version = project.versions.id(req.params.versionId);
    if (!version) return res.status(404).json({ error: 'Version not found' });

    // Restore in-memory state from version
    const session = getSession(userId);
    if (version.spotsGeoJSON) setSpots(userId, version.spotsGeoJSON);
    if (version.vendors) setVendors(userId, version.vendors);
    if (version.placements) setPlacements(userId, version.placements);
    session.deadZones = version.deadZones || [];
    session.amenities = version.amenities || [];
    session.accessPoints = version.accessPoints || [];
    session.timeWindows = version.timeWindows || [];
    session.mapZones = version.mapZones || [];

    // Also update the project's top-level state
    project.spotsGeoJSON = version.spotsGeoJSON;
    project.vendors = version.vendors;
    project.placements = version.placements;
    project.deadZones = version.deadZones || [];
    project.amenities = version.amenities || [];
    project.accessPoints = version.accessPoints || [];
    project.timeWindows = version.timeWindows || [];
    project.mapZones = version.mapZones || [];
    project.paths = version.paths || project.paths;
    if (version.settings) project.settings = version.settings;
    project.activeVersionId = version._id;
    await project.save();

    return res.json({
      spotsGeoJSON: version.spotsGeoJSON,
      vendors: version.vendors,
      placements: version.placements,
      deadZones: version.deadZones || [],
      paths: version.paths || [],
      settings: version.settings || project.settings,
      activeVersionId: version._id,
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
