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

export const GOOGLE_TILE_STYLES = {
  streets: {
    url: 'https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}',
    label: 'Streets',
  },
  satellite: {
    url: 'https://mt1.google.com/vt/lyrs=s,h&x={x}&y={y}&z={z}',
    label: 'Satellite',
  },
};
