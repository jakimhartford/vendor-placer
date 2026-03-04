import express from 'express';
import cors from 'cors';
import { vendorRoutes } from './routes/vendors.js';
import { spotRoutes } from './routes/spots.js';
import { placementRoutes } from './routes/placements.js';
import { projectRoutes } from './routes/projects.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

app.use('/api/vendors', vendorRoutes);
app.use('/api/spots', spotRoutes);
app.use('/api/placements', placementRoutes);
app.use('/api/projects', projectRoutes);

app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
