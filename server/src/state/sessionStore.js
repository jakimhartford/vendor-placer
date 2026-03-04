// Per-user in-memory state: Map<userId, { vendors, spotsGeoJSON, lastPlacement }>
const sessions = new Map();

export function getSession(userId) {
  if (!sessions.has(userId)) {
    sessions.set(userId, {
      vendors: [],
      spotsGeoJSON: { type: 'FeatureCollection', features: [], metadata: {} },
      lastPlacement: null,
    });
  }
  return sessions.get(userId);
}

export function clearSession(userId) {
  sessions.delete(userId);
}
