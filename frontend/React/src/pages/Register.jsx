import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import useTheme from '../hooks/useTheme';

const registerHighlights = [
  'Email-based authentication with protected dashboard',
  'Upload resume and auto-fill details from PDF/DOCX/TXT',
  'Get ATS score, role-fit advice, and downloadable output'
];

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
    <main className="theme-page auth-page min-h-screen px-4 py-8 md:py-10">
      <div className="auth-bg" aria-hidden="true">
        <span className="auth-orb auth-orb-one" />
        <span className="auth-orb auth-orb-two" />
        <span className="auth-orb auth-orb-three" />
      </div>

      <div className="auth-shell mx-auto max-w-5xl">
        <header className="auth-topbar">
          <Link to="/" className="theme-accent text-sm font-semibold">Back to Home</Link>
          <button type="button" className="theme-toggle" onClick={toggleTheme}>
            {isDark ? 'Light Theme' : 'Dark Theme'}
          </button>
        </header>

        <section className="auth-grid mt-4">
          <aside className="auth-showcase auth-animate-slide">
            <p className="auth-kicker">CREATE ACCOUNT</p>
            <h1 className="auth-title">Start your ATS resume workflow in under a minute.</h1>
            <p className="auth-subtitle">
              Sign up once and keep every resume iteration in one place.
            </p>

            <div className="auth-chip-row mt-5">
              <span className="auth-chip">ATS Insights</span>
              <span className="auth-chip">Role Suggestions</span>
              <span className="auth-chip">Resume Generator</span>
            </div>

            <ul className="auth-points mt-5">
              {registerHighlights.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </aside>

          <div className="theme-card auth-form-card auth-animate-rise">
            <h2 className="text-2xl font-extrabold">Register</h2>
            <p className="theme-muted mt-1 text-sm">Create an email account to continue.</p>

            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              <label className="auth-field">
                <span>Email</span>
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@example.com"
                  className="theme-input"
                  required
                />
              </label>

              <label className="auth-field">
                <span>Password</span>
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="At least 6 characters"
                  className="theme-input"
                  required
                />
              </label>

              <label className="auth-field">
                <span>Confirm Password</span>
                <input
                  type="password"
                  value={confirm}
                  onChange={(event) => setConfirm(event.target.value)}
                  placeholder="Re-enter password"
                  className="theme-input"
                  required
                />
              </label>

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
        </section>
      </div>
    </main>
  );
}

export default Register;
