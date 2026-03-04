import { Router } from 'express';
import crypto from 'crypto';
import { parseVendorCsv } from '../services/csvService.js';

export const vendorRoutes = Router();

// In-memory vendor store
let vendors = [];

/** Get the current vendors array (used by other modules) */
export function getVendors() {
  return vendors;
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
