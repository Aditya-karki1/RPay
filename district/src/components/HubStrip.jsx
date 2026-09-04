import { useState, useEffect } from 'react';
import { useApp }  from '../context/AppContext';
import { useAuth } from '../context/AuthContext';

export default function HubStrip() {
  const { addToCart, showToast } = useApp();
  const { getToken } = useAuth();
  const [items,   setItems]   = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/hubs/available')
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data?.items) setItems(data.items); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading || items.length === 0) return null;

  const handleAdd = (item) => {
    addToCart({
      id:             `hub-${item._id}`,
      name:           item.productName,
      brand:          item.productBrand,
      price:          item.hubPrice,
      img:            item.img,
      qty:            1,
      hubInventoryId: item._id,
      hubName:        item.hub?.name,
      instant:        true,
    });
  };

  return (
    <section className="hub-strip-section">
      <div className="hub-strip-header">
        <div className="hub-strip-eyebrow">⚡ District Local</div>
        <h2 className="hub-strip-title">Order Now · <span className="hub-strip-accent">Get Today</span></h2>
        <p className="hub-strip-sub">Returned items stored at hubs near you — verified condition, instant delivery</p>
      </div>

      <div className="hub-strip-scroll">
        {items.map(item => (
          <div key={item._id} className="hub-card">
            <div className="hub-card-img-wrap">
              {item.img
                ? <img src={item.img} alt={item.productName} className="hub-card-img" />
                : <div className="hub-card-img-placeholder">{item.productBrand?.[0]}</div>
              }
              <span className="hub-card-badge">⚡ Instant</span>
            </div>

            <div className="hub-card-info">
              <div className="hub-card-brand">{item.productBrand}</div>
              <div className="hub-card-name">{item.productName}</div>

              <div className="hub-card-price-row">
                <span className="hub-card-price">₹{item.hubPrice?.toLocaleString('en-IN')}</span>
                {item.originalPrice && item.originalPrice > item.hubPrice && (
                  <span className="hub-card-orig">₹{item.originalPrice?.toLocaleString('en-IN')}</span>
                )}
              </div>

              <div className="hub-card-hub">
                <svg width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z"/>
                  <circle cx="12" cy="10" r="3"/>
                </svg>
                {item.hub?.name} · {item.hub?.area}
              </div>

              <div className="hub-card-condition">
                <span className="hub-card-condition-dot" />
                {item.condition}
              </div>
            </div>

            <button className="hub-card-btn" onClick={() => handleAdd(item)}>
              Order Now
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}
