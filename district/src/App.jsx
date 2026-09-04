import { useState, useEffect } from 'react';
import { AppProvider } from './context/AppContext';
import { AuthProvider } from './context/AuthContext';
import { newArrivals, bestSellers } from './data/products';
import Navbar              from './components/Navbar';
import MobileNav           from './components/MobileNav';
import HeroCarousel        from './components/HeroCarousel';
import CategoryGrid        from './components/CategoryGrid';
import ProductGrid         from './components/ProductGrid';
import BrandMarquee        from './components/BrandMarquee';
import PromoStrip          from './components/PromoStrip';
import Newsletter          from './components/Newsletter';
import Footer              from './components/Footer';
import Toast               from './components/Toast';
import CelebrationPopup    from './components/CelebrationPopup';
import ZomatoPage          from './components/ZomatoPage';
import PVRInoxPage         from './components/PVRInoxPage';
import BluestonePage       from './components/BluestonePage';
import AIAssistant         from './components/AIAssistant';
import CartPanel           from './components/CartPanel';
import AccountPanel        from './components/AccountPanel';
import AuthModal           from './components/AuthModal';
import MerchantLoginPage   from './components/MerchantLoginPage';
import MerchantDashboard   from './components/MerchantDashboard';
import HubStrip            from './components/HubStrip';

function mapDbProduct(p) {
  return {
    id:    p.id,
    brand: p.brand,
    name:  p.name,
    price: p.price,
    orig:  p.originalPrice || null,
    badge: p.badge ? p.badge.toLowerCase() : null,
    img:   p.img,
  };
}

export default function App() {
  const [menuOpen,    setMenuOpen]    = useState(false);
  const [activePage,  setActivePage]  = useState(null);
  const [pendingScroll, setPendingScroll] = useState(null);
  const [aiOpen,      setAiOpen]      = useState(false);
  const [authOpen,    setAuthOpen]    = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [aiQuery,     setAiQuery]     = useState({ text: '', key: 0 });
  const [liveArrivals,    setLiveArrivals]    = useState(newArrivals);
  const [liveSellers,     setLiveSellers]     = useState(bestSellers);
  const [catalogLoading,  setCatalogLoading]  = useState(true);

  useEffect(() => {
    fetch('/api/agent/catalog')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.catalog?.length) {
          const mapped = data.catalog.map(mapDbProduct);
          const mid = Math.ceil(mapped.length / 2);
          setLiveArrivals(mapped.slice(0, mid));
          setLiveSellers(mapped.slice(mid));
        }
      })
      .catch(() => {})
      .finally(() => setCatalogLoading(false));
  }, []);

  const handleAIQuery = (text) => {
    setAiQuery({ text, key: Date.now() });
    setAiOpen(true);
  };

  // Merchant state
  const [merchantToken, setMerchantToken] = useState(() => localStorage.getItem('merchant_token'));
  const isMerchant = activePage === 'merchant';

  useEffect(() => {
    if (!activePage && pendingScroll) {
      const el = document.getElementById(pendingScroll);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
      setPendingScroll(null);
    }
  }, [activePage, pendingScroll]);

  const handleNavClick = (page, scrollId) => {
    setActivePage(page ?? null);
    if (!page && scrollId) setPendingScroll(scrollId);
  };

  function handleMerchantLogin(token) {
    setMerchantToken(token);
  }

  function handleMerchantLogout() {
    localStorage.removeItem('merchant_token');
    setMerchantToken(null);
    setActivePage(null);
  }

  // Merchant portal: full-screen takeover (no navbar/footer)
  if (isMerchant) {
    if (!merchantToken) {
      return <MerchantLoginPage onLogin={handleMerchantLogin} />;
    }
    return <MerchantDashboard onLogout={handleMerchantLogout} />;
  }

  return (
    <AuthProvider>
      <AppProvider>
        <Navbar
          onMenuOpen={() => setMenuOpen(true)}
          onNavClick={handleNavClick}
          onAIOpen={() => setAiOpen(true)}
          onAuthOpen={() => setAuthOpen(true)}
          onAccountOpen={() => setAccountOpen(true)}
        />
        <MobileNav isOpen={menuOpen} onClose={() => setMenuOpen(false)} onNavClick={handleNavClick} />

        {activePage === 'zomato' ? (
          <ZomatoPage onClose={() => setActivePage(null)} onAIQuery={handleAIQuery} />
        ) : activePage === 'pvrinox' ? (
          <PVRInoxPage onClose={() => setActivePage(null)} />
        ) : activePage === 'bluestone' ? (
          <BluestonePage onClose={() => setActivePage(null)} />
        ) : (
          <main>
            <HeroCarousel />
            <CategoryGrid />
            <ProductGrid id="arrivals" title="New"  accent="Arrivals" products={liveArrivals} loading={catalogLoading} />
            <HubStrip />
            <BrandMarquee />
            <PromoStrip />
            <ProductGrid title="Best" accent="Sellers" products={liveSellers} loading={catalogLoading} />
            <Newsletter />
          </main>
        )}

        {!activePage && <Footer onMerchantPortal={() => setActivePage('merchant')} />}

        <Toast />
        <CelebrationPopup />
        <CartPanel onAuthOpen={() => setAuthOpen(true)} />
        <AccountPanel
          isOpen={accountOpen}
          onClose={() => setAccountOpen(false)}
          onAuthOpen={() => { setAccountOpen(false); setAuthOpen(true); }}
        />
        <AIAssistant isOpen={aiOpen} onOpen={() => setAiOpen(true)} onClose={() => setAiOpen(false)} onAccountOpen={() => setAccountOpen(true)} initialQuery={aiQuery} />
        {authOpen && (
          <AuthModal
            onClose={() => setAuthOpen(false)}
            onMerchantLogin={(token) => {
              handleMerchantLogin(token);
              setActivePage('merchant');
              setAuthOpen(false);
            }}
          />
        )}
      </AppProvider>
    </AuthProvider>
  );
}
