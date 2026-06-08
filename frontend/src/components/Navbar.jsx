import useTheme from "../hooks/useTheme";

export default function Navbar({ navigate, user, onLogout }) {
  const { isDark, toggleTheme } = useTheme();
  const adminEmail = String(import.meta.env.VITE_ADMIN_EMAIL || "").trim().toLowerCase();
  const isAdmin = Boolean(
    user?.isAdmin || (adminEmail && String(user?.email || "").toLowerCase() === adminEmail)
  );

  return (
    <nav className="navbar">
      <button
        onClick={() => navigate("landing")}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          background: "transparent",
          border: "none",
          color: "var(--text)",
          cursor: "pointer",
          fontFamily: "inherit",
          fontSize: 17,
          fontWeight: 500,
        }}
      >
        <span
          style={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: "#7c6ff7",
            animation: "float 2s ease-in-out infinite",
          }}
        />
        ATS Resume Checker
      </button>

      <div className="nav-links">
        <button onClick={() => navigate("builder")}>Builder</button>
        <button onClick={() => navigate("upload")}>Analyze</button>
        <button onClick={() => navigate("history")}>History</button>
        <button onClick={() => navigate("pricing")}>Pricing</button>
        {isAdmin ? <button onClick={() => navigate("admin")}>Admin</button> : null}
      </div>

      <div className="nav-right">
        <span
          style={{
            fontSize: 11,
            padding: "3px 10px",
            borderRadius: 20,
            background: "rgba(124,111,247,0.15)",
            color: "var(--c)",
            border: "0.5px solid rgba(124,111,247,0.3)",
            whiteSpace: "nowrap",
          }}
        >
          AI Powered
        </span>

        <button
          className="btn-ghost"
          onClick={toggleTheme}
          title={isDark ? "Switch to light theme" : "Switch to dark theme"}
          aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
          style={{ padding: "6px 10px" }}
        >
          {isDark ? "Light" : "Dark"}
        </button>

        {user ? (
          <div className="nav-user">
            <span>{user.email}</span>
            {onLogout ? (
              <button className="btn-ghost" onClick={onLogout}>
                Logout
              </button>
            ) : null}
          </div>
        ) : (
          <>
            <button className="btn-ghost" onClick={() => navigate("auth")}>
              Login
            </button>
            <button className="btn-primary" onClick={() => navigate("auth")}>
              Start free
            </button>
          </>
        )}
      </div>
    </nav>
  );
}
