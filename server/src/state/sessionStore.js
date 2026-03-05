// Per-user in-memory state: Map<userId, { vendors, spotsGeoJSON, lastPlacement }>
const sessions = new Map();

export function getSession(userId) {
  if (!sessions.has(userId)) {
    sessions.set(userId, {
      vendors: [],
      spotsGeoJSON: { type: 'FeatureCollection', features: [], metadata: {} },
      lastPlacement: null,
      deadZones: [], // array of { id, polygon: [[lat, lng], ...] }
      amenities: [], // array of { id, type, lat, lng, notes }
      accessPoints: [], // array of { id, lat, lng, label, notes }
      timeWindows: [], // array of { id, area, start, end }
      mapZones: [], // array of { id, type, polygon, label, notes }
    });
  }
  return sessions.get(userId);
}

export function clearSession(userId) {
  sessions.delete(userId);
}
