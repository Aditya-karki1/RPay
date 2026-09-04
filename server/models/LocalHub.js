const mongoose = require('mongoose');

const localHubSchema = new mongoose.Schema({
  name:    { type: String, required: true },
  area:    { type: String, required: true },
  city:    { type: String, required: true },
  address: { type: String, required: true },
  lat:     { type: Number, default: null },
  lng:     { type: Number, default: null },
  active:  { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('LocalHub', localHubSchema);
