import { useState } from 'react';
import { useApp } from '../context/AppContext';

export default function ProductCard({ product }) {
  const { addToCart } = useApp();
  const [wished,    setWished]    = useState(false);
  const [added,     setAdded]     = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);

  const discount = product.orig
    ? Math.round((1 - product.price / product.orig) * 100)
    : 0;

  const handleAdd = () => {
    addToCart(product);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  return (
    <article className="product-card">
      <div className="product-img">
        <div className={`skeleton product-img-skeleton${imgLoaded ? ' hidden' : ''}`} />

        <img
          src={product.img}
          alt={product.name}
          className="product-real-img"
          loading="lazy"
          onLoad={() => setImgLoaded(true)}
        />

        <div className="product-badges">
          {product.badge === 'new'  && <span className="badge badge-new">New</span>}
          {product.badge === 'sale' && <span className="badge badge-sale">−{discount}%</span>}
        </div>

        <button
          className={`product-wish${wished ? ' active' : ''}`}
          aria-label={wished ? 'Remove from wishlist' : 'Add to wishlist'}
          onClick={() => setWished(w => !w)}
        >
          {wished ? '♥' : '♡'}
        </button>

        <button
          className={`add-to-cart-overlay${added ? ' added' : ''}`}
          onClick={handleAdd}
        >
          {added ? '✓ Added' : 'Add to Cart'}
        </button>
      </div>

      <div className="product-info">
        <div className="product-brand">{product.brand}</div>
        <div className="product-name">{product.name}</div>
        <div className="product-price">
          <span className="price-current">₹{product.price.toLocaleString('en-IN')}</span>
          {product.orig && (
            <>
              <span className="price-original">₹{product.orig.toLocaleString('en-IN')}</span>
              <span className="price-discount">{discount}% off</span>
            </>
          )}
        </div>
        <button
          className={`product-add-btn${added ? ' added' : ''}`}
          onClick={handleAdd}
        >
          {added ? '✓ Added' : '+ Add to Cart'}
        </button>
      </div>
    </article>
  );
}
