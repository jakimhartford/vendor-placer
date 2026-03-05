import { Router } from 'express';
import crypto from 'crypto';
import { getSession } from '../state/sessionStore.js';

export const amenityRoutes = Router();

// GET /api/amenities
amenityRoutes.get('/', (req, res) => {
  return res.json(getSession(req.user.id).amenities);
});

// POST /api/amenities
amenityRoutes.post('/', (req, res) => {
  const { type, lat, lng, notes } = req.body;
  if (!type || lat == null || lng == null) {
    return res.status(400).json({ error: 'type, lat, and lng are required' });
  }
  const session = getSession(req.user.id);
  const amenity = { id: crypto.randomUUID(), type, lat, lng, notes: notes || '' };
  session.amenities.push(amenity);
  return res.json(amenity);
});

// PATCH /api/amenities/:id
amenityRoutes.patch('/:id', (req, res) => {
  const session = getSession(req.user.id);
  const idx = session.amenities.findIndex((a) => a.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Amenity not found' });

  const { type, lat, lng, notes } = req.body;
  if (type) session.amenities[idx].type = type;
  if (lat != null) session.amenities[idx].lat = lat;
  if (lng != null) session.amenities[idx].lng = lng;
  if (notes !== undefined) session.amenities[idx].notes = notes;

  return res.json(session.amenities[idx]);
});

// DELETE /api/amenities/:id
amenityRoutes.delete('/:id', (req, res) => {
  const session = getSession(req.user.id);
  const idx = session.amenities.findIndex((a) => a.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Amenity not found' });
  session.amenities.splice(idx, 1);
  return res.json({ message: 'Amenity deleted', amenities: session.amenities });
});

// DELETE /api/amenities — clear all
amenityRoutes.delete('/', (req, res) => {
  const session = getSession(req.user.id);
  session.amenities = [];
  return res.json({ message: 'All amenities cleared', amenities: [] });
});
