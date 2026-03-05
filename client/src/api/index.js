import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '',
});

// Request interceptor: attach JWT token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor: handle 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      if (window.location.pathname !== '/login' && window.location.pathname !== '/signup') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// ---------- Auth ----------

export function authLogin(email, password) {
  return api.post('/api/auth/login', { email, password }).then((res) => res.data);
}

export function authSignup(email, password, name) {
  return api.post('/api/auth/signup', { email, password, name }).then((res) => res.data);
}

export function authMe() {
  return api.get('/api/auth/me').then((res) => res.data);
}

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

export function updateSpot(id, props) {
  return api.patch(`/api/spots/${id}`, props).then((res) => res.data);
}

export function deleteSpot(id) {
  return api.delete(`/api/spots/${id}`).then((res) => res.data);
}

export function deleteSpotsBatch(ids) {
  return api.post('/api/spots/delete-batch', { ids }).then((res) => res.data);
}

export function updateSpotsBatch(ids, updates) {
  return api.post('/api/spots/update-batch', { ids, updates }).then((res) => res.data);
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

// ---------- Dead Zones ----------

export function fetchDeadZones() {
  return api.get('/api/dead-zones').then((res) => res.data);
}

export function createDeadZone(polygon) {
  return api.post('/api/dead-zones', { polygon }).then((res) => res.data);
}

export function deleteDeadZone(id) {
  return api.delete(`/api/dead-zones/${id}`).then((res) => res.data);
}

export function clearDeadZones() {
  return api.delete('/api/dead-zones').then((res) => res.data);
}

export default api;
