const express     = require('express');
const crypto      = require('crypto');
const Razorpay    = require('razorpay');
const Order       = require('../models/Order');
const User        = require('../models/User');
const requireAuth = require('../middleware/auth');
const { awardCredits, awardBonus, burnCredits, FIRST_PURCHASE_BONUS, MAX_REDEEM_RATIO } = require('./credits');
const { burnCouponGC } = require('./coupons');
const AuditEvent = require('../models/AuditEvent');

const router = express.Router();

const rzp = new Razorpay({
  key_id:     process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// POST /api/payment/create-order
// Creates a Razorpay order and returns the order ID + public key to the frontend.
// Accepts optional `creditsToApply` (GC to burn as discount). Bounded to 20% of amount.
router.post('/create-order', requireAuth, async (req, res) => {
  try {
    const { amount, creditsToApply = 0 } = req.body;
    if (!amount || amount <= 0) return res.status(400).json({ error: 'Invalid amount' });

    let discount = 0;
    if (creditsToApply > 0) {
      const user = await User.findById(req.user._id).select('greenCredits');
      const available = user.greenCredits || 0;
      const maxApplicable = Math.floor(amount * MAX_REDEEM_RATIO);
      discount = Math.min(creditsToApply, available, maxApplicable);
      if (discount < 0) discount = 0;

      // Log if the requested amount was capped by the spending bound
      if (creditsToApply > discount) {
        AuditEvent.create({
          type:   'BOUND_ENFORCED',
          userId: req.user._id,
          detail: `GC redemption capped at ${discount} (requested ${creditsToApply}, limit is ${MAX_REDEEM_RATIO * 100}% of order)`,
          meta:   { requested: creditsToApply, allowed: discount, orderAmount: amount, capPercent: MAX_REDEEM_RATIO },
        }).catch(() => {});
      }
    }

    const finalAmount = Math.max(amount - discount, 1); // minimum ₹1

    const rzpOrder = await rzp.orders.create({
      amount:   Math.round(finalAmount * 100), // paise
      currency: 'INR',
      receipt:  `rcpt_${Date.now()}`,
      notes: discount > 0 ? { green_credits_applied: String(discount) } : {},
    });

    res.json({
      rzpOrderId:       rzpOrder.id,
      amount:           rzpOrder.amount,
      currency:         rzpOrder.currency,
      key:              process.env.RAZORPAY_KEY_ID,
      creditsApplied:   discount,
      originalAmount:   amount,
      finalAmount,
    });
  } catch (err) {
    console.error('Razorpay create-order error:', err);
    res.status(500).json({ error: err.message || 'Payment initiation failed' });
  }
});

// POST /api/payment/verify
// Verifies Razorpay signature and creates the District order on success.
// Burns applied credits, then awards earned credits for the purchase.
router.post('/verify', requireAuth, async (req, res) => {
  try {
    const {
      razorpay_order_id, razorpay_payment_id, razorpay_signature,
      items, total, creditsApplied = 0, originalTotal,
      gcCouponBurn = 0,
      couponCode   = null,
      couponDiscount = 0,
    } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ error: 'Missing payment details' });
    }

    // Verify HMAC-SHA256 signature
    const expected = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (expected !== razorpay_signature) {
      return res.status(400).json({ error: 'Payment verification failed — invalid signature' });
    }

    if (!items?.length) return res.status(400).json({ error: 'Cart is empty' });

    const count    = await Order.countDocuments({ user: req.user._id });
    const orderRef = `ORD-${Date.now()}-${String(count + 1).padStart(3, '0')}`;
    const paidTotal = total || items.reduce((s, i) => s + i.price * i.qty, 0);

    const order = await Order.create({
      user:            req.user._id,
      orderRef,
      items,
      total:           paidTotal,
      couponCode:      couponCode || null,
      discountApplied: couponDiscount || 0,
      originalTotal:   originalTotal || null,
      paymentId:       razorpay_payment_id,
      razorpayOrderId: razorpay_order_id,
      paymentStatus:   'Paid',
    });

    // Consume coupon — move from unlocked → used so it can't be reused
    if (couponCode) {
      try {
        await User.findByIdAndUpdate(req.user._id, {
          $pull:  { unlockedCoupons: couponCode },
          $push:  { usedCoupons:     couponCode },
        });
      } catch (couponErr) {
        console.error('Coupon consume error (non-fatal):', couponErr.message);
      }
    }

    // Burn applied credits (non-fatal — if it fails, order is still placed)
    let creditsEarned = 0;
    let newBalance    = null;
    let firstPurchaseBonus = 0;
    try {
      const amountForEarning = originalTotal || paidTotal;

      // Burn GC from coupon code (e.g. GC100 = burn 100 GC)
      if (gcCouponBurn > 0) {
        await burnCouponGC(req.user._id, gcCouponBurn, order._id, orderRef);
      }

      // First-purchase bonus: only on the very first paid order
      const prevPaidOrders = await Order.countDocuments({
        user: req.user._id, paymentStatus: 'Paid', _id: { $ne: order._id },
      });
      if (prevPaidOrders === 0) {
        await awardBonus(req.user._id, FIRST_PURCHASE_BONUS, 'First purchase bonus!', order._id);
        firstPurchaseBonus = FIRST_PURCHASE_BONUS;
      }

      // Earn GC on the original pre-discount amount (reward the gross spend)
      creditsEarned = await awardCredits(
        req.user._id,
        amountForEarning,
        `Earned for order ${orderRef}`,
        order._id,
      ) || 0;

      const freshUser = await User.findById(req.user._id).select('greenCredits');
      newBalance = freshUser.greenCredits;
    } catch (creditErr) {
      console.error('Credit award error (non-fatal):', creditErr.message);
    }

    res.status(201).json({ order, creditsEarned, firstPurchaseBonus, newBalance });
  } catch (err) {
    console.error('Razorpay verify error:', err);
    res.status(500).json({ error: err.message || 'Order creation failed' });
  }
});

// POST /api/payment/log-failure
router.post('/log-failure', requireAuth, async (req, res) => {
  try {
    const { reason = 'Unknown', amount = 0 } = req.body;
    const count    = await Order.countDocuments({ user: req.user._id });
    const orderRef = `FAIL-${Date.now()}-${String(count + 1).padStart(3, '0')}`;

    const order = await Order.create({
      user:          req.user._id,
      orderRef,
      items:         [],
      total:         Number(amount) || 0,
      paymentStatus: 'Failed',
      status:        'Cancelled',
    });

    res.status(201).json({ order, reason });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
