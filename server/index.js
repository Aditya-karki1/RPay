require('dotenv').config();
const express  = require('express');
const mongoose = require('mongoose');
const cors     = require('cors');
const path     = require('path');

const authRoutes     = require('./routes/auth');
const orderRoutes    = require('./routes/orders');
const paymentRoutes  = require('./routes/payment');
const merchantRoutes = require('./routes/merchant');
const agentRoutes    = require('./routes/agent');
const hubRoutes      = require('./routes/hubs');
const { router: creditRoutes } = require('./routes/credits');
const { router: couponRoutes } = require('./routes/coupons');

const webhookHandler = require('./routes/webhook');

const app  = express();
const PORT = process.env.PORT || 5000;
const isProd = process.env.NODE_ENV === 'production';

const allowedOrigins = isProd
  ? true  // same-origin in prod (Express serves the frontend)
  : ['http://localhost:5173', 'http://localhost:5174'];
app.use(cors({ origin: allowedOrigins, credentials: true }));

// Razorpay webhook needs raw body for HMAC verification — mount before express.json()
app.post('/api/payment/webhook', express.raw({ type: 'application/json' }), webhookHandler);

app.use(express.json());

app.use('/api/auth',     authRoutes);
app.use('/api/orders',   orderRoutes);
app.use('/api/payment',  paymentRoutes);
app.use('/api/merchant', merchantRoutes);
app.use('/api/agent',    agentRoutes);
app.use('/api/hubs',     hubRoutes);
app.use('/api/credits',  creditRoutes);
app.use('/api/coupons',  couponRoutes);

app.get('/api/health', (_, res) => res.json({ status: 'ok', time: new Date() }));

// Serve React build in production
if (isProd) {
  const distPath = path.join(__dirname, '../district/dist');
  app.use(express.static(distPath));
  app.get('/{*path}', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅  MongoDB connected');
    app.listen(PORT, () => console.log(`🚀  Server running on http://localhost:${PORT}`));
  })
  .catch(err => { console.error('MongoDB error:', err.message); process.exit(1); });
