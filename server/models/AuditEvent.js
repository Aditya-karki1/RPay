const mongoose = require('mongoose');

const auditEventSchema = new mongoose.Schema({
  type:    { type: String, required: true },
  userId:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  detail:  { type: String, default: '' },
  meta:    { type: Object, default: {} },
}, { timestamps: true });

module.exports = mongoose.model('AuditEvent', auditEventSchema);
