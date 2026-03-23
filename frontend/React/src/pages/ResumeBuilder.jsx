import { useState } from "react";
import Navbar from "../components/Navbar";

const API_BASE = "http://localhost:8080/api/resume";

const STEPS = [
  "Personal Info",
  "Experience",
  "Education",
  "Skills",
  "Projects",
  "Export",
];

const EMPTY = {
  personal: { name: "", email: "", phone: "", location: "", linkedin: "", github: "" },
  experience: [{ company: "", role: "", duration: "", bullets: ["", ""] }],
  education: [{ institute: "", degree: "", year: "" }],
  skills: { technical: "", tools: "", languages: "" },
  projects: [{ name: "", link: "", desc: "" }],
};

/* ── STEP FORMS ── */
function PersonalForm({ data, onChange }) {
  const fields = [
    ["name", "full_name", "text", "Suman Karmakar"],
    ["email", "email_address", "email", "suman@email.com"],
    ["phone", "phone_number", "text", "+91 98xxx xxxxx"],
    ["location", "city, country", "text", "Kolkata, India"],
    ["linkedin", "linkedin_url", "text", "linkedin.com/in/yourprofile"],
    ["github", "github_url", "text", "github.com/SumanKarmakar467"],
  ];
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
      {fields.map(([key, label, type, placeholder]) => (
        <div key={key} className="form-group">
          <label className="form-label">{label}</label>
          <input
            className="form-input"
            type={type}
            placeholder={placeholder}
            value={data[key]}
            onChange={(e) => onChange({ ...data, [key]: e.target.value })}
          />
        </div>
      ))}
    </div>
  );
}

function ExperienceForm({ data, onChange }) {
  const update = (i, field, val) => {
    const updated = [...data];
    updated[i] = { ...updated[i], [field]: val };
    onChange(updated);
  };
  const updateBullet = (i, j, val) => {
    const updated = [...data];
    updated[i].bullets[j] = val;
    onChange(updated);
  };
  const addBullet = (i) => {
    const updated = [...data];
    updated[i].bullets.push("");
    onChange(updated);
  };
  const addExp = () =>
    onChange([...data, { company: "", role: "", duration: "", bullets: [""] }]);

  return (
    <div>
      {data.map((exp, i) => (
        <div
          key={i}
          style={{
            background: "var(--d3)",
            border: "1px solid var(--border)",
            borderRadius: 10,
            padding: "1.25rem",
            marginBottom: "1rem",
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr",
              gap: "0.75rem",
              marginBottom: "0.75rem",
            }}
          >
            {[["role", "job_title"], ["company", "company_name"], ["duration", "duration"]].map(
              ([field, label]) => (
                <div key={field} className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">{label}</label>
                  <input
                    className="form-input"
                    placeholder={
                      field === "duration" ? "Jun 2023 – Present" : ""
                    }
                    value={exp[field]}
                    onChange={(e) => update(i, field, e.target.value)}
                  />
                </div>
              )
            )}
          </div>
          <label className="form-label">impact_bullets</label>
          {exp.bullets.map((b, j) => (
            <input
              key={j}
              className="form-input"
              style={{ marginBottom: 8 }}
              placeholder={`Bullet ${j + 1}: start with a verb (Built, Led, Increased...)`}
              value={b}
              onChange={(e) => updateBullet(i, j, e.target.value)}
            />
          ))}
          <button
            className="btn-ghost"
            style={{ fontSize: 11, padding: "5px 12px", marginTop: 4 }}
            onClick={() => addBullet(i)}
          >
            + add_bullet()
          </button>
        </div>
      ))}
      <button className="btn-ghost" onClick={addExp}>
        + add_experience()
      </button>
    </div>
  );
}

function EducationForm({ data, onChange }) {
  const update = (i, field, val) => {
    const updated = [...data];
    updated[i] = { ...updated[i], [field]: val };
    onChange(updated);
  };
  return (
    <div>
      {data.map((edu, i) => (
        <div
          key={i}
          style={{
            background: "var(--d3)",
            border: "1px solid var(--border)",
            borderRadius: 10,
            padding: "1.25rem",
            marginBottom: "1rem",
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            gap: "0.75rem",
          }}
        >
          {[["institute", "institute_name"], ["degree", "degree / field"], ["year", "year"]].map(
            ([field, label]) => (
              <div key={field} className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">{label}</label>
                <input
                  className="form-input"
                  value={edu[field]}
                  onChange={(e) => update(i, field, e.target.value)}
                />
              </div>
            )
          )}
        </div>
      ))}
      <button
        className="btn-ghost"
        onClick={() =>
          onChange([...data, { institute: "", degree: "", year: "" }])
        }
      >
        + add_education()
      </button>
    </div>
  );
}

function SkillsForm({ data, onChange }) {
  return (
    <div>
      {[
        ["technical", "technical_skills", "Java, Spring Boot, React, REST API, MySQL"],
        ["tools", "tools_&_platforms", "Git, Maven, Docker, Vercel, Postman"],
        ["languages", "programming_languages", "Java, JavaScript, Python"],
      ].map(([key, label, placeholder]) => (
        <div key={key} className="form-group">
          <label className="form-label">{label}</label>
          <input
            className="form-input"
            placeholder={placeholder}
            value={data[key]}
            onChange={(e) => onChange({ ...data, [key]: e.target.value })}
          />
        </div>
      ))}
      <div
        style={{
          background: "rgba(0,229,255,0.05)",
          border: "1px solid rgba(0,229,255,0.15)",
          borderRadius: 8,
          padding: "10px 14px",
          fontFamily: "var(--font-mono)",
          fontSize: 11,
          color: "var(--muted)",
          lineHeight: 1.8,
        }}
      >
        💡 tip: separate skills with commas. ATS reads comma-separated lists best.
      </div>
    </div>
  );
}

function ProjectsForm({ data, onChange }) {
  const update = (i, field, val) => {
    const updated = [...data];
    updated[i] = { ...updated[i], [field]: val };
    onChange(updated);
  };
  return (
    <div>
      {data.map((p, i) => (
        <div
          key={i}
          style={{
            background: "var(--d3)",
            border: "1px solid var(--border)",
            borderRadius: 10,
            padding: "1.25rem",
            marginBottom: "1rem",
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "0.75rem",
              marginBottom: "0.75rem",
            }}
          >
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">project_name</label>
              <input
                className="form-input"
                value={p.name}
                onChange={(e) => update(i, "name", e.target.value)}
              />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">github_or_live_url</label>
              <input
                className="form-input"
                value={p.link}
                onChange={(e) => update(i, "link", e.target.value)}
              />
            </div>
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">description</label>
            <textarea
              className="form-textarea"
              rows={3}
              placeholder="Describe what you built, the tech stack, and impact..."
              value={p.desc}
              onChange={(e) => update(i, "desc", e.target.value)}
            />
          </div>
        </div>
      ))}
      <button
        className="btn-ghost"
        onClick={() => onChange([...data, { name: "", link: "", desc: "" }])}
      >
        + add_project()
      </button>
    </div>
  );
}

function ExportStep({ formData, onGenerate, loading, error, generatedResume }) {
  return (
    <div style={{ textAlign: "center" }}>
      <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>📄</div>
      <h3 style={{ fontSize: "1.4rem", fontWeight: 700, marginBottom: "0.75rem" }}>
        Ready to export!
      </h3>
      <p style={{ color: "var(--muted)", fontSize: 14, marginBottom: "2rem", lineHeight: 1.7 }}>
        Your resume will be sent to the AI engine for final optimization
        and exported as an ATS-safe PDF.
      </p>

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
            marginBottom: "1.5rem",
            textAlign: "left",
          }}
        >
          ✗ {error}
        </div>
      )}

      {generatedResume ? (
        <div>
          <div
            style={{
              background: "rgba(0,255,136,0.06)",
              border: "1px solid rgba(0,255,136,0.2)",
              borderRadius: 10,
              padding: "1.25rem",
              marginBottom: "1.5rem",
              fontFamily: "var(--font-mono)",
              fontSize: 12,
              color: "var(--g)",
              textAlign: "left",
              lineHeight: 1.9,
              whiteSpace: "pre-wrap",
              maxHeight: 280,
              overflow: "auto",
            }}
          >
            {generatedResume}
          </div>
          <button
            className="btn-primary"
            style={{ fontSize: 14 }}
            onClick={() => {
              const blob = new Blob([generatedResume], { type: "text/plain" });
              const a = document.createElement("a");
              a.href = URL.createObjectURL(blob);
              a.download = "resume_ats_optimized.txt";
              a.click();
            }}
          >
            ↓ download_resume()
          </button>
        </div>
      ) : (
        <button
          className="btn-primary"
          style={{ fontSize: 14 }}
          onClick={onGenerate}
          disabled={loading}
        >
          {loading ? "generating with AI..." : "→ generate_&_export()"}
        </button>
      )}
    </div>
  );
}

/* ── LIVE PREVIEW ── */
function LivePreview({ formData }) {
  const { personal, experience, education, skills, projects } = formData;
  const allSkills = [skills.technical, skills.tools, skills.languages]
    .filter(Boolean)
    .join(", ")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  return (
    <div
      style={{
        background: "#fff",
        borderRadius: 8,
        padding: "1.5rem",
        color: "#1a1a1a",
        fontSize: 11,
        lineHeight: 1.7,
        minHeight: 440,
        overflowY: "auto",
      }}
    >
      {/* Header */}
      <div
        style={{
          borderBottom: "2px solid #00b366",
          paddingBottom: 8,
          marginBottom: 10,
        }}
      >
        <div style={{ fontSize: 18, fontWeight: 700, color: "#111" }}>
          {personal.name || "Your Name"}
        </div>
        <div
          style={{
            fontSize: 10,
            color: "#555",
            fontFamily: "monospace",
            marginTop: 3,
          }}
        >
          {[personal.email, personal.phone, personal.location, personal.github]
            .filter(Boolean)
            .join(" · ") || "email · phone · location"}
        </div>
      </div>

      {/* Experience */}
      {experience.some((e) => e.role || e.company) && (
        <>
          <div
            style={{
              fontSize: 10,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: 1,
              color: "#00b366",
              borderBottom: "1px solid #e0e0e0",
              paddingBottom: 3,
              margin: "10px 0 6px",
            }}
          >
            Experience
          </div>
          {experience.map((e, i) => (
            <div key={i} style={{ marginBottom: 8 }}>
              <div style={{ fontWeight: 600, fontSize: 11 }}>
                {e.role || "Job Title"}
              </div>
              <div style={{ fontSize: 10, color: "#555", marginBottom: 3 }}>
                {e.company} {e.duration && `· ${e.duration}`}
              </div>
              {e.bullets
                .filter(Boolean)
                .map((b, j) => (
                  <div
                    key={j}
                    style={{
                      fontSize: 10,
                      color: "#333",
                      paddingLeft: 10,
                      position: "relative",
                    }}
                  >
                    <span
                      style={{
                        position: "absolute",
                        left: 0,
                        color: "#00b366",
                        fontSize: 8,
                      }}
                    >
                      ▸
                    </span>
                    {b}
                  </div>
                ))}
            </div>
          ))}
        </>
      )}

      {/* Education */}
      {education.some((e) => e.institute) && (
        <>
          <div
            style={{
              fontSize: 10,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: 1,
              color: "#00b366",
              borderBottom: "1px solid #e0e0e0",
              paddingBottom: 3,
              margin: "10px 0 6px",
            }}
          >
            Education
          </div>
          {education.map((e, i) => (
            <div key={i} style={{ marginBottom: 5 }}>
              <span style={{ fontWeight: 600 }}>{e.institute}</span>
              {e.degree && (
                <span style={{ color: "#555", fontSize: 10 }}>
                  {" · "}
                  {e.degree}
                </span>
              )}
              {e.year && (
                <span style={{ color: "#777", fontSize: 10 }}>
                  {" · "}
                  {e.year}
                </span>
              )}
            </div>
          ))}
        </>
      )}

      {/* Skills */}
      {allSkills.length > 0 && (
        <>
          <div
            style={{
              fontSize: 10,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: 1,
              color: "#00b366",
              borderBottom: "1px solid #e0e0e0",
              paddingBottom: 3,
              margin: "10px 0 6px",
            }}
          >
            Skills
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
            {allSkills.map((s) => (
              <span
                key={s}
                style={{
                  fontSize: 9,
                  background: "#f0fdf4",
                  border: "1px solid #bbf7d0",
                  color: "#166534",
                  padding: "2px 7px",
                  borderRadius: 3,
                  fontFamily: "monospace",
                }}
              >
                {s}
              </span>
            ))}
          </div>
        </>
      )}

      {/* Projects */}
      {projects.some((p) => p.name) && (
        <>
          <div
            style={{
              fontSize: 10,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: 1,
              color: "#00b366",
              borderBottom: "1px solid #e0e0e0",
              paddingBottom: 3,
              margin: "10px 0 6px",
            }}
          >
            Projects
          </div>
          {projects.map((p, i) => (
            <div key={i} style={{ marginBottom: 6 }}>
              <div style={{ fontWeight: 600 }}>
                {p.name}
                {p.link && (
                  <span style={{ color: "#555", fontWeight: 400, fontSize: 9 }}>
                    {" · "}
                    {p.link}
                  </span>
                )}
              </div>
              {p.desc && <div style={{ fontSize: 10, color: "#333" }}>{p.desc}</div>}
            </div>
          ))}
        </>
      )}
    </div>
  );
}

/* ── MAIN COMPONENT ── */
export default function ResumeBuilder({ navigate }) {
  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState(EMPTY);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [generatedResume, setGeneratedResume] = useState("");

  const handleGenerate = async () => {
    setLoading(true);
    setError("");
    try {
      const resumeText = buildResumeText(formData);
      const res = await fetch(`${API_BASE}/generate-ats`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeText, jobDescription: "" }),
      });
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      const data = await res.json();
      setGeneratedResume(data.generatedResume || data.resume || resumeText);
    } catch (err) {
      setError(err.message + " — falling back to local export.");
      setGeneratedResume(buildResumeText(formData));
    } finally {
      setLoading(false);
    }
  };

  const buildResumeText = (d) => {
    const lines = [];
    const p = d.personal;
    lines.push(p.name || "Your Name");
    lines.push([p.email, p.phone, p.location, p.github].filter(Boolean).join(" | "));
    lines.push("");
    if (d.experience.some((e) => e.role)) {
      lines.push("EXPERIENCE");
      lines.push("----------");
      d.experience.forEach((e) => {
        lines.push(`${e.role} @ ${e.company} | ${e.duration}`);
        e.bullets.filter(Boolean).forEach((b) => lines.push(`• ${b}`));
        lines.push("");
      });
    }
    if (d.education.some((e) => e.institute)) {
      lines.push("EDUCATION");
      lines.push("---------");
      d.education.forEach((e) =>
        lines.push(`${e.institute} | ${e.degree} | ${e.year}`)
      );
      lines.push("");
    }
    const skills = [d.skills.technical, d.skills.tools, d.skills.languages]
      .filter(Boolean)
      .join(", ");
    if (skills) {
      lines.push("SKILLS");
      lines.push("------");
      lines.push(skills);
      lines.push("");
    }
    if (d.projects.some((p) => p.name)) {
      lines.push("PROJECTS");
      lines.push("--------");
      d.projects.forEach((p) => {
        lines.push(`${p.name} | ${p.link}`);
        if (p.desc) lines.push(p.desc);
        lines.push("");
      });
    }
    return lines.join("\n");
  };

  const progress = Math.round(((step + 1) / STEPS.length) * 100);

  return (
    <div>
      <Navbar navigate={navigate} />

      <div
        style={{ maxWidth: 1120, margin: "0 auto", padding: "3.5rem 2rem" }}
      >
        {/* Header */}
        <div style={{ marginBottom: "2.5rem" }}>
          <div
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 11,
              color: "var(--g)",
              marginBottom: 6,
            }}
          >
            # resume_builder()
          </div>
          <h1
            style={{ fontSize: "clamp(1.6rem, 3vw, 2.2rem)", fontWeight: 700 }}
          >
            Build your resume, step by step.
          </h1>
        </div>

        {/* Progress Bar */}
        <div style={{ marginBottom: "2rem" }}>
          <div className="progress-wrap">
            <div className="progress-fill" style={{ width: `${progress}%` }} />
          </div>
          <div
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 10,
              color: "var(--muted)",
              marginTop: 6,
            }}
          >
            step_{step + 1} / {STEPS.length} — {STEPS[step]}
          </div>
        </div>

        {/* Step Tabs */}
        <div
          style={{
            display: "flex",
            gap: 4,
            marginBottom: "2rem",
            overflowX: "auto",
            paddingBottom: 4,
          }}
        >
          {STEPS.map((s, i) => (
            <button
              key={s}
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 11,
                padding: "7px 14px",
                borderRadius: 6,
                border: `1px solid ${i === step ? "var(--g)" : "var(--border)"}`,
                background: i === step ? "rgba(0,255,136,0.1)" : "var(--d2)",
                color: i < step ? "var(--g)" : i === step ? "var(--g)" : "var(--muted)",
                cursor: "pointer",
                whiteSpace: "nowrap",
                transition: "all 0.2s",
              }}
              onClick={() => setStep(i)}
            >
              {i < step ? "✓ " : ""}
              {s.replace(" ", "_").toLowerCase()}
            </button>
          ))}
        </div>

        {/* Main Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "2rem",
            alignItems: "start",
          }}
        >
          {/* LEFT: FORM */}
          <div
            className="card"
            style={{ animation: "fadeUp 0.4s ease" }}
            key={step}
          >
            <div className="card-head">
              {STEPS[step].replace(" ", "_").toLowerCase()}.fill()
            </div>
            <div style={{ padding: "1.5rem" }}>
              {step === 0 && (
                <PersonalForm
                  data={formData.personal}
                  onChange={(v) => setFormData({ ...formData, personal: v })}
                />
              )}
              {step === 1 && (
                <ExperienceForm
                  data={formData.experience}
                  onChange={(v) => setFormData({ ...formData, experience: v })}
                />
              )}
              {step === 2 && (
                <EducationForm
                  data={formData.education}
                  onChange={(v) => setFormData({ ...formData, education: v })}
                />
              )}
              {step === 3 && (
                <SkillsForm
                  data={formData.skills}
                  onChange={(v) => setFormData({ ...formData, skills: v })}
                />
              )}
              {step === 4 && (
                <ProjectsForm
                  data={formData.projects}
                  onChange={(v) => setFormData({ ...formData, projects: v })}
                />
              )}
              {step === 5 && (
                <ExportStep
                  formData={formData}
                  onGenerate={handleGenerate}
                  loading={loading}
                  error={error}
                  generatedResume={generatedResume}
                />
              )}

              {/* Navigation */}
              {step < 5 && (
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginTop: "1.75rem",
                    paddingTop: "1.25rem",
                    borderTop: "1px solid var(--border)",
                  }}
                >
                  <button
                    className="btn-ghost"
                    onClick={() => setStep((s) => Math.max(0, s - 1))}
                    disabled={step === 0}
                    style={{ opacity: step === 0 ? 0.4 : 1 }}
                  >
                    ← prev()
                  </button>
                  <button
                    className="btn-primary"
                    onClick={() => setStep((s) => Math.min(STEPS.length - 1, s + 1))}
                  >
                    next() →
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT: LIVE PREVIEW */}
          <div>
            <div className="card">
              <div
                className="card-head"
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span>live_preview.pdf</span>
                <span
                  style={{
                    fontSize: 10,
                    color: "var(--muted)",
                    fontFamily: "var(--font-mono)",
                  }}
                >
                  ● ATS-safe format
                </span>
              </div>
              <div style={{ padding: "1.25rem" }}>
                <LivePreview formData={formData} />
              </div>
            </div>

            {/* ATS tip */}
            <div
              style={{
                marginTop: "1rem",
                padding: "10px 14px",
                background: "rgba(0,229,255,0.05)",
                border: "1px solid rgba(0,229,255,0.15)",
                borderRadius: 8,
                fontFamily: "var(--font-mono)",
                fontSize: 11,
                color: "var(--muted)",
                lineHeight: 1.8,
              }}
            >
              💡 ats_tip: single-column format · no tables · no images ·
              standard section headings · saved automatically
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
