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

export function updateVendor(id, updates) {
  return api.patch(`/api/vendors/${id}`, updates).then((res) => res.data);
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

export function runPlacement(settings) {
  return api.post('/api/placements/run', settings || {}).then((res) => res.data);
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

// ---------- Versions ----------

export function fetchVersions(projectId) {
  return api.get(`/api/projects/${projectId}/versions`).then((res) => res.data);
}

export function createVersion(projectId, name) {
  return api.post(`/api/projects/${projectId}/versions`, { name }).then((res) => res.data);
}

export function loadVersion(projectId, versionId) {
  return api.post(`/api/projects/${projectId}/versions/${versionId}/load`).then((res) => res.data);
}

// ---------- Share Links ----------

export function generateShareLink(projectId, vendorId) {
  return api.post(`/api/projects/${projectId}/share-link`, { vendorId }).then((res) => res.data);
}

export function fetchShareData(token) {
  return axios.get(`${api.defaults.baseURL || ''}/api/share/${token}`).then((res) => res.data);
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

export function updateDeadZone(id, data) {
  return api.patch(`/api/dead-zones/${id}`, data).then((res) => res.data);
}

export function clearDeadZones() {
  return api.delete('/api/dead-zones').then((res) => res.data);
}

// ---------- Map Zones ----------

export function fetchMapZones() {
  return api.get('/api/map-zones').then((res) => res.data);
}

export function createMapZone(data) {
  return api.post('/api/map-zones', data).then((res) => res.data);
}

export function updateMapZone(id, data) {
  return api.patch(`/api/map-zones/${id}`, data).then((res) => res.data);
}

export function deleteMapZone(id) {
  return api.delete(`/api/map-zones/${id}`).then((res) => res.data);
}

export function clearMapZones() {
  return api.delete('/api/map-zones').then((res) => res.data);
}

// ---------- Amenities ----------

export function fetchAmenities() {
  return api.get('/api/amenities').then((res) => res.data);
}

export function createAmenity(data) {
  return api.post('/api/amenities', data).then((res) => res.data);
}

export function updateAmenity(id, data) {
  return api.patch(`/api/amenities/${id}`, data).then((res) => res.data);
}

export function deleteAmenity(id) {
  return api.delete(`/api/amenities/${id}`).then((res) => res.data);
}

export function clearAmenities() {
  return api.delete('/api/amenities').then((res) => res.data);
}

// ---------- Logistics ----------

export function fetchLogistics() {
  return api.get('/api/logistics').then((res) => res.data);
}

export function createAccessPoint(data) {
  return api.post('/api/logistics/access-points', data).then((res) => res.data);
}

export function deleteAccessPoint(id) {
  return api.delete(`/api/logistics/access-points/${id}`).then((res) => res.data);
}

export function createTimeWindow(data) {
  return api.post('/api/logistics/time-windows', data).then((res) => res.data);
}

export function deleteTimeWindow(id) {
  return api.delete(`/api/logistics/time-windows/${id}`).then((res) => res.data);
}

// ---------- Check-In ----------

export function fetchCheckInData(projectId) {
  return api.get(`/api/projects/${projectId}/checkin`).then((res) => res.data);
}

export function updateCheckIn(projectId, vendorId, data) {
  return api.patch(`/api/projects/${projectId}/checkin/${vendorId}`, data).then((res) => res.data);
}

export function fetchCheckInSummary(projectId) {
  return api.get(`/api/projects/${projectId}/checkin/summary`).then((res) => res.data);
}

export default api;
