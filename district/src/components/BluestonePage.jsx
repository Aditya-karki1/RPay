import { useState } from 'react';
import { useApp } from '../context/AppContext';

const categories = [
  { label: 'Rings',            img: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=600&q=80', span: 'tall' },
  { label: 'Earrings',         img: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=600&q=80', span: 'normal' },
  { label: 'Pendants',         img: 'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=600&q=80', span: 'normal' },
  { label: 'Necklaces',        img: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=600&q=80', span: 'tall' },
  { label: 'Chains',           img: 'https://images.unsplash.com/photo-1588444837495-c6cfeb53f32d?w=600&q=80', span: 'normal' },
  { label: 'Bangles',          img: 'https://images.unsplash.com/photo-1602173574767-37ac01994b2a?w=600&q=80', span: 'normal' },
  { label: 'Watch Accessories',img: 'https://images.unsplash.com/photo-1617038260897-41a1f14a8ca0?w=600&q=80', span: 'normal' },
  { label: 'Gold Coins',       img: 'https://images.unsplash.com/photo-1610375461246-83df859d849d?w=600&q=80', span: 'normal' },
  { label: 'Bracelets',        img: 'https://images.unsplash.com/photo-1506630448388-4e683c67ddb0?w=600&q=80', span: 'normal' },
];

const featured = [
  { name: 'Eternal Bloom Ring',        metal: '18KT Rose Gold', stone: 'Diamond', price: '₹42,500', originalPrice: '₹52,000', img: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=500&q=80', badge: 'Bestseller' },
  { name: 'Cascade Drop Earrings',     metal: '22KT Yellow Gold', stone: 'Emerald', price: '₹28,900', originalPrice: null, img: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=500&q=80', badge: 'New' },
  { name: 'Heart Solitaire Pendant',   metal: '18KT White Gold', stone: 'Diamond', price: '₹35,200', originalPrice: '₹41,000', img: 'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=500&q=80', badge: null },
  { name: 'Royal Choker Necklace',     metal: '22KT Yellow Gold', stone: 'Ruby', price: '₹1,18,000', originalPrice: '₹1,40,000', img: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=500&q=80', badge: 'Luxury' },
  { name: 'Infinity Bangle Set',       metal: '18KT Rose Gold', stone: 'Diamond', price: '₹64,500', originalPrice: null, img: 'https://images.unsplash.com/photo-1602173574767-37ac01994b2a?w=500&q=80', badge: 'New' },
  { name: 'Heritage Chain',            metal: '22KT Yellow Gold', stone: null, price: '₹31,000', originalPrice: '₹36,500', img: 'https://images.unsplash.com/photo-1588444837495-c6cfeb53f32d?w=500&q=80', badge: null },
  { name: 'Serpent Bracelet',          metal: '18KT White Gold', stone: 'Sapphire', price: '₹52,800', originalPrice: null, img: 'https://images.unsplash.com/photo-1506630448388-4e683c67ddb0?w=500&q=80', badge: 'Luxury' },
  { name: 'Diamond Tennis Bracelet',   metal: '18KT White Gold', stone: 'Diamond', price: '₹89,000', originalPrice: '₹1,05,000', img: 'https://images.unsplash.com/photo-1584302179602-e4c3d3fd629d?w=500&q=80', badge: 'Bestseller' },
];

const collections = [
  { name: 'The Bridal Edit',  sub: 'Crafted for your forever',  img: 'https://images.unsplash.com/photo-1600721391776-b5cd0e0048f9?w=700&q=80' },
  { name: 'Office Luxe',      sub: 'Everyday elegance',         img: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=700&q=80' },
  { name: 'Men\'s Gold',      sub: 'Bold. Refined. Timeless.',  img: 'https://images.unsplash.com/photo-1598560917807-1bae44bd2be8?w=700&q=80' },
];

export default function BluestonePage({ onClose }) {
  const { addToCart } = useApp();
  const [wishlist, setWishlist] = useState(new Set());
  const [added, setAdded] = useState(null);

  const toggleWish = name => setWishlist(prev => {
    const next = new Set(prev);
    next.has(name) ? next.delete(name) : next.add(name);
    return next;
  });

  const handleAdd = (p) => {
    addToCart({
      id:    `bluestone-${p.name}`,
      name:  p.name,
      brand: `BlueStone · ${p.metal}${p.stone ? ` · ${p.stone}` : ''}`,
      price: parseInt(p.price.replace(/[₹,]/g, '')),
      img:   p.img,
      qty:   1,
    });
    setAdded(p.name);
    setTimeout(() => setAdded(null), 2000);
  };

  return (
    <div className="bs-page">

      {/* ── Header ── */}
      <div className="bs-header">
        <button className="zomato-back" onClick={onClose} aria-label="Go back">
          <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
          Back
        </button>
        <div className="bs-brand">
          <span className="bs-logo">BlueStone</span>
          <span className="bs-tagline">Fine Jewellery · Since 2011</span>
        </div>
        <div className="bs-header-actions">
          <span className="bs-trust">🔒 BIS Hallmarked &nbsp;·&nbsp; 30-Day Returns &nbsp;·&nbsp; Free Delivery</span>
        </div>
      </div>

      {/* ── Hero ── */}
      <div className="bs-hero">
        <img src="https://images.unsplash.com/photo-1583292650898-7d22cd27ca6f?w=1600&q=85" alt="Luxury jewellery" className="bs-hero-img" />
        <div className="bs-hero-overlay">
          <p className="bs-hero-eyebrow">The New Luxe Edit</p>
          <h1 className="bs-hero-title">Where Gold Meets<br/>Brilliance</h1>
          <p className="bs-hero-sub">Handcrafted fine jewellery in 18KT & 22KT gold, set with certified diamonds & gemstones.</p>
          <div className="bs-hero-ctas">
            <button className="bs-btn-primary">Shop Now</button>
            <button className="bs-btn-ghost">Explore Collections</button>
          </div>
        </div>
      </div>

      <div className="bs-body">

        {/* ── Shop by Category ── */}
        <section className="bs-section">
          <h2 className="bs-section-title">Shop By <span>Category</span></h2>
          <div className="bs-cat-grid">
            {categories.map(c => (
              <div key={c.label} className={`bs-cat-card bs-cat-${c.span}`}>
                <img src={c.img} alt={c.label} className="bs-cat-img" loading="lazy" />
                <div className="bs-cat-overlay">
                  <span className="bs-cat-label">{c.label}</span>
                  <span className="bs-cat-cta">Explore →</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Collections ── */}
        <section className="bs-section">
          <h2 className="bs-section-title">Curated <span>Collections</span></h2>
          <div className="bs-col-grid">
            {collections.map(c => (
              <div key={c.name} className="bs-col-card">
                <img src={c.img} alt={c.name} className="bs-col-img" loading="lazy" />
                <div className="bs-col-info">
                  <div className="bs-col-name">{c.name}</div>
                  <div className="bs-col-sub">{c.sub}</div>
                  <button className="bs-col-btn">View Collection</button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Featured Products ── */}
        <section className="bs-section">
          <h2 className="bs-section-title">Featured <span>Pieces</span></h2>
          <div className="bs-product-grid">
            {featured.map(p => (
              <div key={p.name} className="bs-product-card">
                <div className="bs-product-img-wrap">
                  <img src={p.img} alt={p.name} className="bs-product-img" loading="lazy" />
                  {p.badge && <span className={`bs-badge bs-badge-${p.badge.toLowerCase()}`}>{p.badge}</span>}
                  <button
                    className={`bs-wish-btn${wishlist.has(p.name) ? ' active' : ''}`}
                    onClick={() => toggleWish(p.name)}
                    aria-label="Wishlist"
                  >♡</button>
                  <button className="bs-add-overlay" onClick={() => handleAdd(p)}>
                    {added === p.name ? '✓ Added' : '+ Add to Cart'}
                  </button>
                </div>
                <div className="bs-product-info">
                  <div className="bs-product-name">{p.name}</div>
                  <div className="bs-product-meta">
                    {p.metal}{p.stone ? ` · ${p.stone}` : ''}
                  </div>
                  <div className="bs-product-price-row">
                    <span className="bs-price">{p.price}</span>
                    {p.originalPrice && <span className="bs-price-original">{p.originalPrice}</span>}
                  </div>
                  <div className="bs-emi">EMI from ₹{Math.round(parseInt(p.price.replace(/[₹,]/g,'')) / 12).toLocaleString('en-IN')}/mo</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Trust Strip ── */}
        <div className="bs-trust-strip">
          {[
            { icon: '💎', title: 'BIS Hallmarked', sub: '100% certified gold & diamonds' },
            { icon: '🔄', title: '30-Day Returns',  sub: 'No questions asked policy' },
            { icon: '🚚', title: 'Free Delivery',   sub: 'On all orders above ₹999' },
            { icon: '🛡️', title: 'Lifetime Exchange', sub: 'On all BlueStone jewellery' },
          ].map(t => (
            <div key={t.title} className="bs-trust-item">
              <span className="bs-trust-icon">{t.icon}</span>
              <div>
                <div className="bs-trust-title">{t.title}</div>
                <div className="bs-trust-sub">{t.sub}</div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
