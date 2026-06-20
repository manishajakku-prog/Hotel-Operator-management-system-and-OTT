import React, { useState } from 'react';
import { api } from '../services/api';
import { LogIn, Hotel, ShieldAlert } from 'lucide-react';

export default function Login({ onLoginSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Client-side validations
    if (!username.trim()) {
      setError('Username is required.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      const data = await api.login(username.trim(), password);
      
      // Save credentials in local storage
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      
      onLoginSuccess(data.user);
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <div className="auth-header">
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem', color: '#6366f1' }}>
            <Hotel size={48} />
          </div>
          <h1 className="auth-logo">SuitesOps</h1>
          <p className="auth-subtitle">Hotel Operations Management System</p>
        </div>

        {error && (
          <div className="alert-panel danger" style={{ marginBottom: '1.5rem' }}>
            <ShieldAlert size={20} style={{ flexShrink: 0 }} />
            <div>{error}</div>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="username">Username</label>
            <input
              type="text"
              id="username"
              className="form-input"
              placeholder="e.g. manager"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              className="form-input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
            />
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }} disabled={loading}>
            {loading ? 'Authenticating...' : (
              <>
                <LogIn size={18} /> Sign In
              </>
            )}
          </button>
        </form>

        <div style={{ marginTop: '2rem', padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid var(--border-color)', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          <p style={{ fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.25rem' }}>Demo Accounts:</p>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
            <span><strong>Manager:</strong> manager / manager123</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span><strong>Front Desk:</strong> frontdesk / frontdesk123</span>
          </div>
        </div>
      </div>
    </div>
  );
}
