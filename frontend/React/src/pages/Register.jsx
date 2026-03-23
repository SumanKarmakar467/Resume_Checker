import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import useTheme from '../hooks/useTheme';

function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const { isDark, toggleTheme } = useTheme();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    if (!email.trim() || !password.trim() || !confirm.trim()) {
      setError('All fields are required.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await api.post('/api/auth/register', {
        email: email.trim(),
        password: password.trim()
      });
      setSuccess('Account created. Redirecting to login...');
      setTimeout(() => navigate('/login'), 900);
    } catch (err) {
      setError(err?.response?.data?.error || 'Unable to register. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="theme-page min-h-screen px-4 py-10">
      <div className="mx-auto max-w-lg space-y-4">
        <header className="flex items-center justify-between">
          <Link to="/" className="theme-accent text-sm font-semibold">Back to Home</Link>
          <button type="button" className="theme-toggle" onClick={toggleTheme}>
            {isDark ? 'Light Theme' : 'Dark Theme'}
          </button>
        </header>

        <div className="theme-card p-6">
          <h1 className="text-2xl font-extrabold">Create your account</h1>
          <p className="theme-muted mt-1 text-sm">Use email authentication to save resume analyses and track ATS improvements.</p>

          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="Email address"
              className="theme-input"
              required
            />
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Password (minimum 6 characters)"
              className="theme-input"
              required
            />
            <input
              type="password"
              value={confirm}
              onChange={(event) => setConfirm(event.target.value)}
              placeholder="Confirm password"
              className="theme-input"
              required
            />

            {error ? <p className="theme-error">{error}</p> : null}
            {success ? (
              <p className="rounded-xl border px-3 py-2 text-sm" style={{ borderColor: 'var(--success-border)', background: 'var(--success-bg)', color: 'var(--success-text)' }}>
                {success}
              </p>
            ) : null}

            <button type="submit" disabled={loading} className="theme-button-primary w-full">
              {loading ? 'Creating account...' : 'Register'}
            </button>
          </form>

          <p className="theme-muted mt-4 text-sm">
            Already have an account? <Link className="theme-accent font-semibold" to="/login">Log in</Link>
          </p>
        </div>
      </div>
    </main>
  );
}

export default Register;
