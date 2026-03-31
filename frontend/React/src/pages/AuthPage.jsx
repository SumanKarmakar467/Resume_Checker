import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { useAuthContext } from "../context/AuthContext";

const PAGE_ROUTES = {
  landing: "/",
  upload: "/upload",
  builder: "/builder",
  result: "/result",
  auth: "/login",
  admin: "/admin",
};

export default function AuthPage({ initialMode = "login" }) {
  const navigate = useNavigate();
  const { login, signup } = useAuthContext();

  const [mode, setMode] = useState(initialMode);
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setMode(initialMode);
  }, [initialMode]);

  const appNavigate = (target) => {
    navigate(PAGE_ROUTES[target] || "/");
  };

  const update = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async () => {
    if (!form.email.trim() || !form.password.trim()) {
      setError("email and password are required.");
      return;
    }

    if (mode === "register" && form.password.trim().length < 6) {
      setError("password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      if (mode === "login") {
        await login(form.email.trim(), form.password.trim());
      } else {
        await signup(form.email.trim(), form.password.trim(), form.name.trim());
      }
      navigate("/");
    } catch (err) {
      const code = err?.code || "";
      if (code === "auth/invalid-credential" || code === "auth/wrong-password" || code === "auth/user-not-found") {
        setError("invalid email or password.");
      } else if (code === "auth/email-already-in-use") {
        setError("email already exists. please login instead.");
      } else {
        setError(err?.message || "authentication failed. please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Navbar navigate={appNavigate} />

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
                ? "Sign in to continue your ATS workflow."
                : "Register once and keep all resume progress synced."}
            </p>
          </div>

          <div className="card">
            <div className="card-head">
              $ auth.{mode}() - <span style={{ color: "var(--muted)" }}>persistent session</span>
            </div>
            <div style={{ padding: "1.75rem" }}>
              {mode === "register" && (
                <div className="form-group">
                  <label className="form-label">full_name</label>
                  <input
                    className="form-input"
                    type="text"
                    placeholder="Suman Karmakar"
                    value={form.name}
                    onChange={(event) => update("name", event.target.value)}
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
                  onChange={(event) => update("email", event.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">password</label>
                <input
                  className="form-input"
                  type="password"
                  placeholder="........"
                  value={form.password}
                  onChange={(event) => update("password", event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") handleSubmit();
                  }}
                />
              </div>

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
                  x {error}
                </div>
              )}

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
                  ? "-> login()"
                  : "-> create_account()"}
              </button>

              <div
                style={{
                  textAlign: "center",
                  marginTop: "1.25rem",
                  fontFamily: "var(--font-mono)",
                  fontSize: 11,
                  color: "var(--muted)",
                }}
              >
                {mode === "login" ? "no account?" : "already have one?"} {" "}
                <span
                  style={{ color: "var(--g)", cursor: "pointer" }}
                  onClick={() => {
                    const nextMode = mode === "login" ? "register" : "login";
                    setMode(nextMode);
                    setError("");
                    navigate(nextMode === "login" ? "/login" : "/register");
                  }}
                >
                  {mode === "login" ? "register()" : "login()"}
                </span>
              </div>

              <div
                style={{
                  textAlign: "center",
                  marginTop: "1rem",
                  fontFamily: "var(--font-mono)",
                  fontSize: 10,
                  color: "var(--muted)",
                }}
              >
                persistent auth enabled via local session
              </div>
            </div>
          </div>

          <div style={{ textAlign: "center", marginTop: "1.5rem" }}>
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 12,
                color: "var(--muted)",
                cursor: "pointer",
              }}
              onClick={() => appNavigate("upload")}
            >
              continue_as_guest - analyze once
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
