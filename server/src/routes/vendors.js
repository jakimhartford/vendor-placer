import { Router } from 'express';
import crypto from 'crypto';
import { readFileSync, readdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { parseVendorCsv } from '../services/csvService.js';
import { getSession } from '../state/sessionStore.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const DATA_DIR = join(__dirname, '..', 'data');

export const vendorRoutes = Router();

/** Get vendors for a user session (used by other modules) */
export function getVendors(userId) {
  return getSession(userId).vendors;
}

/** Replace vendors for a user session (used by projects) */
export function setVendors(userId, v) {
  getSession(userId).vendors = v;
}

// POST /api/vendors/upload — parse CSV and store vendors
vendorRoutes.post('/upload', (req, res) => {
  try {
    const { csvData } = req.body;
    if (!csvData || typeof csvData !== 'string') {
      return res.status(400).json({ error: 'Missing or invalid csvData string' });
    }

    const parsed = parseVendorCsv(csvData);

    // Assign UUIDs
    const newVendors = parsed.map((v) => ({
      id: crypto.randomUUID(),
      ...v,
    }));

    const session = getSession(req.user.id);
    session.vendors = newVendors;

    return res.json({
      message: `Imported ${session.vendors.length} vendors`,
      count: session.vendors.length,
      vendors: session.vendors,
    });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
});

// GET /api/vendors — return all vendors
vendorRoutes.get('/', (req, res) => {
  return res.json(getSession(req.user.id).vendors);
});

// DELETE /api/vendors — clear all vendors
vendorRoutes.delete('/', (req, res) => {
  const session = getSession(req.user.id);
  const count = session.vendors.length;
  session.vendors = [];
  return res.json({ message: `Cleared ${count} vendors` });
});

// PATCH /api/vendors/:id — update a vendor's fields
vendorRoutes.patch('/:id', (req, res) => {
  const session = getSession(req.user.id);
  const idx = session.vendors.findIndex((v) => v.id === req.params.id);
  if (idx === -1) {
    return res.status(404).json({ error: 'Vendor not found' });
  }
  const updates = req.body;
  // Only allow updating safe fields
  const allowed = ['bid', 'name', 'category', 'tier', 'premium', 'booths', 'exclusions', 'conflicts'];
  for (const key of Object.keys(updates)) {
    if (allowed.includes(key)) {
      session.vendors[idx][key] = updates[key];
    }
  }
  return res.json(session.vendors[idx]);
});

// GET /api/vendors/samples — list available sample CSVs
vendorRoutes.get('/samples', (_req, res) => {
  try {
    const files = readdirSync(DATA_DIR)
      .filter((f) => f.startsWith('vendors-') && f.endsWith('.csv'))
      .sort((a, b) => {
        const numA = parseInt(a.match(/\d+/)?.[0] || '0');
        const numB = parseInt(b.match(/\d+/)?.[0] || '0');
        return numA - numB;
      })
      .map((f) => {
        const count = f.match(/\d+/)?.[0] || '?';
        return { filename: f, label: `${count} vendors`, count: parseInt(count) };
      });
    return res.json(files);
  } catch {
    return res.json([]);
  }
});

// GET /api/vendors/samples/:filename — get sample CSV content
vendorRoutes.get('/samples/:filename', (req, res) => {
  const { filename } = req.params;
  if (!filename.match(/^vendors-\d+\.csv$/)) {
    return res.status(400).json({ error: 'Invalid filename' });
  }
  try {
    const content = readFileSync(join(DATA_DIR, filename), 'utf-8');
    return res.type('text/csv').send(content);
  } catch {
    return res.status(404).json({ error: 'Sample not found' });
  }
});
