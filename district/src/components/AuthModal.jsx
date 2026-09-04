import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

const MERCHANT_EMAIL    = 'merchant@district.in';
const MERCHANT_PASSWORD = 'District@2025';

export default function AuthModal({ onClose, onMerchantLogin }) {
  const { login, register } = useAuth();
  const [role,    setRole]    = useState('customer'); // 'customer' | 'merchant'
  const [mode,    setMode]    = useState('login');    // 'login' | 'register'
  const [form,    setForm]    = useState({ name: '', email: '', password: '' });
  const [error,   setError]   = useState('');
  const [loading, setLoading] = useState(false);

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const switchRole = (next) => {
    setRole(next);
    setMode('login');
    setError('');
    if (next === 'merchant') {
      setForm({ name: '', email: MERCHANT_EMAIL, password: MERCHANT_PASSWORD });
    } else {
      setForm({ name: '', email: '', password: '' });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      if (role === 'merchant') {
        const res  = await fetch('/api/merchant/login', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ email: form.email, password: form.password }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Login failed');
        localStorage.setItem('merchant_token', data.token);
        onMerchantLogin?.(data.token);
        onClose();
      } else if (mode === 'login') {
        await login({ email: form.email, password: form.password });
        onClose();
      } else {
        await register({ name: form.name, email: form.email, password: form.password });
        onClose();
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const switchMode = () => {
    setMode(m => m === 'login' ? 'register' : 'login');
    setError('');
  };

  return (
    <>
      <div className="auth-backdrop" onClick={onClose} />
      <div className="auth-modal" role="dialog" aria-modal="true" aria-label={role === 'merchant' ? 'Merchant Sign In' : mode === 'login' ? 'Sign In' : 'Create Account'}>

        {/* Close */}
        <button className="auth-close" onClick={onClose} aria-label="Close">
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>

        {/* Brand */}
        <div className="auth-brand">
          <span className="nav-logo" style={{ fontSize: 22 }}>DIS<span>·</span>TRICT</span>
        </div>

        {/* Role toggle */}
        <div className="auth-role-toggle">
          <button
            className={`auth-role-btn${role === 'customer' ? ' active' : ''}`}
            onClick={() => switchRole('customer')}
          >
            Customer
          </button>
          <button
            className={`auth-role-btn${role === 'merchant' ? ' active' : ''}`}
            onClick={() => switchRole('merchant')}
          >
            Merchant
          </button>
        </div>

        {/* Sign In / Create Account tabs — hidden for merchant */}
        {role === 'customer' && (
          <div className="auth-tabs">
            <button className={`auth-tab${mode === 'login' ? ' active' : ''}`} onClick={() => { setMode('login'); setError(''); }}>Sign In</button>
            <button className={`auth-tab${mode === 'register' ? ' active' : ''}`} onClick={() => { setMode('register'); setError(''); }}>Create Account</button>
          </div>
        )}

        {role === 'merchant' && (
          <div className="auth-merchant-badge">Merchant Portal</div>
        )}

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          {role === 'customer' && mode === 'register' && (
            <div className="auth-field">
              <label className="auth-label">Full Name</label>
              <input
                className="auth-input"
                type="text"
                placeholder="Your full name"
                value={form.name}
                onChange={e => set('name', e.target.value)}
                required autoFocus
              />
            </div>
          )}

          <div className="auth-field">
            <label className="auth-label">Email Address</label>
            <input
              className="auth-input"
              type="email"
              placeholder={role === 'merchant' ? 'merchant@district.in' : 'you@example.com'}
              value={form.email}
              onChange={e => set('email', e.target.value)}
              required
              autoFocus={role === 'customer' && mode === 'login'}
            />
          </div>

          <div className="auth-field">
            <label className="auth-label">Password</label>
            <input
              className="auth-input"
              type="password"
              placeholder={role === 'customer' && mode === 'register' ? 'Min 6 characters' : 'Your password'}
              value={form.password}
              onChange={e => set('password', e.target.value)}
              required
            />
          </div>

          {error && <div className="auth-error">{error}</div>}

          <button className="auth-submit" type="submit" disabled={loading}>
            {loading ? (
              <span className="auth-spinner" />
            ) : role === 'merchant' ? 'Sign In to Dashboard' : (
              mode === 'login' ? 'Sign In' : 'Create Account'
            )}
          </button>
        </form>

        {role === 'customer' && (
          <p className="auth-switch">
            {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}
            {' '}
            <button className="auth-switch-btn" onClick={switchMode}>
              {mode === 'login' ? 'Create one' : 'Sign in'}
            </button>
          </p>
        )}

      </div>
    </>
  );
}
