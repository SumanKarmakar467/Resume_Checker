// Purpose: Provide user login form and JWT storage.
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import useAuth from '../hooks/useAuth';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (!email.trim() || !password.trim()) {
      setError('Email and password are required.');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/api/auth/login', {
        email: email.trim(),
        password: password.trim()
      });
      login(response.data?.token || '');
      navigate('/dashboard');
    } catch (err) {
      setError(err?.response?.data?.error || 'Unable to log in. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="theme-page min-h-screen px-4 py-10">
      <div className="mx-auto max-w-lg">
        <div className="theme-card p-6">
          <h1 className="text-2xl font-extrabold">Welcome back</h1>
          <p className="theme-muted mt-1 text-sm">Log in to access your ATS history dashboard.</p>

          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="Email address"
              className="theme-input w-full rounded-xl px-3 py-2 text-sm"
              required
            />
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Password"
              className="theme-input w-full rounded-xl px-3 py-2 text-sm"
              required
            />

            {error ? <p className="theme-error rounded-xl px-3 py-2 text-sm">{error}</p> : null}

            <button
              type="submit"
              disabled={loading}
              className="theme-button-primary w-full rounded-xl px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>

          <p className="theme-muted mt-4 text-sm">
            New here? <Link className="theme-accent font-semibold" to="/register">Create an account</Link>
          </p>
        </div>
      </div>
    </main>
  );
}

export default Login;
