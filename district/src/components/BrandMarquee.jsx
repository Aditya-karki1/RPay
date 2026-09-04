import { brands } from '../data/products';

export default function BrandMarquee() {
  const items = [...brands, ...brands];
  return (
    <div className="brands-section" aria-hidden="true">
      <p className="brands-label">300+ Brands · All Authentic</p>
      <div className="brand-marquee-wrap">
        <div className="brand-marquee">
          {items.map((b, i) => <span key={i} className="brand-item">{b}</span>)}
        </div>
        <div className="brand-marquee">
          {items.map((b, i) => <span key={i} className="brand-item">{b}</span>)}
        </div>
      </div>
    </div>
  );
}
