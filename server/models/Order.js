const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
  productId: String,
  name:      String,
  brand:     String,
  price:     Number,
  qty:       Number,
  img:       String,
}, { _id: false });

const orderSchema = new mongoose.Schema({
  user:               { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  orderRef:           { type: String, required: true },
  items:              [itemSchema],
  total:              { type: Number, required: true },
  status:             { type: String, default: 'Confirmed', enum: ['Confirmed', 'Processing', 'Shipped', 'Delivered', 'Cancelled'] },
  returnStatus:         { type: String, default: null, enum: [null, 'Requested', 'AI-Approved', 'Approved', 'Rejected'] },
  returnRequestedAt:    { type: Date, default: null },
  returnAutoApprovedAt: { type: Date, default: null },
  returnResolvedAt:     { type: Date, default: null },
  returnRiskScore:      { type: Number, default: null },     // 0–100
  returnRiskDecision:   { type: String, default: null },     // 'auto-approve' | 'manual-review'
  returnRiskFactors:    { type: [String], default: [] },
  returnImg:            { type: String, default: null },     // base64 photo from customer scan
  returnGrade:          { type: String, default: null },     // 'A' | 'B' | 'C'
  returnGradeLabel:     { type: String, default: null },     // e.g. 'Grade A – Like New'
  returnGradeScore:     { type: Number, default: null },     // 0–100 AI condition score
  agentPurchase:      { type: Boolean, default: false },
  agentId:            { type: String, default: null },
  couponCode:         { type: String, default: null },
  discountApplied:    { type: Number, default: 0 },
  originalTotal:      { type: Number, default: null },
  paymentId:          { type: String, default: null },
  razorpayOrderId:    { type: String, default: null },
  paymentStatus:      { type: String, default: 'Pending', enum: ['Pending', 'Paid', 'Failed'] },
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);
