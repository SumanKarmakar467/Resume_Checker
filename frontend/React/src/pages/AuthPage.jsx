import { useState } from "react";
import Navbar from "../components/Navbar";

const API_BASE = "http://localhost:8080/api/auth";

export default function AuthPage({ navigate, setUser }) {
  const [mode, setMode] = useState("login"); // "login" | "register"
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const update = (k, v) => setForm({ ...form, [k]: v });

  const handleSubmit = async () => {
    if (!form.email || !form.password) {
      setError("email and password are required.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const endpoint = mode === "login" ? "/login" : "/register";
      const body =
        mode === "login"
          ? { email: form.email, password: form.password }
          : { name: form.name, email: form.email, password: form.password };

      const res = await fetch(`${API_BASE}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || `Error ${res.status}`);
      }

      const data = await res.json();
      // Store JWT token
      if (data.token) localStorage.setItem("jwt_token", data.token);
      setUser({ email: form.email, name: form.name || form.email, token: data.token });
      navigate("landing");
    } catch (err) {
      setError(err.message || "Authentication failed. Make sure the backend is running.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Navbar navigate={navigate} />

      <div
        style={{
          minHeight: "90vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "3rem 2rem",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div className="grid-bg" />

        <div style={{ width: "100%", maxWidth: 440, animation: "fadeUp 0.5s ease" }}>
          {/* Header */}
          <div style={{ textAlign: "center", marginBottom: "2rem" }}>
            <div
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 11,
                color: "var(--g)",
                marginBottom: "0.75rem",
              }}
            >
              # user.{mode}()
            </div>
            <h1 style={{ fontSize: "2rem", fontWeight: 700, marginBottom: "0.5rem" }}>
              {mode === "login" ? "Welcome back." : "Create account."}
            </h1>
            <p style={{ color: "var(--muted)", fontSize: 14 }}>
              {mode === "login"
                ? "Sign in to save your resumes and track your ATS scores."
                : "Free forever. No credit card required."}
            </p>
          </div>

          {/* Card */}
          <div className="card">
            <div className="card-head">
              $ auth.{mode}() —{" "}
              <span style={{ color: "var(--muted)" }}>JWT secured</span>
            </div>
            <div style={{ padding: "1.75rem" }}>
              {/* OAuth */}
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: "1.25rem" }}>
                {[
                  { icon: "🐙", label: "Continue with GitHub" },
                  { icon: "🔵", label: "Continue with Google" },
                ].map(({ icon, label }) => (
                  <button
                    key={label}
                    style={{
                      width: "100%",
                      background: "var(--d3)",
                      border: "1px solid var(--border)",
                      color: "var(--text)",
                      fontSize: 13,
                      padding: "10px",
                      borderRadius: 8,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 10,
                      fontFamily: "var(--font-main)",
                      transition: "border-color 0.2s",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.borderColor = "var(--c)")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.borderColor = "var(--border)")
                    }
                    onClick={() => setError("OAuth coming soon — use email login for now.")}
                  >
                    {icon} &nbsp; {label}
                  </button>
                ))}
              </div>

              {/* Divider */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                  margin: "1.25rem 0",
                }}
              >
                <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
                <span
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: 11,
                    color: "var(--muted)",
                  }}
                >
                  // or with email
                </span>
                <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
              </div>

              {/* Form */}
              {mode === "register" && (
                <div className="form-group">
                  <label className="form-label">full_name</label>
                  <input
                    className="form-input"
                    type="text"
                    placeholder="Suman Karmakar"
                    value={form.name}
                    onChange={(e) => update("name", e.target.value)}
                  />
                </div>
              )}

              <div className="form-group">
                <label className="form-label">email_address</label>
                <input
                  className="form-input"
                  type="email"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={(e) => update("email", e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">password</label>
                <input
                  className="form-input"
                  type="password"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={(e) => update("password", e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                />
              </div>

              {/* Error */}
              {error && (
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
                  ✗ {error}
                </div>
              )}

              {/* Submit */}
              <button
                className="btn-primary"
                style={{
                  width: "100%",
                  justifyContent: "center",
                  fontSize: 13,
                  marginTop: "0.5rem",
                }}
                onClick={handleSubmit}
                disabled={loading}
              >
                {loading
                  ? "authenticating..."
                  : mode === "login"
                  ? "→ login --jwt-secured"
                  : "→ create_account()"}
              </button>

              {/* Toggle */}
              <div
                style={{
                  textAlign: "center",
                  marginTop: "1.25rem",
                  fontFamily: "var(--font-mono)",
                  fontSize: 11,
                  color: "var(--muted)",
                }}
              >
                {mode === "login" ? "no account?" : "already have one?"}{" "}
                <span
                  style={{ color: "var(--g)", cursor: "pointer" }}
                  onClick={() => {
                    setMode(mode === "login" ? "register" : "login");
                    setError("");
                  }}
                >
                  {mode === "login" ? "register()" : "login()"}
                </span>
              </div>

              {/* JWT note */}
              <div
                style={{
                  textAlign: "center",
                  marginTop: "1rem",
                  fontFamily: "var(--font-mono)",
                  fontSize: 10,
                  color: "var(--muted)",
                }}
              >
                🔒 JWT-secured · no tracking · your data stays yours
              </div>
            </div>
          </div>

          {/* Skip link */}
          <div style={{ textAlign: "center", marginTop: "1.5rem" }}>
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 12,
                color: "var(--muted)",
                cursor: "pointer",
              }}
              onClick={() => navigate("upload")}
            >
              skip → use without account
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
