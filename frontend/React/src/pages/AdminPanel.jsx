import { useEffect, useMemo, useState } from "react";
import {
  adminLogin,
  fetchAdminUsers,
  fetchAdminAnalyses,
  fetchAdminBuilds,
} from "../api/resumeApi";

const ADMIN_TOKEN_KEY = "resume_admin_token";
const ADMIN_EMAIL_KEY = "resume_admin_email";
const DEFAULT_ADMIN_EMAIL = "karmakarsuman12138@gmail.com";

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

function isAuthError(errorMessage) {
  const text = String(errorMessage || "").toLowerCase();
  return (
    text.includes("invalid or expired admin token") ||
    text.includes("missing admin token") ||
    text.includes("admin access denied")
  );
}

function saveAdminSession(token, email) {
  localStorage.setItem(ADMIN_TOKEN_KEY, token);
  localStorage.setItem(ADMIN_EMAIL_KEY, email);
}

function clearAdminSession() {
  localStorage.removeItem(ADMIN_TOKEN_KEY);
  localStorage.removeItem(ADMIN_EMAIL_KEY);
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
  const prefilledAdminEmail = String(import.meta.env.VITE_ADMIN_EMAIL || DEFAULT_ADMIN_EMAIL)
    .trim()
    .toLowerCase();

  const [token, setToken] = useState(() => localStorage.getItem(ADMIN_TOKEN_KEY) || "");
  const [loggedInEmail, setLoggedInEmail] = useState(() => localStorage.getItem(ADMIN_EMAIL_KEY) || "");
  const [form, setForm] = useState(() => ({
    email: localStorage.getItem(ADMIN_EMAIL_KEY) || prefilledAdminEmail,
    password: "",
  }));

  const [tab, setTab] = useState("users");
  const [authLoading, setAuthLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [users, setUsers] = useState([]);
  const [analyses, setAnalyses] = useState([]);
  const [builds, setBuilds] = useState([]);

  useEffect(() => {
    if (!token) return;
    let mounted = true;

    const loadData = async () => {
      setLoading(true);
      setError("");
      try {
        const [usersRes, analysesRes, buildsRes] = await Promise.all([
          fetchAdminUsers(token),
          fetchAdminAnalyses(token),
          fetchAdminBuilds(token),
        ]);
        if (!mounted) return;
        setUsers(Array.isArray(usersRes) ? usersRes : []);
        setAnalyses(Array.isArray(analysesRes) ? analysesRes : []);
        setBuilds(Array.isArray(buildsRes) ? buildsRes : []);
      } catch (err) {
        if (!mounted) return;
        const message = err?.message || "Failed to load admin data.";
        if (isAuthError(message)) {
          clearAdminSession();
          setToken("");
          setLoggedInEmail("");
          setForm((prev) => ({ ...prev, password: "" }));
          setError("Admin session expired. Please login again.");
          return;
        }
        setError(message);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadData();
    return () => {
      mounted = false;
    };
  }, [token]);

  const counts = useMemo(
    () => ({
      users: users.length,
      analyses: analyses.length,
      builds: builds.length,
    }),
    [users, analyses, builds]
  );

  const handleLogin = async () => {
    const email = String(form.email || "").trim().toLowerCase();
    const password = String(form.password || "");

    if (!email || !password) {
      setError("Admin email and password are required.");
      return;
    }

    setAuthLoading(true);
    setError("");
    try {
      const payload = await adminLogin(email, password);
      const nextToken = String(payload?.token || "").trim();
      const nextEmail = String(payload?.admin?.email || email).trim().toLowerCase();

      if (!nextToken) {
        throw new Error("Login succeeded but token was not returned.");
      }

      saveAdminSession(nextToken, nextEmail);
      setToken(nextToken);
      setLoggedInEmail(nextEmail);
      setForm({ email: nextEmail, password: "" });
    } catch (err) {
      setError(err?.message || "Admin login failed.");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    clearAdminSession();
    setToken("");
    setLoggedInEmail("");
    setForm((prev) => ({ ...prev, password: "" }));
  };

  if (!token) {
    return (
      <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: "#f8fafc", color: "#1a1a1a" }}>
        <div style={{ width: "min(460px, 92vw)", background: "#ffffff", border: "1px solid #cbd5e1", borderRadius: 12, padding: 20 }}>
          <h1 style={{ margin: 0, marginBottom: 8 }}>Admin Login</h1>
          <p style={{ margin: 0, marginBottom: 14, color: "#475569", fontSize: 14 }}>
            Sign in with your admin credentials to access project user analytics.
          </p>

          <div className="form-group">
            <label className="form-label">admin_email</label>
            <input
              className="form-input"
              type="email"
              value={form.email}
              onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
              placeholder="admin@example.com"
            />
          </div>

          <div className="form-group">
            <label className="form-label">admin_password</label>
            <input
              className="form-input"
              type="password"
              value={form.password}
              onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
              placeholder="••••••••"
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  handleLogin();
                }
              }}
            />
          </div>

          {error ? <div style={{ marginTop: 8, color: "#b91c1c", fontSize: 13 }}>{error}</div> : null}
          <button className="btn-primary" style={{ marginTop: 12 }} onClick={handleLogin} disabled={authLoading}>
            {authLoading ? "logging_in..." : "login_admin()"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", display: "grid", gridTemplateColumns: "240px 1fr", background: "#f8fafc" }}>
      <aside style={{ background: "#1e293b", color: "#ffffff", padding: "22px 14px" }}>
        <h2 style={{ marginTop: 0, marginBottom: 4, fontSize: 18 }}>Admin Panel</h2>
        <p style={{ marginTop: 0, marginBottom: 16, fontSize: 12, color: "rgba(255,255,255,0.72)" }}>
          {loggedInEmail || "admin"}
        </p>

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
          onClick={handleLogout}
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
          logout_admin()
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
