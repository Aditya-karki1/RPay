const express        = require('express');
const Coupon         = require('../models/Coupon');
const User           = require('../models/User');
const AuditEvent     = require('../models/AuditEvent');
const requireAuth    = require('../middleware/auth');
const { burnCredits } = require('./credits');

const router = express.Router();

// Seed default coupons on first run
const SEED = [
  { code: 'SAVE5',    label: '5% Off',    description: '5% off on any order',                   type: 'percent', value: 5,   gcCost: 30,  minOrder: 0,    color: '#C8FF00', emoji: '⚡' },
  { code: 'FLAT150',  label: '₹150 Off',  description: 'Flat ₹150 off on orders above ₹999',   type: 'flat',    value: 150, gcCost: 80,  minOrder: 999,  color: '#48C479', emoji: '🎁' },
  { code: 'SAVE10',   label: '10% Off',   description: '10% off on orders above ₹2,000',        type: 'percent', value: 10,  gcCost: 120, minOrder: 2000, color: '#F59E0B', emoji: '🔥' },
  { code: 'FLAT300',  label: '₹300 Off',  description: 'Flat ₹300 off on orders above ₹2,500', type: 'flat',    value: 300, gcCost: 200, minOrder: 2500, color: '#A78BFA', emoji: '💜' },
  { code: 'PREMIUM15',label: '15% Off',   description: '15% off — max discount ₹500',           type: 'percent', value: 15,  gcCost: 300, minOrder: 500, maxDiscount: 500, color: '#FF6B6B', emoji: '👑' },
];

async function seedCoupons() {
  const count = await Coupon.countDocuments();
  if (count === 0) await Coupon.insertMany(SEED);
}
seedCoupons().catch(console.error);

// ── Customer routes ───────────────────────────────────────────

// GET /api/coupons — active coupons with user's unlock status
router.get('/', requireAuth, async (req, res) => {
  try {
    const [user, coupons] = await Promise.all([
      User.findById(req.user._id).select('greenCredits unlockedCoupons'),
      Coupon.find({ active: true }).sort({ gcCost: 1 }),
    ]);
    const gcBalance  = user.greenCredits || 0;
    const unlocked   = user.unlockedCoupons || [];

    res.json({
      gcBalance,
      coupons: coupons.map(c => ({
        code:        c.code,
        label:       c.label,
        description: c.description,
        type:        c.type,
        value:       c.value,
        gcCost:      c.gcCost,
        minOrder:    c.minOrder,
        maxDiscount: c.maxDiscount,
        color:       c.color,
        emoji:       c.emoji,
        isUnlocked:  unlocked.includes(c.code),
        canAfford:   gcBalance >= c.gcCost,
      })),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/coupons/unlock
router.post('/unlock', requireAuth, async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) return res.status(400).json({ error: 'code is required' });

    const coupon = await Coupon.findOne({ code: code.toUpperCase().trim(), active: true });
    if (!coupon) return res.status(404).json({ error: 'Coupon not found' });

    const user = await User.findById(req.user._id);
    if ((user.unlockedCoupons || []).includes(coupon.code)) {
      return res.status(400).json({ error: 'You already unlocked this coupon' });
    }
    if ((user.greenCredits || 0) < coupon.gcCost) {
      return res.status(400).json({ error: `Need ${coupon.gcCost} GC — you have ${user.greenCredits || 0} GC` });
    }

    await burnCredits(req.user._id, coupon.gcCost, `Unlocked coupon ${coupon.code}`, null);
    user.unlockedCoupons.push(coupon.code);
    await user.save();

    coupon.unlockCount = (coupon.unlockCount || 0) + 1;
    await coupon.save();

    const fresh = await User.findById(req.user._id).select('greenCredits');
    res.json({ success: true, code: coupon.code, label: coupon.label, gcSpent: coupon.gcCost, gcBalance: fresh.greenCredits });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/coupons/apply — validate an unlocked, unused coupon at checkout
router.post('/apply', requireAuth, async (req, res) => {
  try {
    const { code, amount } = req.body;
    if (!code || !amount) return res.status(400).json({ error: 'code and amount are required' });

    const coupon = await Coupon.findOne({ code: code.toUpperCase().trim(), active: true });
    if (!coupon) return res.status(404).json({ error: 'Invalid or inactive coupon code' });

    const user = await User.findById(req.user._id).select('unlockedCoupons usedCoupons');

    if (!(user.unlockedCoupons || []).includes(coupon.code)) {
      return res.status(403).json({ error: 'Unlock this coupon first using your Green Credits' });
    }
    if ((user.usedCoupons || []).includes(coupon.code)) {
      AuditEvent.create({
        type:   'FRAUD_ATTEMPT',
        userId: req.user._id,
        detail: `Attempted to reuse already-consumed coupon "${coupon.code}" — blocked`,
        meta:   { couponCode: coupon.code, orderAmount: amount },
      }).catch(() => {});
      return res.status(400).json({ error: 'You have already used this coupon' });
    }
    if (amount < (coupon.minOrder || 0)) {
      return res.status(400).json({ error: `Minimum order ₹${coupon.minOrder.toLocaleString('en-IN')} required` });
    }

    let discount = coupon.type === 'flat'
      ? coupon.value
      : Math.floor(amount * coupon.value / 100);
    if (coupon.maxDiscount) discount = Math.min(discount, coupon.maxDiscount);

    res.json({ valid: true, code: coupon.code, label: coupon.label, discount, finalAmount: Math.max(amount - discount, 1) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/coupons/consume — called by payment/verify after successful payment
// Marks the coupon as used so it cannot be applied again
router.post('/consume', requireAuth, async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) return res.json({ ok: true }); // no coupon — noop
    const user = await User.findById(req.user._id);
    if (!user.usedCoupons.includes(code)) {
      user.usedCoupons.push(code);
      await user.save();
    }
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Merchant routes ───────────────────────────────────────────

const jwt = require('jsonwebtoken');
const MERCHANT_SECRET = process.env.JWT_SECRET + '_merchant';
function requireMerchant(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const payload = jwt.verify(auth.slice(7), MERCHANT_SECRET);
    if (payload.role !== 'merchant') throw new Error();
    next();
  } catch {
    res.status(401).json({ error: 'Invalid merchant token' });
  }
}

// GET /api/coupons/merchant — all coupons (including inactive) with stats
router.get('/merchant', requireMerchant, async (req, res) => {
  try {
    const coupons = await Coupon.find().sort({ createdAt: -1 });
    res.json({ coupons });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/coupons/merchant — create a new coupon
router.post('/merchant', requireMerchant, async (req, res) => {
  try {
    const { code, label, description, type, value, gcCost, minOrder, maxDiscount, color, emoji } = req.body;
    if (!code || !label || !type || !value || !gcCost) {
      return res.status(400).json({ error: 'code, label, type, value and gcCost are required' });
    }
    const coupon = await Coupon.create({ code, label, description, type, value, gcCost, minOrder: minOrder || 0, maxDiscount: maxDiscount || null, color: color || '#C8FF00', emoji: emoji || '🎁' });
    res.status(201).json({ coupon });
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ error: 'Coupon code already exists' });
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/coupons/merchant/:code — update a coupon
router.patch('/merchant/:code', requireMerchant, async (req, res) => {
  try {
    const coupon = await Coupon.findOneAndUpdate(
      { code: req.params.code.toUpperCase() },
      { $set: req.body },
      { new: true }
    );
    if (!coupon) return res.status(404).json({ error: 'Coupon not found' });
    res.json({ coupon });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/coupons/merchant/:code — delete a coupon
router.delete('/merchant/:code', requireMerchant, async (req, res) => {
  try {
    const coupon = await Coupon.findOneAndDelete({ code: req.params.code.toUpperCase() });
    if (!coupon) return res.status(404).json({ error: 'Coupon not found' });
    res.json({ deleted: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = { router, burnCouponGC: async () => {} };
