import mongoose from 'mongoose';

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
}, {
  timestamps: true,
});

export default mongoose.model('Project', projectSchema);
