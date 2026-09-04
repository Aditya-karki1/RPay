import { useState } from 'react';
import { useApp } from '../context/AppContext';

export default function Newsletter() {
  const { showToast } = useApp();
  const [email, setEmail] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    showToast('Subscribed! Check your inbox for a welcome code.');
    setEmail('');
  };

  return (
    <div className="newsletter-section">
      <div className="newsletter-inner">
        <h2 className="newsletter-title">Stay in the Loop</h2>
        <p className="newsletter-sub">
          New drops, exclusive deals, and brand launches — straight to your inbox.
        </p>
        <form className="newsletter-form" onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="Your email address"
            aria-label="Email address"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />
          <button type="submit">Subscribe</button>
        </form>
        <div className="newsletter-perks">
          <span className="newsletter-perk">No spam, ever</span>
          <span className="newsletter-perk">Early access to drops</span>
          <span className="newsletter-perk">Exclusive discount codes</span>
        </div>
      </div>
    </div>
  );
}
