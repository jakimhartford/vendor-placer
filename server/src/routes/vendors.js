import { Router } from 'express';
import crypto from 'crypto';
import { readFileSync, readdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { parseVendorCsv } from '../services/csvService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const DATA_DIR = join(__dirname, '..', 'data');

export const vendorRoutes = Router();

// In-memory vendor store
let vendors = [];

/** Get the current vendors array (used by other modules) */
export function getVendors() {
  return vendors;
}

/** Replace vendors in-memory (used by projects) */
export function setVendors(v) {
  vendors = v;
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

    vendors = newVendors;

    return res.json({
      message: `Imported ${vendors.length} vendors`,
      count: vendors.length,
      vendors,
    });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
});

// GET /api/vendors — return all vendors
vendorRoutes.get('/', (_req, res) => {
  return res.json(vendors);
});

// DELETE /api/vendors — clear all vendors
vendorRoutes.delete('/', (_req, res) => {
  const count = vendors.length;
  vendors = [];
  return res.json({ message: `Cleared ${count} vendors` });
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
