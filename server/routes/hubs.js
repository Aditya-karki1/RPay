const express      = require('express');
const jwt          = require('jsonwebtoken');
const LocalHub     = require('../models/LocalHub');
const HubInventory = require('../models/HubInventory');
const requireAuth  = require('../middleware/auth');

const router = express.Router();

function requireMerchant(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const payload = jwt.verify(auth.slice(7), process.env.JWT_SECRET + '_merchant');
    if (payload.role !== 'merchant') throw new Error();
    next();
  } catch {
    res.status(401).json({ error: 'Invalid merchant token' });
  }
}

// GET /api/hubs — all active hubs (public)
router.get('/', async (req, res) => {
  try {
    const hubs = await LocalHub.find({ active: true }).sort({ createdAt: 1 });
    res.json({ hubs });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/hubs/available — all hub items available for instant delivery (public)
router.get('/available', async (req, res) => {
  try {
    const items = await HubInventory.find({ status: 'available' })
      .populate('hub', 'name area city')
      .sort({ createdAt: -1 });
    res.json({ items });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/hubs/inventory/:id/sell — mark a hub item as sold after order payment
router.patch('/inventory/:id/sell', requireAuth, async (req, res) => {
  try {
    const item = await HubInventory.findById(req.params.id);
    if (!item) return res.status(404).json({ error: 'Hub inventory item not found' });
    if (item.status === 'sold') return res.json({ item }); // idempotent

    item.status = 'sold';
    item.soldAt = new Date();
    await item.save();
    res.json({ item });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/hubs/dashboard — merchant view: hubs with inventory counts
router.get('/dashboard', requireMerchant, async (req, res) => {
  try {
    const hubs = await LocalHub.find({ active: true }).sort({ createdAt: 1 });

    const hubsWithStats = await Promise.all(hubs.map(async (hub) => {
      const available = await HubInventory.countDocuments({ hub: hub._id, status: 'available' });
      const sold      = await HubInventory.countDocuments({ hub: hub._id, status: 'sold' });
      const items     = await HubInventory.find({ hub: hub._id }).sort({ createdAt: -1 }).limit(5);
      return { ...hub.toObject(), available, sold, recentItems: items };
    }));

    res.json({ hubs: hubsWithStats });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
