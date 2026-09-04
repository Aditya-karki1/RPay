const express  = require('express');
const jwt      = require('jsonwebtoken');
const Order    = require('../models/Order');
const Product  = require('../models/Product');

const router = express.Router();

const MERCHANT_EMAIL    = 'merchant@district.in';
const MERCHANT_PASSWORD = 'District@2025';
const MERCHANT_SECRET   = process.env.JWT_SECRET + '_merchant';

function signMerchantToken() {
  return jwt.sign({ role: 'merchant', email: MERCHANT_EMAIL }, MERCHANT_SECRET, { expiresIn: '12h' });
}

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

// POST /api/merchant/login
router.post('/login', (req, res) => {
  const { email, password } = req.body;
  if (email !== MERCHANT_EMAIL || password !== MERCHANT_PASSWORD)
    return res.status(401).json({ error: 'Invalid merchant credentials' });
  res.json({ token: signMerchantToken(), email: MERCHANT_EMAIL });
});

// GET /api/merchant/orders — all orders across all customers
router.get('/orders', requireMerchant, async (req, res) => {
  try {
    const orders = await Order.find()
      .populate('user', 'name email')
      .sort({ createdAt: -1 });
    res.json({ orders });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/merchant/revenue — summary stats
router.get('/revenue', requireMerchant, async (req, res) => {
  try {
    const orders = await Order.find({ paymentStatus: 'Paid' });
    const totalRevenue   = orders.reduce((s, o) => s + o.total, 0);
    const totalOrders    = orders.length;
    const avgOrderValue  = totalOrders ? totalRevenue / totalOrders : 0;
    const returnRequests = await Order.countDocuments({ returnStatus: { $in: ['Requested', 'AI-Approved'] } });
    const pendingOrders  = await Order.countDocuments({ status: { $in: ['Confirmed', 'Processing'] } });

    // Revenue by day (last 7 days)
    const now     = new Date();
    const weekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);
    const recentOrders = await Order.find({ createdAt: { $gte: weekAgo }, paymentStatus: 'Paid' });

    const byDay = {};
    recentOrders.forEach(o => {
      const day = o.createdAt.toISOString().slice(0, 10);
      byDay[day] = (byDay[day] || 0) + o.total;
    });

    res.json({
      totalRevenue: Math.round(totalRevenue),
      totalOrders,
      avgOrderValue: Math.round(avgOrderValue),
      returnRequests,
      pendingOrders,
      revenueByDay: byDay,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/merchant/orders/:id/return — approve or reject a return
router.patch('/orders/:id/return', requireMerchant, async (req, res) => {
  try {
    const { action } = req.body; // 'Approved' | 'Rejected'
    if (!['Approved', 'Rejected'].includes(action))
      return res.status(400).json({ error: 'action must be Approved or Rejected' });

    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ error: 'Order not found' });
    if (order.returnStatus === 'AI-Approved')
      return res.status(400).json({ error: 'This return was already auto-approved by AI' });
    if (order.returnStatus !== 'Requested')
      return res.status(400).json({ error: 'No pending return request for this order' });

    order.returnStatus    = action;
    order.returnResolvedAt = new Date();
    await order.save();
    res.json({ order });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/merchant/products
router.get('/products', requireMerchant, async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    res.json({ products });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/merchant/products
router.post('/products', requireMerchant, async (req, res) => {
  try {
    const { name, brand, price, originalPrice, category, img, badge, description, stock } = req.body;
    if (!name || !brand || !price) return res.status(400).json({ error: 'name, brand and price are required' });
    const product = await Product.create({ name, brand, price, originalPrice, category, img, badge, description, stock });
    res.status(201).json({ product });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/merchant/products/:id
router.delete('/products/:id', requireMerchant, async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/merchant/products/public — no auth, for customer side to fetch
router.get('/products/public', async (req, res) => {
  try {
    const products = await Product.find({ active: true }).sort({ createdAt: -1 }).limit(20);
    res.json({ products });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
