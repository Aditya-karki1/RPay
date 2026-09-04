import { useState } from 'react';

export default function MerchantLoginPage({ onLogin }) {
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res  = await fetch('/api/merchant/login', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Login failed');
      localStorage.setItem('merchant_token', data.token);
      onLogin(data.token);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="m-login-bg">
      <div className="m-login-card">
        <div className="m-login-logo">DIS<span>·</span>TRICT</div>
        <div className="m-login-subtitle">Merchant Portal</div>

        <div className="m-login-hint">
          <span className="m-hint-label">Demo Credentials</span>
          <code className="m-hint-val">merchant@district.in</code>
          <code className="m-hint-val">District@2025</code>
        </div>

        <form onSubmit={handleSubmit} className="m-login-form">
          <div className="m-field">
            <label className="m-label">Email</label>
            <input
              type="email"
              className="m-input"
              placeholder="merchant@district.in"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="m-field">
            <label className="m-label">Password</label>
            <input
              type="password"
              className="m-input"
              placeholder="Enter password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </div>

          {error && <div className="m-error">{error}</div>}

          <button type="submit" className="m-btn-primary" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign In to Dashboard'}
          </button>
        </form>

        <p className="m-login-note">
          Merchant portal access only. Customer login is available on the main storefront.
        </p>
      </div>
    </div>
  );
}
