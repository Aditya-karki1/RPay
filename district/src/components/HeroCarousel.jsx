import { useState, useEffect, useCallback } from 'react';
import { heroSlides } from '../data/products';

export default function HeroCarousel() {
  const [current, setCurrent] = useState(0);
  const total = heroSlides.length;

  const goTo = useCallback((n) => setCurrent((n + total) % total), [total]);

  useEffect(() => {
    const id = setInterval(() => goTo(current + 1), 5500);
    return () => clearInterval(id);
  }, [current, goTo]);

  return (
    <section className="hero" aria-label="Featured promotions">
      <div className="hero-track" style={{ transform: `translateX(-${current * 100}%)` }}>
        {heroSlides.map((slide) => (
          <HeroSlide key={slide.id} slide={slide} />
        ))}
      </div>

      <div className="hero-dots" aria-label="Carousel navigation">
        {heroSlides.map((_, i) => (
          <button
            key={i}
            className={`hero-dot${i === current ? ' active' : ''}`}
            onClick={() => goTo(i)}
            aria-label={`Go to slide ${i + 1}`}
          />
        ))}
      </div>

      <button className="hero-slide-btn hero-prev" onClick={() => goTo(current - 1)} aria-label="Previous slide">
        <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path d="M15 18l-6-6 6-6"/>
        </svg>
      </button>
      <button className="hero-slide-btn hero-next" onClick={() => goTo(current + 1)} aria-label="Next slide">
        <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path d="M9 18l6-6-6-6"/>
        </svg>
      </button>
    </section>
  );
}

function HeroSlide({ slide }) {
  return (
    <div className={`hero-slide ${slide.cls}`}>
      {/* Real photo background */}
      <img src={slide.img} alt="" className="hero-slide-photo" aria-hidden="true" />
      <div className="hero-slide-overlay" />

      <div className="hero-bg-text" aria-hidden="true">{slide.bgWord}</div>

      <div className="hero-content">
        <p className="hero-eyebrow">{slide.eyebrow}</p>
        <h1 className="hero-headline">
          {slide.line1}
          <em>{slide.line2}</em>
        </h1>
        <p className="hero-sub">{slide.sub}</p>
        <div className="hero-ctas">
          <a href={slide.cta1.href} className="btn-primary">
            {slide.cta1.label} <span aria-hidden="true">→</span>
          </a>
          <a href={slide.cta2.href} className="btn-ghost">
            {slide.cta2.label}
          </a>
        </div>
      </div>
    </div>
  );
}
