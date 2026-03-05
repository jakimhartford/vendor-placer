import mongoose from 'mongoose';

const versionSchema = new mongoose.Schema({
  name: { type: String, default: 'Untitled Version' },
  spotsGeoJSON: Object,
  vendors: [Object],
  placements: Object,
  deadZones: mongoose.Schema.Types.Mixed,
  paths: mongoose.Schema.Types.Mixed,
  settings: {
    noSameAdjacentCategories: { type: [String], default: ['art', 'craft', 'jewelry', 'clothing'] },
  },
  createdAt: { type: Date, default: Date.now },
}, { _id: true });

const projectSchema = new mongoose.Schema({
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  name: {
    type: String,
    required: true,
    default: 'Untitled Project',
  },
  spotsGeoJSON: {
    type: Object,
    default: { type: 'FeatureCollection', features: [], metadata: {} },
  },
  vendors: {
    type: [Object],
    default: [],
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
  versions: [versionSchema],
  activeVersionId: {
    type: mongoose.Schema.Types.ObjectId,
    default: null,
  },
  settings: {
    noSameAdjacentCategories: { type: [String], default: ['art', 'craft', 'jewelry', 'clothing'] },
  },
}, {
  timestamps: true,
});

export default mongoose.model('Project', projectSchema);
