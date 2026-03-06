import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { connectDB } from './db.js';
import { requireAuth } from './middleware/auth.js';
import { authRoutes } from './routes/auth.js';
import { vendorRoutes } from './routes/vendors.js';
import { spotRoutes } from './routes/spots.js';
import { placementRoutes } from './routes/placements.js';
import { eventRoutes } from './routes/events.js';
import { layoutRoutes } from './routes/layouts.js';
import { deadZoneRoutes } from './routes/deadZones.js';
import { shareRoutes } from './routes/share.js';
import { amenityRoutes } from './routes/amenities.js';
import { logisticsRoutes } from './routes/logistics.js';
import { checkinRoutes } from './routes/checkin.js';
import { mapZoneRoutes } from './routes/mapZones.js';
import { vendorPortalRoutes } from './routes/vendorPortal.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Public routes
app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));
app.use('/api/auth', authRoutes);
app.use('/api', shareRoutes);
app.use('/api/vendor-portal', vendorPortalRoutes);

// Protected routes
app.use('/api/events', requireAuth, eventRoutes);
app.use('/api/events/:eventId/layouts', requireAuth, layoutRoutes);
app.use('/api/vendors', requireAuth, vendorRoutes);
app.use('/api/spots', requireAuth, spotRoutes);
app.use('/api/placements', requireAuth, placementRoutes);
app.use('/api/dead-zones', requireAuth, deadZoneRoutes);
app.use('/api/amenities', requireAuth, amenityRoutes);
app.use('/api/logistics', requireAuth, logisticsRoutes);
app.use('/api/map-zones', requireAuth, mapZoneRoutes);
app.use('/api/events', checkinRoutes);
app.use('/api', vendorPortalRoutes);

async function start() {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

start();
