const mongoose = require('mongoose');

const campaignSchema = new mongoose.Schema({
  name:                { type: String, required: true },
  goal:                { type: String, required: true },
  targetCategory:      { type: String, default: null },
  targetBadge:         { type: String, default: null },
  discountPercent:     { type: Number, default: 0 },
  predictedRevenueLift: { type: String, default: '' },
  reasoning:           { type: String, default: '' },
  status:              { type: String, default: 'Draft', enum: ['Draft', 'Active', 'Ended'] },
  activatedAt:         { type: Date, default: null },
  endedAt:             { type: Date, default: null },
  affectedProductIds:  { type: [String], default: [] },
}, { timestamps: true });

module.exports = mongoose.model('Campaign', campaignSchema);
