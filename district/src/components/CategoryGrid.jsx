import { categories } from '../data/products';

export default function CategoryGrid() {
  return (
    <div className="section">
      <div className="section-header">
        <h2 className="section-title">Shop by <span>Category</span></h2>
        <a href="#" className="section-link">All Categories</a>
      </div>
      <div className="category-grid">
        {categories.map(cat => (
          <a key={cat.id} href="#" className={`cat-card ${cat.cls}`}>
            <img src={cat.img} alt={cat.label} className="cat-photo" loading="lazy" />
            <div className="cat-overlay" />
            <div className="cat-info">
              <div className="cat-label">{cat.label}</div>
              <div className="cat-count">{cat.count} styles</div>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
