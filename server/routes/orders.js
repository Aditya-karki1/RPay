const express      = require('express');
const Order        = require('../models/Order');
const LocalHub     = require('../models/LocalHub');
const HubInventory = require('../models/HubInventory');
const requireAuth  = require('../middleware/auth');

const router = express.Router();

// GET /api/orders  — user's orders
router.get('/', requireAuth, async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json({ orders });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/orders  — place a new order
router.post('/', requireAuth, async (req, res) => {
  try {
    const { items, total } = req.body;
    if (!items?.length) return res.status(400).json({ error: 'Cart is empty' });


    const count  = await Order.countDocuments({ user: req.user._id });
    const orderRef = `ORD-${Date.now()}-${String(count + 1).padStart(3, '0')}`;

    const order = await Order.create({ user: req.user._id, orderRef, items, total });
    res.status(201).json({ order });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/orders/:id/return  — request a return (within 7-day window)
// Orders < ₹3000: auto-approved instantly | Orders >= ₹3000: queued for manual merchant review
router.patch('/:id/return', requireAuth, async (req, res) => {
  try {
    const order = await Order.findOne({ _id: req.params.id, user: req.user._id });
    if (!order) return res.status(404).json({ error: 'Order not found' });
    if (order.returnStatus) return res.status(400).json({ error: 'Return already requested for this order' });

    const ageMs   = Date.now() - new Date(order.createdAt).getTime();
    const ageDays = ageMs / (1000 * 60 * 60 * 24);
    if (ageDays > 7) return res.status(400).json({ error: 'Return window has closed (7 days from order date)' });

    const now         = new Date();
    const autoApprove = order.total < 3000;

    order.returnRequestedAt = now;
    if (autoApprove) {
      order.returnStatus         = 'AI-Approved';
      order.returnAutoApprovedAt = now;
    } else {
      order.returnStatus = 'Requested';
      // Store AI scan evidence for merchant review
      const { returnImg, returnGrade, returnGradeLabel, returnGradeScore } = req.body;
      if (returnImg)        order.returnImg        = returnImg;
      if (returnGrade)      order.returnGrade      = returnGrade;
      if (returnGradeLabel) order.returnGradeLabel = returnGradeLabel;
      if (returnGradeScore) order.returnGradeScore = returnGradeScore;
    }

    await order.save();

    // Auto-approved: assign items to nearest District Hub for instant re-delivery
    let assignedHub = null;
    if (autoApprove) {
      try {
        const hubs = await LocalHub.find({ active: true });
        if (hubs.length) {
          // Pick hub deterministically from order ID (so same order always goes same hub)
          const hubIndex = order._id.toString().charCodeAt(0) % hubs.length;
          const hub      = hubs[hubIndex];

          await Promise.all((order.items || []).map(item =>
            HubInventory.create({
              hub:           hub._id,
              order:         order._id,
              productId:     item.productId || null,
              productName:   item.name,
              productBrand:  item.brand || '',
              originalPrice: item.price,
              hubPrice:      Math.round(item.price * 0.95), // 5% discount on returned item
              img:           item.img || '',
              condition:     'Like New',
            })
          ));

          assignedHub = { name: hub.name, area: hub.area, city: hub.city, lat: hub.lat, lng: hub.lng };
        }
      } catch (hubErr) {
        console.error('Hub assignment error (non-fatal):', hubErr.message);
      }
    }

    res.json({ order, autoApproved: autoApprove, hub: assignedHub });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
