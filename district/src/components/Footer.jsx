import { footerLinks } from '../data/products';

const socials = [
  { label: 'Instagram', short: 'IN' },
  { label: 'Twitter',   short: 'TW' },
  { label: 'YouTube',   short: 'YT' },
  { label: 'Facebook',  short: 'FB' },
];

const payMethods = ['VISA', 'MC', 'UPI', 'COD', 'EMI', 'AMEX'];

export default function Footer({ onMerchantPortal }) {
  return (
    <footer>
      <div className="footer-inner">
        <div className="footer-top">
          <div className="footer-brand-col">
            <div className="footer-logo">DIS<span>·</span>TRICT</div>
            <p className="footer-brand-desc">
              India's premier destination for authentic streetwear, sneakers, and
              contemporary fashion from 300+ global and homegrown brands.
            </p>
            <div className="footer-socials">
              {socials.map(s => (
                <a key={s.label} href="#" className="footer-social" aria-label={s.label}>
                  {s.short}
                </a>
              ))}
            </div>
          </div>

          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title} className="footer-col">
              <div className="footer-col-title">{title}</div>
              <ul>
                {links.map(link => (
                  <li key={link}><a href="#">{link}</a></li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="footer-bottom">
          <p className="footer-copy">© 2025 District India Pvt. Ltd. All rights reserved.</p>
          <div className="footer-pay" aria-label="Accepted payment methods">
            {payMethods.map(m => <span key={m} className="pay-chip">{m}</span>)}
          </div>
          <button className="footer-merchant-link" onClick={onMerchantPortal}>
            Merchant Portal
          </button>
        </div>
      </div>
    </footer>
  );
}
