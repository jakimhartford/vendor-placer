import { Router } from 'express';
import crypto from 'crypto';
import { readFileSync, writeFileSync, readdirSync, unlinkSync, existsSync, mkdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { getSpots, setSpots } from './spots.js';
import { getVendors, setVendors } from './vendors.js';
import { getPlacements, setPlacements } from './placements.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECTS_DIR = join(__dirname, '..', 'data', 'projects');

// Ensure directory exists
if (!existsSync(PROJECTS_DIR)) {
  mkdirSync(PROJECTS_DIR, { recursive: true });
}

export const projectRoutes = Router();

// GET /api/projects — list project summaries
projectRoutes.get('/', (_req, res) => {
  try {
    const files = readdirSync(PROJECTS_DIR).filter((f) => f.endsWith('.json'));
    const summaries = files.map((f) => {
      const data = JSON.parse(readFileSync(join(PROJECTS_DIR, f), 'utf-8'));
      return {
        id: data.id,
        name: data.name,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      };
    }).sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''));
    return res.json(summaries);
  } catch {
    return res.json([]);
  }
});

// GET /api/projects/:id — load a full project and restore in-memory state
projectRoutes.get('/:id', (req, res) => {
  const filePath = join(PROJECTS_DIR, `${req.params.id}.json`);
  if (!existsSync(filePath)) {
    return res.status(404).json({ error: 'Project not found' });
  }
  try {
    const data = JSON.parse(readFileSync(filePath, 'utf-8'));
    // Restore in-memory state
    if (data.spotsGeoJSON) setSpots(data.spotsGeoJSON);
    if (data.vendors) setVendors(data.vendors);
    if (data.placements) setPlacements(data.placements);
    return res.json(data);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// POST /api/projects — create new project from current state
projectRoutes.post('/', (req, res) => {
  try {
    const { name, mapCenter, zoom, paths } = req.body;
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const project = {
      id,
      name: name || `Project ${id.slice(0, 8)}`,
      createdAt: now,
      updatedAt: now,
      mapCenter: mapCenter || null,
      zoom: zoom || null,
      spotsGeoJSON: getSpots(),
      vendors: getVendors(),
      placements: getPlacements(),
      paths: paths || [],
    };
    writeFileSync(join(PROJECTS_DIR, `${id}.json`), JSON.stringify(project, null, 2));
    return res.json({ id, name: project.name, createdAt: now, updatedAt: now });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// PUT /api/projects/:id — update/save current state to existing project
projectRoutes.put('/:id', (req, res) => {
  const filePath = join(PROJECTS_DIR, `${req.params.id}.json`);
  if (!existsSync(filePath)) {
    return res.status(404).json({ error: 'Project not found' });
  }
  try {
    const existing = JSON.parse(readFileSync(filePath, 'utf-8'));
    const { name, mapCenter, zoom, paths } = req.body;
    const now = new Date().toISOString();
    const updated = {
      ...existing,
      name: name || existing.name,
      updatedAt: now,
      mapCenter: mapCenter ?? existing.mapCenter,
      zoom: zoom ?? existing.zoom,
      spotsGeoJSON: getSpots(),
      vendors: getVendors(),
      placements: getPlacements(),
      paths: paths ?? existing.paths,
    };
    writeFileSync(filePath, JSON.stringify(updated, null, 2));
    return res.json({ id: updated.id, name: updated.name, updatedAt: now });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// DELETE /api/projects/:id
projectRoutes.delete('/:id', (req, res) => {
  const filePath = join(PROJECTS_DIR, `${req.params.id}.json`);
  if (!existsSync(filePath)) {
    return res.status(404).json({ error: 'Project not found' });
  }
  try {
    unlinkSync(filePath);
    return res.json({ message: 'Project deleted' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});
