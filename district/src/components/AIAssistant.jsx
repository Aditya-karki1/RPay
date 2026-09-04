import { useState, useRef, useEffect, useCallback } from 'react';
import { useApp }  from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { parseMessage, resolveAction, initLiveCatalog, getCatalogSnapshot } from '../utils/aiAgent';

const WELCOME = [
  { id: 1, type: 'bot', text: "Hey! 👋 I'm your District AI assistant — I can add items to your cart, place orders, find deals, and more.", time: 'Now' },
  { id: 2, type: 'bot', text: "Try: *Add Nike Dunks to cart* or *Show me sneakers under ₹5000*", time: 'Now' },
];

const QUICK_PROMPTS = [
  { icon: '🛒', label: 'Add Nike Dunks' },
  { icon: '👟', label: 'Show me sneakers' },
  { icon: '💸', label: 'Sale items' },
  { icon: '📦', label: 'My orders' },
];

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

function loadRazorpayScript() {
  return new Promise(resolve => {
    if (window.Razorpay) { resolve(true); return; }
    const s = document.createElement('script');
    s.src = 'https://checkout.razorpay.com/v1/checkout.js';
    s.onload  = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });
}

function renderText(text) {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|\n)/g);
  return parts.map((p, i) => {
    if (p.startsWith('**') && p.endsWith('**')) return <strong key={i}>{p.slice(2, -2)}</strong>;
    if (p.startsWith('*') && p.endsWith('*')) return <em key={i}>{p.slice(1, -1)}</em>;
    if (p === '\n') return <br key={i} />;
    return p;
  });
}

export default function AIAssistant({ isOpen, onOpen, onClose, onAccountOpen, initialQuery }) {
  const { cartItems, addToCart, removeFromCart, clearCart, setCartOpen } = useApp();
  const { getToken, user } = useAuth();

  const [messages,  setMessages]  = useState(WELCOME);
  const [input,     setInput]     = useState('');
  const [typing,    setTyping]    = useState(false);
  const [listening, setListening] = useState(false);
  const [micError,  setMicError]  = useState('');
  const [dragPos,   setDragPos]   = useState(null); // { top, left } or null = use CSS default
  const bottomRef      = useRef(null);
  const recognitionRef = useRef(null);
  const panelRef       = useRef(null);
  const dragState      = useRef(null); // { startX, startY, startTop, startLeft }
  // keep a live ref to cartItems so sendMessage closure always has fresh cart
  const cartRef = useRef(cartItems);
  useEffect(() => { cartRef.current = cartItems; }, [cartItems]);

  // track the last products displayed so pronoun refs ("them", "those") can resolve
  const lastProductsRef = useRef([]);

  const onDragStart = useCallback((e) => {
    if (e.button !== 0) return;
    const rect = panelRef.current.getBoundingClientRect();
    dragState.current = { startX: e.clientX, startY: e.clientY, startTop: rect.top, startLeft: rect.left };
    e.preventDefault();

    const onMove = (ev) => {
      const { startX, startY, startTop, startLeft } = dragState.current;
      const W = panelRef.current.offsetWidth;
      const H = panelRef.current.offsetHeight;
      const left = Math.min(Math.max(startLeft + ev.clientX - startX, 0), window.innerWidth  - W);
      const top  = Math.min(Math.max(startTop  + ev.clientY - startY, 0), window.innerHeight - H);
      setDragPos({ top, left });
    };
    const onUp = () => {
      dragState.current = null;
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup',   onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup',   onUp);
  }, []);

  // Seed live merchant catalog into the AI on first open
  useEffect(() => { initLiveCatalog(); }, []);

  // Reset chat whenever the logged-in user changes (login / logout / switch)
  useEffect(() => {
    setMessages(WELCOME);
    lastProductsRef.current = [];
    setInput('');
  }, [user?._id ?? user?.email]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typing]);

  useEffect(() => {
    if (!isOpen) { stopListening(); setDragPos(null); }
  }, [isOpen]); // eslint-disable-line

  // Auto-send query injected from outside (e.g. Zomato search bar)
  useEffect(() => {
    if (initialQuery?.text && isOpen) {
      sendMessage(initialQuery.text);
    }
  }, [initialQuery?.key]); // eslint-disable-line

  /* ── upsell acceptance tracking ──────────────────────────── */
  const trackUpsellAccept = useCallback((product, triggerProduct) => {
    const token = getToken();
    if (!token) return;
    fetch('/api/agent/upsell/accept', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body:    JSON.stringify({
        productId:      String(product.id || product._id || ''),
        productName:    product.name,
        productBrand:   product.brand,
        price:          product.price,
        triggerProduct: triggerProduct?.name || '',
      }),
    }).catch(() => {});
  }, [getToken]);

  /* ── upsell ───────────────────────────────────────────────── */
  const fetchUpsell = useCallback(async (item) => {
    const token = getToken();
    if (!token) return;

    // Skip upsell for recipe/food ingredients
    if (String(item?.id || '').startsWith('r-')) return;

    try {
      const allProducts = getCatalogSnapshot();
      const res  = await fetch('/api/agent/upsell', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body:    JSON.stringify({ item, cartItems: cartRef.current, allProducts }),
      });
      if (!res.ok) return;
      const data = await res.json();
      if (!data.suggestions?.length) return;
      const lines = data.suggestions.map(s => `• **${s.product.name}** — ${s.reason}`).join('\n');
      const upsellProducts = data.suggestions.map(s => s.product);
      lastProductsRef.current = upsellProducts;
      setMessages(prev => [...prev, {
        id:      Date.now() + 10,
        type:    'bot',
        text:    `You might also like:\n${lines}`,
        upsells: upsellProducts,
        trigger: item,
        time:    'Now',
      }]);
    } catch {
      // upsell is best-effort
    }
  }, [getToken]);

  /* ── order placement via Razorpay ────────────────────────── */
  const logPaymentFailure = async (reason, amount) => {
    const token = getToken();
    if (!token) return;
    fetch('/api/payment/log-failure', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body:    JSON.stringify({ reason, amount }),
    }).catch(() => {});
  };

  const placeOrder = async (items, total) => {
    const token = getToken();
    if (!token) return { error: 'Please sign in first to place orders.' };
    try {
      // Step 1 — create Razorpay order on server
      const initRes  = await fetch('/api/payment/create-order', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body:    JSON.stringify({ amount: total }),
      });
      const initData = await initRes.json();
      if (!initRes.ok) {
        const reason = initData.error || 'Payment gateway error';
        await logPaymentFailure(reason, total);
        return { error: `Payment failed: ${reason}` };
      }

      // Step 2 — load Razorpay SDK
      const loaded = await loadRazorpayScript();
      if (!loaded) {
        await logPaymentFailure('Razorpay SDK failed to load', total);
        return { error: 'Payment gateway could not load. Check your connection and try again.' };
      }

      // Step 3 — open Razorpay checkout modal and await outcome
      return await new Promise(resolve => {
        const rzp = new window.Razorpay({
          key:         initData.key,
          amount:      initData.amount,
          currency:    initData.currency,
          order_id:    initData.rzpOrderId,
          name:        'District',
          description: `${items.length} item${items.length > 1 ? 's' : ''}`,
          prefill:     { name: user?.name, email: user?.email },
          theme:       { color: '#C8FF00' },

          handler: async (response) => {
            // Step 4 — verify HMAC signature on server
            try {
              const vRes  = await fetch('/api/payment/verify', {
                method:  'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body:    JSON.stringify({
                  razorpay_order_id:   response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature:  response.razorpay_signature,
                  items,
                  total,
                }),
              });
              const vData = await vRes.json();
              if (!vRes.ok) {
                logPaymentFailure(vData.error || 'Signature verification failed', total);
                resolve({ error: `Verification failed: ${vData.error || 'invalid signature'}. You were NOT charged.` });
              } else {
                resolve({ order: vData.order });
              }
            } catch (e) {
              logPaymentFailure(e.message, total);
              resolve({ error: 'Verification error. Contact support if you were charged.' });
            }
          },

          modal: { ondismiss: () => resolve({ dismissed: true }) },
        });
        rzp.open();
      });
    } catch (err) {
      logPaymentFailure(err.message, total);
      return { error: `Payment error: ${err.message}` };
    }
  };

  /* ── core send ────────────────────────────────────────────── */
  const sendMessage = useCallback(async (text) => {
    if (!text.trim()) return;
    setMessages(prev => [...prev, { id: Date.now(), type: 'user', text, time: 'Now' }]);
    setInput('');
    setTyping(true);

    await new Promise(r => setTimeout(r, 550));

    const cart   = cartRef.current;
    const parsed = parseMessage(text);
    const { intent, query } = parsed;
    const action = resolveAction(intent, query, cart, { recipe: parsed.recipe, lastProducts: lastProductsRef.current });

    // Execute the resolved action
    if (action.type === 'ADD_RECIPE' && action.ingredients?.length) {
      action.ingredients.forEach(ing => addToCart({ ...ing, qty: 1 }));
      setTimeout(() => fetchUpsell(action.ingredients[0]), 1200);
    } else if (action.type === 'ADD_ALL_TO_CART' && action.products?.length) {
      action.products.forEach(p => addToCart(p));
      lastProductsRef.current = [];
    } else if (action.type === 'ADD_TO_CART' && action.product) {
      addToCart(action.product);
      setTimeout(() => fetchUpsell(action.product), 1200);
    } else if (action.type === 'REMOVE_FROM_CART' && action.id) {
      removeFromCart(action.id);
    } else if (action.type === 'CLEAR_CART') {
      clearCart();
    } else if (action.type === 'OPEN_CART') {
      onClose();
      setTimeout(() => setCartOpen(true), 200);
    } else if (action.type === 'SHOW_ORDERS') {
      onClose();
      setTimeout(() => onAccountOpen?.(), 200);
    } else if (action.type === 'PLACE_ORDER') {
      if (!cart.length) {
        action.reply = 'Your cart is empty — add some items before placing an order!';
      } else {
        const total = cart.reduce((s, i) => s + i.price * i.qty, 0);
        const items = cart.map(i => ({
          productId: String(i.id), name: i.name, brand: i.brand,
          price: i.price, qty: i.qty, img: i.img,
        }));
        const result = await placeOrder(items, total);
        if (result.dismissed) {
          action.reply = "Payment cancelled — your cart is saved whenever you're ready!";
        } else if (result.error) {
          action.reply = result.error;
        } else {
          clearCart();
          action.reply = `Payment successful! 🎉 Order **${result.order.orderRef}** confirmed via Razorpay.\nExpected delivery in 3–5 business days.`;
        }
      }
    }

    const botMsg = {
      id:          Date.now() + 1,
      type:        'bot',
      text:        action.reply,
      products:    action.products    || null,
      productCard: action.product_card || null,
      time:        'Now',
    };
    if (botMsg.products?.length) lastProductsRef.current = botMsg.products;
    setMessages(prev => [...prev, botMsg]);
    setTyping(false);
  }, [addToCart, removeFromCart, clearCart, setCartOpen, onClose, onAccountOpen, getToken, fetchUpsell]);

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input); }
  };

  /* ── voice input ──────────────────────────────────────────── */
  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    setListening(false);
  }, []);

  const toggleMic = useCallback(() => {
    if (listening) { stopListening(); return; }
    if (!SpeechRecognition) {
      setMicError('Voice input not supported in this browser.');
      setTimeout(() => setMicError(''), 3000);
      return;
    }
    const rec = new SpeechRecognition();
    rec.lang = 'en-IN'; rec.interimResults = true; rec.maxAlternatives = 1;
    recognitionRef.current = rec;
    rec.onstart  = () => { setListening(true); setMicError(''); };
    rec.onresult = (e) => {
      const t = Array.from(e.results).map(r => r[0].transcript).join('');
      setInput(t);
      if (e.results[e.results.length - 1].isFinal) { stopListening(); sendMessage(t); }
    };
    rec.onerror  = (e) => {
      setMicError(e.error === 'not-allowed' ? 'Microphone access denied.' : 'Voice input error.');
      setTimeout(() => setMicError(''), 3500);
      stopListening();
    };
    rec.onend = () => setListening(false);
    rec.start();
  }, [listening, stopListening, sendMessage]);

  const hasUserMsg = messages.some(m => m.type === 'user');

  return (
    <>
      {/* Floating trigger bubble */}
      <button
        className={`ai-fab${isOpen ? ' ai-fab--hidden' : ''}`}
        onClick={onOpen}
        aria-label="Open AI Assistant"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7h1a1 1 0 0 1 0 2h-1v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1H2a1 1 0 0 1 0-2h1a7 7 0 0 1 7-7h1V5.73A2 2 0 0 1 10 4a2 2 0 0 1 2-2z"/>
          <circle cx="9" cy="14" r="1" fill="currentColor"/>
          <circle cx="15" cy="14" r="1" fill="currentColor"/>
        </svg>
      </button>

      <aside
        ref={panelRef}
        className={`ai-panel${isOpen ? ' ai-panel--open' : ''}`}
        style={dragPos ? { top: dragPos.top, left: dragPos.left, bottom: 'auto', right: 'auto' } : undefined}
        aria-label="AI Assistant"
        role="complementary"
      >

        {/* Header — drag handle */}
        <div className="ai-panel-header" onMouseDown={onDragStart} style={{ cursor: 'grab' }}>
          <div className="ai-panel-brand">
            <div className="ai-avatar">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7h1a1 1 0 0 1 0 2h-1v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1H2a1 1 0 0 1 0-2h1a7 7 0 0 1 7-7h1V5.73A2 2 0 0 1 10 4a2 2 0 0 1 2-2z"/>
                <circle cx="9" cy="14" r="1" fill="currentColor"/>
                <circle cx="15" cy="14" r="1" fill="currentColor"/>
              </svg>
            </div>
            <div>
              <div className="ai-panel-title">AI Assistant</div>
              <div className="ai-panel-status">
                <span className="ai-status-dot" />
                Agentic · Shopping mode
              </div>
            </div>
          </div>
          <button className="ai-close-btn" onClick={onClose} aria-label="Close AI Assistant">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Messages */}
        <div className="ai-messages">
          {!hasUserMsg && (
            <div className="ai-doodle-welcome">
              <svg width="90" height="100" viewBox="0 0 90 100" fill="none" className="ai-robot-doodle">
                <line x1="45" y1="6" x2="45" y2="20" stroke="#7c6ef5" strokeWidth="2.5" strokeLinecap="round"/>
                <circle cx="45" cy="4" r="4.5" fill="#7c6ef5"/>
                <circle cx="45" cy="4" r="2" fill="#c4b5fd"/>
                <rect x="14" y="18" width="62" height="44" rx="14" fill="#ede9fe" stroke="#7c6ef5" strokeWidth="2.2"/>
                <rect x="7" y="30" width="7" height="16" rx="3.5" fill="#7c6ef5"/>
                <rect x="76" y="30" width="7" height="16" rx="3.5" fill="#7c6ef5"/>
                <circle cx="32" cy="37" r="9" fill="#7c6ef5"/>
                <circle cx="58" cy="37" r="9" fill="#7c6ef5"/>
                <circle cx="29.5" cy="34.5" r="3" fill="white"/>
                <circle cx="55.5" cy="34.5" r="3" fill="white"/>
                <circle cx="28" cy="33" r="1.2" fill="#c4b5fd"/>
                <circle cx="54" cy="33" r="1.2" fill="#c4b5fd"/>
                <path d="M 33 50 Q 45 59 57 50" stroke="#7c6ef5" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
                <rect x="18" y="64" width="54" height="30" rx="10" fill="#ddd6fe" stroke="#7c6ef5" strokeWidth="2"/>
                <circle cx="38" cy="76" r="5" fill="#7c6ef5" opacity="0.65"/>
                <circle cx="52" cy="76" r="5" fill="#a78bfa" opacity="0.65"/>
                <rect x="39" y="85" width="12" height="4" rx="2" fill="#7c6ef5" opacity="0.35"/>
                <rect x="4" y="68" width="13" height="8" rx="4" fill="#ddd6fe" stroke="#7c6ef5" strokeWidth="1.8"/>
                <rect x="73" y="68" width="13" height="8" rx="4" fill="#ddd6fe" stroke="#7c6ef5" strokeWidth="1.8"/>
                <rect x="24" y="92" width="14" height="7" rx="3.5" fill="#c4b5fd" stroke="#7c6ef5" strokeWidth="1.8"/>
                <rect x="52" y="92" width="14" height="7" rx="3.5" fill="#c4b5fd" stroke="#7c6ef5" strokeWidth="1.8"/>
              </svg>
              <p className="ai-doodle-greeting">What can I get you?</p>
            </div>
          )}

          {messages.map(msg => (
            <div key={msg.id} className={`ai-msg ai-msg--${msg.type}`}>
              {msg.type === 'bot' && (
                <div className="ai-msg-avatar">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7h1a1 1 0 0 1 0 2h-1v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1H2a1 1 0 0 1 0-2h1a7 7 0 0 1 7-7h1V5.73A2 2 0 0 1 10 4a2 2 0 0 1 2-2z"/>
                    <circle cx="9" cy="14" r="1" fill="currentColor"/>
                    <circle cx="15" cy="14" r="1" fill="currentColor"/>
                  </svg>
                </div>
              )}
              <div className="ai-msg-bubble">
                <p className="ai-msg-text">{renderText(msg.text)}</p>

                {/* Single product added — confirmation card */}
                {msg.productCard && (
                  <div className="ai-confirm-card">
                    <img src={msg.productCard.img} alt={msg.productCard.name} className="ai-confirm-img" />
                    <div className="ai-confirm-info">
                      <div className="ai-confirm-brand">{msg.productCard.brand}</div>
                      <div className="ai-confirm-name">{msg.productCard.name}</div>
                      <div className="ai-confirm-price">₹{msg.productCard.price.toLocaleString('en-IN')}</div>
                    </div>
                    <span className="ai-confirm-check">✓</span>
                  </div>
                )}

                {/* Upsell suggestions */}
                {msg.upsells && msg.upsells.length > 0 && (
                  <div className="ai-product-grid">
                    {msg.upsells.filter(Boolean).map((p, i) => (
                      <div key={i} className="ai-product-card ai-product-card--upsell">
                        {p.img && <img src={p.img} alt={p.name} className="ai-product-img" />}
                        <div className="ai-product-info">
                          <div className="ai-product-brand">{p.brand}</div>
                          <div className="ai-product-name">{p.name}</div>
                          <div className="ai-product-price">₹{p.price?.toLocaleString('en-IN')}</div>
                        </div>
                        <button className="ai-product-add-btn" onClick={() => {
                          addToCart(p);
                          trackUpsellAccept(p, msg.trigger);
                        }}>+ Add</button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Product search results grid */}
                {msg.products && msg.products.length > 0 && (
                  <div className="ai-product-grid">
                    {msg.products.map(p => (
                      <div key={p.id} className="ai-product-card">
                        <img src={p.img} alt={p.name} className="ai-product-img" />
                        <div className="ai-product-info">
                          <div className="ai-product-brand">{p.brand}</div>
                          <div className="ai-product-name">{p.name}</div>
                          <div className="ai-product-price">₹{p.price.toLocaleString('en-IN')}</div>
                        </div>
                        <button className="ai-product-add-btn" onClick={() => addToCart(p)}>+ Add</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}

          {typing && (
            <div className="ai-msg ai-msg--bot">
              <div className="ai-msg-avatar">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7h1a1 1 0 0 1 0 2h-1v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1H2a1 1 0 0 1 0-2h1a7 7 0 0 1 7-7h1V5.73A2 2 0 0 1 10 4a2 2 0 0 1 2-2z"/>
                  <circle cx="9" cy="14" r="1" fill="currentColor"/>
                  <circle cx="15" cy="14" r="1" fill="currentColor"/>
                </svg>
              </div>
              <div className="ai-msg-bubble ai-typing"><span /><span /><span /></div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Quick prompts */}
        <div className="ai-quick-prompts">
          {QUICK_PROMPTS.map(p => (
            <button key={p.label} className="ai-quick-btn" onClick={() => sendMessage(p.label)}>
              {p.icon} {p.label}
            </button>
          ))}
        </div>

        {micError && <div className="ai-mic-error">{micError}</div>}

        {/* Input bar */}
        <div className="ai-input-bar">
          <button
            className={`ai-mic-btn${listening ? ' ai-mic-btn--active' : ''}`}
            onClick={toggleMic}
            aria-label={listening ? 'Stop voice input' : 'Start voice input'}
          >
            {listening ? (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <rect x="6" y="6" width="12" height="12" rx="2"/>
              </svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                <line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/>
              </svg>
            )}
            {listening && <span className="ai-mic-ring" />}
          </button>

          <input
            type="text"
            className={`ai-input${listening ? ' ai-input--listening' : ''}`}
            placeholder={listening ? 'Listening… speak now' : 'Add to cart, search, order…'}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
            aria-label="Message AI Assistant"
          />

          <button
            className="ai-send-btn"
            onClick={() => sendMessage(input)}
            disabled={!input.trim()}
            aria-label="Send message"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="22" y1="2" x2="11" y2="13"/>
              <polygon points="22 2 15 22 11 13 2 9 22 2"/>
            </svg>
          </button>
        </div>
      </aside>
    </>
  );
}
