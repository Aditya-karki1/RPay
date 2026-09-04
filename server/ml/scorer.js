const path  = require('path');
const model = require(path.join(__dirname, 'model.json'));

const { scaler_mean, scaler_scale, coef, intercept, threshold, features } = model;

function sigmoid(x) {
  return 1 / (1 + Math.exp(-x));
}

/**
 * Score a return request.
 *
 * @param {object} p
 * @param {number} p.order_total        - order value in INR
 * @param {number} p.prev_returns       - how many times user has returned before
 * @param {number} p.total_orders       - total orders by this user (including current)
 * @param {number} p.days_since_order   - days elapsed since order was placed (0–7)
 * @param {number} p.num_items          - number of items in the order
 *
 * @returns {{ riskScore: number, decision: string, factors: string[] }}
 */
function score(p) {
  const total_orders   = Math.max(p.total_orders || 1, 1);
  const prev_returns   = p.prev_returns || 0;
  const return_rate    = total_orders > 1 ? prev_returns / total_orders : 0;
  const is_first_order = total_orders === 1 ? 1 : 0;

  // Build feature vector in the same order as training
  const raw = [
    p.order_total,
    return_rate,
    prev_returns,
    total_orders,
    p.days_since_order || 0,
    p.num_items || 1,
    is_first_order,
  ];

  // StandardScaler: (x - mean) / scale
  const scaled = raw.map((v, i) => (v - scaler_mean[i]) / scaler_scale[i]);

  // Logistic regression: dot(coef, x) + intercept → sigmoid
  const logit = scaled.reduce((sum, v, i) => sum + coef[i] * v, intercept);
  const prob  = sigmoid(logit);
  const riskScore = Math.round(prob * 100);

  const decision = prob >= threshold ? 'manual-review' : 'auto-approve';

  // Human-readable factors driving the score
  const factors = [];
  if (return_rate > 0.40)                          factors.push(`High return rate (${Math.round(return_rate * 100)}%)`);
  else if (return_rate > 0.25)                     factors.push(`Elevated return rate (${Math.round(return_rate * 100)}%)`);
  if (p.order_total > 12000)                       factors.push(`Premium order value (₹${p.order_total.toLocaleString('en-IN')})`);
  else if (p.order_total > 7000)                   factors.push(`Mid-high order value (₹${p.order_total.toLocaleString('en-IN')})`);
  if (prev_returns >= 3)                           factors.push(`${prev_returns} prior returns`);
  else if (prev_returns >= 2)                      factors.push(`${prev_returns} prior returns`);
  if (is_first_order && p.order_total > 5000)      factors.push('First-time buyer, high-value order');
  if ((p.days_since_order || 0) >= 6)              factors.push(`Return requested on day ${p.days_since_order} of 7-day window`);
  if ((p.num_items || 1) >= 6)                     factors.push(`Large cart (${p.num_items} items)`);
  if (factors.length === 0)                        factors.push('No significant risk signals detected');

  return { riskScore, decision, factors };
}

module.exports = { score, modelMetrics: model.metrics };
