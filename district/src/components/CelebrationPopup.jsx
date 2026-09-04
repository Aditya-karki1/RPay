import { useApp } from '../context/AppContext';

const DOTS = [
  { color: '#C8FF00', x: -60, y: -55, size: 10, delay: 0 },
  { color: '#48C479', x:  55, y: -65, size:  8, delay: 0.05 },
  { color: '#F59E0B', x: -80, y:  10, size:  7, delay: 0.1 },
  { color: '#A78BFA', x:  75, y:  20, size:  9, delay: 0.08 },
  { color: '#FF6B6B', x: -45, y:  60, size:  6, delay: 0.15 },
  { color: '#C8FF00', x:  50, y:  55, size:  8, delay: 0.12 },
  { color: '#48C479', x:   5, y: -80, size:  7, delay: 0.06 },
  { color: '#F59E0B', x: -20, y:  75, size:  6, delay: 0.18 },
];

const TYPE_COLORS = {
  coupon:  { bg: '#1a2e1a', border: '#48C479', glow: 'rgba(72,196,121,0.25)' },
  credits: { bg: '#1e2a0a', border: '#C8FF00', glow: 'rgba(200,255,0,0.25)'  },
  success: { bg: '#1a1a2e', border: '#A78BFA', glow: 'rgba(167,139,250,0.25)' },
};

export default function CelebrationPopup() {
  const { popup } = useApp();
  if (!popup) return null;

  const colors = TYPE_COLORS[popup.type] || TYPE_COLORS.success;
  const visible = popup.visible;

  return (
    <div className={`celeb-overlay${visible ? ' celeb-overlay--show' : ''}`} aria-live="assertive">
      <div
        className={`celeb-card${visible ? ' celeb-card--show' : ''}`}
        style={{ '--celeb-border': colors.border, '--celeb-glow': colors.glow, '--celeb-bg': colors.bg }}
      >
        {/* Confetti dots */}
        <div className="celeb-dots" aria-hidden="true">
          {DOTS.map((d, i) => (
            <span
              key={i}
              className={`celeb-dot${visible ? ' celeb-dot--pop' : ''}`}
              style={{
                background: d.color,
                width: d.size, height: d.size,
                left: `calc(50% + ${d.x}px)`,
                top:  `calc(50% + ${d.y}px)`,
                animationDelay: `${d.delay}s`,
              }}
            />
          ))}
        </div>

        {/* Emoji ring */}
        <div className="celeb-emoji-ring" aria-hidden="true">
          <span className="celeb-emoji">{popup.emoji || '🎉'}</span>
        </div>

        {/* Text */}
        <p className="celeb-title">{popup.title}</p>
        {popup.subtitle && <p className="celeb-subtitle">{popup.subtitle}</p>}
      </div>
    </div>
  );
}
