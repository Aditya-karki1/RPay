import ProductCard from './ProductCard';

function SkeletonCard() {
  return (
    <div className="skeleton-card">
      <div className="skeleton skeleton-img" />
      <div className="skeleton-info">
        <div className="skeleton skeleton-line skeleton-brand-line" />
        <div className="skeleton skeleton-line skeleton-name-line" />
        <div className="skeleton skeleton-line skeleton-name-line2" />
        <div className="skeleton skeleton-line skeleton-price-line" />
      </div>
    </div>
  );
}

export default function ProductGrid({ title, accent, products, id, loading }) {
  return (
    <div className="section" id={id}>
      <div className="section-header">
        <h2 className="section-title">
          {title} <span>{accent}</span>
        </h2>
        <a href="#" className="section-link">View All</a>
      </div>
      <div className="product-grid">
        {loading
          ? Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)
          : products.map(product => <ProductCard key={product.id} product={product} />)
        }
      </div>
    </div>
  );
}
