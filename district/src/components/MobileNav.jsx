import { useEffect } from 'react';

const links = [
  { label: 'New Arrivals', page: null,        scroll: 'arrivals' },
  { label: 'Zomato',       page: 'zomato',    scroll: null },
  { label: 'PVR INOX',     page: 'pvrinox',   scroll: null },
  { label: 'Bluestone',    page: 'bluestone',  scroll: null },
];

export default function MobileNav({ isOpen, onClose, onNavClick }) {
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  const handleClick = (link) => {
    onNavClick?.(link.page, link.scroll);
    onClose();
  };

  return (
    <nav className={`mobile-nav${isOpen ? ' open' : ''}`} aria-label="Mobile navigation" aria-hidden={!isOpen}>
      <div className="mobile-nav-header">
        <span className="nav-logo">DIS<span>·</span>TRICT</span>
        <button className="nav-btn" onClick={onClose} aria-label="Close menu">
          <svg width="18" height="18" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M18 6 6 18M6 6l12 12"/>
          </svg>
        </button>
      </div>
      <ul className="mobile-nav-links">
        {links.map(link => (
          <li key={link.label}>
            <a href="#" onClick={e => { e.preventDefault(); handleClick(link); }}>
              {link.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
