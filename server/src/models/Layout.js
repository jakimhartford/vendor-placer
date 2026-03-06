import mongoose from 'mongoose';

const layoutSchema = new mongoose.Schema({
  event: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true,
    index: true,
  },
  name: {
    type: String,
    required: true,
    default: 'Untitled Layout',
  },
  spotsGeoJSON: {
    type: Object,
    default: { type: 'FeatureCollection', features: [], metadata: {} },
  },
  placements: {
    type: Object,
    default: null,
  },
  deadZones: {
    type: mongoose.Schema.Types.Mixed,
    default: [],
  },
  paths: {
    type: mongoose.Schema.Types.Mixed,
    default: [],
  },
  mapCenter: {
    type: [Number],
    default: null,
  },
  zoom: {
    type: Number,
    default: null,
  },
  amenities: {
    type: [Object],
    default: [],
  },
  accessPoints: {
    type: [Object],
    default: [],
  },
  timeWindows: {
    type: [Object],
    default: [],
  },
  mapZones: {
    type: [Object],
    default: [],
  },
}, {
  timestamps: true,
});

export default mongoose.model('Layout', layoutSchema);
