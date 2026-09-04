const mongoose = require('mongoose');

const hubInventorySchema = new mongoose.Schema({
  hub:          { type: mongoose.Schema.Types.ObjectId, ref: 'LocalHub', required: true },
  order:        { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
  productId:    { type: String, default: null },
  productName:  { type: String, required: true },
  productBrand: { type: String, default: '' },
  originalPrice:{ type: Number, default: 0 },
  hubPrice:     { type: Number, default: 0 },  // 95% of original — slight discount for re-sale
  img:          { type: String, default: '' },
  condition:    { type: String, default: 'Like New' },
  status:       { type: String, default: 'available', enum: ['available', 'sold'] },
  soldAt:       { type: Date, default: null },
}, { timestamps: true });

module.exports = mongoose.model('HubInventory', hubInventorySchema);
