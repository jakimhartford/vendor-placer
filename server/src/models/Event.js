import mongoose from 'mongoose';

const eventSchema = new mongoose.Schema({
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  name: {
    type: String,
    required: true,
    default: 'Untitled Event',
  },
  vendors: {
    type: [Object],
    default: [],
  },
  vendorPortal: {
    enabled: { type: Boolean, default: false },
    inviteToken: { type: String, default: null },
    maxSpotChoices: { type: Number, default: 3 },
    signupDeadline: { type: Date, default: null },
    instructions: { type: String, default: '' },
    requirePayment: { type: Boolean, default: false },
  },
  checkIns: {
    type: Map,
    of: Object,
    default: {},
  },
  settings: {
    noSameAdjacentCategories: { type: [String], default: ['art', 'craft', 'jewelry', 'clothing'] },
    pricingConfig: { type: Object, default: null },
  },
  activeLayoutId: {
    type: mongoose.Schema.Types.ObjectId,
    default: null,
  },
}, {
  timestamps: true,
});

export default mongoose.model('Event', eventSchema);
