import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import useAuth from '../hooks/useAuth';
import useTheme from '../hooks/useTheme';

const loginHighlights = [
  'Track ATS score improvements across applications',
  'Get role-fit suggestions like Frontend / Backend / Full Stack',
  'Generate and download recruiter-ready resumes quickly'
];

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const { login } = useAuth();
  const { isDark, toggleTheme } = useTheme();

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
            <p className="auth-kicker">WELCOME BACK</p>
            <h1 className="auth-title">Continue building resumes that recruiters shortlist.</h1>
            <p className="auth-subtitle">
              Your ATS optimization dashboard is one login away.
            </p>

            <div className="auth-meter mt-5">
              <div className="auth-meter-row"><span>Keyword Match</span><strong>92%</strong></div>
              <div className="auth-meter-bar"><i style={{ width: '92%' }} /></div>
              <div className="auth-meter-row"><span>Formatting</span><strong>87%</strong></div>
              <div className="auth-meter-bar"><i style={{ width: '87%' }} /></div>
            </div>

            <ul className="auth-points mt-5">
              {loginHighlights.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </aside>

          <div className="theme-card auth-form-card auth-animate-rise">
            <h2 className="text-2xl font-extrabold">Log in</h2>
            <p className="theme-muted mt-1 text-sm">Use your email account to continue.</p>

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
                  placeholder="Enter your password"
                  className="theme-input"
                  required
                />
              </label>

              {error ? <p className="theme-error">{error}</p> : null}

              <button type="submit" disabled={loading} className="theme-button-primary w-full">
                {loading ? 'Logging in...' : 'Log In'}
              </button>
            </form>

            <p className="theme-muted mt-4 text-sm">
              New here? <Link className="theme-accent font-semibold" to="/register">Create an account</Link>
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}

export default Login;
