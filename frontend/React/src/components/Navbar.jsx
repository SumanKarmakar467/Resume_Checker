export default function Navbar({ navigate, user }) {
  return (
    <nav className="navbar">
      <div className="nav-logo mono" onClick={() => navigate("landing")}>
        <span style={{ color: "var(--muted)" }}>[&gt;_]</span>&nbsp;
        Resume<span>AI</span>
      </div>

      <div className="nav-links">
        <button onClick={() => navigate("landing")}>features</button>
        <button onClick={() => navigate("builder")}>resume_builder</button>
        <button onClick={() => navigate("upload")}>ats_checker</button>
        {user && <button>dashboard</button>}
      </div>

      <div className="nav-right">
        {user ? (
          <div
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "12px",
              color: "var(--g)",
            }}
          >
            ● {user.email}
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
