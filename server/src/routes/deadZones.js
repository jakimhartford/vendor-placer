import { Router } from 'express';
import crypto from 'crypto';
import { getSession } from '../state/sessionStore.js';
import { spotOverlapsDeadZone } from '../utils/geometry.js';

export const deadZoneRoutes = Router();

// GET /api/dead-zones
deadZoneRoutes.get('/', (req, res) => {
  return res.json(getSession(req.user.id).deadZones);
});

// POST /api/dead-zones — create a dead zone and remove overlapping spots
deadZoneRoutes.post('/', (req, res) => {
  const { polygon } = req.body; // [[lat, lng], ...]
  if (!Array.isArray(polygon) || polygon.length < 3) {
    return res.status(400).json({ error: 'polygon must be an array of at least 3 [lat, lng] points' });
  }

  const session = getSession(req.user.id);
  const deadZone = { id: crypto.randomUUID(), polygon };
  session.deadZones.push(deadZone);

  // Remove any existing spots that fall inside this dead zone
  const before = session.spotsGeoJSON.features.length;
  session.spotsGeoJSON = {
    ...session.spotsGeoJSON,
    features: session.spotsGeoJSON.features.filter(
      (f) => !spotOverlapsDeadZone(f, [deadZone])
    ),
  };
  const removed = before - session.spotsGeoJSON.features.length;

  return res.json({
    deadZone,
    removedSpots: removed,
    spotsGeoJSON: session.spotsGeoJSON,
    deadZones: session.deadZones,
  });
});

// DELETE /api/dead-zones/:id
deadZoneRoutes.delete('/:id', (req, res) => {
  const session = getSession(req.user.id);
  const idx = session.deadZones.findIndex((dz) => dz.id === req.params.id);
  if (idx === -1) {
    return res.status(404).json({ error: 'Dead zone not found' });
  }
  session.deadZones.splice(idx, 1);
  return res.json({ message: 'Dead zone deleted', deadZones: session.deadZones });
});

// DELETE /api/dead-zones — clear all
deadZoneRoutes.delete('/', (req, res) => {
  const session = getSession(req.user.id);
  session.deadZones = [];
  return res.json({ message: 'All dead zones cleared', deadZones: [] });
});
