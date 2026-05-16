import { useEffect, useMemo, useRef } from "react";
import Navbar from "../components/Navbar";

function animateNumber(element, target, suffix = "", duration = 1000) {
  const start = Date.now();
  const tick = () => {
    const progress = Math.min(1, (Date.now() - start) / duration);
    const ease = 1 - Math.pow(1 - progress, 3);
    if (element) element.textContent = `${Math.round(ease * target)}${suffix}`;
    if (progress < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

function clampScore(value, fallback = 0) {
  const number = Number(value ?? fallback);
  if (!Number.isFinite(number)) return fallback;
  return Math.max(0, Math.min(100, Math.round(number)));
}

function getColor(score) {
  if (score >= 85) return "#5dcaa5";
  if (score >= 70) return "#7c6ff7";
  if (score >= 50) return "#ef9f27";
  return "#e24b4a";
}

function getLabel(score) {
  if (score >= 85) return "Excellent Match";
  if (score >= 70) return "Good Match";
  if (score >= 50) return "Fair Match";
  return "Needs Work";
}

function getDesc(score) {
  if (score >= 85) return "Your resume is highly optimized for ATS systems.";
  if (score >= 70) return "Your resume is well optimized with room to improve.";
  return "Use the suggestions below to improve your match score.";
}

export default function Result({ navigate, result, user, onLogout }) {
  const scoreNumRef = useRef();
  const kwRef = useRef();
  const fmtRef = useRef();
  const readRef = useRef();
  const impactRef = useRef();
  const circleRef = useRef();
  const kwBarRef = useRef();
  const fmtBarRef = useRef();
  const readBarRef = useRef();
  const impactBarRef = useRef();

  const score = clampScore(result?.atsScore ?? result?.score);
  const keywordScore = clampScore(result?.keywordScore, Math.max(0, score - 6));
  const formatScore = clampScore(result?.formatScore, Math.min(100, score + 8));
  const readabilityScore = clampScore(result?.readabilityScore ?? result?.completenessScore, Math.min(100, score + 3));
  const impactScore = clampScore(result?.verbScore, Math.max(0, score - 10));
  const optimizedResume = result?.optimizedResume || "";

  const keywords = useMemo(
    () => result?.foundKeywords || result?.matchedKeywords || result?.keywords || [],
    [result]
  );
  const missingKeywords = result?.missingKeywords || [];
  const suggestions = Array.isArray(result?.suggestions)
    ? result.suggestions
    : result?.feedback
      ? [result.feedback]
      : [];

  useEffect(() => {
    if (!result) return;
    const circumference = 2 * Math.PI * 68;
    const timer = window.setTimeout(() => {
      if (circleRef.current) {
        circleRef.current.style.strokeDashoffset = circumference - (circumference * score) / 100;
        circleRef.current.style.stroke = getColor(score);
      }
      animateNumber(scoreNumRef.current, score, "", 1200);
    }, 180);

    const metricTimer = window.setTimeout(() => {
      animateNumber(kwRef.current, keywordScore, "%", 1000);
      animateNumber(fmtRef.current, formatScore, "%", 1000);
      animateNumber(readRef.current, readabilityScore, "%", 1000);
      animateNumber(impactRef.current, impactScore, "%", 1000);
      if (kwBarRef.current) kwBarRef.current.style.width = `${keywordScore}%`;
      if (fmtBarRef.current) fmtBarRef.current.style.width = `${formatScore}%`;
      if (readBarRef.current) readBarRef.current.style.width = `${readabilityScore}%`;
      if (impactBarRef.current) impactBarRef.current.style.width = `${impactScore}%`;
    }, 420);

    return () => {
      window.clearTimeout(timer);
      window.clearTimeout(metricTimer);
    };
  }, [formatScore, impactScore, keywordScore, readabilityScore, result, score]);

  const downloadOptimizedResume = () => {
    if (!optimizedResume.trim()) return;
    const blob = new Blob([optimizedResume], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "ats_optimized_resume.txt";
    anchor.click();
    URL.revokeObjectURL(url);
  };

  if (!result) {
    return (
      <div>
        <Navbar navigate={navigate} user={user} onLogout={onLogout} />
        <div style={{ textAlign: "center", padding: "6rem 2rem" }}>
          <div style={{ color: "rgba(255,255,255,0.42)", marginBottom: "1.5rem" }}>
            No result found. Upload a resume first.
          </div>
          <button className="btn-primary" onClick={() => navigate("upload")}>
            Go to upload
          </button>
        </div>
      </div>
    );
  }

  const circumference = 2 * Math.PI * 68;
  const metrics = [
    { ref: kwRef, barRef: kwBarRef, val: keywordScore, label: "Keyword match", color: "#7c6ff7", icon: "KW" },
    { ref: fmtRef, barRef: fmtBarRef, val: formatScore, label: "Format quality", color: "#5dcaa5", icon: "FM" },
    { ref: readRef, barRef: readBarRef, val: readabilityScore, label: "Readability", color: "#ef9f27", icon: "RD" },
    { ref: impactRef, barRef: impactBarRef, val: impactScore, label: "Impact verbs", color: "#e24b4a", icon: "IV" },
  ];

  return (
    <div>
      <Navbar navigate={navigate} user={user} onLogout={onLogout} />
      <main style={{ maxWidth: 920, margin: "0 auto", padding: "40px 24px", animation: "slideUp 0.5s ease" }}>
        <section style={{ textAlign: "center", marginBottom: 44 }}>
          <div style={{ position: "relative", width: 160, height: 160, margin: "0 auto 24px" }}>
            <svg width="160" height="160" viewBox="0 0 160 160" style={{ transform: "rotate(-90deg)" }}>
              <circle cx="80" cy="80" r="68" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
              <circle
                ref={circleRef}
                cx="80"
                cy="80"
                r="68"
                fill="none"
                stroke="#7c6ff7"
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={circumference}
                style={{ transition: "stroke-dashoffset 1.2s cubic-bezier(0.4,0,0.2,1), stroke 0.3s" }}
              />
            </svg>
            <div
              style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <div ref={scoreNumRef} style={{ fontSize: 40, fontWeight: 500, color: "#fff", lineHeight: 1 }}>
                0
              </div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", marginTop: 6 }}>ATS score</div>
            </div>
          </div>
          <div style={{ fontSize: 22, fontWeight: 500, color: "#fff", marginBottom: 6 }}>{getLabel(score)}</div>
          <div style={{ fontSize: 14, color: "rgba(255,255,255,0.42)" }}>{getDesc(score)}</div>
        </section>

        <section
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: 12,
            marginBottom: 32,
          }}
        >
          {metrics.map((metric, index) => (
            <div
              key={metric.label}
              className="card"
              style={{ padding: 20, animation: `slideUp 0.5s ease ${index * 0.1}s both` }}
            >
              <div style={{ fontSize: 12, color: metric.color, marginBottom: 12 }}>{metric.icon}</div>
              <div ref={metric.ref} style={{ fontSize: 28, fontWeight: 500, color: "#fff", marginBottom: 4 }}>
                0%
              </div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.35)" }}>{metric.label}</div>
              <div
                style={{
                  height: 3,
                  background: "rgba(255,255,255,0.06)",
                  borderRadius: 2,
                  marginTop: 12,
                  overflow: "hidden",
                }}
              >
                <div
                  ref={metric.barRef}
                  style={{
                    height: "100%",
                    background: metric.color,
                    borderRadius: 2,
                    width: "0%",
                    transition: "width 1s ease",
                  }}
                />
              </div>
            </div>
          ))}
        </section>

        <section style={{ marginBottom: 32 }}>
          <div className="result-section-label">Keyword analysis</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {keywords.length ? (
              keywords.map((keyword) => (
                <span key={keyword} className="keyword-pill keyword-pill-found">
                  OK {keyword}
                </span>
              ))
            ) : (
              <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 13 }}>No matched keywords returned.</span>
            )}
            {missingKeywords.map((keyword) => (
              <span key={keyword} className="keyword-pill keyword-pill-missing">
                Missing {keyword}
              </span>
            ))}
          </div>
        </section>

        {suggestions.length ? (
          <section style={{ marginBottom: 32 }}>
            <div className="result-section-label">Suggestions to improve</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {suggestions.map((suggestion, index) => (
                <div
                  key={`${String(suggestion).slice(0, 24)}-${index}`}
                  style={{
                    display: "flex",
                    gap: 12,
                    padding: "14px 16px",
                    background: "rgba(255,255,255,0.02)",
                    border: "0.5px solid rgba(255,255,255,0.06)",
                    borderRadius: 12,
                    animation: `slideUp 0.5s ease ${index * 0.1 + 0.3}s both`,
                  }}
                >
                  <div style={{ color: "#7c6ff7", flexShrink: 0, marginTop: 1 }}>{index + 1}</div>
                  <div style={{ fontSize: 13, color: "rgba(255,255,255,0.62)", lineHeight: 1.6 }}>
                    {typeof suggestion === "string" ? suggestion : JSON.stringify(suggestion)}
                  </div>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {optimizedResume ? (
          <section className="card" style={{ padding: 18, marginBottom: 32 }}>
            <div className="result-section-label" style={{ marginBottom: 12 }}>
              Optimized resume preview
            </div>
            <textarea className="form-textarea" rows={10} value={optimizedResume} readOnly />
          </section>
        ) : null}

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button className="btn-ghost" onClick={() => navigate("upload")} style={{ flex: "1 1 170px" }}>
            Check another resume
          </button>
          <button className="btn-primary" onClick={() => navigate("builder")} style={{ flex: "1 1 170px" }}>
            Fix in builder
          </button>
          {optimizedResume ? (
            <button className="btn-secondary" onClick={downloadOptimizedResume} style={{ flex: "1 1 170px" }}>
              Download resume
            </button>
          ) : null}
          <button className="btn-secondary" onClick={() => navigate("history")} style={{ flex: "1 1 170px" }}>
            View history
          </button>
        </div>
      </main>
    </div>
  );
}
