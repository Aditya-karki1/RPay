import { useEffect, useState, useCallback } from 'react';
import { useApp }  from '../context/AppContext';
import { useAuth } from '../context/AuthContext';

const navLinks = [
  { label: 'New Arrivals', page: null, scroll: 'arrivals' },
  { label: 'Zomato',       page: 'zomato' },
  { label: 'PVR INOX',     page: 'pvrinox' },
  { label: 'Bluestone',    page: 'bluestone' },
];

export default function Navbar({ onMenuOpen, onNavClick, onAIOpen, onAuthOpen, onAccountOpen }) {
  const { cartCount, setCartOpen, showPopup, showToast } = useApp();
  const { user, logout, getToken } = useAuth();
  const [scrolled,    setScrolled]    = useState(false);
  const [gcBalance,   setGcBalance]   = useState(0);
  const [couponsOpen, setCouponsOpen] = useState(false);
  const [coupons,     setCoupons]     = useState([]);
  const [copiedCode,  setCopiedCode]  = useState(null);
  const [unlocking,   setUnlocking]   = useState(null); // code being unlocked
  const [unlockMsg,   setUnlockMsg]   = useState(null); // { code, label }

  useEffect(() => {
    if (!user) { setGcBalance(0); return; }
    fetch('/api/credits/balance', { headers: { Authorization: `Bearer ${getToken()}` } })
      .then(r => r.json())
      .then(d => { if (d.greenCredits != null) setGcBalance(d.greenCredits); })
      .catch(() => {});
  }, [user, getToken]);

  const fetchCoupons = useCallback(() => {
    if (!user) return;
    fetch('/api/coupons', { headers: { Authorization: `Bearer ${getToken()}` } })
      .then(r => r.json())
      .then(d => {
        if (d.coupons)   setCoupons(d.coupons);
        if (d.gcBalance != null) setGcBalance(d.gcBalance);
      })
      .catch(() => {});
  }, [user, getToken]);

  useEffect(() => {
    if (couponsOpen) fetchCoupons();
  }, [couponsOpen, fetchCoupons]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleCopy = (code) => {
    navigator.clipboard.writeText(code).catch(() => {});
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleUnlock = async (code) => {
    setUnlocking(code);
    try {
      const res  = await fetch('/api/coupons/unlock', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body:    JSON.stringify({ code }),
      });
      const data = await res.json();
      if (!res.ok) { showToast(data.error || 'Failed to unlock coupon'); return; }
      setGcBalance(data.gcBalance);
      setUnlockMsg({ code: data.code, label: data.label });
      setTimeout(() => setUnlockMsg(null), 3000);
      fetchCoupons();
      showPopup({
        emoji:    '🔓',
        title:    `${data.label} Unlocked!`,
        subtitle: `${data.code} is ready to use at checkout · Balance: ${data.gcBalance} GC`,
        type:     'coupon',
      });
    } catch {
      showToast('Failed to unlock coupon. Try again.');
    } finally {
      setUnlocking(null);
    }
  };

  return (
    <>
      <nav className={`navbar${scrolled ? ' scrolled' : ''}`} aria-label="Main navigation">
        <a href="#" className="nav-logo" onClick={e => { e.preventDefault(); onNavClick?.(null, null); }}>
          DIS<span>·</span>TRICT
        </a>

        <ul className="nav-links" role="list">
          {navLinks.map(link => (
            <li key={link.label}>
              <a href="#" onClick={e => { e.preventDefault(); onNavClick?.(link.page, link.scroll ?? null); }}>
                {link.label}
              </a>
            </li>
          ))}
        </ul>

        <div className="nav-search-bar" role="search">
          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input type="search" placeholder="Search brands, products…" aria-label="Search" />
        </div>

        <div className="nav-actions">
          <button className="ai-assistant-btn" onClick={onAIOpen} aria-label="Open AI Assistant">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7h1a1 1 0 0 1 0 2h-1v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1H2a1 1 0 0 1 0-2h1a7 7 0 0 1 7-7h1V5.73A2 2 0 0 1 10 4a2 2 0 0 1 2-2z"/>
              <circle cx="9" cy="14" r="1" fill="currentColor"/>
              <circle cx="15" cy="14" r="1" fill="currentColor"/>
            </svg>
            <span className="ai-btn-label">AI Assistant</span>
          </button>

          {/* Coupons button */}
          <button
            className={`nav-coupon-btn${couponsOpen ? ' nav-coupon-btn--active' : ''}`}
            onClick={() => { if (!user) { onAuthOpen?.(); return; } setCouponsOpen(v => !v); }}
            aria-label="View coupons"
          >
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M20 12V22H4V12"/><path d="M22 7H2v5h20V7z"/>
              <path d="M12 22V7"/>
              <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/>
              <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/>
            </svg>
            <span className="nav-coupon-label">Coupons</span>
            {user && coupons.some(c => c.isUnlocked) && (
              <span className="nav-coupon-dot" />
            )}
          </button>

          {/* Auth */}
          {user ? (
            <div className="nav-user-menu">
              <button className="nav-user-btn" onClick={onAccountOpen} aria-label="My account">
                <span className="nav-user-avatar">{user.name.charAt(0).toUpperCase()}</span>
                <span className="nav-user-name nav-btn--desktop">{user.name.split(' ')[0]}</span>
              </button>
              <div className="nav-user-dropdown">
                <div className="nav-dropdown-info">
                  <div className="nav-dropdown-name">{user.name}</div>
                  <div className="nav-dropdown-email">{user.email}</div>
                  <div className="nav-gc-badge"><span>🌿</span> {gcBalance} Green Credits</div>
                </div>
                <div className="nav-dropdown-divider" />
                <button className="nav-dropdown-item" onClick={onAccountOpen}>
                  <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                  </svg>
                  My Account
                </button>
                <button className="nav-dropdown-item" onClick={onAccountOpen}>
                  <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
                    <line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/>
                  </svg>
                  My Orders
                </button>
                <div className="nav-dropdown-divider" />
                <button className="nav-dropdown-item" onClick={logout}>
                  <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                    <polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
                  </svg>
                  Sign Out
                </button>
              </div>
            </div>
          ) : (
            <button className="nav-login-btn nav-btn--desktop" onClick={onAuthOpen}>Sign In</button>
          )}

          <button className="nav-btn nav-btn--desktop" aria-label="Wishlist">
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
          </button>

          <button className="nav-btn" aria-label={`Cart, ${cartCount} items`} onClick={() => setCartOpen(true)}>
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
              <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
              <line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/>
            </svg>
            {cartCount > 0 && <span className="cart-count" aria-live="polite">{cartCount}</span>}
          </button>

          {!user && (
            <button className="nav-btn nav-login-mobile" onClick={onAuthOpen} style={{ display: 'none' }}>
              <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
              </svg>
            </button>
          )}

          <button className="hamburger nav-btn" onClick={onMenuOpen} aria-label="Open menu">
            <span /><span /><span />
          </button>
        </div>
      </nav>

      {/* Coupon panel backdrop */}
      {couponsOpen && <div className="coupon-backdrop" onClick={() => setCouponsOpen(false)} />}

      {/* Coupon panel */}
      <aside className={`coupon-panel${couponsOpen ? ' coupon-panel--open' : ''}`} aria-label="Coupons">
        {/* Header */}
        <div className="coupon-panel-header">
          <div className="coupon-panel-title">
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M20 12V22H4V12"/><path d="M22 7H2v5h20V7z"/>
              <path d="M12 22V7"/>
              <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/>
              <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/>
            </svg>
            Coupons
          </div>
          <button className="coupon-panel-close" onClick={() => setCouponsOpen(false)}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* GC balance + unlock success */}
        <div className="coupon-gc-strip">
          <span className="coupon-gc-leaf">🌿</span>
          <div style={{ flex: 1 }}>
            <div className="coupon-gc-bal">{gcBalance} Green Credits</div>
            <div className="coupon-gc-hint">Spend GC to unlock discount coupons</div>
          </div>
        </div>

        {unlockMsg && (
          <div className="coupon-unlock-success">
            <svg width="16" height="16" fill="none" stroke="#48C479" strokeWidth="2.5" viewBox="0 0 24 24">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
            <strong>{unlockMsg.label}</strong> unlocked! Copy the code below.
          </div>
        )}

        {/* Coupon cards */}
        <div className="coupon-list">
          {coupons.map(c => (
            <div
              key={c.code}
              className={`coupon-card${c.isUnlocked ? ' coupon-card--unlocked' : ''}${!c.isUnlocked && !c.canAfford ? ' coupon-card--locked' : ''}`}
              style={{ '--coupon-color': c.color }}
            >
              <div className="coupon-card-left">
                <div className="coupon-value">
                  <span className="coupon-emoji">{c.emoji}</span>
                  {c.type === 'flat' ? `₹${c.value}` : `${c.value}%`}
                  <span className="coupon-off">OFF</span>
                </div>
                <div className="coupon-label">{c.label}</div>
                <div className="coupon-desc">{c.description}</div>
                {c.minOrder > 0 && (
                  <div className="coupon-min">Min order ₹{c.minOrder.toLocaleString('en-IN')}</div>
                )}
                {/* GC cost or unlocked badge */}
                {c.isUnlocked ? (
                  <div className="coupon-unlocked-tag">✓ Unlocked — use code at checkout</div>
                ) : (
                  <div className={`coupon-gc-cost${c.canAfford ? ' coupon-gc-cost--afford' : ''}`}>
                    🌿 {c.gcCost} GC to unlock
                    {!c.canAfford && ` (need ${c.gcCost - gcBalance} more GC)`}
                  </div>
                )}
              </div>

              <div className="coupon-card-right">
                {c.isUnlocked ? (
                  <>
                    <div className="coupon-code-box">
                      <span className="coupon-code">{c.code}</span>
                    </div>
                    <button
                      className={`coupon-copy-btn${copiedCode === c.code ? ' coupon-copy-btn--copied' : ''}`}
                      onClick={() => handleCopy(c.code)}
                    >
                      {copiedCode === c.code ? (
                        <><svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>Copied!</>
                      ) : (
                        <><svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>Copy</>
                      )}
                    </button>
                  </>
                ) : (
                  <>
                    <div className="coupon-code-box coupon-code-box--locked">
                      <span className="coupon-code coupon-code--hidden">••••••</span>
                    </div>
                    <button
                      className={`coupon-unlock-btn${!c.canAfford ? ' coupon-unlock-btn--cant' : ''}`}
                      onClick={() => c.canAfford && handleUnlock(c.code)}
                      disabled={!c.canAfford || unlocking === c.code}
                    >
                      {unlocking === c.code
                        ? <span className="auth-spinner" style={{ width: 12, height: 12 }} />
                        : c.canAfford ? `Unlock · ${c.gcCost} GC` : `${c.gcCost} GC`}
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </aside>
    </>
  );
}
