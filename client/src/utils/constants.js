export const MAP_CENTER = [29.2108, -81.0243];
export const DEFAULT_ZOOM = 20;
export const DEFAULT_SPACING_FT = 4;

export const CATEGORIES = [
  'food',
  'art',
  'craft',
  'jewelry',
  'clothing',
  'services',
  'other',
];

export const TIERS = ['platinum', 'gold', 'silver', 'bronze'];

/** Spot size in meters (12 feet) */
export const SPOT_SIZE_METERS = 3.66;

export const MAP_TILE_STYLES = {
  satellite: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: '&copy; Esri, Maxar, Earthstar Geographics',
    label: 'Satellite',
  },
  hybrid: {
    url: 'https://mt1.google.com/vt/lyrs=s,h&x={x}&y={y}&z={z}',
    attribution: '&copy; Google Maps',
    label: 'Hybrid',
  },
  streets: {
    url: 'https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}',
    attribution: '&copy; Google Maps',
    label: 'Streets',
  },
};
