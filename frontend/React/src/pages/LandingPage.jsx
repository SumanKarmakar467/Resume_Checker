import { useEffect, useRef, useState } from "react";
import Navbar from "../components/Navbar";

/* ── helpers ── */
function useInView(ref, threshold = 0.15) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold }
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [ref, threshold]);
  return visible;
}

function AnimatedBar({ pct, color, delay = 0 }) {
  const ref = useRef();
  const visible = useInView(ref, 0.3);
  return (
    <div ref={ref} className="score-bar-track" style={{ marginTop: 6 }}>
      <div
        className="score-bar-fill"
        style={{
          width: visible ? `${pct}%` : "0%",
          background: color,
          transitionDelay: `${delay}ms`,
        }}
      />
    </div>
  );
}

function Section({ children, style }) {
  const ref = useRef();
  const visible = useInView(ref);
  return (
    <div
      ref={ref}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(28px)",
        transition: "opacity 0.65s ease, transform 0.65s ease",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

/* ── FEATURE CARD ── */
function FeatureCard({ fn, title, desc, tag, tagType = "green" }) {
  return (
    <div
      style={{
        background: "var(--d2)",
        border: "1px solid var(--border)",
        borderRadius: 12,
        padding: "1.6rem",
        transition: "background 0.2s, transform 0.2s",
        position: "relative",
        overflow: "hidden",
        cursor: "default",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = "var(--d3)";
        e.currentTarget.style.transform = "translateY(-3px)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "var(--d2)";
        e.currentTarget.style.transform = "translateY(0)";
      }}
    >
      <div
        style={{
          position: "absolute", top: 0, left: 0, right: 0, height: 2,
          background: "linear-gradient(90deg, var(--g), var(--c))",
        }}
      />
      <div className={`tag-${tagType}`} style={{ marginBottom: "0.9rem" }}>
        {fn}
      </div>
      <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: "0.5rem" }}>
        {title}
      </h3>
      <p style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.65 }}>
        {desc}
      </p>
      {tag && (
        <div
          className={`tag-${tagType}`}
          style={{ marginTop: "0.9rem", fontSize: 10 }}
        >
          {tag}
        </div>
      )}
    </div>
  );
}

/* ── TYPEWRITER HERO ── */
function TerminalHero() {
  const [lines, setLines] = useState([
    { text: "# ── ResumeAI · Full Suite ─────────────", done: true },
    { text: "from resume_ai import check, build, generate", done: true },
    { text: "", done: true },
  ]);
  const [phase, setPhase] = useState(0);

  const phases = [
    '# 1. check existing resume',
    'score = check("resume.pdf", jd=job_desc)',
    '# 2. build from scratch',
    'draft = build(template="ats_clean", steps=6)',
    '# 3. generate with AI',
    'ai_cv = generate(skills=me, jd=target_role)',
    '# → { ats_score: 91, keywords: "matched ✓" }',
  ];

  useEffect(() => {
    if (phase >= phases.length) return;
    const full = phases[phase];
    let i = 0;
    const interval = setInterval(() => {
      i++;
      setLines((prev) => {
        const updated = [...prev];
        const last = updated[updated.length - 1];
        if (!last || last.done) {
          updated.push({ text: full.substring(0, i), done: false });
        } else {
          updated[updated.length - 1] = {
            text: full.substring(0, i),
            done: i >= full.length,
          };
        }
        return updated;
      });
      if (i >= full.length) {
        clearInterval(interval);
        setTimeout(() => setPhase((p) => p + 1), 260);
      }
    }, 42);
    return () => clearInterval(interval);
  }, [phase]);

  const colorize = (line) => {
    if (line.startsWith("#"))
      return <span style={{ color: "var(--muted)" }}>{line}</span>;
    return line
      .split(/(\bcheck\b|\bbuild\b|\bgenerate\b|"[^"]*"|\b\d+\b)/)
      .map((part, i) => {
        if (/^"/.test(part)) return <span key={i} style={{ color: "var(--g)" }}>{part}</span>;
        if (/^(check|build|generate)$/.test(part)) return <span key={i} style={{ color: "var(--c)" }}>{part}</span>;
        if (/^\d+$/.test(part)) return <span key={i} style={{ color: "var(--o)" }}>{part}</span>;
        if (/^(from|import|=)$/.test(part)) return <span key={i} style={{ color: "var(--p)" }}>{part}</span>;
        return <span key={i}>{part}</span>;
      });
  };

  return (
    <div
      className="card"
      style={{ maxWidth: 600, width: "100%", marginTop: "2.5rem" }}
    >
      <div
        style={{
          background: "var(--d3)",
          padding: "10px 16px",
          display: "flex",
          alignItems: "center",
          gap: 8,
          borderBottom: "1px solid var(--border)",
        }}
      >
        {["#ff5f57", "#ffbd2e", "#28c840"].map((c) => (
          <div
            key={c}
            style={{ width: 10, height: 10, borderRadius: "50%", background: c }}
          />
        ))}
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 11,
            color: "var(--muted)",
            marginLeft: "auto",
          }}
        >
          resume_ai.py
        </span>
      </div>
      <div
        style={{
          padding: "1.3rem 1.5rem",
          fontFamily: "var(--font-mono)",
          fontSize: 12.5,
          lineHeight: 2.1,
          minHeight: 200,
        }}
      >
        {lines.map((l, i) => (
          <div key={i}>
            {colorize(l.text)}
            {i === lines.length - 1 && !l.done && (
              <span className="cursor-blink" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── MAIN LANDING PAGE ── */
export default function LandingPage({ navigate, user, onLogout }) {
  return (
    <div>
      <Navbar navigate={navigate} user={user} onLogout={onLogout} />

      {/* HERO */}
      <section
        style={{
          minHeight: "94vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "4rem 2rem",
          textAlign: "center",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div className="grid-bg" />
        <div
          style={{
            position: "absolute",
            width: 600,
            height: 600,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(0,255,136,0.06) 0%, transparent 70%)",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -55%)",
            pointerEvents: "none",
          }}
        />

        <div className="badge fade-up" style={{ marginBottom: "2rem" }}>
          <span className="pulse-dot" />
          <span className="mono">v2.5 — resume builder is live</span>
        </div>

        <h1
          className="fade-up"
          style={{
            fontSize: "clamp(2.4rem, 5.5vw, 4.2rem)",
            fontWeight: 800,
            lineHeight: 1.08,
            marginBottom: "1.5rem",
            maxWidth: 820,
            letterSpacing: -1,
          }}
        >
          <span style={{ color: "var(--g)" }}>Check.</span>{" "}
          <span style={{ color: "var(--c)" }}>Build.</span>{" "}
          <span style={{ color: "var(--p)" }}>Generate.</span>
          <br />
          Land your{" "}
          <span style={{ color: "var(--o)" }}>dream job.</span>
        </h1>

        <p
          className="fade-up"
          style={{
            fontSize: 16,
            color: "var(--muted)",
            maxWidth: 560,
            lineHeight: 1.75,
            marginBottom: "2.5rem",
          }}
        >
          Upload your resume for ATS scoring, build one from scratch with our
          guided editor, or generate a fully optimized resume with AI — all in
          one place. Built with React + Node.js + Express.
        </p>

        <div
          className="fade-up"
          style={{
            display: "flex",
            gap: "1rem",
            flexWrap: "wrap",
            justifyContent: "center",
            marginBottom: "3rem",
          }}
        >
          <button className="btn-primary" onClick={() => navigate("upload")}>
            → analyze_resume()
          </button>
          <button className="btn-secondary" onClick={() => navigate("builder")}>
            build_resume.new()
          </button>
        </div>

        <TerminalHero />
      </section>

      {/* STATS */}
      <Section>
        <div
          style={{
            display: "flex",
            borderTop: "1px solid var(--border)",
            borderBottom: "1px solid var(--border)",
          }}
        >
          {[
            ["94%", "ats_pass_rate"],
            ["12k+", "resumes_analyzed"],
            ["< 3s", "analysis_time"],
            ["3×", "more_callbacks"],
            ["5+", "resume_templates"],
          ].map(([num, label]) => (
            <div
              key={label}
              style={{
                flex: 1,
                textAlign: "center",
                padding: "2rem 1rem",
                borderRight: "1px solid var(--border)",
              }}
            >
              <div
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "2rem",
                  fontWeight: 600,
                  color: "var(--g)",
                }}
              >
                {num}
              </div>
              <div
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 12,
                  color: "var(--muted)",
                  marginTop: 4,
                }}
              >
                {label}
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* FEATURES */}
      <Section style={{ padding: "5.5rem 2rem", maxWidth: 1120, margin: "0 auto" }}>
        <div className="section-tag"># core_features.all()</div>
        <h2 className="section-title">Three tools. One career boost.</h2>
        <p className="section-sub">
          Built with React + Node.js + Express. Powered by AI. Designed to get you hired.
        </p>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gap: "1rem",
            marginTop: "3rem",
          }}
        >
          <FeatureCard
            fn="POST /api/resume/analyze"
            title="ATS Resume Checker"
            desc="Upload PDF, DOCX, or TXT. Get an instant ATS compatibility score, keyword gap analysis, and section-by-section feedback."
            tag="existing feature ✓"
            tagType="green"
          />
          <FeatureCard
            fn="POST /api/resume/generate-ats"
            title="AI Resume Generator"
            desc="Paste your experience + a job description. The AI writes a clean, ATS-optimized resume draft tailored exactly to the role."
            tag="existing feature ✓"
            tagType="green"
          />
          <FeatureCard
            fn="fn: resume_builder()"
            title="Resume Builder"
            desc="Step-by-step guided editor. Add personal info, experience, education, skills and projects — export as ATS-safe PDF."
            tag="new feature 🔥"
            tagType="orange"
          />
          <FeatureCard
            fn="fn: keyword_match(jd)"
            title="Keyword Intelligence"
            desc="Match your resume vocabulary to job descriptions. Spot missing keywords before the ATS bot rejects you."
            tag="existing feature ✓"
            tagType="green"
          />
          <FeatureCard
            fn="fn: auth.jwt() + oauth()"
            title="Secure Authentication"
            desc="JWT sessions, GitHub & Google OAuth. Save your resumes, track score history, and access from anywhere."
            tag="new feature 🔥"
            tagType="purple"
          />
          <FeatureCard
            fn="fn: parse(pdf|docx|txt)"
            title="Multi-format Upload"
            desc="Node.js + Express backend handles PDF, DOCX, and plain text with full fidelity parsing. No content lost in translation."
            tag="existing feature ✓"
            tagType="green"
          />
        </div>
      </Section>

      {/* SCORE PREVIEW */}
      <Section>
        <div
          style={{
            background: "var(--d2)",
            borderTop: "1px solid var(--border)",
            borderBottom: "1px solid var(--border)",
            padding: "5.5rem 2rem",
          }}
        >
          <div style={{ maxWidth: 1120, margin: "0 auto" }}>
            <div className="section-tag"># analyze_result.preview()</div>
            <h2 className="section-title">
              Instant ATS score.<br />Actionable feedback.
            </h2>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
                gap: "2rem",
                marginTop: "3rem",
              }}
            >
              {/* Score Card */}
              <div className="card">
                <div className="card-head" style={{ color: "var(--c)" }}>
                  analyze_result — resume.pdf
                </div>
                <div style={{ padding: "1.75rem" }}>
                  <div style={{ textAlign: "center", marginBottom: "1.75rem" }}>
                    <div
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: "3.5rem",
                        fontWeight: 700,
                        color: "var(--g)",
                        lineHeight: 1,
                      }}
                    >
                      87
                    </div>
                    <div
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: 11,
                        color: "var(--muted)",
                        marginTop: 4,
                      }}
                    >
                      // ats_compatibility_score
                    </div>
                  </div>

                  {[
                    { label: "keyword_match", pct: 88, color: "linear-gradient(90deg, var(--g), #00cc6a)", delay: 0 },
                    { label: "format_quality", pct: 92, color: "linear-gradient(90deg, var(--c), #009bbd)", delay: 150 },
                    { label: "impact_verbs", pct: 75, color: "linear-gradient(90deg, var(--p), #9b5fd8)", delay: 300 },
                    { label: "section_complete", pct: 60, color: "linear-gradient(90deg, var(--o), #f08020)", delay: 450 },
                  ].map(({ label, pct, color, delay }) => (
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
                      <AnimatedBar pct={pct} color={color} delay={delay} />
                    </div>
                  ))}

                  <div
                    style={{
                      marginTop: "1.25rem",
                      padding: "10px 14px",
                      background: "rgba(0,255,136,0.05)",
                      border: "1px solid rgba(0,255,136,0.15)",
                      borderRadius: 8,
                      fontFamily: "var(--font-mono)",
                      fontSize: 11,
                      color: "var(--muted)",
                      lineHeight: 1.9,
                    }}
                  >
                    ⚠ missing:{" "}
                    <span style={{ color: "var(--o)" }}>Docker, CI/CD, REST</span>
                    <br />
                    ✓ strong:{" "}
                    <span style={{ color: "var(--g)" }}>Node.js + Express, React, Java</span>
                    <br />→ add{" "}
                    <span style={{ color: "var(--c)" }}>2 impact verbs</span> to boost
                  </div>
                </div>
              </div>

              {/* CTA Card */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                  gap: "1.5rem",
                }}
              >
                <h3 style={{ fontSize: "1.6rem", fontWeight: 700 }}>
                  Know exactly<br />where you stand.
                </h3>
                <p style={{ color: "var(--muted)", lineHeight: 1.75, fontSize: 15 }}>
                  Our Node.js + Express parser reads your resume deeply — not just keywords,
                  but structure, impact language, and ATS compatibility rules that most
                  tools miss.
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                  {[
                    "✓ Keyword gap analysis vs job description",
                    "✓ Section completeness check",
                    "✓ Impact verb detection",
                    "✓ ATS formatting rules",
                    "✓ Download detailed report",
                  ].map((item) => (
                    <div
                      key={item}
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: 13,
                        color: "var(--muted)",
                      }}
                    >
                      {item}
                    </div>
                  ))}
                </div>
                <button className="btn-primary" onClick={() => navigate("upload")}>
                  → analyze_my_resume()
                </button>
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* WORKFLOW */}
      <Section style={{ padding: "5.5rem 2rem", maxWidth: 1120, margin: "0 auto" }}>
        <div className="section-tag"># how_it_works.all_flows()</div>
        <h2 className="section-title">Three flows, zero friction.</h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gap: "2.5rem",
            marginTop: "3rem",
          }}
        >
          {[
            {
              color: "var(--g)",
              label: "// flow_01: check existing resume",
              steps: [
                ["step_01", "Upload Resume", "PDF, DOCX, or TXT via drag & drop"],
                ["step_02", "Paste Job Description", "Optional but unlocks keyword matching"],
                ["step_03", "Get ATS Score", "Score, gaps, suggestions — instant"],
              ],
              cta: "analyze_resume()",
              ctaPage: "upload",
            },
            {
              color: "var(--o)",
              label: "// flow_02: build from scratch",
              steps: [
                ["step_01", "Open Builder", "6-step guided editor, zero blank page"],
                ["step_02", "Fill Each Section", "Info → Experience → Skills → Projects"],
                ["step_03", "Export ATS-safe PDF", "Clean single-column, passes any ATS"],
              ],
              cta: "build_resume.new()",
              ctaPage: "builder",
            },
            {
              color: "var(--p)",
              label: "// flow_03: generate with AI",
              steps: [
                ["step_01", "Describe Yourself", "Skills, experience level, target role"],
                ["step_02", "Paste Target JD", "AI tailors every bullet to the role"],
                ["step_03", "Download & Edit", "Full resume ready in under 10 seconds"],
              ],
              cta: "generate_resume.ai()",
              ctaPage: "upload",
            },
          ].map(({ color, label, steps, cta, ctaPage }) => (
            <div key={label}>
              <div
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 11,
                  color,
                  marginBottom: "1.25rem",
                }}
              >
                {label}
              </div>
              <div
                style={{
                  position: "relative",
                  paddingLeft: "2rem",
                  borderLeft: `1px solid ${color}`,
                }}
              >
                {steps.map(([step, title, desc]) => (
                  <div key={step} style={{ marginBottom: "2rem" }}>
                    <div
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: 11,
                        color,
                        marginBottom: 4,
                      }}
                    >
                      {step}
                    </div>
                    <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 5 }}>
                      {title}
                    </div>
                    <div
                      style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.65 }}
                    >
                      {desc}
                    </div>
                  </div>
                ))}
              </div>
              <button
                className="btn-ghost"
                style={{ marginTop: "0.5rem", borderColor: color, color }}
                onClick={() => navigate(ctaPage)}
              >
                → {cta}
              </button>
            </div>
          ))}
        </div>
      </Section>

      {/* CTA BANNER */}
      <Section>
        <div
          style={{
            background: "var(--d2)",
            borderTop: "1px solid var(--border)",
            borderBottom: "1px solid var(--border)",
            padding: "4rem 2rem",
            textAlign: "center",
          }}
        >
          <div
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 11,
              color: "var(--g)",
              marginBottom: "1rem",
            }}
          >
            # ready_to_get_hired?
          </div>
          <h2
            style={{
              fontSize: "clamp(1.8rem, 4vw, 3rem)",
              fontWeight: 800,
              marginBottom: "1rem",
              letterSpacing: -1,
            }}
          >
            Your next job starts with
            <br />
            <span style={{ color: "var(--g)" }}>a better resume.</span>
          </h2>
          <p
            style={{
              color: "var(--muted)",
              marginBottom: "2rem",
              fontSize: 15,
              maxWidth: 480,
              margin: "0 auto 2rem",
            }}
          >
            Free to use. No credit card required. Built by a developer, for developers.
          </p>
          <div
            style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}
          >
            <button className="btn-primary" onClick={() => navigate("upload")}>
              → analyze_resume()
            </button>
            <button className="btn-secondary" onClick={() => navigate("builder")}>
              build_resume.new()
            </button>
          </div>
        </div>
      </Section>

      {/* FOOTER */}
      <footer
        style={{
          background: "var(--d2)",
          borderTop: "1px solid var(--border)",
          padding: "2.5rem 2rem",
          textAlign: "center",
        }}
      >
        <div
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 13,
            color: "var(--g)",
            marginBottom: "0.75rem",
          }}
        >
          &gt;_ ResumeAI · built by @SumanKarmakar467
        </div>
        <div
          style={{
            display: "flex",
            gap: "2rem",
            justifyContent: "center",
            marginBottom: "1rem",
          }}
        >
          {["github", "features", "resume_builder", "privacy"].map((l) => (
            <span
              key={l}
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 12,
                color: "var(--muted)",
                cursor: "pointer",
              }}
            >
              {l}
            </span>
          ))}
        </div>
        <p
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 11,
            color: "var(--muted)",
          }}
        >
          React · Node.js + Express · Java · Vercel · open source · made in India 🇮🇳
        </p>
      </footer>
    </div>
  );
}

