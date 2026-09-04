const crypto = require('crypto');
const Order  = require('../models/Order');

// POST /api/payment/webhook
// Razorpay sends this when a payment is captured on their side.
// Mount this BEFORE express.json() so req.body is the raw Buffer.
module.exports = async (req, res) => {
  try {
    const sig    = req.headers['x-razorpay-signature'];
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;

    if (!secret) {
      // Webhook secret not configured — accept but log
      console.warn('WEBHOOK: RAZORPAY_WEBHOOK_SECRET not set, skipping signature check');
    } else if (!sig) {
      return res.status(400).json({ error: 'Missing X-Razorpay-Signature header' });
    } else {
      const expected = crypto
        .createHmac('sha256', secret)
        .update(req.body) // raw Buffer
        .digest('hex');
      if (expected !== sig) {
        return res.status(400).json({ error: 'Invalid webhook signature' });
      }
    }

    const payload = JSON.parse(req.body.toString('utf8'));
    const event   = payload.event;

    if (event === 'payment.captured') {
      const payment    = payload?.payload?.payment?.entity;
      if (!payment) return res.json({ received: true });
      const rzpOrderId = payment.order_id;

      const order = await Order.findOne({ razorpayOrderId: rzpOrderId });

      if (!order) {
        // Browser closed before /api/payment/verify ran — payment captured but no DB order.
        // Log clearly so merchant can investigate; Razorpay will show this in their dashboard too.
        console.warn(`WEBHOOK: payment.captured for ${payment.id} (${rzpOrderId}) — no matching order in DB. Manual recovery needed.`);
      } else if (order.paymentStatus === 'Pending') {
        // Rare: verify endpoint didn't complete — update payment status from webhook
        order.paymentStatus = 'Paid';
        order.paymentId     = payment.id;
        await order.save();
        console.log(`WEBHOOK: recovered order ${order.orderRef} — marked Paid via webhook`);
      }
      // If already Paid, it's a duplicate event — safe to ignore
    }

    // Always return 200 so Razorpay doesn't retry
    res.json({ received: true });
  } catch (err) {
    console.error('Webhook error:', err.message);
    res.status(500).json({ error: err.message });
  }
};
