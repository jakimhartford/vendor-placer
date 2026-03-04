import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>Vendor Placer</h1>
        <p style={styles.subtitle}>Sign in to your account</p>
        <form onSubmit={handleSubmit} style={styles.form}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={styles.input}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={styles.input}
          />
          {error && <p style={styles.error}>{error}</p>}
          <button type="submit" disabled={loading} style={styles.button}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
        <p style={styles.link}>
          Don't have an account? <Link to="/signup" style={styles.a}>Sign up</Link>
        </p>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: '#0f172a',
  },
  card: {
    background: '#1e293b', borderRadius: 12, padding: '40px 32px', width: 360,
    boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
  },
  title: { color: '#f1f5f9', margin: '0 0 4px', fontSize: 24, textAlign: 'center' },
  subtitle: { color: '#94a3b8', margin: '0 0 24px', fontSize: 14, textAlign: 'center' },
  form: { display: 'flex', flexDirection: 'column', gap: 12 },
  input: {
    padding: '10px 12px', borderRadius: 6, border: '1px solid #334155',
    background: '#0f172a', color: '#f1f5f9', fontSize: 14, outline: 'none',
  },
  error: { color: '#f87171', fontSize: 13, margin: 0 },
  button: {
    padding: '10px 0', borderRadius: 6, border: 'none', background: '#3b82f6',
    color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer', marginTop: 4,
  },
  link: { color: '#94a3b8', fontSize: 13, textAlign: 'center', marginTop: 16 },
  a: { color: '#3b82f6', textDecoration: 'none' },
};
