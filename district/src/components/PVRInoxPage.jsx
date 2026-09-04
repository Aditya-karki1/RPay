import { useState } from 'react';

const tabs = ['Now Showing', 'Coming Soon', 'Offers'];

const nowShowing = [
  {
    title: 'Spider-Man: Brand New Day',
    genre: 'Action • Superhero',
    lang: 'English / Hindi',
    rating: 'U/A',
    duration: '2h 18m',
    score: '8.7',
    img: 'https://images.unsplash.com/photo-1635805737707-575885ab0820?w=400&q=80',
    badge: 'New',
  },
  {
    title: 'The Odyssey',
    genre: 'Action • Epic',
    lang: 'English',
    rating: 'U/A',
    duration: '2h 52m',
    score: '8.1',
    img: 'https://images.unsplash.com/photo-1594908900066-3f47337549d8?w=400&q=80',
    badge: 'New',
  },
  {
    title: 'Rage of Stars',
    genre: 'Sci-Fi • Action',
    lang: 'English',
    rating: 'U/A',
    duration: '2h 24m',
    score: '7.9',
    img: 'https://images.unsplash.com/photo-1506318137071-a8e063b4bec0?w=400&q=80',
    badge: 'New',
  },
  {
    title: 'Toy Story 5',
    genre: 'Animation • Family',
    lang: 'English / Hindi',
    rating: 'U',
    duration: '1h 48m',
    score: '8.6',
    img: 'https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?w=400&q=80',
    badge: 'Hit',
  },
  {
    title: 'Spider-Man: No Way Home',
    genre: 'Action • Superhero',
    lang: 'English / Hindi',
    rating: 'U/A',
    duration: '2h 28m',
    score: '8.8',
    img: 'https://images.unsplash.com/photo-1604200213928-ba3cf4fc8436?w=400&q=80',
    badge: null,
  },
  {
    title: 'Minions & Monsters',
    genre: 'Animation • Comedy',
    lang: 'English / Hindi',
    rating: 'U',
    duration: '1h 52m',
    score: '7.8',
    img: 'https://images.unsplash.com/photo-1559181567-c3190ca9959b?w=400&q=80',
    badge: 'New',
  },
  {
    title: 'Obsession',
    genre: 'Thriller • Drama',
    lang: 'English',
    rating: 'A',
    duration: '1h 58m',
    score: '7.6',
    img: 'https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=400&q=80',
    badge: 'New',
  },
  {
    title: 'Mutiny',
    genre: 'Action • Drama',
    lang: 'English',
    rating: 'U/A',
    duration: '2h 12m',
    score: '7.7',
    img: 'https://images.unsplash.com/photo-1521341957697-b93449760f30?w=400&q=80',
    badge: 'New',
  },
  {
    title: 'Moana',
    genre: 'Animation • Adventure',
    lang: 'English / Hindi',
    rating: 'U',
    duration: '1h 42m',
    score: '8.3',
    img: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&q=80',
    badge: 'Hit',
  },
];

const comingSoon = [
  {
    title: 'Colony',
    genre: 'Sci-Fi • Horror',
    release: 'Aug 28, 2026',
    img: 'https://images.unsplash.com/photo-1534796636912-3b952d9c04d5?w=400&q=80',
  },
];

const cinemas = [
  {
    name: 'PVR: Select Citywalk, Saket',
    dist: '2.1 km',
    screens: 8,
    facilities: ['IMAX', 'Dolby', 'Recliner'],
    img: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=600&q=80',
  },
  {
    name: 'INOX: Nehru Place',
    dist: '3.8 km',
    screens: 6,
    facilities: ['4DX', 'Dolby Atmos'],
    img: 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?w=600&q=80',
  },
  {
    name: 'PVR: Ambience Mall, Gurgaon',
    dist: '9.4 km',
    screens: 12,
    facilities: ['IMAX', '4DX', 'Gold Class'],
    img: 'https://images.unsplash.com/photo-1440404653325-ab127d49abc1?w=600&q=80',
  },
];

export default function PVRInoxPage({ onClose }) {
  const [activeTab, setActiveTab] = useState('Now Showing');
  const [bookingMovie, setBookingMovie] = useState(null);

  return (
    <div className="pvr-page">
      {/* ── Header ── */}
      <div className="pvr-header">
        <button className="zomato-back" onClick={onClose} aria-label="Go back">
          <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
          Back
        </button>
        <div className="pvr-brand">
          <span className="pvr-logo">PVR<span className="pvr-dot">·</span>INOX</span>
          <span className="pvr-tagline">Movies &amp; Entertainment</span>
        </div>
      </div>

      {/* ── Hero ── */}
      <div className="pvr-hero">
        <img
          src="https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=1600&q=85"
          alt="Cinema"
          className="pvr-hero-img"
        />
        <div className="pvr-hero-overlay">
          <p className="pvr-hero-eyebrow">Now Playing Near You</p>
          <h1 className="pvr-hero-title">Your Cinema.<br/>Your Experience.</h1>
          <div className="pvr-location-bar">
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 1 1 18 0z"/><circle cx="12" cy="10" r="3"/>
            </svg>
            <span>New Delhi, India</span>
            <button className="pvr-change-loc">Change</button>
          </div>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="pvr-tabs-bar">
        <div className="pvr-tabs">
          {tabs.map(t => (
            <button
              key={t}
              className={`pvr-tab${activeTab === t ? ' active' : ''}`}
              onClick={() => setActiveTab(t)}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="pvr-body">

        {/* ── Now Showing ── */}
        {activeTab === 'Now Showing' && (
          <>
            <section className="pvr-section">
              <h2 className="pvr-section-title">Latest Releases</h2>
              <div className="pvr-movie-grid">
                {nowShowing.map(m => (
                  <div key={m.title} className="pvr-movie-card">
                    <div className="pvr-poster-wrap">
                      <img src={m.img} alt={m.title} className="pvr-poster" loading="lazy" />
                      {m.badge && <span className="pvr-badge">{m.badge}</span>}
                      <div className="pvr-score">★ {m.score}</div>
                    </div>
                    <div className="pvr-movie-info">
                      <div className="pvr-movie-title">{m.title}</div>
                      <div className="pvr-movie-meta">
                        <span>{m.genre}</span>
                      </div>
                      <div className="pvr-movie-sub">
                        <span className="pvr-pill">{m.rating}</span>
                        <span className="pvr-pill">{m.duration}</span>
                        <span className="pvr-pill">{m.lang}</span>
                      </div>
                      <button
                        className="pvr-book-btn"
                        onClick={() => setBookingMovie(m.title)}
                      >
                        Book Tickets
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="pvr-section">
              <h2 className="pvr-section-title">Nearby Cinemas</h2>
              <div className="pvr-cinema-grid">
                {cinemas.map(c => (
                  <div key={c.name} className="pvr-cinema-card">
                    <div className="pvr-cinema-img-wrap">
                      <img src={c.img} alt={c.name} className="pvr-cinema-img" loading="lazy" />
                      <span className="pvr-cinema-dist">📍 {c.dist}</span>
                    </div>
                    <div className="pvr-cinema-info">
                      <div className="pvr-cinema-name">{c.name}</div>
                      <div className="pvr-cinema-screens">{c.screens} Screens</div>
                      <div className="pvr-facilities">
                        {c.facilities.map(f => (
                          <span key={f} className="pvr-facility">{f}</span>
                        ))}
                      </div>
                      <button className="pvr-book-btn pvr-book-outline">View Showtimes</button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </>
        )}

        {/* ── Coming Soon ── */}
        {activeTab === 'Coming Soon' && (
          <section className="pvr-section">
            <h2 className="pvr-section-title">Upcoming Movies</h2>
            <div className="pvr-upcoming-grid">
              {comingSoon.map(m => (
                <div key={m.title} className="pvr-upcoming-card">
                  <div className="pvr-upcoming-img-wrap">
                    <img src={m.img} alt={m.title} className="pvr-upcoming-img" loading="lazy" />
                    <div className="pvr-upcoming-overlay">
                      <span className="pvr-release-date">Releasing {m.release}</span>
                    </div>
                  </div>
                  <div className="pvr-movie-info">
                    <div className="pvr-movie-title">{m.title}</div>
                    <div className="pvr-movie-meta"><span>{m.genre}</span></div>
                    <button className="pvr-book-btn pvr-book-outline">Remind Me</button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── Offers ── */}
        {activeTab === 'Offers' && (
          <section className="pvr-section">
            <h2 className="pvr-section-title">Exclusive Offers</h2>
            <div className="pvr-offers-grid">
              {[
                { title: '50% off on Wednesday', sub: 'Book any movie on Wednesday and get 50% off up to ₹150', color: '#E8A020', icon: '🎬' },
                { title: 'Buy 2 Get 1 Free', sub: 'Book 2 tickets on weekends and get 1 ticket absolutely free', color: '#E23744', icon: '🎟️' },
                { title: 'HDFC Bank Offer', sub: '25% cashback on all bookings using HDFC Credit Card', color: '#004C8F', icon: '💳' },
                { title: 'Student Discount', sub: '30% off for students with valid ID every Monday & Tuesday', color: '#48C479', icon: '🎓' },
              ].map(o => (
                <div key={o.title} className="pvr-offer-card" style={{ borderTop: `3px solid ${o.color}` }}>
                  <span className="pvr-offer-icon">{o.icon}</span>
                  <div className="pvr-offer-title">{o.title}</div>
                  <div className="pvr-offer-sub">{o.sub}</div>
                  <button className="pvr-book-btn" style={{ background: o.color }}>Grab Offer</button>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      {/* ── Booking toast ── */}
      {bookingMovie && (
        <div className="pvr-booking-toast" onClick={() => setBookingMovie(null)}>
          <div className="pvr-booking-inner" onClick={e => e.stopPropagation()}>
            <button className="pvr-booking-close" onClick={() => setBookingMovie(null)}>✕</button>
            <div className="pvr-booking-title">🎟️ Booking: {bookingMovie}</div>
            <p className="pvr-booking-sub">Select your preferred cinema & showtime to continue.</p>
            <div className="pvr-showtime-grid">
              {['10:00 AM', '1:15 PM', '4:30 PM', '7:45 PM', '10:00 PM'].map(t => (
                <button key={t} className="pvr-showtime">{t}</button>
              ))}
            </div>
            <button className="pvr-book-btn" style={{ width: '100%', marginTop: 16 }}>Confirm &amp; Pay</button>
          </div>
        </div>
      )}
    </div>
  );
}
