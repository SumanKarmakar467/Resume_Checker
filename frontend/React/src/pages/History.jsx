import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import { requestResumeApi } from "../api/resumeApi";

function formatDate(value) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "-";
  return parsed.toLocaleString();
}

export default function History({ navigate, user, onLogout }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    const loadHistory = async () => {
      setLoading(true);
      setError("");
      try {
        const data = await requestResumeApi("/history");
        if (mounted) setHistory(Array.isArray(data) ? data : []);
      } catch (err) {
        if (mounted) setError(err.message || "Failed to load analysis history.");
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadHistory();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div>
      <Navbar navigate={navigate} user={user} onLogout={onLogout} />

      <div style={{ maxWidth: 1080, margin: "0 auto", padding: "3.5rem 2rem" }}>
        <div style={{ marginBottom: "1.5rem" }}>
          <div
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 11,
              color: "var(--g)",
              marginBottom: 6,
            }}
          >
            # resume_analysis_history()
          </div>
          <h1 style={{ fontSize: "clamp(1.6rem, 3vw, 2.2rem)", fontWeight: 700 }}>
            Past Resume Analyses
          </h1>
        </div>

        {loading ? (
          <div className="card" style={{ padding: "1.2rem", fontFamily: "var(--font-mono)", color: "var(--muted)" }}>
            loading_history...
          </div>
        ) : null}

        {error ? (
          <div
            style={{
              background: "rgba(255,85,85,0.08)",
              border: "1px solid rgba(255,85,85,0.25)",
              borderRadius: 8,
              padding: "10px 14px",
              fontFamily: "var(--font-mono)",
              fontSize: 12,
              color: "var(--r)",
              marginBottom: "1rem",
            }}
          >
            x {error}
          </div>
        ) : null}

        {!loading && !error && !history.length ? (
          <div className="card" style={{ padding: "1.2rem", color: "var(--muted)" }}>
            No analyses yet. Upload a resume to create your first history item.
          </div>
        ) : null}

        {!loading && !error && history.length ? (
          <div style={{ display: "grid", gap: "0.9rem" }}>
            {history.map((item) => (
              <div key={item._id || item.id} className="card" style={{ padding: "1rem 1.1rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                  <div>
                    <div style={{ fontWeight: 700, marginBottom: 4 }}>{item.filename || "resume"}</div>
                    <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--muted)" }}>
                      {formatDate(item.createdAt)}
                    </div>
                  </div>
                  <div
                    style={{
                      border: "1px solid rgba(0,255,136,0.35)",
                      borderRadius: 999,
                      padding: "6px 12px",
                      fontFamily: "var(--font-mono)",
                      fontSize: 12,
                      color: "var(--g)",
                      height: "fit-content",
                    }}
                  >
                    ATS {item.atsScore ?? 0}%
                  </div>
                </div>

                <div style={{ marginTop: 10, color: "var(--muted)", fontSize: 13, lineHeight: 1.65 }}>
                  {item.feedback || "No feedback available."}
                </div>

                {(item.suggestions || []).length ? (
                  <ul style={{ marginTop: 10, paddingLeft: 18, lineHeight: 1.6 }}>
                    {item.suggestions.slice(0, 3).map((suggestion, index) => (
                      <li key={`${item._id || item.id}-s-${index}`} style={{ fontSize: 13 }}>
                        {suggestion}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}

