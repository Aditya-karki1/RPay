const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
  code:        { type: String, required: true, unique: true, uppercase: true, trim: true },
  label:       { type: String, required: true },
  description: { type: String, required: true },
  type:        { type: String, required: true, enum: ['percent', 'flat'] },
  value:       { type: Number, required: true },
  gcCost:      { type: Number, required: true, min: 1 },
  minOrder:    { type: Number, default: 0 },
  maxDiscount: { type: Number, default: null },
  color:       { type: String, default: '#C8FF00' },
  emoji:       { type: String, default: '🎁' },
  active:      { type: Boolean, default: true },
  unlockCount: { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model('Coupon', couponSchema);
