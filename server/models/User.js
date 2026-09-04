const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name:         { type: String, required: true, trim: true },
  email:        { type: String, required: true, unique: true, lowercase: true, trim: true },
  password:     { type: String, required: true, minlength: 6 },
  avatar:       { type: String, default: null },
  greenCredits:    { type: Number, default: 0, min: 0 },
  unlockedCoupons: { type: [String], default: [] },
  usedCoupons:     { type: [String], default: [] },
}, { timestamps: true });

userSchema.pre('save', async function() {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 10);
});

userSchema.methods.comparePassword = function(plain) {
  return bcrypt.compare(plain, this.password);
};

userSchema.methods.toSafeObject = function() {
  const { _id, name, email, avatar, greenCredits, createdAt } = this;
  return { id: _id, name, email, avatar, greenCredits: greenCredits ?? 0, createdAt };
};

module.exports = mongoose.model('User', userSchema);
