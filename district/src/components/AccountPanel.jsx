import { useState, useEffect, useCallback } from 'react';
import { useApp }  from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import ReturnScanModal from './ReturnScanModal';

function fmtDate(iso) {
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}
function daysAgo(iso) {
  return Math.floor((Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60 * 24));
}

export default function AccountPanel({ isOpen, onClose, onAuthOpen }) {
  const { cartItems, cartCount, removeFromCart, changeQty, setCartOpen, showToast } = useApp();
  const { user, getToken, logout } = useAuth();

  const [tab,          setTab]          = useState('cart');
  const [orders,       setOrders]       = useState([]);
  const [loading,      setLoading]      = useState(false);
  const [scanTarget,   setScanTarget]   = useState(null);   // { item, itemIndex, orderId }
  const [returnedKeys, setReturnedKeys] = useState(new Set()); // 'orderId-itemIndex'
  const [confirmLoading, setConfirmLoading] = useState(false);

  const subtotal = cartItems.reduce((s, i) => s + i.price * i.qty, 0);

  const fetchOrders = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const res  = await fetch('/api/orders', { headers: { Authorization: `Bearer ${getToken()}` } });
      const data = await res.json();
      if (res.ok) setOrders(data.orders);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, [user, getToken]);

  useEffect(() => {
    if (isOpen && user) fetchOrders();
    if (!user) { setOrders([]); setReturnedKeys(new Set()); }
  }, [isOpen, user, fetchOrders]);

  const switchTab = (t) => {
    setTab(t);
    if ((t === 'orders' || t === 'returns') && user) fetchOrders();
  };

  const handleScanClick = (item, itemIndex, orderId, orderTotal) => {
    setScanTarget({ item, itemIndex, orderId, orderTotal });
  };

  const handleScanConfirm = async ({ capturedImg, gradeData } = {}) => {
    if (!scanTarget) return;
    const { item, itemIndex, orderId } = scanTarget;
    const key = `${orderId}-${itemIndex}`;
    setConfirmLoading(true);
    try {
      const body = {};
      if (capturedImg) body.returnImg = capturedImg;
      if (gradeData) {
        body.returnGrade      = gradeData.grade;
        body.returnGradeLabel = gradeData.label;
        body.returnGradeScore = gradeData.score;
      }
      const res  = await fetch(`/api/orders/${orderId}/return`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${getToken()}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Return failed');
      const autoApproved = data.autoApproved;
      const newStatus    = autoApproved ? 'AI-Approved' : 'Requested';
      const hubMsg = data.hub
        ? ` Item stored at ${data.hub.name} for instant delivery to nearby buyers.`
        : '';
      showToast(autoApproved
        ? `Return auto-approved for ${item.name}. Refund in 3–5 days.${hubMsg}`
        : `Return submitted for ${item.name}. Merchant will review within 24–48 hours.`);
      setReturnedKeys(prev => new Set([...prev, key]));
      setOrders(prev => prev.map(o => o._id === orderId ? { ...o, returnStatus: newStatus } : o));
      setScanTarget(null);
      fetchOrders();
    } catch (err) {
      showToast(err.message);
    } finally {
      setConfirmLoading(false);
    }
  };

  const returnOrders = orders.filter(o => o.returnStatus);

  return (
    <>
      {isOpen && <div className="acct-backdrop" onClick={onClose} aria-hidden="true" />}

      <aside className={`acct-panel${isOpen ? ' acct-panel--open' : ''}`} aria-label="Account" role="complementary">

        {/* Header */}
        <div className="acct-header">
          <div className="acct-header-left">
            <div className={`acct-avatar${user ? '' : ' acct-avatar--guest'}`}>
              {user ? user.name.charAt(0).toUpperCase() : '?'}
            </div>
            <div className="acct-header-info">
              <div className="acct-header-name">{user ? user.name : 'Guest'}</div>
              <div className="acct-header-sub">
                {user ? user.email : (
                  <button className="acct-signin-inline" onClick={onAuthOpen}>Sign in to your account →</button>
                )}
              </div>
            </div>
          </div>
          <div className="acct-header-right">
            {user && (
              <button className="acct-logout-btn" onClick={() => { logout(); onClose(); }} title="Sign out">
                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                  <polyline points="16 17 21 12 16 7"/>
                  <line x1="21" y1="12" x2="9" y2="12"/>
                </svg>
              </button>
            )}
            <button className="acct-close-btn" onClick={onClose} aria-label="Close">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="acct-tabs">
          <button className={`acct-tab${tab === 'cart' ? ' active' : ''}`} onClick={() => switchTab('cart')}>
            Cart{cartCount > 0 ? ` (${cartCount})` : ''}
          </button>
          <button className={`acct-tab${tab === 'orders' ? ' active' : ''}`} onClick={() => switchTab('orders')}>
            Orders{orders.length > 0 ? ` (${orders.length})` : ''}
          </button>
          <button className={`acct-tab${tab === 'returns' ? ' active' : ''}`} onClick={() => switchTab('returns')}>
            Returns{returnOrders.length > 0 ? ` (${returnOrders.length})` : ''}
          </button>
        </div>

        {/* ── CART TAB ── */}
        {tab === 'cart' && (
          <>
            <div className="acct-body">
              {cartItems.length === 0 ? (
                <div className="acct-empty">
                  <div className="acct-empty-icon">🛍️</div>
                  <div className="acct-empty-title">Your cart is empty</div>
                  <div className="acct-empty-sub">Add items from the store to start shopping</div>
                </div>
              ) : (
                <ul className="acct-item-list">
                  {cartItems.map(item => (
                    <li key={item.id} className="acct-cart-item">
                      <img src={item.img} alt={item.name} className="acct-item-img" />
                      <div className="acct-item-info">
                        <div className="acct-item-brand">{item.brand}</div>
                        <div className="acct-item-name">{item.name}</div>
                        <div className="acct-item-price">₹{(item.price * item.qty).toLocaleString('en-IN')}</div>
                        <div className="acct-qty-row">
                          <div className="acct-qty-ctrl">
                            <button className="acct-qty-btn" onClick={() => changeQty(item.id, -1)}>−</button>
                            <span className="acct-qty-val">{item.qty}</span>
                            <button className="acct-qty-btn" onClick={() => changeQty(item.id, +1)}>+</button>
                          </div>
                          <button className="acct-remove-btn" onClick={() => removeFromCart(item.id)}>Remove</button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            {cartItems.length > 0 && (
              <div className="acct-footer">
                <div className="acct-total-row">
                  <span className="acct-total-label">Total ({cartCount} item{cartCount !== 1 ? 's' : ''})</span>
                  <span className="acct-total-val">₹{subtotal.toLocaleString('en-IN')}</span>
                </div>
                <div className="acct-footer-note">Free delivery · Taxes included</div>
                <button className="acct-checkout-btn" onClick={() => { onClose(); setCartOpen(true); }}>
                  Checkout <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                </button>
              </div>
            )}
          </>
        )}

        {/* ── ORDERS TAB ── */}
        {tab === 'orders' && (
          <div className="acct-body">
            {!user ? (
              <div className="acct-empty">
                <div className="acct-empty-icon">🔐</div>
                <div className="acct-empty-title">Sign in to see orders</div>
                <div className="acct-empty-sub">Your order history is saved to your account</div>
                <button className="acct-cta-btn" onClick={onAuthOpen}>Sign In</button>
              </div>
            ) : loading ? (
              <div className="acct-empty"><span className="acct-spinner" /></div>
            ) : orders.length === 0 ? (
              <div className="acct-empty">
                <div className="acct-empty-icon">📦</div>
                <div className="acct-empty-title">No orders yet</div>
                <div className="acct-empty-sub">Place your first order to see it here</div>
              </div>
            ) : (
              <ul className="acct-order-list">
                {orders.map(order => {
                  const age        = daysAgo(order.createdAt);
                  const orderOpen  = age <= 7 && order.status !== 'Cancelled';
                  return (
                    <li key={order._id} className="acct-order-card">
                      <div className="acct-order-header">
                        <div>
                          <div className="acct-order-ref">{order.orderRef}</div>
                          <div className="acct-order-date">
                            {fmtDate(order.createdAt)}
                            <span className="acct-order-age"> · {age === 0 ? 'today' : `${age}d ago`}</span>
                          </div>
                        </div>
                        <div className="acct-order-badges">
                          <span className={`acct-status acct-status--${order.status.toLowerCase()}`}>{order.status}</span>
                          {order.returnStatus && (
                            <span className="acct-return-pill">{order.returnStatus}</span>
                          )}
                        </div>
                      </div>

                      {/* Per-item rows with individual Return buttons */}
                      <ul className="acct-order-items">
                        {order.items.map((it, i) => {
                          const key        = `${order._id}-${i}`;
                          const alreadyDone = returnedKeys.has(key) || !!order.returnStatus;
                          const showBtn    = orderOpen && !alreadyDone;
                          return (
                            <li key={i} className="acct-order-item acct-order-item--returnable">
                              <img src={it.img} alt={it.name} className="acct-order-item-img" />
                              <div className="acct-order-item-info">
                                <div className="acct-order-item-name">{it.name}</div>
                                <div className="acct-order-item-meta">{it.brand} · Qty {it.qty}</div>
                                <div className="acct-order-item-price">₹{(it.price * it.qty).toLocaleString('en-IN')}</div>
                              </div>
                              <div className="acct-item-return-col">
                                {showBtn ? (
                                  <button
                                    className="acct-scan-btn"
                                    onClick={() => handleScanClick(it, i, order._id, it.price)}
                                  >
                                    <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                      <path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2"/>
                                    </svg>
                                    Return
                                  </button>
                                ) : alreadyDone ? (
                                  <span className="acct-item-returned-tag">↩ Done</span>
                                ) : (
                                  <span className="acct-item-expired-tag">Closed</span>
                                )}
                              </div>
                            </li>
                          );
                        })}
                      </ul>

                      <div className="acct-order-footer">
                        <span className="acct-order-total-label">Order Total</span>
                        <span className="acct-order-total">₹{order.total.toLocaleString('en-IN')}</span>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        )}

        {/* ── RETURNS TAB ── */}
        {tab === 'returns' && (
          <div className="acct-body">
            {!user ? (
              <div className="acct-empty">
                <div className="acct-empty-icon">🔐</div>
                <div className="acct-empty-title">Sign in to see returns</div>
                <button className="acct-cta-btn" onClick={onAuthOpen}>Sign In</button>
              </div>
            ) : loading ? (
              <div className="acct-empty"><span className="acct-spinner" /></div>
            ) : returnOrders.length === 0 ? (
              <div className="acct-empty">
                <div className="acct-empty-icon">↩️</div>
                <div className="acct-empty-title">No return requests</div>
                <div className="acct-empty-sub">Returns can be initiated within 7 days of ordering</div>
              </div>
            ) : (
              <ul className="acct-order-list">
                {returnOrders.map(order => (
                  <li key={order._id} className="acct-order-card">
                    <div className="acct-order-header">
                      <div>
                        <div className="acct-order-ref">{order.orderRef}</div>
                        <div className="acct-order-date">{fmtDate(order.createdAt)}</div>
                      </div>
                      <span className={`acct-return-pill acct-return-pill--${order.returnStatus.toLowerCase().replace('-', '-')}`}>
                        {order.returnStatus === 'AI-Approved' ? '⚡ AI-Approved' : order.returnStatus}
                      </span>
                    </div>
                    <ul className="acct-order-items">
                      {order.items.map((it, i) => (
                        <li key={i} className="acct-order-item">
                          <img src={it.img} alt={it.name} className="acct-order-item-img" />
                          <div className="acct-order-item-info">
                            <div className="acct-order-item-name">{it.name}</div>
                            <div className="acct-order-item-meta">{it.brand} · ₹{it.price.toLocaleString('en-IN')}</div>
                          </div>
                        </li>
                      ))}
                    </ul>
                    {order.returnStatus === 'AI-Approved' ? (
                      <div className="acct-return-timeline">
                        <div className="acct-timeline-step acct-timeline-step--done">
                          <span className="acct-tl-dot" />Requested
                        </div>
                        <div className="acct-timeline-line" />
                        <div className="acct-timeline-step acct-timeline-step--done acct-timeline-step--ai">
                          <span className="acct-tl-dot" />⚡ AI Verified
                        </div>
                        <div className="acct-timeline-line" />
                        <div className="acct-timeline-step acct-timeline-step--done">
                          <span className="acct-tl-dot" />Refund Issued
                        </div>
                      </div>
                    ) : (
                      <div className="acct-return-timeline">
                        <div className="acct-timeline-step acct-timeline-step--done">
                          <span className="acct-tl-dot" />Requested
                        </div>
                        <div className="acct-timeline-line" />
                        <div className={`acct-timeline-step${['Approved','Rejected'].includes(order.returnStatus) ? ' acct-timeline-step--done' : ''}`}>
                          <span className="acct-tl-dot" />Merchant Review
                        </div>
                        <div className="acct-timeline-line" />
                        <div className={`acct-timeline-step${order.returnStatus === 'Approved' ? ' acct-timeline-step--done' : order.returnStatus === 'Rejected' ? ' acct-timeline-step--rejected' : ''}`}>
                          <span className="acct-tl-dot" />
                          {order.returnStatus === 'Rejected' ? 'Rejected' : 'Refund Issued'}
                        </div>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

      </aside>

      {/* AI Return Scanner modal */}
      {scanTarget && (
        <ReturnScanModal
          item={scanTarget.item}
          itemIndex={scanTarget.itemIndex}
          orderTotal={scanTarget.orderTotal}
          onClose={() => setScanTarget(null)}
          onConfirm={handleScanConfirm}
        />
      )}
    </>
  );
}
