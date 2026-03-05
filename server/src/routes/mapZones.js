import { Router } from 'express';
import crypto from 'crypto';
import { getSession } from '../state/sessionStore.js';

export const mapZoneRoutes = Router();

// GET /api/map-zones
mapZoneRoutes.get('/', (req, res) => {
  return res.json(getSession(req.user.id).mapZones);
});

// POST /api/map-zones
mapZoneRoutes.post('/', (req, res) => {
  const { type, polygon, label, notes } = req.body;
  if (!Array.isArray(polygon) || polygon.length < 3) {
    return res.status(400).json({ error: 'polygon must be an array of at least 3 [lat, lng] points' });
  }

  const session = getSession(req.user.id);
  const zone = { id: crypto.randomUUID(), type: type || 'barricade', polygon, label: label || null, notes: notes || null };
  session.mapZones.push(zone);

  return res.json({ mapZone: zone, mapZones: session.mapZones });
});

// PATCH /api/map-zones/:id
mapZoneRoutes.patch('/:id', (req, res) => {
  const session = getSession(req.user.id);
  const idx = session.mapZones.findIndex((z) => z.id === req.params.id);
  if (idx === -1) {
    return res.status(404).json({ error: 'Map zone not found' });
  }

  const { polygon, type, label, notes } = req.body;
  if (polygon) {
    if (!Array.isArray(polygon) || polygon.length < 3) {
      return res.status(400).json({ error: 'polygon must be an array of at least 3 [lat, lng] points' });
    }
    session.mapZones[idx].polygon = polygon;
  }
  if (type !== undefined) session.mapZones[idx].type = type;
  if (label !== undefined) session.mapZones[idx].label = label;
  if (notes !== undefined) session.mapZones[idx].notes = notes;

  return res.json({ mapZone: session.mapZones[idx], mapZones: session.mapZones });
});

// DELETE /api/map-zones/:id
mapZoneRoutes.delete('/:id', (req, res) => {
  const session = getSession(req.user.id);
  const idx = session.mapZones.findIndex((z) => z.id === req.params.id);
  if (idx === -1) {
    return res.status(404).json({ error: 'Map zone not found' });
  }
  session.mapZones.splice(idx, 1);
  return res.json({ message: 'Map zone deleted', mapZones: session.mapZones });
});

// DELETE /api/map-zones — clear all
mapZoneRoutes.delete('/', (req, res) => {
  const session = getSession(req.user.id);
  session.mapZones = [];
  return res.json({ message: 'All map zones cleared', mapZones: [] });
});
