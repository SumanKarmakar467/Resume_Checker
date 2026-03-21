// Purpose: Show authenticated user history with ATS scores.
import { useEffect, useState } from 'react';
import api from '../api/axios';
import useAuth from '../hooks/useAuth';

const scoreColor = (score) => {
  if (score < 50) return '#EF4444';
  if (score < 75) return '#F59E0B';
  return '#22C55E';
};

function Dashboard() {
  const { logout } = useAuth();
  const [history, setHistory] = useState([]);
  const [expanded, setExpanded] = useState('');
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

  return (
    <main className="theme-page min-h-screen px-4 py-10">
      <div className="mx-auto max-w-5xl space-y-5">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-extrabold">Your ATS History</h1>
            <p className="theme-muted text-sm">Review your last 10 resume checks.</p>
          </div>
          <button
            type="button"
            onClick={logout}
            className="theme-button-secondary rounded-xl px-4 py-2 text-sm font-semibold"
          >
            Logout
          </button>
        </header>

        <div className="theme-card p-5 md:p-6">
          {loading ? (
            <p className="theme-muted text-sm">Loading history...</p>
          ) : null}
          {error ? <p className="theme-error rounded-xl px-3 py-2 text-sm">{error}</p> : null}

          {!loading && !error && history.length === 0 ? (
            <p className="theme-muted text-sm">No history yet. Run your first ATS analysis.</p>
          ) : null}

          {!loading && !error && history.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-[var(--border-color)] text-xs uppercase tracking-wide">
                    <th className="py-2 pr-4">Date</th>
                    <th className="py-2 pr-4">Job Title</th>
                    <th className="py-2 pr-4">ATS Score</th>
                    <th className="py-2 pr-4">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((item) => {
                    const score = item.atsScore ?? 0;
                    const color = scoreColor(score);
                    return (
                      <tr key={item.id} className="border-b border-[var(--border-color)]">
                        <td className="py-3 pr-4">
                          {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : '—'}
                        </td>
                        <td className="py-3 pr-4">{item.jobTitle || item.resumeFileName || 'Untitled'}</td>
                        <td className="py-3 pr-4">
                          <span
                            className="rounded-full px-3 py-1 text-xs font-bold"
                            style={{ backgroundColor: `${color}22`, color }}
                          >
                            {score}
                          </span>
                        </td>
                        <td className="py-3 pr-4">
                          <button
                            type="button"
                            onClick={() => setExpanded(expanded === item.id ? '' : item.id)}
                            className="theme-button-secondary rounded-lg px-3 py-1 text-xs font-semibold"
                          >
                            {expanded === item.id ? 'Hide Details' : 'View Details'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : null}
        </div>

        {history.map((item) => {
          if (expanded !== item.id) return null;
          return (
            <div key={`${item.id}-details`} className="theme-card p-5 md:p-6">
              <h2 className="text-lg font-bold">Details</h2>
              <p className="theme-muted text-sm">Matched vs missing keywords for this check.</p>

              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <article className="rounded-2xl border border-[var(--border-color)] bg-[var(--surface-soft)] p-4">
                  <h3 className="text-sm font-bold uppercase tracking-wide">Matched Keywords</h3>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {(item.matchedKeywords || []).map((keyword) => (
                      <span key={keyword} className="keyword-chip keyword-chip-strong">
                        {keyword}
                      </span>
                    ))}
                  </div>
                </article>
                <article className="rounded-2xl border border-[var(--border-color)] bg-[var(--surface-soft)] p-4">
                  <h3 className="text-sm font-bold uppercase tracking-wide">Missing Keywords</h3>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {(item.missingKeywords || []).map((keyword) => (
                      <span key={keyword} className="keyword-chip keyword-chip-weak">
                        + {keyword}
                      </span>
                    ))}
                  </div>
                </article>
              </div>
            </div>
          );
        })}
      </div>
    </main>
  );
}

export default Dashboard;
