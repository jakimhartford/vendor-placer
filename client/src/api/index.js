import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '',
});

// ---------- Vendors ----------

export function fetchVendors() {
  return api.get('/api/vendors').then((res) => res.data);
}

export function uploadVendors(csvData) {
  return api.post('/api/vendors/upload', { csvData }).then((res) => res.data);
}

export function clearVendors() {
  return api.delete('/api/vendors').then((res) => res.data);
}

// ---------- Spots ----------

export function fetchSpots() {
  return api.get('/api/spots').then((res) => res.data);
}

export function saveSpots(geojson) {
  return api.post('/api/spots', geojson).then((res) => res.data);
}

export function generateGrid(params) {
  return api.post('/api/spots/generate-grid', params).then((res) => res.data);
}

// ---------- Placements ----------

export function runPlacement() {
  return api.post('/api/placements/run').then((res) => res.data);
}

export function fetchPlacements() {
  return api.get('/api/placements').then((res) => res.data);
}

export default api;
