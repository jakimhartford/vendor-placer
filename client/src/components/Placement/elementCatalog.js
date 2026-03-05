export const ELEMENT_GROUPS = [
  { id: 'amenities', label: 'Amenities & Access' },
  { id: 'zones', label: 'Zones' },
  { id: 'infrastructure', label: 'Infrastructure' },
];

export const ELEMENT_CATALOG = [
  // Amenities & Access
  { id: 'power', group: 'amenities', mode: 'point', icon: '⚡', color: '#facc15', label: 'Power', amenityType: 'power' },
  { id: 'water', group: 'amenities', mode: 'point', icon: '💧', color: '#38bdf8', label: 'Water', amenityType: 'water' },
  { id: 'restroom', group: 'amenities', mode: 'point', icon: '🚻', color: '#a78bfa', label: 'Restroom', amenityType: 'restroom' },
  { id: 'trash', group: 'amenities', mode: 'point', icon: '🗑️', color: '#94a3b8', label: 'Trash', amenityType: 'trash' },
  { id: 'info_booth', group: 'amenities', mode: 'point', icon: 'ℹ️', color: '#60a5fa', label: 'Info Booth', amenityType: 'info_booth' },
  { id: 'stage', group: 'amenities', mode: 'point', icon: '🎤', color: '#f472b6', label: 'Stage', amenityType: 'stage' },
  { id: 'sponsor', group: 'amenities', mode: 'point', icon: '🏷️', color: '#fb923c', label: 'Sponsor', amenityType: 'sponsor' },
  { id: 'access_point', group: 'amenities', mode: 'point', icon: '🚪', color: '#34d399', label: 'Access Pt' },

  // Zones
  { id: 'dead_zone', group: 'zones', mode: 'zone', icon: '⛔', color: '#dc2626', label: 'Dead Zone' },

  // Infrastructure
  { id: 'barricade', group: 'infrastructure', mode: 'zone', icon: '🚧', color: '#f97316', label: 'Barricade', zoneType: 'barricade' },
  { id: 'loading', group: 'infrastructure', mode: 'zone', icon: '🚛', color: '#a3e635', label: 'Loading', zoneType: 'loading' },
  { id: 'accessible', group: 'infrastructure', mode: 'zone', icon: '♿', color: '#22d3ee', label: 'Accessible', zoneType: 'accessible' },
  { id: 'sightline', group: 'infrastructure', mode: 'zone', icon: '👁️', color: '#e879f9', label: 'Sight Line', zoneType: 'sightline' },
];
