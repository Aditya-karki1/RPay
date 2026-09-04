const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name:          { type: String, required: true, trim: true },
  brand:         { type: String, required: true, trim: true },
  price:         { type: Number, required: true },
  originalPrice: { type: Number, default: null },
  category:      { type: String, default: 'Fashion' },
  img:           { type: String, default: null },
  badge:         { type: String, default: 'NEW', enum: ['NEW', 'SALE', 'HOT', 'LIMITED'] },
  description:   { type: String, default: '' },
  stock:         { type: Number, default: 100 },
  active:        { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);
