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
  startDate: { type: Date, default: null },
  endDate: { type: Date, default: null },
  location: { type: String, default: '' },
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
  infoSections: {
    type: [{
      key: String,
      title: String,
      content: { type: String, default: '' },
    }],
    default: [
      { key: 'eventInfo', title: 'Event Information', content: '' },
      { key: 'generalInfo', title: 'General Information', content: '' },
      { key: 'boothInfo', title: 'Booth Information', content: '' },
      { key: 'rulesRegulations', title: 'Rules & Regulations', content: '' },
      { key: 'refundPolicy', title: 'Refund Policy', content: '' },
      { key: 'juryDetails', title: 'Jury Details', content: '' },
    ],
  },
  activeLayoutId: {
    type: mongoose.Schema.Types.ObjectId,
    default: null,
  },
}, {
  timestamps: true,
});

export default mongoose.model('Event', eventSchema);
