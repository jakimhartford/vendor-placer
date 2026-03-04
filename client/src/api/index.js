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

export function fetchSampleList() {
  return api.get('/api/vendors/samples').then((res) => res.data);
}

export function fetchSampleCsv(filename) {
  return api.get(`/api/vendors/samples/${filename}`, { responseType: 'text', transformResponse: [(data) => data] }).then((res) => res.data);
}

// ---------- Spots ----------

export function fetchSpots() {
  return api.get('/api/spots').then((res) => res.data);
}

export function saveSpots(geojson) {
  return api.put('/api/spots', geojson).then((res) => res.data);
}

export function clearSpots() {
  return api.delete('/api/spots').then((res) => res.data);
}

export function generateGrid(params) {
  return api.post('/api/spots/generate-grid', params).then((res) => res.data);
}

export function generateFromPath(params) {
  return api.post('/api/spots/generate-from-path', params).then((res) => res.data);
}

export function addSingleSpot(params) {
  return api.post('/api/spots/add-single', params).then((res) => res.data);
}

// ---------- Placements ----------

export function runPlacement() {
  return api.post('/api/placements/run').then((res) => res.data);
}

export function fetchPlacements() {
  return api.get('/api/placements').then((res) => res.data);
}

// ---------- Projects ----------

export function fetchProjects() {
  return api.get('/api/projects').then((res) => res.data);
}

export function fetchProject(id) {
  return api.get(`/api/projects/${id}`).then((res) => res.data);
}

export function createProject(data) {
  return api.post('/api/projects', data).then((res) => res.data);
}

export function updateProject(id, data) {
  return api.put(`/api/projects/${id}`, data).then((res) => res.data);
}

export function deleteProject(id) {
  return api.delete(`/api/projects/${id}`).then((res) => res.data);
}

export default api;
