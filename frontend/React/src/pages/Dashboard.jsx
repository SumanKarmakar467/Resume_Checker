import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import useAuth from '../hooks/useAuth';
import useTheme from '../hooks/useTheme';

function scoreColor(score) {
  if (score >= 80) return '#16a34a';
  if (score >= 65) return '#d97706';
  return '#dc2626';
}

function Dashboard() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();

  const [history, setHistory] = useState([]);
  const [expandedId, setExpandedId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await api.get('/api/history');
        setHistory(Array.isArray(response.data) ? response.data : []);
      } catch (err) {
        setError(err?.response?.data?.error || 'Unable to load history.');
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, []);

  const handleDelete = async (itemId) => {
    try {
      await api.delete(`/api/history/${itemId}`);
      setHistory((current) => current.filter((item) => item.id !== itemId));
      if (expandedId === itemId) setExpandedId('');
    } catch (err) {
      setError(err?.response?.data?.error || 'Unable to delete history item.');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <main className="theme-page min-h-screen px-4 py-10">
      <div className="mx-auto max-w-6xl space-y-5">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-extrabold">Your ATS History</h1>
            <p className="theme-muted text-sm">Latest resume checks for your account.</p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button type="button" className="theme-button-secondary" onClick={() => navigate('/')}>
              Home
            </button>
            <button type="button" className="theme-toggle" onClick={toggleTheme}>
              {isDark ? 'Light Theme' : 'Dark Theme'}
            </button>
            <button type="button" className="theme-button-secondary" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </header>

        <section className="theme-card p-5 md:p-6">
          {loading ? <p className="theme-muted text-sm">Loading history...</p> : null}
          {error ? <p className="theme-error text-sm">{error}</p> : null}

          {!loading && !error && history.length === 0 ? (
            <p className="theme-muted text-sm">No history yet. Run your first ATS analysis from the home page.</p>
          ) : null}

          {!loading && !error && history.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead>
                  <tr className="border-b border-[var(--border-color)] text-xs uppercase tracking-wide">
                    <th className="py-2 pr-4">Date</th>
                    <th className="py-2 pr-4">Resume</th>
                    <th className="py-2 pr-4">ATS Score</th>
                    <th className="py-2 pr-4">Best Fit</th>
                    <th className="py-2 pr-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((item) => {
                    const score = item.atsScore ?? item.overallScore ?? 0;
                    const color = scoreColor(score);

                    return (
                      <tr key={item.id} className="border-b border-[var(--border-color)]">
                        <td className="py-3 pr-4">{item.createdAt ? new Date(item.createdAt).toLocaleDateString() : '-'}</td>
                        <td className="py-3 pr-4">{item.resumeFileName || item.jobTitle || 'Untitled'}</td>
                        <td className="py-3 pr-4">
                          <span className="rounded-full px-3 py-1 text-xs font-bold" style={{ backgroundColor: `${color}22`, color }}>
                            {score}/100
                          </span>
                        </td>
                        <td className="py-3 pr-4">{item.bestFitRole || 'General Software Developer'}</td>
                        <td className="py-3 pr-4">
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              className="theme-button-secondary"
                              onClick={() => setExpandedId((current) => (current === item.id ? '' : item.id))}
                            >
                              {expandedId === item.id ? 'Hide' : 'Details'}
                            </button>
                            <button
                              type="button"
                              className="theme-button-secondary"
                              onClick={() => handleDelete(item.id)}
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : null}
        </section>

        {history
          .filter((item) => item.id === expandedId)
          .map((item) => (
            <section key={`${item.id}-details`} className="theme-card p-5 md:p-6">
              <h2 className="text-lg font-bold">Details</h2>
              <p className="theme-muted mt-1 text-sm">{item.roleSuggestion || 'Use this result to tune your next resume iteration.'}</p>

              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <article className="rounded-2xl border border-[var(--border-color)] bg-[var(--surface-soft)] p-4">
                  <h3 className="text-xs font-bold uppercase tracking-wide">Matched Keywords</h3>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {(item.matchedKeywords || []).length ? (
                      item.matchedKeywords.map((keyword) => (
                        <span key={keyword} className="keyword-matched">{keyword}</span>
                      ))
                    ) : (
                      <span className="theme-muted text-xs">No matched keywords recorded</span>
                    )}
                  </div>
                </article>

                <article className="rounded-2xl border border-[var(--border-color)] bg-[var(--surface-soft)] p-4">
                  <h3 className="text-xs font-bold uppercase tracking-wide">Missing Keywords</h3>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {(item.missingKeywords || []).length ? (
                      item.missingKeywords.map((keyword) => (
                        <span key={keyword} className="keyword-missing">{keyword}</span>
                      ))
                    ) : (
                      <span className="theme-muted text-xs">No missing keywords recorded</span>
                    )}
                  </div>
                </article>
              </div>
            </section>
          ))}
      </div>
    </main>
  );
}

export default Dashboard;
