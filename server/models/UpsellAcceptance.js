const mongoose = require('mongoose');

const upsellSchema = new mongoose.Schema({
  user:           { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  productId:      String,
  productName:    String,
  productBrand:   String,
  price:          Number,
  triggerProduct: String, // the item that was added first, triggering the upsell
}, { timestamps: true });

module.exports = mongoose.model('UpsellAcceptance', upsellSchema);
