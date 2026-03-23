import { useEffect, useRef, useState } from "react";
import Navbar from "../components/Navbar";

function Bar({ pct, color }) {
  const ref = useRef();
  const [w, setW] = useState(0);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setW(pct); obs.disconnect(); }
    }, { threshold: 0.3 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [pct]);
  return (
    <div ref={ref} className="score-bar-track">
      <div className="score-bar-fill" style={{ width: `${w}%`, background: color }} />
    </div>
  );
}

export default function Result({ navigate, result }) {
  const [count, setCount] = useState(0);
  const score = result?.atsScore ?? result?.score ?? 0;

  useEffect(() => {
    let n = 0;
    const iv = setInterval(() => {
      n = Math.min(n + 2, score);
      setCount(n);
      if (n >= score) clearInterval(iv);
    }, 18);
    return () => clearInterval(iv);
  }, [score]);

  if (!result) {
    return (
      <div>
        <Navbar navigate={navigate} />
        <div style={{ textAlign: "center", padding: "6rem 2rem" }}>
          <div style={{ fontFamily: "var(--font-mono)", color: "var(--muted)", marginBottom: "1.5rem" }}>
            # no result found — upload a resume first
          </div>
          <button className="btn-primary" onClick={() => navigate("upload")}>
            → go_to_upload()
          </button>
        </div>
      </div>
    );
  }

  const keywords = result.matchedKeywords || result.keywords || [];
  const missingKeywords = result.missingKeywords || [];
  const suggestions = result.suggestions || result.feedback || [];
  const sections = result.sections || {};

  const scoreColor =
    score >= 80 ? "var(--g)" : score >= 60 ? "var(--o)" : "var(--r)";
  const scoreGrade =
    score >= 80 ? "Excellent" : score >= 60 ? "Good" : "Needs Work";

  return (
    <div>
      <Navbar navigate={navigate} />
      <div
        style={{
          maxWidth: 960,
          margin: "0 auto",
          padding: "3.5rem 2rem",
          animation: "fadeUp 0.6s ease",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "1rem",
            marginBottom: "2.5rem",
          }}
        >
          <div>
            <div
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 11,
                color: "var(--g)",
                marginBottom: 6,
              }}
            >
              # analyze_result.json
            </div>
            <h1 style={{ fontSize: "clamp(1.6rem, 3vw, 2.4rem)", fontWeight: 700 }}>
              Your ATS Report
            </h1>
          </div>
          <div style={{ display: "flex", gap: "0.75rem" }}>
            <button className="btn-ghost" onClick={() => navigate("upload")}>
              ← upload_new()
            </button>
            <button className="btn-primary" onClick={() => navigate("builder")}>
              → fix_in_builder()
            </button>
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "1.5rem",
          }}
        >
          {/* BIG SCORE */}
          <div
            className="card"
            style={{ gridColumn: "span 1", textAlign: "center" }}
          >
            <div className="card-head">ats_score</div>
            <div style={{ padding: "2rem 1.5rem" }}>
              <div
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "4rem",
                  fontWeight: 700,
                  color: scoreColor,
                  lineHeight: 1,
                }}
              >
                {count}
              </div>
              <div
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 12,
                  color: "var(--muted)",
                  marginTop: 6,
                }}
              >
                / 100
              </div>
              <div
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 13,
                  color: scoreColor,
                  marginTop: "1rem",
                  padding: "6px 16px",
                  background: `${scoreColor}18`,
                  borderRadius: 20,
                  border: `1px solid ${scoreColor}40`,
                  display: "inline-block",
                }}
              >
                {scoreGrade}
              </div>
            </div>
          </div>

          {/* SCORE BREAKDOWN */}
          <div className="card" style={{ gridColumn: "span 1" }}>
            <div className="card-head">score_breakdown</div>
            <div style={{ padding: "1.5rem" }}>
              {[
                {
                  label: "keyword_match",
                  pct: result.keywordScore ?? 70,
                  color: "linear-gradient(90deg, var(--g), #00cc6a)",
                },
                {
                  label: "format_quality",
                  pct: result.formatScore ?? 80,
                  color: "linear-gradient(90deg, var(--c), #009bbd)",
                },
                {
                  label: "impact_verbs",
                  pct: result.verbScore ?? 65,
                  color: "linear-gradient(90deg, var(--p), #9b5fd8)",
                },
                {
                  label: "completeness",
                  pct: result.completenessScore ?? 75,
                  color: "linear-gradient(90deg, var(--o), #f08020)",
                },
              ].map(({ label, pct, color }) => (
                <div key={label} style={{ marginBottom: "1rem" }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontFamily: "var(--font-mono)",
                      fontSize: 11,
                      color: "var(--muted)",
                      marginBottom: 5,
                    }}
                  >
                    <span>{label}</span>
                    <span style={{ color: "var(--text)" }}>{pct}%</span>
                  </div>
                  <Bar pct={pct} color={color} />
                </div>
              ))}
            </div>
          </div>

          {/* KEYWORDS MATCHED */}
          {keywords.length > 0 && (
            <div className="card">
              <div className="card-head" style={{ color: "var(--g)" }}>
                keywords_matched ✓
              </div>
              <div style={{ padding: "1.5rem" }}>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {keywords.map((kw) => (
                    <span
                      key={kw}
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: 12,
                        background: "rgba(0,255,136,0.08)",
                        color: "var(--g)",
                        border: "1px solid rgba(0,255,136,0.2)",
                        padding: "4px 10px",
                        borderRadius: 4,
                      }}
                    >
                      {kw}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* MISSING KEYWORDS */}
          {missingKeywords.length > 0 && (
            <div className="card">
              <div className="card-head" style={{ color: "var(--o)" }}>
                keywords_missing ⚠
              </div>
              <div style={{ padding: "1.5rem" }}>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {missingKeywords.map((kw) => (
                    <span
                      key={kw}
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: 12,
                        background: "rgba(255,184,108,0.08)",
                        color: "var(--o)",
                        border: "1px solid rgba(255,184,108,0.2)",
                        padding: "4px 10px",
                        borderRadius: 4,
                      }}
                    >
                      {kw}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* SUGGESTIONS */}
          {suggestions.length > 0 && (
            <div className="card" style={{ gridColumn: "1 / -1" }}>
              <div className="card-head" style={{ color: "var(--c)" }}>
                ai_suggestions
              </div>
              <div style={{ padding: "1.5rem" }}>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.9rem",
                  }}
                >
                  {suggestions.map((s, i) => (
                    <div
                      key={i}
                      style={{
                        display: "flex",
                        gap: "0.75rem",
                        padding: "12px 14px",
                        background: "var(--d3)",
                        borderRadius: 8,
                        borderLeft: "3px solid var(--c)",
                      }}
                    >
                      <div
                        style={{
                          fontFamily: "var(--font-mono)",
                          fontSize: 11,
                          color: "var(--c)",
                          flexShrink: 0,
                          paddingTop: 2,
                        }}
                      >
                        {String(i + 1).padStart(2, "0")}
                      </div>
                      <div style={{ fontSize: 13, color: "var(--text)", lineHeight: 1.65 }}>
                        {s}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div
          style={{
            display: "flex",
            gap: "1rem",
            justifyContent: "center",
            marginTop: "3rem",
            flexWrap: "wrap",
          }}
        >
          <button className="btn-primary" onClick={() => navigate("builder")}>
            → fix_resume_in_builder()
          </button>
          <button className="btn-secondary" onClick={() => navigate("upload")}>
            analyze_another()
          </button>
        </div>
      </div>
    </div>
  );
}
