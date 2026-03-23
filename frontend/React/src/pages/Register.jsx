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
  const [errorTick, setErrorTick] = useState(0);
  const [success, setSuccess] = useState('');
  const [successTick, setSuccessTick] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [shakeForm, setShakeForm] = useState(false);

  const navigate = useNavigate();
  const { isDark, toggleTheme } = useTheme();

  const raiseError = (message) => {
    setError(message);
    setErrorTick((value) => value + 1);
    setShakeForm(true);
    setTimeout(() => setShakeForm(false), 420);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    if (!email.trim() || !password.trim() || !confirm.trim()) {
      raiseError('All fields are required.');
      return;
    }
    if (password.length < 6) {
      raiseError('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirm) {
      raiseError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await api.post('/api/auth/register', {
        email: email.trim(),
        password: password.trim()
      });
      setSuccess('Account created. Redirecting to login...');
      setSuccessTick((value) => value + 1);
      setTimeout(() => navigate('/login'), 900);
    } catch (err) {
      raiseError(err?.response?.data?.error || 'Unable to register. Please try again.');
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

          <div className={`theme-card auth-form-card auth-animate-rise ${shakeForm ? 'auth-form-shake' : ''} ${success ? 'auth-form-success' : ''}`}>
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
                  className="theme-input auth-input-glow"
                  required
                />
              </label>

              <label className="auth-field auth-password-field">
                <span>Password</span>
                <div className="auth-password-wrap">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="At least 6 characters"
                    className="theme-input auth-input-glow auth-password-input"
                    required
                  />
                  <button
                    type="button"
                    className="auth-password-toggle"
                    onClick={() => setShowPassword((value) => !value)}
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
              </label>

              <label className="auth-field auth-password-field">
                <span>Confirm Password</span>
                <div className="auth-password-wrap">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirm}
                    onChange={(event) => setConfirm(event.target.value)}
                    placeholder="Re-enter password"
                    className="theme-input auth-input-glow auth-password-input"
                    required
                  />
                  <button
                    type="button"
                    className="auth-password-toggle"
                    onClick={() => setShowConfirmPassword((value) => !value)}
                  >
                    {showConfirmPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
              </label>

              {error ? <p key={errorTick} className="theme-error auth-error-bounce">{error}</p> : null}
              {success ? (
                <p key={successTick} className="rounded-xl border px-3 py-2 text-sm auth-success-pop" style={{ borderColor: 'var(--success-border)', background: 'var(--success-bg)', color: 'var(--success-text)' }}>
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
