import { createContext, useContext, useState, useCallback } from 'react';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [cartItems, setCartItems] = useState([]);
  const [toast,     setToast]     = useState({ message: '', visible: false });
  const [cartOpen,  setCartOpen]  = useState(false);
  const [popup,     setPopup]     = useState(null); // { emoji, title, subtitle, type }

  const cartCount = cartItems.reduce((s, i) => s + i.qty, 0);

  const showToast = useCallback((message) => {
    setToast({ message, visible: true });
    setTimeout(() => setToast(t => ({ ...t, visible: false })), 2800);
  }, []);

  const showPopup = useCallback((opts) => {
    // opts: { emoji, title, subtitle, type: 'coupon'|'credits'|'success' }
    setPopup({ ...opts, visible: true });
    setTimeout(() => setPopup(p => p ? { ...p, visible: false } : p), 3500);
  }, []);

  const addToCart = useCallback((product) => {
    setCartItems(prev => {
      const exists = prev.find(i => i.id === product.id);
      if (exists) return prev.map(i => i.id === product.id ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { ...product, qty: 1 }];
    });
    showToast(`Added to cart: ${product.name}`);
  }, [showToast]);

  const removeFromCart = useCallback((id) => {
    setCartItems(prev => prev.filter(i => i.id !== id));
  }, []);

  const changeQty = useCallback((id, delta) => {
    setCartItems(prev =>
      prev.map(i => i.id === id ? { ...i, qty: Math.max(1, i.qty + delta) } : i)
    );
  }, []);

  const clearCart = useCallback(() => setCartItems([]), []);

  return (
    <AppContext.Provider value={{
      cartItems, cartCount,
      addToCart, removeFromCart, changeQty, clearCart,
      toast, showToast,
      popup, showPopup,
      cartOpen, setCartOpen,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() { return useContext(AppContext); }
