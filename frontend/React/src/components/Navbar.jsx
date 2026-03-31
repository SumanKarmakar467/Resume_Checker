export default function Navbar({ navigate, user, onLogout }) {
  const adminEmail = String(import.meta.env.VITE_ADMIN_EMAIL || "").trim().toLowerCase();
  const isAdmin = Boolean(
    user?.isAdmin || (adminEmail && String(user?.email || "").toLowerCase() === adminEmail)
  );

  return (
    <nav className="navbar">
      <div className="nav-logo mono">
        <button
          className="btn-ghost"
          onClick={() => navigate("landing")}
          style={{ fontSize: 11, padding: "4px 10px", marginRight: 8 }}
        >
          Back
        </button>
        Resume<span>AI</span>
      </div>

      <div className="nav-links">
        <button onClick={() => navigate("landing")}>features</button>
        <button onClick={() => navigate("builder")}>resume_builder</button>
        <button onClick={() => navigate("upload")}>ats_checker</button>
        <button onClick={() => navigate("history")}>history</button>
        {isAdmin ? <button onClick={() => navigate("admin")}>admin</button> : null}
      </div>

      <div className="nav-right">
        {user ? (
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "12px",
                color: "var(--g)",
              }}
            >
              {user.email}
            </div>
            {onLogout ? (
              <button className="btn-ghost" onClick={onLogout}>
                logout()
              </button>
            ) : null}
          </div>
        ) : (
          <>
            <button className="btn-ghost" onClick={() => navigate("auth")}>
              login()
            </button>
            <button className="btn-primary" onClick={() => navigate("auth")}>
              $ start_free
            </button>
          </>
        )}
      </div>
    </nav>
  );
}
