import { Router } from 'express';
import crypto from 'crypto';
import { getSession } from '../state/sessionStore.js';
import { requireAuth } from '../middleware/auth.js';
import { recalculateScores } from '../utils/spotScoring.js';

export const logisticsRoutes = Router();

// GET /api/logistics — get access points + time windows
logisticsRoutes.get('/', requireAuth, (req, res) => {
  const session = getSession(req.user.id);
  return res.json({
    accessPoints: session.accessPoints,
    timeWindows: session.timeWindows,
  });
});

// POST /api/logistics/access-points
logisticsRoutes.post('/access-points', requireAuth, (req, res) => {
  const { lat, lng, label, notes } = req.body;
  if (lat == null || lng == null) {
    return res.status(400).json({ error: 'lat and lng are required' });
  }
  const session = getSession(req.user.id);
  const ap = { id: crypto.randomUUID(), lat, lng, label: label || 'Access Point', notes: notes || '' };
  session.accessPoints.push(ap);
  recalculateScores(session);
  return res.json(ap);
});

// DELETE /api/logistics/access-points/:id
logisticsRoutes.delete('/access-points/:id', requireAuth, (req, res) => {
  const session = getSession(req.user.id);
  const idx = session.accessPoints.findIndex((a) => a.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Access point not found' });
  session.accessPoints.splice(idx, 1);
  recalculateScores(session);
  return res.json({ message: 'Access point deleted', accessPoints: session.accessPoints });
});

// POST /api/logistics/time-windows
logisticsRoutes.post('/time-windows', requireAuth, (req, res) => {
  const { area, start, end } = req.body;
  if (!area || !start || !end) {
    return res.status(400).json({ error: 'area, start, and end are required' });
  }
  const session = getSession(req.user.id);
  const tw = { id: crypto.randomUUID(), area, start, end };
  session.timeWindows.push(tw);
  return res.json(tw);
});

// DELETE /api/logistics/time-windows/:id
logisticsRoutes.delete('/time-windows/:id', requireAuth, (req, res) => {
  const session = getSession(req.user.id);
  const idx = session.timeWindows.findIndex((tw) => tw.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Time window not found' });
  session.timeWindows.splice(idx, 1);
  return res.json({ message: 'Time window deleted', timeWindows: session.timeWindows });
});
