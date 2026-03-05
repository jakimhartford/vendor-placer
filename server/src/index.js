import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { connectDB } from './db.js';
import { requireAuth } from './middleware/auth.js';
import { authRoutes } from './routes/auth.js';
import { vendorRoutes } from './routes/vendors.js';
import { spotRoutes } from './routes/spots.js';
import { placementRoutes } from './routes/placements.js';
import { projectRoutes } from './routes/projects.js';
import { deadZoneRoutes } from './routes/deadZones.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Public routes
app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));
app.use('/api/auth', authRoutes);

// Protected routes
app.use('/api/vendors', requireAuth, vendorRoutes);
app.use('/api/spots', requireAuth, spotRoutes);
app.use('/api/placements', requireAuth, placementRoutes);
app.use('/api/projects', requireAuth, projectRoutes);
app.use('/api/dead-zones', requireAuth, deadZoneRoutes);

async function start() {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

start();
