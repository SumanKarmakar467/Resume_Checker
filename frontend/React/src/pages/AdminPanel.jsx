import { useEffect, useMemo, useState } from "react";
import {
  fetchAdminUsers,
  fetchAdminAnalyses,
  fetchAdminBuilds,
} from "../api/resumeApi";

const ADMIN_UNLOCK_KEY = "resume_admin_unlocked";
const DEFAULT_ADMIN_PASSWORD = "admin123";

function formatDate(value) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "-";
  return parsed.toLocaleString();
}

function truncateText(value, max = 80) {
  const text = String(value || "").trim();
  if (text.length <= max) return text;
  return `${text.slice(0, Math.max(0, max - 1)).trim()}...`;
}

function UsersTable({ rows }) {
  return (
    <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 720 }}>
      <thead>
        <tr style={{ background: "#f1f5f9", color: "#0f172a", textAlign: "left" }}>
          <th style={{ padding: "10px 12px", borderBottom: "1px solid #cbd5e1" }}>User ID / Email</th>
          <th style={{ padding: "10px 12px", borderBottom: "1px solid #cbd5e1" }}>Registration Date</th>
          <th style={{ padding: "10px 12px", borderBottom: "1px solid #cbd5e1" }}>Last Active</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((item, index) => (
          <tr key={item.id || item.email || index} style={{ background: index % 2 === 0 ? "#ffffff" : "#f8fafc" }}>
            <td style={{ padding: "10px 12px", borderBottom: "1px solid #e2e8f0" }}>
              {item.email || "anonymous"} {item.id ? `(${item.id})` : ""}
            </td>
            <td style={{ padding: "10px 12px", borderBottom: "1px solid #e2e8f0" }}>{formatDate(item.createdAt)}</td>
            <td style={{ padding: "10px 12px", borderBottom: "1px solid #e2e8f0" }}>{formatDate(item.lastActive)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function AnalysesTable({ rows }) {
  return (
    <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 900 }}>
      <thead>
        <tr style={{ background: "#f1f5f9", color: "#0f172a", textAlign: "left" }}>
          <th style={{ padding: "10px 12px", borderBottom: "1px solid #cbd5e1" }}>User Email</th>
          <th style={{ padding: "10px 12px", borderBottom: "1px solid #cbd5e1" }}>Filename</th>
          <th style={{ padding: "10px 12px", borderBottom: "1px solid #cbd5e1" }}>Job Description</th>
          <th style={{ padding: "10px 12px", borderBottom: "1px solid #cbd5e1" }}>ATS Score</th>
          <th style={{ padding: "10px 12px", borderBottom: "1px solid #cbd5e1" }}>Timestamp</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((item, index) => (
          <tr key={item.id || index} style={{ background: index % 2 === 0 ? "#ffffff" : "#f8fafc" }}>
            <td style={{ padding: "10px 12px", borderBottom: "1px solid #e2e8f0" }}>{item.userEmail || "anonymous"}</td>
            <td style={{ padding: "10px 12px", borderBottom: "1px solid #e2e8f0" }}>{item.filename || "-"}</td>
            <td style={{ padding: "10px 12px", borderBottom: "1px solid #e2e8f0" }}>{truncateText(item.jobDescription, 70) || "-"}</td>
            <td style={{ padding: "10px 12px", borderBottom: "1px solid #e2e8f0" }}>{Number(item.atsScore || 0)}</td>
            <td style={{ padding: "10px 12px", borderBottom: "1px solid #e2e8f0" }}>{formatDate(item.analyzedAt)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function BuildsTable({ rows }) {
  return (
    <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 760 }}>
      <thead>
        <tr style={{ background: "#f1f5f9", color: "#0f172a", textAlign: "left" }}>
          <th style={{ padding: "10px 12px", borderBottom: "1px solid #cbd5e1" }}>User Email</th>
          <th style={{ padding: "10px 12px", borderBottom: "1px solid #cbd5e1" }}>Template</th>
          <th style={{ padding: "10px 12px", borderBottom: "1px solid #cbd5e1" }}>Timestamp</th>
          <th style={{ padding: "10px 12px", borderBottom: "1px solid #cbd5e1" }}>Download Count</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((item, index) => (
          <tr key={item.id || index} style={{ background: index % 2 === 0 ? "#ffffff" : "#f8fafc" }}>
            <td style={{ padding: "10px 12px", borderBottom: "1px solid #e2e8f0" }}>{item.userEmail || "anonymous"}</td>
            <td style={{ padding: "10px 12px", borderBottom: "1px solid #e2e8f0" }}>{item.templateName || "-"}</td>
            <td style={{ padding: "10px 12px", borderBottom: "1px solid #e2e8f0" }}>{formatDate(item.builtAt)}</td>
            <td style={{ padding: "10px 12px", borderBottom: "1px solid #e2e8f0" }}>{Number(item.downloadCount || 0)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default function AdminPanel() {
  const [password, setPassword] = useState("");
  const [isUnlocked, setIsUnlocked] = useState(() => localStorage.getItem(ADMIN_UNLOCK_KEY) === "1");
  const [tab, setTab] = useState("users");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [users, setUsers] = useState([]);
  const [analyses, setAnalyses] = useState([]);
  const [builds, setBuilds] = useState([]);

  const adminPassword = String(import.meta.env.VITE_ADMIN_PASSWORD || DEFAULT_ADMIN_PASSWORD);

  useEffect(() => {
    if (!isUnlocked) return;
    let mounted = true;

    const loadData = async () => {
      setLoading(true);
      setError("");
      try {
        const [usersRes, analysesRes, buildsRes] = await Promise.all([
          fetchAdminUsers(),
          fetchAdminAnalyses(),
          fetchAdminBuilds(),
        ]);
        if (!mounted) return;
        setUsers(Array.isArray(usersRes) ? usersRes : []);
        setAnalyses(Array.isArray(analysesRes) ? analysesRes : []);
        setBuilds(Array.isArray(buildsRes) ? buildsRes : []);
      } catch (err) {
        if (!mounted) return;
        setError(err.message || "Failed to load admin data.");
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadData();
    return () => {
      mounted = false;
    };
  }, [isUnlocked]);

  const counts = useMemo(
    () => ({
      users: users.length,
      analyses: analyses.length,
      builds: builds.length,
    }),
    [users, analyses, builds]
  );

  const handleUnlock = () => {
    if (password === adminPassword) {
      localStorage.setItem(ADMIN_UNLOCK_KEY, "1");
      setIsUnlocked(true);
      setError("");
      setPassword("");
      return;
    }
    setError("Incorrect admin password.");
  };

  if (!isUnlocked) {
    return (
      <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: "#f8fafc", color: "#1a1a1a" }}>
        <div style={{ width: "min(420px, 92vw)", background: "#ffffff", border: "1px solid #cbd5e1", borderRadius: 12, padding: 20 }}>
          <h1 style={{ margin: 0, marginBottom: 8 }}>Admin Access</h1>
          <p style={{ margin: 0, marginBottom: 14, color: "#475569", fontSize: 14 }}>
            Enter the admin password to access the dashboard.
          </p>
          <input
            className="form-input"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Admin password"
          />
          {error ? <div style={{ marginTop: 8, color: "#b91c1c", fontSize: 13 }}>{error}</div> : null}
          <button className="btn-primary" style={{ marginTop: 12 }} onClick={handleUnlock}>
            unlock_admin()
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", display: "grid", gridTemplateColumns: "240px 1fr", background: "#f8fafc" }}>
      <aside style={{ background: "#1e293b", color: "#ffffff", padding: "22px 14px" }}>
        <h2 style={{ marginTop: 0, marginBottom: 16, fontSize: 18 }}>Admin Panel</h2>
        {[
          { key: "users", label: `Registered Users (${counts.users})` },
          { key: "analyses", label: `Resume Analyses (${counts.analyses})` },
          { key: "builds", label: `Resume Builds (${counts.builds})` },
        ].map((item) => (
          <button
            key={item.key}
            onClick={() => setTab(item.key)}
            style={{
              width: "100%",
              textAlign: "left",
              marginBottom: 8,
              border: "1px solid rgba(255,255,255,0.18)",
              background: tab === item.key ? "rgba(255,255,255,0.22)" : "transparent",
              color: "#ffffff",
              borderRadius: 8,
              padding: "9px 10px",
              cursor: "pointer",
              fontSize: 13,
            }}
          >
            {item.label}
          </button>
        ))}
        <button
          onClick={() => {
            localStorage.removeItem(ADMIN_UNLOCK_KEY);
            setIsUnlocked(false);
          }}
          style={{
            width: "100%",
            marginTop: 16,
            border: "1px solid rgba(255,255,255,0.18)",
            background: "transparent",
            color: "#ffffff",
            borderRadius: 8,
            padding: "9px 10px",
            cursor: "pointer",
            fontSize: 13,
          }}
        >
          lock_admin()
        </button>
      </aside>

      <main style={{ background: "#ffffff", color: "#1a1a1a", padding: "20px 22px" }}>
        <h1 style={{ marginTop: 0 }}>{tab === "users" ? "Registered Users" : tab === "analyses" ? "Resume Analyses" : "Resume Builds"}</h1>
        {loading ? <p style={{ color: "#475569" }}>Loading data...</p> : null}
        {error ? <p style={{ color: "#b91c1c" }}>{error}</p> : null}
        {!loading && !error ? (
          <div style={{ border: "1px solid #cbd5e1", borderRadius: 10, overflowX: "auto" }}>
            {tab === "users" ? <UsersTable rows={users} /> : null}
            {tab === "analyses" ? <AnalysesTable rows={analyses} /> : null}
            {tab === "builds" ? <BuildsTable rows={builds} /> : null}
          </div>
        ) : null}
      </main>
    </div>
  );
}
