const mongoose = require('mongoose');

const creditLedgerSchema = new mongoose.Schema({
  user:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type:    { type: String, required: true, enum: ['earn', 'burn'] },
  amount:  { type: Number, required: true },
  reason:  { type: String, required: true },
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', default: null },
  balance: { type: Number, required: true }, // balance AFTER this transaction
}, { timestamps: true });

module.exports = mongoose.model('CreditLedger', creditLedgerSchema);
