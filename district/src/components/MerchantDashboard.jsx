import { useState, useEffect, useCallback, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const TABS = ['Overview', 'Orders', 'Returns', 'Hubs', 'Products', 'Campaigns', 'Coupons', 'AI Buyer', 'Audit'];

function fmt(n) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);
}

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)   return 'just now';
  if (m < 60)  return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24)  return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

const STATUS_COLOR = {
  Confirmed:  '#E8A020',
  Processing: '#3B82F6',
  Shipped:    '#8B5CF6',
  Delivered:  '#10B981',
  Cancelled:  '#EF4444',
};
const RETURN_COLOR = { Requested: '#F59E0B', 'AI-Approved': '#C8FF00', Approved: '#10B981', Rejected: '#EF4444' };

export default function MerchantDashboard({ onLogout }) {
  const [tab,       setTab]       = useState('Overview');
  const [revenue,   setRevenue]   = useState(null);
  const [orders,    setOrders]    = useState([]);
  const [products,  setProducts]  = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [auditEvents,      setAuditEvents]      = useState([]);
  const [hubs,             setHubs]             = useState([]);
  const [merchantCoupons,  setMerchantCoupons]  = useState([]);
  const [loading,          setLoading]          = useState(false);

  const token = () => localStorage.getItem('merchant_token');

  const headers = useCallback(() => ({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token()}`,
  }), []);

  async function fetchRevenue() {
    const r = await fetch('/api/merchant/revenue', { headers: headers() });
    const d = await r.json();

    // Seed the last 7 days with demo values so the chart is never empty.
    // Real order data overwrites demo values for any day that has actual revenue.
    const DEMO = [28400, 19750, 34200, 22600, 41800, 17300, 29500];
    const demoByDay = {};
    for (let i = 6; i >= 0; i--) {
      const d2 = new Date();
      d2.setDate(d2.getDate() - i);
      const key = d2.toISOString().slice(0, 10);
      demoByDay[key] = DEMO[6 - i];
    }
    d.revenueByDay = { ...demoByDay, ...(d.revenueByDay || {}) };

    setRevenue(d);
  }

  async function fetchOrders() {
    setLoading(true);
    const r = await fetch('/api/merchant/orders', { headers: headers() });
    const d = await r.json();
    setOrders(d.orders || []);
    setLoading(false);
  }

  async function fetchProducts() {
    const r = await fetch('/api/merchant/products', { headers: headers() });
    const d = await r.json();
    setProducts(d.products || []);
  }

  async function fetchCampaigns() {
    const r = await fetch('/api/agent/campaigns', { headers: headers() });
    const d = await r.json();
    setCampaigns(d.campaigns || []);
  }

  async function fetchAudit() {
    const r = await fetch('/api/agent/audit', { headers: headers() });
    const d = await r.json();
    setAuditEvents(d.events || []);
  }

  async function fetchHubs() {
    const r = await fetch('/api/hubs/dashboard', { headers: headers() });
    const d = await r.json();
    setHubs(d.hubs || []);
  }

  async function fetchMerchantCoupons() {
    const r = await fetch('/api/coupons/merchant', { headers: headers() });
    const d = await r.json();
    setMerchantCoupons(d.coupons || []);
  }

  useEffect(() => { fetchRevenue(); fetchOrders(); fetchProducts(); fetchCampaigns(); fetchAudit(); fetchHubs(); fetchMerchantCoupons(); }, []);

  async function handleReturnAction(orderId, action) {
    await fetch(`/api/merchant/orders/${orderId}/return`, {
      method:  'PATCH',
      headers: headers(),
      body:    JSON.stringify({ action }),
    });
    fetchOrders();
    fetchRevenue();
  }

  async function handleDeleteProduct(id) {
    await fetch(`/api/merchant/products/${id}`, { method: 'DELETE', headers: headers() });
    fetchProducts();
  }

  const returns     = orders.filter(o => o.returnStatus);
  const aiReturns   = orders.filter(o => o.returnStatus === 'AI-Approved');
  const manualReturns = orders.filter(o => ['Requested', 'Approved', 'Rejected'].includes(o.returnStatus));

  return (
    <div className="md-shell">
      {/* Sidebar */}
      <aside className="md-sidebar">
        <div className="md-sidebar-logo">DIS<span>·</span>TRICT</div>
        <div className="md-sidebar-role">Merchant Dashboard</div>

        <nav className="md-nav">
          {TABS.map(t => (
            <button
              key={t}
              className={`md-nav-item ${tab === t ? 'active' : ''}`}
              onClick={() => setTab(t)}
            >
              <span className="md-nav-icon">
                {t === 'Overview' ? '◈' : t === 'Orders' ? '◉' : t === 'Returns' ? '↩' : t === 'Hubs' ? '📦' : t === 'Products' ? '＋' : t === 'Campaigns' ? '⚡' : t === 'Coupons' ? '🎟️' : t === 'AI Buyer' ? '🤖' : '📋'}
              </span>
              {t}
              {t === 'Returns' && returns.filter(o => o.returnStatus === 'Requested').length > 0 && (
                <span className="md-badge-dot">{returns.filter(o => o.returnStatus === 'Requested').length}</span>
              )}
            </button>
          ))}
        </nav>

        <div className="md-sidebar-bottom">
          <div className="md-merchant-info">
            <div className="md-merchant-avatar">M</div>
            <div>
              <div className="md-merchant-name">District Merchant</div>
              <div className="md-merchant-email">merchant@district.in</div>
            </div>
          </div>
          <button className="md-logout" onClick={onLogout}>Sign Out</button>
        </div>
      </aside>

      {/* Main */}
      <main className="md-main">
        <div className="md-topbar">
          <h1 className="md-page-title">{tab}</h1>
          <div className="md-topbar-right">
            <span className="md-live-badge">● LIVE</span>
            <span className="md-topbar-date">{new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
          </div>
        </div>

        {tab === 'Overview' && revenue && (
          <OverviewTab revenue={revenue} orders={orders} />
        )}
        {tab === 'Orders' && (
          <OrdersTab orders={orders} loading={loading} />
        )}
        {tab === 'Returns' && (
          <ReturnsTab returns={returns} aiReturns={aiReturns} manualReturns={manualReturns} onAction={handleReturnAction} />
        )}
        {tab === 'Hubs' && (
          <HubsTab hubs={hubs} onRefresh={fetchHubs} />
        )}
        {tab === 'Products' && (
          <ProductsTab products={products} onDelete={handleDeleteProduct} onRefresh={fetchProducts} headers={headers()} />
        )}
        {tab === 'Campaigns' && (
          <CampaignsTab campaigns={campaigns} headers={headers()} onRefresh={() => { fetchCampaigns(); fetchAudit(); }} />
        )}
        {tab === 'Coupons' && (
          <CouponsTab coupons={merchantCoupons} headers={headers()} onRefresh={fetchMerchantCoupons} />
        )}
        {tab === 'AI Buyer' && (
          <AIBuyerTab headers={headers()} onRefresh={fetchAudit} />
        )}
        {tab === 'Audit' && (
          <AuditTab events={auditEvents} onRefresh={fetchAudit} />
        )}
      </main>
    </div>
  );
}

/* ─── Overview ─────────────────────────────────────────────── */
function OverviewTab({ revenue, orders }) {
  const recentOrders = orders.slice(0, 5);

  return (
    <div className="md-content">
      <div className="md-stat-grid">
        <StatCard label="Total Revenue" value={fmt(revenue.totalRevenue)} icon="₹" accent />
        <StatCard label="Total Orders" value={revenue.totalOrders} icon="📦" />
        <StatCard label="Avg Order Value" value={fmt(revenue.avgOrderValue)} icon="📊" />
        <StatCard label="Return Requests" value={revenue.returnRequests} icon="↩" warn={revenue.returnRequests > 0} />
        <StatCard label="Pending Orders" value={revenue.pendingOrders} icon="⏳" />
      </div>

      {Object.keys(revenue.revenueByDay).length > 0 && (
        <div className="md-card md-chart-card">
          <div className="md-card-title">Revenue — Last 7 Days</div>
          <MiniBarChart data={revenue.revenueByDay} />
        </div>
      )}

      <div className="md-card">
        <div className="md-card-title">Recent Orders</div>
        <div style={{ overflowX: 'auto' }}>
        <table className="md-table">
          <thead>
            <tr>
              <th>Order Ref</th>
              <th>Customer</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Time</th>
            </tr>
          </thead>
          <tbody>
            {recentOrders.map(o => (
              <tr key={o._id}>
                <td><code className="md-code">{o.orderRef}</code></td>
                <td>{o.user?.name || '—'}</td>
                <td><strong>{fmt(o.total)}</strong></td>
                <td><span className="md-status-chip" style={{ background: STATUS_COLOR[o.status] + '22', color: STATUS_COLOR[o.status] }}>{o.status}</span></td>
                <td className="md-muted">{timeAgo(o.createdAt)}</td>
              </tr>
            ))}
            {recentOrders.length === 0 && (
              <tr><td colSpan={5} className="md-empty-row">No orders yet</td></tr>
            )}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon, accent, warn }) {
  return (
    <div className={`md-stat-card ${accent ? 'accent' : ''} ${warn ? 'warn' : ''}`}>
      <div className="md-stat-icon">{icon}</div>
      <div className="md-stat-value">{value}</div>
      <div className="md-stat-label">{label}</div>
    </div>
  );
}

function MiniBarChart({ data }) {
  const entries  = Object.entries(data).sort(([a], [b]) => a.localeCompare(b));
  const maxVal   = Math.max(...entries.map(([, v]) => v), 1);

  return (
    <div className="md-bar-chart">
      {entries.map(([day, val]) => (
        <div key={day} className="md-bar-col">
          <div className="md-bar-amount">{fmt(val)}</div>
          <div className="md-bar-wrap">
            <div className="md-bar" style={{ height: `${Math.max((val / maxVal) * 100, 4)}%` }} />
          </div>
          <div className="md-bar-label">{new Date(day).toLocaleDateString('en-IN', { weekday: 'short' })}</div>
        </div>
      ))}
    </div>
  );
}

/* ─── Orders ────────────────────────────────────────────────── */
function OrdersTab({ orders, loading }) {
  const [search, setSearch] = useState('');
  const filtered = orders.filter(o =>
    o.orderRef?.toLowerCase().includes(search.toLowerCase()) ||
    o.user?.name?.toLowerCase().includes(search.toLowerCase()) ||
    o.user?.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="md-content">
      <div className="md-toolbar">
        <input
          className="md-search"
          placeholder="Search by order ID or customer…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <span className="md-count">{filtered.length} orders</span>
      </div>
      {loading ? (
        <div className="md-loader">Loading…</div>
      ) : (
        <div className="md-card">
          <div style={{ overflowX: 'auto' }}>
          <table className="md-table">
            <thead>
              <tr>
                <th>Order Ref</th>
                <th>Customer</th>
                <th>Items</th>
                <th>Amount</th>
                <th>Payment</th>
                <th>Order Status</th>
                <th>Return</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(o => (
                <tr key={o._id}>
                  <td><code className="md-code">{o.orderRef}</code></td>
                  <td>
                    <div className="md-cust-name">{o.user?.name || '—'}</div>
                    <div className="md-muted" style={{ fontSize: 11 }}>{o.user?.email}</div>
                  </td>
                  <td>{o.items?.length} item{o.items?.length !== 1 ? 's' : ''}</td>
                  <td><strong>{fmt(o.total)}</strong></td>
                  <td>
                    <span className="md-status-chip" style={{
                      background: o.paymentStatus === 'Paid' ? '#10B98122' : '#EF444422',
                      color:      o.paymentStatus === 'Paid' ? '#10B981'   : '#EF4444',
                    }}>{o.paymentStatus}</span>
                  </td>
                  <td>
                    <span className="md-status-chip" style={{ background: STATUS_COLOR[o.status] + '22', color: STATUS_COLOR[o.status] }}>
                      {o.status}
                    </span>
                  </td>
                  <td>
                    {o.returnStatus
                      ? <span className="md-status-chip" style={{ background: RETURN_COLOR[o.returnStatus] + '22', color: RETURN_COLOR[o.returnStatus] }}>{o.returnStatus}</span>
                      : <span className="md-muted">—</span>}
                  </td>
                  <td className="md-muted">{new Date(o.createdAt).toLocaleDateString('en-IN')}</td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={8} className="md-empty-row">No orders found</td></tr>
              )}
            </tbody>
          </table>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Returns ───────────────────────────────────────────────── */
function ReturnsTab({ returns, aiReturns, manualReturns, onAction }) {
  const pending  = manualReturns.filter(o => o.returnStatus === 'Requested');
  const resolved = manualReturns.filter(o => ['Approved', 'Rejected'].includes(o.returnStatus));

  return (
    <div className="md-content">

      {/* AI Auto-approved section */}
      {aiReturns.length > 0 && (
        <>
          <div className="md-section-label md-section-label--ai">
            ⚡ AI Verified — Auto-Approved ({aiReturns.length})
            <span className="md-section-sublabel">Under ₹3,000 · No merchant action required</span>
          </div>
          <div className="md-returns-list">
            {aiReturns.map(o => (
              <ReturnCard key={o._id} order={o} onAction={onAction} aiApproved />
            ))}
          </div>
        </>
      )}

      {/* Manual review pending */}
      {pending.length > 0 && (
        <>
          <div className="md-section-label" style={{ marginTop: aiReturns.length > 0 ? 32 : 0 }}>
            Pending Manual Review ({pending.length})
            <span className="md-section-sublabel">₹3,000 and above · Requires your decision</span>
          </div>
          <div className="md-returns-list">
            {pending.map(o => (
              <ReturnCard key={o._id} order={o} onAction={onAction} />
            ))}
          </div>
        </>
      )}

      {/* Merchant-resolved */}
      {resolved.length > 0 && (
        <>
          <div className="md-section-label" style={{ marginTop: 32 }}>Resolved by Merchant</div>
          <div className="md-returns-list">
            {resolved.map(o => (
              <ReturnCard key={o._id} order={o} onAction={onAction} resolved />
            ))}
          </div>
        </>
      )}

      {returns.length === 0 && (
        <div className="md-empty-state">
          <div className="md-empty-icon">✓</div>
          <div className="md-empty-title">No return requests</div>
          <div className="md-empty-sub">All orders are proceeding normally.</div>
        </div>
      )}
    </div>
  );
}

function ReturnCard({ order, onAction, resolved, aiApproved }) {
  return (
    <div className={`md-return-card${aiApproved ? ' md-return-card--ai' : ''}`}>
      <div className="md-return-header">
        <div>
          <code className="md-code">{order.orderRef}</code>
          <span className="md-muted" style={{ marginLeft: 10, fontSize: 12 }}>
            {order.user?.name} · {order.user?.email}
          </span>
        </div>
        <span className="md-status-chip" style={{ background: RETURN_COLOR[order.returnStatus] + '22', color: RETURN_COLOR[order.returnStatus] }}>
          {order.returnStatus === 'AI-Approved' ? '⚡ AI-Approved' : order.returnStatus}
        </span>
      </div>

      <div className="md-return-items">
        {order.items?.map((item, i) => (
          <div key={i} className="md-return-item">
            <span className="md-return-item-name">{item.name}</span>
            <span className="md-muted">×{item.qty} · {fmt(item.price)}</span>
          </div>
        ))}
      </div>

      {/* AI Scan Evidence — image + grade for high-value returns (≥ ₹3,000) */}
      {(order.returnImg || order.returnGrade) && (
        <div style={{ margin: '12px 0', display: 'flex', gap: 14, alignItems: 'flex-start', background: 'var(--md-hover)', borderRadius: 10, padding: 12 }}>
          {order.returnImg && (
            <div style={{ flexShrink: 0 }}>
              <img
                src={order.returnImg}
                alt="Customer scan"
                style={{ width: 90, height: 90, objectFit: 'cover', borderRadius: 8, border: '1px solid rgba(255,255,255,0.08)', display: 'block' }}
              />
              <div style={{ fontSize: 10, color: '#666', textAlign: 'center', marginTop: 4 }}>Customer photo</div>
            </div>
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#888', marginBottom: 6 }}>
              AI Condition Report
            </div>
            {order.returnGrade && (() => {
              const gradeColor = { A: '#10B981', B: '#C8FF00', C: '#F59E0B' }[order.returnGrade] || '#888';
              return (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <span style={{
                    fontWeight: 900, fontSize: 20, lineHeight: 1,
                    background: gradeColor + '22', color: gradeColor,
                    border: `1px solid ${gradeColor}44`,
                    borderRadius: 6, padding: '4px 10px',
                  }}>{order.returnGrade}</span>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: gradeColor }}>{order.returnGradeLabel}</div>
                    {order.returnGradeScore != null && (
                      <div style={{ fontSize: 11, color: '#888' }}>AI Score: {order.returnGradeScore}/100</div>
                    )}
                  </div>
                </div>
              );
            })()}
            <div style={{ fontSize: 11, color: '#666', lineHeight: 1.5 }}>
              {order.returnGrade === 'A' && 'Product appears in excellent condition — minimal to no signs of use. Recommend approving return.'}
              {order.returnGrade === 'B' && 'Product shows light use with no significant damage. Suitable for return and resale.'}
              {order.returnGrade === 'C' && 'Product shows visible wear. Review carefully before approving return.'}
              {!order.returnGrade && 'AI scan image attached. Review photo before deciding.'}
            </div>
          </div>
        </div>
      )}

      {/* ML Risk Score badge */}
      {order.returnRiskScore != null && (
        <div style={{ margin: '8px 0', display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <span style={{
            fontWeight: 700, fontSize: 12, padding: '3px 10px', borderRadius: 6,
            background: order.returnRiskScore >= 50 ? '#EF444422' : '#10B98122',
            color:      order.returnRiskScore >= 50 ? '#EF4444'   : '#10B981',
          }}>
            Risk score: {order.returnRiskScore}/100 · {order.returnRiskDecision}
          </span>
          {(order.returnRiskFactors || []).map((f, i) => (
            <span key={i} style={{ fontSize: 11, color: 'var(--md-text-secondary)', background: 'var(--md-hover)', borderRadius: 4, padding: '2px 7px' }}>{f}</span>
          ))}
        </div>
      )}

      <div className="md-return-footer">
        <div className="md-return-timestamps">
          <strong>Total: {fmt(order.total)}</strong>
          {order.returnRequestedAt && (
            <span className="md-timestamp">
              🕐 Requested: {new Date(order.returnRequestedAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
          {order.returnAutoApprovedAt && (
            <span className="md-timestamp md-timestamp--ai">
              ⚡ ML Verified: {new Date(order.returnAutoApprovedAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
          {order.returnResolvedAt && (
            <span className="md-timestamp">
              ✓ Resolved: {new Date(order.returnResolvedAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
        </div>
        {!resolved && !aiApproved && (
          <div className="md-return-actions">
            <button className="md-btn-approve" onClick={() => onAction(order._id, 'Approved')}>Approve Return</button>
            <button className="md-btn-reject"  onClick={() => onAction(order._id, 'Rejected')}>Reject</button>
          </div>
        )}
        {aiApproved && (
          <div className="md-ai-resolved-tag">Auto-processed · No action needed</div>
        )}
      </div>
    </div>
  );
}

/* ─── Campaigns ─────────────────────────────────────────────── */
function CampaignsTab({ campaigns, headers, onRefresh }) {
  const [goal,     setGoal]     = useState('');
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');
  const [draft,    setDraft]    = useState(null);
  const [activating, setActivating] = useState(null);
  const [confirm,  setConfirm]  = useState(null); // { id, preview } — gate state

  const STATUS_C = { Draft: '#E8A020', Active: '#10B981', Ended: '#6B7280' };

  async function handleGenerate(e) {
    e.preventDefault();
    if (!goal.trim()) return;
    setError(''); setDraft(null); setLoading(true);
    try {
      const res  = await fetch('/api/agent/campaign', {
        method:  'POST',
        headers,
        body:    JSON.stringify({ goal }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      setDraft(data.campaign);
      setGoal('');
      onRefresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleDeactivate(id) {
    setError('');
    try {
      const res  = await fetch(`/api/agent/campaigns/${id}/deactivate`, { method: 'PATCH', headers });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      onRefresh();
    } catch (err) {
      setError(err.message);
    }
  }

  // Step 1: fetch preview impact before allowing activation
  async function handleActivateClick(id) {
    setError('');
    try {
      const res  = await fetch(`/api/agent/campaigns/${id}/preview`, { headers });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Preview failed');
      setConfirm({ id, preview: data });
    } catch (err) {
      setError(err.message);
    }
  }

  // Step 2: confirmed — actually activate
  async function handleActivate() {
    if (!confirm) return;
    const id = confirm.id;
    setActivating(id);
    setConfirm(null);
    try {
      const res  = await fetch(`/api/agent/campaigns/${id}/activate`, { method: 'PATCH', headers });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      onRefresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setActivating(null);
    }
  }

  return (
    <div className="md-content">
      {/* Campaign generator */}
      <div className="md-card" style={{ marginBottom: 24 }}>
        <div className="md-card-title">⚡ AI Campaign Orchestrator</div>
        <p className="md-muted" style={{ marginBottom: 16, fontSize: 13 }}>
          Describe a revenue goal. Claude will design a targeted promotional campaign, set the discount, and predict the revenue lift.
        </p>
        <form onSubmit={handleGenerate} style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
          <div className="md-field" style={{ flex: 1, margin: 0 }}>
            <label className="md-label">Campaign Goal</label>
            <input
              className="md-input"
              placeholder='e.g. "Boost sneaker sales this weekend" or "Clear old inventory before restock"'
              value={goal}
              onChange={e => setGoal(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="m-btn-primary" disabled={loading} style={{ whiteSpace: 'nowrap', marginBottom: 0 }}>
            {loading ? 'Generating…' : '⚡ Generate Plan'}
          </button>
        </form>
        {error && <div className="m-error" style={{ marginTop: 10 }}>{error}</div>}

        {/* Newly drafted campaign preview */}
        {draft && (
          <div className="md-campaign-draft" style={{ marginTop: 20, background: 'var(--md-hover)', border: '1px solid var(--md-border)', borderRadius: 10, padding: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 15 }}>{draft.name}</div>
                <div className="md-muted" style={{ fontSize: 12, marginTop: 2 }}>Draft created · Activate to apply discounts</div>
              </div>
              <button className="md-btn-approve" onClick={() => handleActivateClick(draft._id)} disabled={!!activating}>
                {activating === draft._id ? 'Activating…' : 'Activate Campaign'}
              </button>
            </div>
            <div style={{ marginTop: 12, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
              <div className="md-stat-card" style={{ padding: '10px 14px' }}>
                <div className="md-stat-value" style={{ fontSize: 20 }}>{draft.discountPercent}%</div>
                <div className="md-stat-label">Discount</div>
              </div>
              <div className="md-stat-card" style={{ padding: '10px 14px' }}>
                <div className="md-stat-value" style={{ fontSize: 14 }}>{draft.targetCategory || 'All'}</div>
                <div className="md-stat-label">Category</div>
              </div>
              <div className="md-stat-card" style={{ padding: '10px 14px' }}>
                <div className="md-stat-value" style={{ fontSize: 13 }}>{draft.predictedRevenueLift || '—'}</div>
                <div className="md-stat-label">Predicted Lift</div>
              </div>
            </div>
            <div style={{ marginTop: 12, fontSize: 13, lineHeight: 1.6, color: 'var(--md-text-secondary)' }}>
              <strong>Strategy:</strong> {draft.reasoning}
            </div>
          </div>
        )}
      </div>

      {/* ── Confirmation gate ────────────────────────────────── */}
      {confirm && (
        <div className="md-card" style={{ marginBottom: 24, border: '1px solid #F59E0B', background: '#F59E0B0A' }}>
          <div className="md-card-title" style={{ color: '#F59E0B' }}>⚠ Confirm Campaign Activation</div>
          <p className="md-muted" style={{ fontSize: 13, marginBottom: 16 }}>
            This action will immediately apply discounts to live products. Review the impact below before proceeding.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 16 }}>
            <div className="md-stat-card" style={{ padding: '10px 14px' }}>
              <div className="md-stat-value" style={{ fontSize: 22 }}>{confirm.preview.affectedCount}</div>
              <div className="md-stat-label">Products affected</div>
            </div>
            <div className="md-stat-card" style={{ padding: '10px 14px' }}>
              <div className="md-stat-value" style={{ fontSize: 20 }}>{confirm.preview.discountPercent}%</div>
              <div className="md-stat-label">Discount applied</div>
            </div>
            <div className="md-stat-card" style={{ padding: '10px 14px', border: '1px solid #EF444440' }}>
              <div className="md-stat-value" style={{ fontSize: 16, color: '#EF4444' }}>−{fmt(confirm.preview.estimatedRevLost)}</div>
              <div className="md-stat-label">Estimated margin cost</div>
            </div>
          </div>
          {confirm.preview.sample?.length > 0 && (
            <div className="md-muted" style={{ fontSize: 12, marginBottom: 16 }}>
              <strong>Sample products:</strong> {confirm.preview.sample.map(p => p.name).join(', ')}
            </div>
          )}
          {confirm.preview.affectedCount === 0 && (
            <div style={{ marginBottom: 16, color: '#F59E0B', fontSize: 13 }}>
              ⚠ No products match this campaign's filters — activation will have no effect.
            </div>
          )}
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="md-btn-approve" onClick={handleActivate} disabled={!!activating}>
              {activating ? 'Activating…' : `Yes, activate — apply ${confirm.preview.discountPercent}% discount`}
            </button>
            <button className="md-btn-reject" onClick={() => setConfirm(null)}>Cancel</button>
          </div>
        </div>
      )}

      {/* Campaign history */}
      <div className="md-card">
        <div className="md-card-title">Campaign History ({campaigns.length})</div>
        {campaigns.length === 0 ? (
          <div className="md-empty-state" style={{ padding: '30px 0' }}>
            <div className="md-empty-icon">⚡</div>
            <div className="md-empty-title">No campaigns yet</div>
            <div className="md-empty-sub">Generate your first campaign above.</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {campaigns.map(c => (
              <div key={c._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: 'var(--md-hover)', borderRadius: 8 }}>
                <div>
                  <div style={{ fontWeight: 600 }}>{c.name}</div>
                  <div className="md-muted" style={{ fontSize: 12 }}>
                    {c.discountPercent}% off {c.targetCategory || 'all products'} · {c.predictedRevenueLift}
                  </div>
                  <div className="md-muted" style={{ fontSize: 11, marginTop: 2 }}>{c.goal}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span className="md-status-chip" style={{ background: STATUS_C[c.status] + '22', color: STATUS_C[c.status] }}>{c.status}</span>
                  {c.status === 'Draft' && (
                    <button className="md-btn-approve" onClick={() => handleActivateClick(c._id)} disabled={!!activating} style={{ fontSize: 12, padding: '4px 10px' }}>
                      {activating === c._id ? '…' : 'Activate'}
                    </button>
                  )}
                  {c.status === 'Active' && (
                    <button className="md-btn-reject" onClick={() => handleDeactivate(c._id)} style={{ fontSize: 12, padding: '4px 10px' }}>
                      End Campaign
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Coupons Management ─────────────────────────────────────── */
const EMOJI_OPTIONS = ['🎁','⚡','🔥','💜','👑','🎯','💰','🛍️','✨','🌟'];
const COLOR_OPTIONS = ['#C8FF00','#48C479','#F59E0B','#A78BFA','#FF6B6B','#3B82F6','#F97316','#EC4899'];

const BLANK_FORM = { code: '', label: '', description: '', type: 'percent', value: '', gcCost: '', minOrder: '', maxDiscount: '', color: '#C8FF00', emoji: '🎁' };

function CouponsTab({ coupons, headers, onRefresh }) {
  const [showForm,  setShowForm]  = useState(false);
  const [form,      setForm]      = useState(BLANK_FORM);
  const [editing,   setEditing]   = useState(null); // code being edited
  const [saving,    setSaving]    = useState(false);
  const [err,       setErr]       = useState('');

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const openCreate = () => { setForm(BLANK_FORM); setEditing(null); setErr(''); setShowForm(true); };
  const openEdit   = (c) => {
    setForm({ code: c.code, label: c.label, description: c.description, type: c.type, value: c.value, gcCost: c.gcCost, minOrder: c.minOrder || '', maxDiscount: c.maxDiscount || '', color: c.color || '#C8FF00', emoji: c.emoji || '🎁' });
    setEditing(c.code);
    setErr('');
    setShowForm(true);
  };
  const closeForm  = () => { setShowForm(false); setEditing(null); setErr(''); };

  const handleSave = async () => {
    setErr(''); setSaving(true);
    try {
      const body = { ...form, value: Number(form.value), gcCost: Number(form.gcCost), minOrder: Number(form.minOrder) || 0, maxDiscount: form.maxDiscount ? Number(form.maxDiscount) : null };
      const url    = editing ? `/api/coupons/merchant/${editing}` : '/api/coupons/merchant';
      const method = editing ? 'PATCH' : 'POST';
      const res    = await fetch(url, { method, headers, body: JSON.stringify(body) });
      const data   = await res.json();
      if (!res.ok) { setErr(data.error || 'Failed to save'); return; }
      closeForm();
      onRefresh();
    } catch { setErr('Network error'); }
    finally { setSaving(false); }
  };

  const handleToggle = async (c) => {
    await fetch(`/api/coupons/merchant/${c.code}`, { method: 'PATCH', headers, body: JSON.stringify({ active: !c.active }) });
    onRefresh();
  };

  const handleDelete = async (code) => {
    if (!window.confirm(`Delete coupon ${code}? Users who unlocked it can no longer apply it.`)) return;
    await fetch(`/api/coupons/merchant/${code}`, { method: 'DELETE', headers });
    onRefresh();
  };

  return (
    <div className="md-section">
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h2 className="md-section-title">Coupon Management</h2>
          <p style={{ fontSize: 13, color: '#666', marginTop: 2 }}>Customers spend Green Credits to unlock these discount coupons</p>
        </div>
        <button className="md-btn md-btn--primary" onClick={openCreate}>+ New Coupon</button>
      </div>

      {/* Create / Edit form */}
      {showForm && (
        <div className="coupon-mgr-form">
          <div className="coupon-mgr-form-title">{editing ? `Edit ${editing}` : 'Create New Coupon'}</div>

          <div className="coupon-mgr-grid">
            <div className="coupon-mgr-field">
              <label>Code</label>
              <input value={form.code} onChange={e => set('code', e.target.value.toUpperCase())} placeholder="e.g. SUMMER20" disabled={!!editing} />
            </div>
            <div className="coupon-mgr-field">
              <label>Label</label>
              <input value={form.label} onChange={e => set('label', e.target.value)} placeholder="e.g. 20% Off" />
            </div>
            <div className="coupon-mgr-field" style={{ gridColumn: '1 / -1' }}>
              <label>Description</label>
              <input value={form.description} onChange={e => set('description', e.target.value)} placeholder="e.g. 20% off on all orders above ₹1,000" />
            </div>
            <div className="coupon-mgr-field">
              <label>Discount Type</label>
              <select value={form.type} onChange={e => set('type', e.target.value)}>
                <option value="percent">Percentage (%)</option>
                <option value="flat">Flat Amount (₹)</option>
              </select>
            </div>
            <div className="coupon-mgr-field">
              <label>Discount Value {form.type === 'percent' ? '(%)' : '(₹)'}</label>
              <input type="number" value={form.value} onChange={e => set('value', e.target.value)} placeholder={form.type === 'percent' ? '10' : '150'} />
            </div>
            <div className="coupon-mgr-field">
              <label>GC Cost to Unlock 🌿</label>
              <input type="number" value={form.gcCost} onChange={e => set('gcCost', e.target.value)} placeholder="80" />
            </div>
            <div className="coupon-mgr-field">
              <label>Min Order (₹)</label>
              <input type="number" value={form.minOrder} onChange={e => set('minOrder', e.target.value)} placeholder="0 = no minimum" />
            </div>
            {form.type === 'percent' && (
              <div className="coupon-mgr-field">
                <label>Max Discount (₹)</label>
                <input type="number" value={form.maxDiscount} onChange={e => set('maxDiscount', e.target.value)} placeholder="Leave blank for no cap" />
              </div>
            )}
            <div className="coupon-mgr-field">
              <label>Emoji</label>
              <div className="coupon-mgr-emoji-row">
                {EMOJI_OPTIONS.map(e => (
                  <button key={e} className={`coupon-mgr-emoji-btn${form.emoji === e ? ' active' : ''}`} onClick={() => set('emoji', e)}>{e}</button>
                ))}
              </div>
            </div>
            <div className="coupon-mgr-field">
              <label>Color</label>
              <div className="coupon-mgr-color-row">
                {COLOR_OPTIONS.map(c => (
                  <button key={c} className={`coupon-mgr-color-btn${form.color === c ? ' active' : ''}`} style={{ background: c }} onClick={() => set('color', c)} />
                ))}
              </div>
            </div>
          </div>

          {err && <div className="coupon-mgr-err">{err}</div>}
          <div className="coupon-mgr-actions">
            <button className="md-btn" onClick={closeForm}>Cancel</button>
            <button className="md-btn md-btn--primary" onClick={handleSave} disabled={saving}>
              {saving ? 'Saving…' : editing ? 'Save Changes' : 'Create Coupon'}
            </button>
          </div>
        </div>
      )}

      {/* Coupon table */}
      <div className="coupon-mgr-table-wrap">
        <table className="md-table">
          <thead>
            <tr>
              <th>Coupon</th>
              <th>Discount</th>
              <th>GC Cost</th>
              <th>Min Order</th>
              <th>Unlocks</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {coupons.length === 0 && (
              <tr><td colSpan={7} style={{ textAlign: 'center', color: '#666', padding: 32 }}>No coupons yet. Click + New Coupon.</td></tr>
            )}
            {coupons.map(c => (
              <tr key={c.code} style={{ opacity: c.active ? 1 : 0.5 }}>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 20 }}>{c.emoji}</span>
                    <div>
                      <div style={{ fontWeight: 800, fontFamily: 'monospace', letterSpacing: 1, color: c.color || '#C8FF00' }}>{c.code}</div>
                      <div style={{ fontSize: 11, color: '#666' }}>{c.label}</div>
                    </div>
                  </div>
                </td>
                <td>
                  <span style={{ fontWeight: 700, color: '#fff' }}>
                    {c.type === 'flat' ? `₹${c.value}` : `${c.value}%`} off
                  </span>
                  {c.maxDiscount ? <div style={{ fontSize: 10, color: '#666' }}>max ₹{c.maxDiscount}</div> : null}
                </td>
                <td><span style={{ color: '#48C479', fontWeight: 700 }}>🌿 {c.gcCost} GC</span></td>
                <td style={{ color: '#888', fontSize: 13 }}>{c.minOrder ? `₹${c.minOrder.toLocaleString('en-IN')}` : '—'}</td>
                <td style={{ fontWeight: 700 }}>{c.unlockCount || 0} users</td>
                <td>
                  <span style={{ background: c.active ? 'rgba(72,196,121,0.15)' : 'rgba(255,255,255,0.06)', color: c.active ? '#48C479' : '#666', border: `1px solid ${c.active ? 'rgba(72,196,121,0.3)' : '#333'}`, borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 700 }}>
                    {c.active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="md-btn md-btn--sm" onClick={() => openEdit(c)}>Edit</button>
                    <button className="md-btn md-btn--sm" onClick={() => handleToggle(c)} style={{ color: c.active ? '#F59E0B' : '#48C479' }}>
                      {c.active ? 'Disable' : 'Enable'}
                    </button>
                    <button className="md-btn md-btn--sm" onClick={() => handleDelete(c.code)} style={{ color: '#FF6B6B' }}>Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ─── AI Buyer ───────────────────────────────────────────────── */
function AIBuyerTab({ headers, onRefresh }) {
  const [category,      setCategory]      = useState('Sneakers');
  const [spendingLimit, setSpendingLimit] = useState(5000);
  const [badge,         setBadge]         = useState('');
  const [running,       setRunning]       = useState(false);
  const [result,        setResult]        = useState(null);
  const [error,         setError]         = useState('');

  const CATEGORIES = ['Sneakers', 'Streetwear', 'Ethnic Wear', 'Accessories'];

  async function handleBuy() {
    setRunning(true); setResult(null); setError('');
    try {
      const res  = await fetch('/api/agent/buy', {
        method:  'POST',
        headers,
        body:    JSON.stringify({
          agentId:       'district-ai-buyer-v1',
          preferences:   { category, ...(badge ? { badge } : {}) },
          spendingLimit: Number(spendingLimit),
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Agent purchase failed'); return; }
      setResult(data);
      onRefresh?.();
    } catch (e) {
      setError(e.message);
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="md-content">
      {/* Explainer */}
      <div className="md-card" style={{ borderColor: '#06B6D4', background: 'rgba(6,182,212,0.05)' }}>
        <div className="md-card-title" style={{ color: '#06B6D4' }}>🤖 AI Buyer Agent</div>
        <p className="md-muted" style={{ fontSize: 13, lineHeight: 1.6, marginBottom: 0 }}>
          Simulates an autonomous AI buyer placing a Razorpay order without human interaction.
          The agent discovers products, enforces a <strong>spending limit</strong> (bounded),
          creates a real Razorpay test-mode order, generates a valid HMAC signature, and logs every step
          to the audit trail — demonstrating <strong>agent-to-merchant agentic commerce</strong>.
        </p>
      </div>

      {/* Controls */}
      <div className="md-card">
        <div className="md-card-title">Configure Purchase</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 20 }}>
          <div>
            <label className="md-label">Category preference</label>
            <select className="md-input" value={category} onChange={e => setCategory(e.target.value)}>
              {CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="md-label">Badge filter (optional)</label>
            <select className="md-input" value={badge} onChange={e => setBadge(e.target.value)}>
              <option value="">Any</option>
              <option value="SALE">SALE</option>
              <option value="HOT">HOT</option>
              <option value="NEW">NEW</option>
              <option value="LIMITED">LIMITED</option>
            </select>
          </div>
          <div>
            <label className="md-label">Spending limit (₹)</label>
            <input className="md-input" type="number" min="100" max="50000" value={spendingLimit} onChange={e => setSpendingLimit(e.target.value)} />
          </div>
        </div>
        <button className="md-btn md-btn--primary" onClick={handleBuy} disabled={running} style={{ width: '100%', padding: '12px 0', fontSize: 14 }}>
          {running ? '🤖 Agent running…' : '🤖 Run AI Buyer Agent'}
        </button>
        {error && <div style={{ marginTop: 12, padding: '10px 14px', background: 'rgba(239,68,68,0.1)', borderRadius: 8, color: '#EF4444', fontSize: 13 }}>{error}</div>}
      </div>

      {/* Result */}
      {result && (
        <div className="md-card" style={{ borderColor: '#10B981', background: 'rgba(16,185,129,0.05)' }}>
          <div className="md-card-title" style={{ color: '#10B981' }}>✅ Agent Purchase Complete</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 16 }}>
            <div style={{ background: 'var(--md-hover)', borderRadius: 10, padding: 14 }}>
              <div style={{ fontSize: 11, color: 'var(--md-text-secondary)', marginBottom: 4 }}>Order Ref</div>
              <div style={{ fontWeight: 700, fontSize: 14 }}>{result.orderRef}</div>
            </div>
            <div style={{ background: 'var(--md-hover)', borderRadius: 10, padding: 14 }}>
              <div style={{ fontSize: 11, color: 'var(--md-text-secondary)', marginBottom: 4 }}>Amount Paid</div>
              <div style={{ fontWeight: 700, fontSize: 14, color: '#10B981' }}>{fmt(result.totalAmount)}</div>
            </div>
            <div style={{ background: 'var(--md-hover)', borderRadius: 10, padding: 14 }}>
              <div style={{ fontSize: 11, color: 'var(--md-text-secondary)', marginBottom: 4 }}>Spending Limit</div>
              <div style={{ fontWeight: 700, fontSize: 14, color: result.bounded ? '#10B981' : '#EF4444' }}>{fmt(result.spendingLimit)} {result.bounded ? '✓' : '✗'}</div>
            </div>
          </div>
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 11, color: 'var(--md-text-secondary)', marginBottom: 6 }}>Razorpay Order ID</div>
            <code style={{ fontSize: 12, background: 'var(--md-hover)', padding: '4px 10px', borderRadius: 6 }}>{result.razorpayOrderId}</code>
          </div>
          {/* Step-by-step trail */}
          <div style={{ fontSize: 12, color: 'var(--md-text-secondary)', marginBottom: 8 }}>Agent execution steps:</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {(result.steps || []).map((s, i) => (
              <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', fontSize: 12 }}>
                <span style={{ background: '#06B6D422', color: '#06B6D4', padding: '1px 7px', borderRadius: 4, whiteSpace: 'nowrap', fontWeight: 600 }}>{s.step}</span>
                <span style={{ color: 'var(--md-text-secondary)' }}>{s.detail}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Audit Trail ────────────────────────────────────────────── */
const AUDIT_COLOR = {
  ORDER_CREATED:      { bg: '#3B82F6', label: 'Order' },
  PAYMENT_VERIFIED:   { bg: '#10B981', label: 'Payment' },
  PAYMENT_FAILED:     { bg: '#EF4444', label: 'Failed' },
  RETURN_REQUESTED:   { bg: '#F59E0B', label: 'Return' },
  AI_RETURN_APPROVED: { bg: '#C8FF00', label: 'AI' },
  RETURN_APPROVED:    { bg: '#10B981', label: 'Approved' },
  RETURN_REJECTED:    { bg: '#EF4444', label: 'Rejected' },
  CAMPAIGN_ACTIVATED: { bg: '#8B5CF6', label: 'Campaign' },
  CAMPAIGN_ENDED:     { bg: '#6B7280', label: 'Ended' },
  UPSELL_ACCEPTED:    { bg: '#F97316', label: 'Upsell' },
  GREEN_CREDITS_EARNED:   { bg: '#C8FF00', label: 'GC Earned' },
  GREEN_CREDITS_REDEEMED: { bg: '#48C479', label: 'GC Redeemed' },
  COUPON_APPLIED:     { bg: '#48C479', label: 'Coupon' },
  AI_BUYER_PURCHASE:  { bg: '#06B6D4', label: 'AI Buyer' },
  AI_BUYER_FAILED:    { bg: '#EF4444', label: 'AI Failed' },
  FRAUD_ATTEMPT:      { bg: '#DC2626', label: '🚫 Blocked' },
  BOUND_ENFORCED:     { bg: '#F97316', label: '🛡 Bounded' },
};

function exportAudit(events, format) {
  if (format === 'json') {
    const blob = new Blob([JSON.stringify(events, null, 2)], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a'); a.href = url; a.download = `district-audit-${Date.now()}.json`; a.click();
    URL.revokeObjectURL(url);
  } else {
    const cols = ['timestamp', 'type', 'orderRef', 'customer', 'email', 'amount', 'actor', 'decision', 'paymentId'];
    const rows = [cols.join(','), ...events.map(e => cols.map(c => JSON.stringify(e[c] ?? '')).join(','))];
    const blob = new Blob([rows.join('\n')], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a'); a.href = url; a.download = `district-audit-${Date.now()}.csv`; a.click();
    URL.revokeObjectURL(url);
  }
}

function AuditTab({ events, onRefresh }) {
  const [filter, setFilter] = useState('ALL');
  const types = ['ALL', 'ORDER_CREATED', 'PAYMENT_VERIFIED', 'PAYMENT_FAILED', 'AI_BUYER_PURCHASE',
    'GREEN_CREDITS_EARNED', 'GREEN_CREDITS_REDEEMED', 'COUPON_APPLIED',
    'FRAUD_ATTEMPT', 'BOUND_ENFORCED',
    'RETURN_REQUESTED', 'AI_RETURN_APPROVED', 'CAMPAIGN_ACTIVATED', 'UPSELL_ACCEPTED'];

  const filtered = filter === 'ALL' ? events : events.filter(e => e.type === filter);

  return (
    <div className="md-content">
      <div className="md-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
          <div className="md-card-title" style={{ margin: 0 }}>Audit Trail — {filtered.length} events</div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <select className="md-input" style={{ width: 180, margin: 0 }} value={filter} onChange={e => setFilter(e.target.value)}>
              {types.map(t => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
            </select>
            <button className="md-btn" style={{ padding: '7px 12px', fontSize: 12 }} onClick={onRefresh}>↺ Refresh</button>
            <button className="md-btn" style={{ padding: '7px 12px', fontSize: 12 }} onClick={() => exportAudit(filtered, 'csv')}>⬇ CSV</button>
            <button className="md-btn" style={{ padding: '7px 12px', fontSize: 12 }} onClick={() => exportAudit(filtered, 'json')}>⬇ JSON</button>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="md-empty-state" style={{ padding: '30px 0' }}>
            <div className="md-empty-icon">📋</div>
            <div className="md-empty-title">No events yet</div>
            <div className="md-empty-sub">Money events appear here as orders are placed and processed.</div>
          </div>
        ) : (
          <div className="md-audit-timeline">
            {filtered.map(ev => {
              const meta = AUDIT_COLOR[ev.type] || { bg: '#6B7280', label: ev.type };
              return (
                <div key={ev.id} className="md-audit-row">
                  <div className="md-audit-dot" style={{ background: meta.bg }} />
                  <div className="md-audit-body">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <span className="md-status-chip" style={{ background: meta.bg + '22', color: meta.bg, marginRight: 8 }}>{meta.label}</span>
                        <strong style={{ fontSize: 13 }}>{ev.decision}</strong>
                        {ev.orderRef && <code className="md-code" style={{ marginLeft: 8, fontSize: 11 }}>{ev.orderRef}</code>}
                      </div>
                      {ev.amount != null && <span style={{ fontWeight: 700, fontSize: 13 }}>{fmt(ev.amount)}</span>}
                    </div>
                    <div className="md-muted" style={{ fontSize: 11, marginTop: 4, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                      <span>🕐 {new Date(ev.timestamp).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                      {ev.customer && <span>👤 {ev.customer}{ev.email ? ` · ${ev.email}` : ''}</span>}
                      <span>🔒 Actor: {ev.actor}</span>
                      {ev.paymentId && <span>💳 {ev.paymentId}</span>}
                      {ev.bounded && <span style={{ color: '#10B981' }}>✓ Bounded & Explainable</span>}
                      {ev.blocked && <span style={{ color: '#EF4444' }}>🚫 Blocked — fraud prevention</span>}
                      {ev.riskScore != null && <span style={{ color: '#C8FF00' }}>🤖 Risk score: {ev.riskScore}/100</span>}
                    </div>
                    {ev.riskFactors?.length > 0 && (
                      <div style={{ marginTop: 4, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {ev.riskFactors.map((f, i) => (
                          <span key={i} style={{ fontSize: 10, padding: '1px 6px', borderRadius: 4, background: 'var(--md-hover)', color: 'var(--md-text-secondary)' }}>{f}</span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Products ──────────────────────────────────────────────── */
const RADIUS_KM = 60;

function distKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2
    + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLng/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}
function hubDistKm(hub, userLoc) {
  if (!hub.lat || !hub.lng || !userLoc) return null;
  return distKm(userLoc.lat, userLoc.lng, hub.lat, hub.lng);
}
function fmtDist(km) {
  return km == null ? '—' : km < 1 ? `${Math.round(km*1000)}m` : `${km.toFixed(1)}km`;
}

async function geocodeLocation(query) {
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1&addressdetails=1`;
  const res  = await fetch(url, { headers: { 'Accept-Language': 'en-US,en' } });
  const data = await res.json();
  if (!data.length) throw new Error('Location not found');
  const { lat, lon, display_name } = data[0];
  return { lat: parseFloat(lat), lng: parseFloat(lon), label: display_name };
}

function HubsMapView({ nearbyHubs, userLoc }) {
  const containerRef = useRef(null);
  const mapRef       = useRef(null);

  useEffect(() => {
    if (!nearbyHubs.length || !userLoc || !containerRef.current) return;
    if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; }

    const map = L.map(containerRef.current, { zoomControl: true, attributionControl: true });
    mapRef.current = map;

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: 'abcd', maxZoom: 19,
    }).addTo(map);

    const userIcon = L.divIcon({
      html: `<div style="width:14px;height:14px;border-radius:50%;background:#C8FF00;border:3px solid #000;box-shadow:0 0 10px #C8FF00,0 0 22px rgba(200,255,0,0.5)"></div>`,
      iconSize: [14, 14], iconAnchor: [7, 7], className: '',
    });
    L.marker([userLoc.lat, userLoc.lng], { icon: userIcon })
      .addTo(map)
      .bindPopup(`<b style="color:#C8FF00">Customer Location</b><br><small>${userLoc.label}</small>`);

    const points = [[userLoc.lat, userLoc.lng]];
    nearbyHubs.forEach(hub => {
      points.push([hub.lat, hub.lng]);
      const dist = hubDistKm(hub, userLoc);
      const icon = L.divIcon({
        html: `<div style="background:#C8FF00;color:#000;font-size:10px;font-weight:800;padding:5px 10px;border-radius:8px;white-space:nowrap;box-shadow:0 2px 10px rgba(0,0,0,0.6);border:2px solid #fff">📦 ${hub.area} · ${fmtDist(dist)}</div>`,
        iconAnchor: [0, 0], className: '',
      });
      L.marker([hub.lat, hub.lng], { icon })
        .addTo(map)
        .bindPopup(`<b>${hub.name}</b><br><small>${hub.address}</small><br><small style="color:#22c55e">⚡ ${fmtDist(dist)} — instant delivery eligible</small>`);

      L.polyline([[userLoc.lat, userLoc.lng], [hub.lat, hub.lng]], {
        color: '#C8FF00', weight: 1.5, dashArray: '5 6', opacity: 0.5,
      }).addTo(map);
    });

    map.fitBounds(points, { padding: [50, 50], maxZoom: 13 });

    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, [nearbyHubs, userLoc]);

  return (
    <div ref={containerRef} style={{ height: 400, borderRadius: 14, overflow: 'hidden', border: '1px solid #222' }} />
  );
}

function HubsTab({ hubs, onRefresh }) {
  const fmt2 = (n) => '₹' + Number(n).toLocaleString('en-IN');

  const [input,     setInput]     = useState('Indiranagar, Bangalore');
  const [userLoc,   setUserLoc]   = useState(null);
  const [geocoding, setGeocoding] = useState(false);
  const [geoError,  setGeoError]  = useState('');

  const doGeocode = useCallback(async (query) => {
    if (!query.trim()) return;
    setGeocoding(true);
    setGeoError('');
    try {
      const loc = await geocodeLocation(query.trim());
      setUserLoc(loc);
    } catch {
      setGeoError('Location not found. Try a different area or city name.');
    } finally {
      setGeocoding(false);
    }
  }, []);

  // geocode the default on first load
  useEffect(() => { doGeocode('Indiranagar, Bangalore'); }, [doGeocode]);

  const nearbyHubs = userLoc
    ? hubs.filter(h => { const d = hubDistKm(h, userLoc); return d != null && d <= RADIUS_KM; })
    : [];

  const totalAvailable = nearbyHubs.reduce((s, h) => s + (h.available || 0), 0);
  const totalSold      = nearbyHubs.reduce((s, h) => s + (h.sold || 0), 0);

  return (
    <div className="md-section">
      <div className="md-section-header">
        <div className="md-section-title">District Local Hubs</div>
        <button className="md-refresh-btn" onClick={onRefresh}>Refresh</button>
      </div>

      {/* Location search */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: '#888', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>
          Customer Location
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <input
            className="md-input"
            style={{ flex: 1 }}
            placeholder="Enter area or city (e.g. Bandra, Mumbai)"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && doGeocode(input)}
          />
          <button
            className="m-btn-primary"
            style={{ padding: '0 20px', minWidth: 90 }}
            onClick={() => doGeocode(input)}
            disabled={geocoding}
          >
            {geocoding ? <span className="auth-spinner" /> : 'Search'}
          </button>
        </div>
        {geoError && <div style={{ fontSize: 12, color: '#ef4444', marginTop: 6 }}>{geoError}</div>}
        {userLoc && !geocoding && (
          <div style={{ fontSize: 11, color: '#C8FF00', marginTop: 6 }}>
            📍 {userLoc.label.split(',').slice(0, 3).join(',')} · showing hubs within {RADIUS_KM} km
          </div>
        )}
      </div>

      {/* Stats — only if we have a location */}
      {userLoc && (
        <div style={{ display: 'flex', gap: 16, marginBottom: 20 }}>
          <div className="md-stat-card" style={{ flex: 1 }}>
            <div className="md-stat-label">Hubs Within {RADIUS_KM}km</div>
            <div className="md-stat-value">{nearbyHubs.length}</div>
          </div>
          <div className="md-stat-card" style={{ flex: 1 }}>
            <div className="md-stat-label">Available Items</div>
            <div className="md-stat-value" style={{ color: '#C8FF00' }}>{totalAvailable}</div>
          </div>
          <div className="md-stat-card" style={{ flex: 1 }}>
            <div className="md-stat-label">Items Sold</div>
            <div className="md-stat-value">{totalSold}</div>
          </div>
        </div>
      )}

      {/* Map + hub list */}
      {geocoding && (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#555' }}>
          <span className="auth-spinner" style={{ display: 'inline-block', marginBottom: 10 }} />
          <div style={{ fontSize: 13 }}>Locating…</div>
        </div>
      )}

      {!geocoding && userLoc && nearbyHubs.length === 0 && (
        <div className="md-empty-state" style={{ padding: '40px 0' }}>
          <div className="md-empty-icon">🏪</div>
          <div className="md-empty-title">No hubs within {RADIUS_KM} km</div>
          <div className="md-empty-sub">No District Local Hubs are within range of this location. Try a different area.</div>
        </div>
      )}

      {!geocoding && userLoc && nearbyHubs.length > 0 && (
        <>
          <HubsMapView nearbyHubs={nearbyHubs} userLoc={userLoc} />

          <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {nearbyHubs.map(hub => {
              const dist   = hubDistKm(hub, userLoc);
              const dirUrl = `https://www.google.com/maps/dir/${userLoc.lat},${userLoc.lng}/${hub.lat},${hub.lng}`;
              return (
                <div key={hub._id} className="md-card" style={{ padding: '16px 20px', borderColor: 'rgba(200,255,0,0.2)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <span style={{ fontWeight: 700, fontSize: 14 }}>{hub.name}</span>
                        <span style={{ fontSize: 10, fontWeight: 800, background: '#C8FF00', color: '#000', padding: '2px 7px', borderRadius: 10 }}>⚡ Nearby</span>
                      </div>
                      <div style={{ fontSize: 12, color: '#666' }}>📍 {hub.area} · {hub.city}</div>
                      <div style={{ fontSize: 11, color: '#555', marginTop: 2 }}>{hub.address}</div>
                    </div>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                      <span style={{ fontSize: 13, fontWeight: 800, color: '#C8FF00' }}>{fmtDist(dist)}</span>
                      <a href={dirUrl} target="_blank" rel="noopener noreferrer" style={{
                        fontSize: 11, fontWeight: 700, color: '#C8FF00',
                        background: 'rgba(200,255,0,0.08)', border: '1px solid rgba(200,255,0,0.2)',
                        borderRadius: 6, padding: '4px 10px', textDecoration: 'none',
                      }}>Directions →</a>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 10, marginBottom: hub.recentItems?.length ? 14 : 0 }}>
                    <div style={{ background: 'rgba(200,255,0,0.08)', borderRadius: 8, padding: '5px 14px', textAlign: 'center' }}>
                      <div style={{ fontSize: 18, fontWeight: 800, color: '#C8FF00' }}>{hub.available || 0}</div>
                      <div style={{ fontSize: 10, color: '#666' }}>Available</div>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 8, padding: '5px 14px', textAlign: 'center' }}>
                      <div style={{ fontSize: 18, fontWeight: 800 }}>{hub.sold || 0}</div>
                      <div style={{ fontSize: 10, color: '#666' }}>Sold</div>
                    </div>
                  </div>

                  {hub.recentItems?.length > 0 && (
                    <div>
                      <div style={{ fontSize: 11, color: '#444', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>Recent items</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {hub.recentItems.map(item => (
                          <div key={item._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13 }}>
                            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                              {item.img && <img src={item.img} alt={item.productName} style={{ width: 30, height: 30, objectFit: 'cover', borderRadius: 4 }} />}
                              <div>
                                <div style={{ fontWeight: 600 }}>{item.productName}</div>
                                <div style={{ color: '#555', fontSize: 11 }}>{item.productBrand}</div>
                              </div>
                            </div>
                            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                              <span style={{ fontWeight: 700 }}>{fmt2(item.hubPrice)}</span>
                              <span style={{
                                fontSize: 11, fontWeight: 600, padding: '2px 7px', borderRadius: 4,
                                background: item.status === 'sold' ? 'rgba(255,255,255,0.06)' : 'rgba(200,255,0,0.15)',
                                color: item.status === 'sold' ? '#555' : '#C8FF00',
                              }}>{item.status === 'sold' ? 'Sold' : '⚡ Available'}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

function ProductsTab({ products, onDelete, onRefresh, headers }) {
  const [form,    setForm]    = useState({ name: '', brand: '', price: '', originalPrice: '', category: 'Fashion', badge: 'NEW', description: '', stock: '100' });
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState('');
  const [success, setSuccess] = useState('');

  async function handleAdd(e) {
    e.preventDefault();
    setError(''); setSuccess('');
    setSaving(true);
    try {
      const res = await fetch('/api/merchant/products', {
        method:  'POST',
        headers,
        body:    JSON.stringify({
          ...form,
          price:         Number(form.price),
          originalPrice: form.originalPrice ? Number(form.originalPrice) : null,
          stock:         Number(form.stock),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      setSuccess(`"${data.product.name}" added successfully!`);
      setForm({ name: '', brand: '', price: '', originalPrice: '', category: 'Fashion', badge: 'NEW', description: '', stock: '100' });
      onRefresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="md-content md-products-layout">
      {/* Add product form */}
      <div className="md-card md-add-form-card">
        <div className="md-card-title">Add New Product</div>
        <form onSubmit={handleAdd} className="md-add-form">
          <div className="md-form-row">
            <div className="md-field">
              <label className="md-label">Product Name *</label>
              <input className="md-input" placeholder="e.g. Air Force 1 Low" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
            </div>
            <div className="md-field">
              <label className="md-label">Brand *</label>
              <input className="md-input" placeholder="e.g. Nike" value={form.brand} onChange={e => setForm(f => ({ ...f, brand: e.target.value }))} required />
            </div>
          </div>
          <div className="md-form-row">
            <div className="md-field">
              <label className="md-label">Price (₹) *</label>
              <input className="md-input" type="number" min="1" placeholder="8999" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} required />
            </div>
            <div className="md-field">
              <label className="md-label">Original Price (₹)</label>
              <input className="md-input" type="number" min="1" placeholder="11999" value={form.originalPrice} onChange={e => setForm(f => ({ ...f, originalPrice: e.target.value }))} />
            </div>
          </div>
          <div className="md-form-row">
            <div className="md-field">
              <label className="md-label">Category</label>
              <select className="md-input" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                {['Fashion', 'Sneakers', 'Accessories', 'Streetwear', 'Sportswear', 'Denim'].map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div className="md-field">
              <label className="md-label">Badge</label>
              <select className="md-input" value={form.badge} onChange={e => setForm(f => ({ ...f, badge: e.target.value }))}>
                {['NEW', 'SALE', 'HOT', 'LIMITED'].map(b => <option key={b}>{b}</option>)}
              </select>
            </div>
          </div>
          <div className="md-form-row">
            <div className="md-field">
              <label className="md-label">Stock</label>
              <input className="md-input" type="number" min="0" value={form.stock} onChange={e => setForm(f => ({ ...f, stock: e.target.value }))} />
            </div>
            <div className="md-field">
              <label className="md-label">Image URL</label>
              <input className="md-input" placeholder="https://…" value={form.img} onChange={e => setForm(f => ({ ...f, img: e.target.value }))} />
            </div>
          </div>
          <div className="md-field">
            <label className="md-label">Description</label>
            <textarea className="md-input md-textarea" rows={3} placeholder="Short product description…" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
          </div>

          {error   && <div className="m-error">{error}</div>}
          {success && <div className="md-success">{success}</div>}

          <button type="submit" className="m-btn-primary" disabled={saving}>
            {saving ? 'Adding…' : 'Add Product to Catalog'}
          </button>
        </form>
      </div>

      {/* Product list */}
      <div className="md-card">
        <div className="md-card-title">Catalog ({products.length} products)</div>
        {products.length === 0 ? (
          <div className="md-empty-state" style={{ padding: '40px 0' }}>
            <div className="md-empty-icon">📦</div>
            <div className="md-empty-title">No products yet</div>
            <div className="md-empty-sub">Add your first product using the form.</div>
          </div>
        ) : (
          <div className="md-product-list">
            {products.map(p => (
              <div key={p._id} className="md-product-row">
                <div className="md-product-img-placeholder">
                  {p.img
                    ? <img src={p.img} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <span>{p.brand?.[0]}</span>}
                </div>
                <div className="md-product-info">
                  <div className="md-product-name">{p.name}</div>
                  <div className="md-product-brand">{p.brand} · {p.category}</div>
                </div>
                <div className="md-product-price-col">
                  <div className="md-product-price">{fmt(p.price)}</div>
                  {p.originalPrice && <div className="md-product-original">{fmt(p.originalPrice)}</div>}
                </div>
                <span className="md-badge-chip">{p.badge}</span>
                <div className="md-product-stock">Stock: {p.stock}</div>
                <button className="md-del-btn" onClick={() => onDelete(p._id)} title="Delete product">✕</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
