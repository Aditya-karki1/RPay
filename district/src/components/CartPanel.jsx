import { useState, useEffect, useCallback } from 'react';
import { useApp }  from '../context/AppContext';
import { useAuth } from '../context/AuthContext';

function fmtDate(iso) {
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function CartPanel({ onAuthOpen }) {
  const { cartOpen, setCartOpen, cartItems, cartCount,
          removeFromCart, changeQty, clearCart, showToast, showPopup } = useApp();
  const { user, getToken } = useAuth();

  const [tab,             setTab]             = useState('cart');
  const [orders,          setOrders]          = useState([]);
  const [loading,         setLoading]         = useState(false);
  const [placing,         setPlacing]         = useState(false);
  const [gcBalance,       setGcBalance]       = useState(0);
  const [earnedMsg,       setEarnedMsg]       = useState(null);
  const [couponInput,     setCouponInput]     = useState('');
  const [appliedCoupon,   setAppliedCoupon]   = useState(null); // { code, label, discount, kind, gcToBurn }
  const [couponError,     setCouponError]     = useState('');
  const [couponLoading,   setCouponLoading]   = useState(false);

  const subtotal       = cartItems.reduce((s, i) => s + i.price * i.qty, 0);
  const couponDiscount = appliedCoupon ? appliedCoupon.discount : 0;
  const finalTotal     = subtotal - couponDiscount;

  const fetchOrders = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const res  = await fetch('/api/orders', {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const data = await res.json();
      if (res.ok) setOrders(data.orders);
    } catch { /* network error — stay silent */ }
    finally { setLoading(false); }
  }, [user, getToken]);

  const fetchGcBalance = useCallback(async () => {
    if (!user) return;
    try {
      const res  = await fetch('/api/credits/balance', {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const data = await res.json();
      if (res.ok) setGcBalance(data.greenCredits || 0);
    } catch { /* silent */ }
  }, [user, getToken]);

  const handleApplyCoupon = async () => {
    if (!couponInput.trim()) return;
    if (!user) { onAuthOpen?.(); return; }
    setCouponLoading(true);
    setCouponError('');
    try {
      const res  = await fetch('/api/coupons/apply', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body:    JSON.stringify({ code: couponInput.trim(), amount: subtotal }),
      });
      const data = await res.json();
      if (!res.ok) { setCouponError(data.error || 'Invalid coupon'); return; }
      setAppliedCoupon({ code: data.code, label: data.label, discount: data.discount, kind: data.kind, gcToBurn: data.gcToBurn || 0 });
      setCouponInput('');
      showPopup({
        emoji:    '🎉',
        title:    'Hurray! Coupon Applied!',
        subtitle: `${data.code} — ₹${data.discount.toLocaleString('en-IN')} off your order`,
        type:     'coupon',
      });
    } catch {
      setCouponError('Could not apply coupon. Try again.');
    } finally {
      setCouponLoading(false);
    }
  };

  const removeCoupon = () => { setAppliedCoupon(null); setCouponError(''); };

  // fetch orders + GC balance whenever the panel opens or user changes
  useEffect(() => {
    if (cartOpen && user) { fetchOrders(); fetchGcBalance(); }
    if (!user) { setOrders([]); setGcBalance(0); setAppliedCoupon(null); }
  }, [cartOpen, user, fetchOrders, fetchGcBalance]);

  // also fetch when switching to orders tab
  const handleOrdersTab = () => {
    setTab('orders');
    fetchOrders();
  };

  const loadRazorpayScript = () => new Promise((resolve) => {
    if (window.Razorpay) { resolve(true); return; }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload  = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });

  const handlePlaceOrder = async () => {
    if (!user) { onAuthOpen?.(); return; }
    if (!cartItems.length) return;

    setEarnedMsg(null);
    setPlacing(true);
    try {
      // Step 1 — create Razorpay order with final amount (after coupon)
      const initRes  = await fetch('/api/payment/create-order', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body:    JSON.stringify({ amount: finalTotal }),
      });
      const initData = await initRes.json();
      if (!initRes.ok) throw new Error(initData.error || 'Payment initiation failed');

      // Step 2 — load Razorpay checkout SDK
      const loaded = await loadRazorpayScript();
      if (!loaded) throw new Error('Failed to load payment gateway. Check your connection.');

      // Step 3 — open Razorpay checkout modal
      const items = cartItems.map(i => ({
        productId: String(i.id),
        name:      i.name,
        brand:     i.brand,
        price:     i.price,
        qty:       i.qty,
        img:       i.img,
      }));

      await new Promise((resolve, reject) => {
        const rzp = new window.Razorpay({
          key:         initData.key,
          amount:      initData.amount,
          currency:    initData.currency,
          order_id:    initData.rzpOrderId,
          name:        'District',
          description: `Order of ${cartItems.length} item${cartItems.length > 1 ? 's' : ''}`,
          prefill: {
            name:  user.name,
            email: user.email,
          },
          theme: { color: '#C8FF00' },

          handler: async (response) => {
            // Step 4 — verify payment + create District order
            try {
              const verifyRes = await fetch('/api/payment/verify', {
                method:  'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
                body:    JSON.stringify({
                  razorpay_order_id:   response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature:  response.razorpay_signature,
                  items,
                  total:          finalTotal,
                  originalTotal:  subtotal,
                  gcCouponBurn:   appliedCoupon?.gcToBurn || 0,
                  couponCode:     appliedCoupon?.code    || null,
                  couponDiscount: appliedCoupon?.discount || 0,
                }),
              });
              const verifyData = await verifyRes.json();
              if (!verifyRes.ok) throw new Error(verifyData.error || 'Payment verification failed');

              // Mark hub inventory items as sold
              const hubItems = cartItems.filter(i => i.hubInventoryId);
              hubItems.forEach(i => {
                fetch(`/api/hubs/inventory/${i.hubInventoryId}/sell`, {
                  method: 'PATCH',
                  headers: { Authorization: `Bearer ${getToken()}` },
                }).catch(() => {});
              });

              const hasInstant = hubItems.length > 0;
              clearCart();
              setAppliedCoupon(null);

              // Show earned credits message
              if (verifyData.creditsEarned > 0 || verifyData.firstPurchaseBonus > 0) {
                const earned  = verifyData.creditsEarned || 0;
                const bonus   = verifyData.firstPurchaseBonus || 0;
                const balance = verifyData.newBalance || 0;
                setEarnedMsg({ earned, bonus, newBalance: balance });
                if (verifyData.newBalance != null) setGcBalance(balance);

                const total = earned + bonus;
                const lines = [];
                if (bonus > 0) lines.push(`+${bonus} GC first-order bonus 🎁`);
                if (earned > 0) lines.push(`+${earned} GC for your purchase`);
                showPopup({
                  emoji:    '⚡',
                  title:    `Congrats! You earned ${total} Green Credits!`,
                  subtitle: lines.join('  ·  ') + `  ·  Balance: ${balance} GC`,
                  type:     'credits',
                });
              }

              showToast(hasInstant
                ? `Order placed! ⚡ ${hubItems.length} item${hubItems.length > 1 ? 's' : ''} delivered today from District Hub 🎉`
                : 'Payment successful! Order placed 🎉');
              setTab('orders');
              setOrders(prev => [verifyData.order, ...prev]);
              resolve();
            } catch (err) {
              reject(err);
            }
          },

          modal: {
            ondismiss: () => reject(new Error('__dismissed__')),
          },
        });
        rzp.open();
      });

    } catch (err) {
      if (err.message !== '__dismissed__') showToast(err.message);
    } finally {
      setPlacing(false);
    }
  };

  return (
    <>
      {cartOpen && (
        <div className="cart-backdrop" onClick={() => setCartOpen(false)} aria-hidden="true" />
      )}
      <aside className={`cart-panel${cartOpen ? ' cart-panel--open' : ''}`} aria-label="Cart" role="complementary">

        {/* Header */}
        <div className="cart-header">
          <div className="cart-header-left">
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
              <line x1="3" y1="6" x2="21" y2="6"/>
              <path d="M16 10a4 4 0 0 1-8 0"/>
            </svg>
            <span className="cart-title">My Cart</span>
            {cartCount > 0 && <span className="cart-header-badge">{cartCount}</span>}
          </div>
          <button className="cart-close-btn" onClick={() => setCartOpen(false)} aria-label="Close cart">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="cart-tabs">
          <button className={`cart-tab${tab === 'cart' ? ' active' : ''}`} onClick={() => setTab('cart')}>
            Cart{cartCount > 0 ? ` (${cartCount})` : ''}
          </button>
          <button className={`cart-tab${tab === 'orders' ? ' active' : ''}`} onClick={handleOrdersTab}>
            Past Orders{orders.length > 0 ? ` (${orders.length})` : ''}
          </button>
        </div>

        {/* ── Cart Tab ────────────────────────────────────────── */}
        {tab === 'cart' && (
          <>
            <div className="cart-body">
              {cartItems.length === 0 ? (
                <div className="cart-empty">
                  <div className="cart-empty-icon">🛍️</div>
                  <div className="cart-empty-title">Your cart is empty</div>
                  <div className="cart-empty-sub">Add products to start shopping</div>
                </div>
              ) : (
                <ul className="cart-item-list">
                  {cartItems.map(item => (
                    <li key={item.id} className="cart-item">
                      <div className="cart-item-img">
                        <img src={item.img} alt={item.name} className="cart-item-real-img" />
                      </div>
                      <div className="cart-item-info">
                        <div className="cart-item-brand">{item.brand}</div>
                        <div className="cart-item-name">{item.name}</div>
                        <div className="cart-item-price">₹{(item.price * item.qty).toLocaleString('en-IN')}</div>
                        <div className="cart-item-controls">
                          <div className="cart-qty-row">
                            <button className="cart-qty-btn" onClick={() => changeQty(item.id, -1)}>−</button>
                            <span className="cart-qty-val">{item.qty}</span>
                            <button className="cart-qty-btn" onClick={() => changeQty(item.id, +1)}>+</button>
                          </div>
                          <button className="cart-remove-btn" onClick={() => removeFromCart(item.id)}>
                            <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                              <polyline points="3 6 5 6 21 6"/>
                              <path d="M19 6l-1 14H6L5 6"/>
                              <path d="M10 11v6M14 11v6"/>
                              <path d="M9 6V4h6v2"/>
                            </svg>
                            Remove
                          </button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {cartItems.length > 0 && (
              <div className="cart-footer">
                {/* Green Credits earned message */}
                {earnedMsg && (
                  <div className="gc-earned-banner">
                    <span className="gc-leaf">🌿</span>
                    <div>
                      {earnedMsg.bonus > 0 && <div className="gc-earned-line">+{earnedMsg.bonus} GC first-purchase bonus!</div>}
                      {earnedMsg.earned > 0 && <div className="gc-earned-line">+{earnedMsg.earned} Green Credits earned</div>}
                      <div className="gc-earned-balance">Balance: {earnedMsg.newBalance} GC</div>
                    </div>
                    <button className="gc-earned-close" onClick={() => setEarnedMsg(null)}>×</button>
                  </div>
                )}

                <div className="cart-summary-row">
                  <span>Subtotal ({cartCount} item{cartCount !== 1 ? 's' : ''})</span>
                  <span className="cart-subtotal">₹{subtotal.toLocaleString('en-IN')}</span>
                </div>
                {appliedCoupon && (
                  <div className="cart-summary-row gc-discount-row">
                    <span>Coupon ({appliedCoupon.code})</span>
                    <span className="gc-discount-amount">−₹{appliedCoupon.discount.toLocaleString('en-IN')}</span>
                  </div>
                )}
                <div className="cart-summary-row cart-summary-small">
                  <span>Delivery</span>
                  <span className="cart-free">FREE</span>
                </div>

                {/* Coupon code input */}
                {!appliedCoupon ? (
                  <div className="coupon-input-row">
                    <input
                      className="coupon-input"
                      placeholder="Enter coupon code"
                      value={couponInput}
                      onChange={e => { setCouponInput(e.target.value.toUpperCase()); setCouponError(''); }}
                      onKeyDown={e => e.key === 'Enter' && handleApplyCoupon()}
                    />
                    <button className="coupon-apply-btn" onClick={handleApplyCoupon} disabled={couponLoading || !couponInput.trim()}>
                      {couponLoading ? <span className="auth-spinner" style={{ width: 12, height: 12 }} /> : 'Apply'}
                    </button>
                  </div>
                ) : (
                  <div className="coupon-applied-row">
                    <svg width="14" height="14" fill="none" stroke="#48C479" strokeWidth="2.5" viewBox="0 0 24 24">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                    <div className="coupon-applied-info">
                      <span className="coupon-applied-code">{appliedCoupon.code}</span>
                      <span className="coupon-applied-save">−₹{appliedCoupon.discount.toLocaleString('en-IN')} saved</span>
                    </div>
                    <button className="coupon-remove-btn" onClick={removeCoupon}>✕</button>
                  </div>
                )}
                {couponError && <div className="coupon-error">{couponError}</div>}

                {/* GC nudge — shows when user has GC but no coupon applied */}
                {user && gcBalance > 0 && !appliedCoupon && (
                  <div className="gc-hint-row">
                    <span>🌿</span>
                    <span>You have <strong>{gcBalance} GC</strong> — unlock coupons with your credits from the <strong>Coupons</strong> button in the nav</span>
                  </div>
                )}

                <div className="cart-divider" />
                <div className="cart-summary-row cart-total-row">
                  <span>Total</span>
                  <span className="cart-total">₹{finalTotal.toLocaleString('en-IN')}</span>
                </div>
                <button className="cart-checkout-btn" onClick={handlePlaceOrder} disabled={placing}>
                  {placing ? (
                    <span className="auth-spinner" />
                  ) : user ? (
                    <>Place Order <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg></>
                  ) : (
                    <>Sign In to Order <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg></>
                  )}
                </button>
              </div>
            )}
          </>
        )}

        {/* ── Orders Tab ────────────────────────────────────── */}
        {tab === 'orders' && (
          <div className="cart-body">
            {!user ? (
              <div className="cart-empty">
                <div className="cart-empty-icon">🔐</div>
                <div className="cart-empty-title">Sign in to see orders</div>
                <div className="cart-empty-sub">Your order history is saved to your account</div>
                <button className="cart-signin-cta" onClick={onAuthOpen}>Sign In</button>
              </div>
            ) : loading ? (
              <div className="cart-empty">
                <span className="cart-orders-spinner" />
                <div className="cart-empty-sub" style={{ marginTop: 12 }}>Loading orders…</div>
              </div>
            ) : orders.length === 0 ? (
              <div className="cart-empty">
                <div className="cart-empty-icon">📦</div>
                <div className="cart-empty-title">No orders yet</div>
                <div className="cart-empty-sub">Your placed orders will appear here</div>
              </div>
            ) : (
              <ul className="order-list">
                {orders.map(order => (
                  <li key={order._id} className="order-card">
                    <div className="order-card-header">
                      <div>
                        <div className="order-id">{order.orderRef}</div>
                        <div className="order-date">{fmtDate(order.createdAt)}</div>
                      </div>
                      <span className={`order-status order-status--${order.status.toLowerCase()}`}>
                        {order.status}
                      </span>
                    </div>
                    <ul className="order-items">
                      {order.items.map((it, i) => (
                        <li key={i} className="order-item-row">
                          <div className="order-item-img">
                            <img src={it.img} alt={it.name} className="cart-item-real-img" />
                          </div>
                          <div className="order-item-detail">
                            <div className="order-item-name">{it.name}</div>
                            <div className="order-item-meta">{it.brand} · Qty {it.qty}</div>
                          </div>
                          <div className="order-item-price">₹{(it.price * it.qty).toLocaleString('en-IN')}</div>
                        </li>
                      ))}
                    </ul>
                    <div className="order-card-footer">
                      <span className="order-total-label">Order Total</span>
                      <span className="order-total">₹{order.total.toLocaleString('en-IN')}</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

      </aside>
    </>
  );
}
