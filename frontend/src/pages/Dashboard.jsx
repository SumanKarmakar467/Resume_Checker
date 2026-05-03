import { useEffect, useMemo, useState } from "react";
import Navbar from "../components/Navbar";
import ResumeCard from "../components/ResumeCard";
import StatsSummary from "../components/StatsSummary";
import { deleteHistoryItemWithUser, requestHistory } from "../api/resumeApi";

function LoadingSkeleton() {
  return (
    <div style={{ display: "grid", gap: 10 }}>
      {[1, 2, 3].map((id) => (
        <div key={id} className="card" style={{ padding: "1rem", opacity: 0.7 }}>
          <div style={{ height: 14, width: "36%", background: "var(--d3)", borderRadius: 6, marginBottom: 10 }} />
          <div style={{ height: 10, width: "95%", background: "var(--d3)", borderRadius: 6 }} />
        </div>
      ))}
    </div>
  );
}

export default function Dashboard({ navigate, user, onLogout }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [minScore, setMinScore] = useState(0);
  const [deletingId, setDeletingId] = useState("");

  const loadHistory = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await requestHistory({
        limit: 100,
        minScore,
        includeText: false,
        userEmail: user?.email || "",
      });
      setItems(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "Failed to fetch history.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, [minScore]);

  const stats = useMemo(() => {
    const total = items.length;
    const avg = total ? Math.round(items.reduce((sum, item) => sum + Number(item.atsScore || 0), 0) / total) : 0;
    const good = items.filter((item) => Number(item.atsScore || 0) >= 80).length;
    const poor = items.filter((item) => Number(item.atsScore || 0) < 50).length;
    return { total, average: avg, good, poor };
  }, [items]);

  const handleDelete = async (id) => {
    if (!id) return;
    setDeletingId(id);
    try {
      await deleteHistoryItemWithUser(id, user?.email || "");
      await loadHistory();
    } catch (err) {
      setError(err.message || "Failed to delete history item.");
    } finally {
      setDeletingId("");
    }
  };

  return (
    <div>
      <Navbar navigate={navigate} user={user} onLogout={onLogout} />
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "2rem" }}>
        <div style={{ marginBottom: "1rem" }}>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--g)", marginBottom: 6 }}>
            # analysis_history_dashboard()
          </div>
          <h1 style={{ fontSize: "clamp(1.6rem, 3vw, 2.2rem)", fontWeight: 800 }}>History Dashboard</h1>
        </div>

        <StatsSummary stats={stats} />

        <div className="card" style={{ padding: "1rem", marginBottom: 14 }}>
          <label className="form-label" htmlFor="min-score">
            minimum_ats_score: {minScore}
          </label>
          <input
            id="min-score"
            type="range"
            min="0"
            max="100"
            value={minScore}
            onChange={(event) => setMinScore(Number(event.target.value))}
            style={{ width: "100%" }}
          />
        </div>

        {error ? (
          <div style={{ background: "rgba(255,85,85,0.08)", border: "1px solid rgba(255,85,85,0.25)", borderRadius: 8, padding: "10px 14px", fontSize: 12, color: "var(--r)", marginBottom: 12 }}>
            x {error}
          </div>
        ) : null}

        {loading ? <LoadingSkeleton /> : null}

        {!loading && !items.length ? (
          <div className="card" style={{ padding: "1rem", color: "var(--muted)" }}>
            No analyses found yet. Upload a resume to generate history.
          </div>
        ) : null}

        {!loading && items.length ? (
          <div style={{ display: "grid", gap: 10 }}>
            {items.map((item) => (
              <ResumeCard
                key={item.id || item._id}
                item={item}
                deleting={deletingId === (item.id || item._id)}
                onDelete={() => handleDelete(item.id || item._id)}
              />
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}
