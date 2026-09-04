const express       = require('express');
const User          = require('../models/User');
const CreditLedger  = require('../models/CreditLedger');
const requireAuth   = require('../middleware/auth');

const router = express.Router();

// Max Green Credits redeemable per order: 20% of order value
const MAX_REDEEM_RATIO = 0.20;
// Earn rate: 5 GC per ₹100 spent
const EARN_RATE = 5 / 100;
// First-purchase bonus
const FIRST_PURCHASE_BONUS = 50;

// Exported helper used by payment route
async function awardCredits(userId, amount, reason, orderId = null) {
  const user = await User.findById(userId);
  if (!user) return;
  const earned = Math.floor(amount * EARN_RATE);
  if (earned <= 0) return;
  user.greenCredits = (user.greenCredits || 0) + earned;
  await user.save();
  await CreditLedger.create({
    user:    userId,
    type:    'earn',
    amount:  earned,
    reason,
    orderId,
    balance: user.greenCredits,
  });
  return earned;
}

async function awardBonus(userId, bonus, reason, orderId = null) {
  const user = await User.findById(userId);
  if (!user) return;
  user.greenCredits = (user.greenCredits || 0) + bonus;
  await user.save();
  await CreditLedger.create({
    user:    userId,
    type:    'earn',
    amount:  bonus,
    reason,
    orderId,
    balance: user.greenCredits,
  });
  return bonus;
}

async function burnCredits(userId, amount, reason, orderId = null) {
  const user = await User.findById(userId);
  if (!user) throw new Error('User not found');
  if ((user.greenCredits || 0) < amount) throw new Error('Insufficient Green Credits');
  user.greenCredits -= amount;
  await user.save();
  await CreditLedger.create({
    user:    userId,
    type:    'burn',
    amount,
    reason,
    orderId,
    balance: user.greenCredits,
  });
  return user.greenCredits;
}

// GET /api/credits/balance
router.get('/balance', requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('greenCredits');
    res.json({ greenCredits: user.greenCredits || 0 });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/credits/history
router.get('/history', requireAuth, async (req, res) => {
  try {
    const ledger = await CreditLedger.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(50);
    res.json({ ledger });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/credits/preview
// Given an order amount, returns how many GC the user can apply (bounded)
router.post('/preview', requireAuth, async (req, res) => {
  try {
    const { amount } = req.body;
    if (!amount || amount <= 0) return res.status(400).json({ error: 'Invalid amount' });

    const user = await User.findById(req.user._id).select('greenCredits');
    const available = user.greenCredits || 0;
    const maxApplicable = Math.floor(amount * MAX_REDEEM_RATIO);
    const creditsToApply = Math.min(available, maxApplicable);
    const finalAmount = amount - creditsToApply;

    res.json({
      available,
      maxApplicable,
      creditsToApply,
      finalAmount,
      savings: creditsToApply,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = { router, awardCredits, awardBonus, burnCredits, FIRST_PURCHASE_BONUS, EARN_RATE, MAX_REDEEM_RATIO };
