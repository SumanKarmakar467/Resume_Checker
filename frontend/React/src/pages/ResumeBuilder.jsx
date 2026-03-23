import { useRef, useState } from "react";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import Navbar from "../components/Navbar";

const API_BASE = "http://localhost:8080/api/resume";
const ACCEPTED_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
];
const PHOTO_TYPES = ["image/png", "image/jpeg", "image/webp"];

const STEPS = [
  "Personal Info",
  "Experience",
  "Education",
  "Skills",
  "Projects",
  "Export",
];

const EMPTY = {
  personal: {
    name: "",
    email: "",
    phone: "",
    location: "",
    linkedin: "",
    github: "",
    headline: "",
    summary: "",
    photoUrl: "",
  },
  experience: [{ company: "", role: "", duration: "", bullets: ["", ""] }],
  education: [{ institute: "", degree: "", year: "" }],
  skills: { technical: "", tools: "", languages: "" },
  projects: [{ name: "", link: "", desc: "" }],
};

const RESUME_TEMPLATES = [
  {
    id: "ats_clean",
    name: "ATS Clean",
    description: "Single-column ATS-safe layout with clear sections.",
    primary: "#0f766e",
    background: "#ffffff",
    text: "#111827",
    sectionBg: "#f8fafc",
  },
  {
    id: "modern_split",
    name: "Modern Split",
    description: "Two-column professional template with subtle color accents.",
    primary: "#1d4ed8",
    background: "#ffffff",
    text: "#0f172a",
    sectionBg: "#eff6ff",
  },
  {
    id: "executive",
    name: "Executive",
    description: "Balanced premium look with elegant typography and spacing.",
    primary: "#7c2d12",
    background: "#fffdf7",
    text: "#1f2937",
    sectionBg: "#fffbeb",
  },
];

function normalizeText(text) {
  return (text || "")
    .replace(/\r/g, "")
    .replace(/\t/g, " ")
    .replace(/[^\x20-\x7E\n]/g, " ")
    .replace(/[ ]{2,}/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function pickMatch(text, pattern) {
  const match = text.match(pattern);
  return match ? match[0] : "";
}

function sanitizePdfName(name) {
  const cleaned = (name || "")
    .trim()
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, "")
    .replace(/\s+/g, "_")
    .slice(0, 80);
  return cleaned || "resume_ats_optimized";
}

function parseUploadedResumeText(rawText) {
  const text = normalizeText(rawText);
  const lines = text.split("\n").map((line) => line.trim()).filter(Boolean);
  const firstLine = lines[0] || "";

  const email = pickMatch(text, /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
  const phone = pickMatch(
    text,
    /(?:\+?\d{1,3}[\s-]?)?(?:\(?\d{2,4}\)?[\s-]?)?\d{3,4}[\s-]?\d{3,4}/
  );
  const linkedin = pickMatch(text, /https?:\/\/(?:www\.)?linkedin\.com\/[^\s]+/i);
  const github = pickMatch(text, /https?:\/\/(?:www\.)?github\.com\/[^\s]+/i);

  const sections = text.split(/\n(?=(experience|education|skills|projects)\s*$)/gim);
  const fullLower = text.toLowerCase();
  const experienceStart = fullLower.indexOf("experience");
  const educationStart = fullLower.indexOf("education");
  const skillsStart = fullLower.indexOf("skills");
  const projectsStart = fullLower.indexOf("projects");

  const expText =
    experienceStart >= 0
      ? text.slice(
          experienceStart,
          [educationStart, skillsStart, projectsStart]
            .filter((n) => n > experienceStart)
            .sort((a, b) => a - b)[0] || text.length
        )
      : "";
  const eduText =
    educationStart >= 0
      ? text.slice(
          educationStart,
          [skillsStart, projectsStart]
            .filter((n) => n > educationStart)
            .sort((a, b) => a - b)[0] || text.length
        )
      : "";
  const skillsText =
    skillsStart >= 0
      ? text.slice(
          skillsStart,
          [projectsStart].filter((n) => n > skillsStart)[0] || text.length
        )
      : "";
  const projectsText = projectsStart >= 0 ? text.slice(projectsStart) : "";

  const expLines = expText.split("\n").map((line) => line.trim()).filter(Boolean);
  const expHeader = expLines.find((line) => /@|\|/.test(line)) || expLines[1] || "";
  const expHeaderParts = expHeader.split("|").map((p) => p.trim()).filter(Boolean);
  let role = "";
  let company = "";
  let duration = "";
  if (expHeader.includes("@")) {
    const [left, right] = expHeader.split("@").map((p) => p.trim());
    role = left || "";
    company = (right || "").split("|")[0]?.trim() || "";
  } else if (expHeaderParts.length >= 2) {
    role = expHeaderParts[0] || "";
    company = expHeaderParts[1] || "";
    duration = expHeaderParts[2] || "";
  } else {
    role = expHeader || "";
  }
  if (!duration) {
    duration = pickMatch(expHeader, /(19|20)\d{2}[^,\n]*/i);
  }
  const bullets = expLines
    .filter((line) => /^[-*]/.test(line) || /^(built|led|developed|implemented|improved|created)/i.test(line))
    .map((line) => line.replace(/^[-*]\s*/, "").trim())
    .filter(Boolean)
    .slice(0, 6);

  const eduLines = eduText.split("\n").map((line) => line.trim()).filter(Boolean);
  const eduLine = eduLines[1] || eduLines[0] || "";
  const degree = pickMatch(
    eduLine,
    /(b\.?tech|bachelor|m\.?tech|master|b\.?e|m\.?e|bsc|msc|bca|mca|phd|diploma)[^,|]*/i
  );
  const year = pickMatch(eduLine, /(19|20)\d{2}(?:\s*-\s*(?:19|20)\d{2}|(?:\s*-\s*present))?/i);
  const institute = eduLine
    .replace(degree, "")
    .replace(year, "")
    .replace(/[|,-]/g, " ")
    .replace(/[ ]{2,}/g, " ")
    .trim();

  const skillTokens = skillsText
    .split(/,|\n|\|/)
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 24);

  const projectLines = projectsText.split("\n").map((line) => line.trim()).filter(Boolean);
  const projectName = projectLines[1] || projectLines[0] || "";
  const projectLink = pickMatch(projectsText, /https?:\/\/[^\s]+/i);
  const projectDesc = projectLines.slice(2, 5).join(" ");

  const maybeName =
    firstLine.length <= 60 &&
    !firstLine.includes("@") &&
    /^[A-Za-z .'-]{3,}$/.test(firstLine)
      ? firstLine
      : "";
  const maybeHeadline =
    lines.find((line, idx) => idx > 0 && line.length > 8 && line.length < 80 && !/@/.test(line)) || "";
  const maybeSummary = lines.slice(0, 8).find((line) => line.length > 60) || "";

  return {
    personal: {
      name: maybeName,
      email,
      phone,
      location: "",
      linkedin,
      github,
      headline: maybeHeadline,
      summary: maybeSummary,
      photoUrl: "",
    },
    experience: [
      {
        company,
        role,
        duration,
        bullets: bullets.length ? bullets : ["", ""],
      },
    ],
    education: [
      {
        institute,
        degree,
        year,
      },
    ],
    skills: {
      technical: skillTokens.slice(0, 12).join(", "),
      tools: skillTokens.slice(12, 20).join(", "),
      languages: "",
    },
    projects: [
      {
        name: projectName.replace(projectLink, "").trim(),
        link: projectLink,
        desc: projectDesc,
      },
    ],
    rawText: text,
    sectionCount: sections.length,
  };
}

function mergeIntoBuilderData(parsed) {
  return {
    personal: { ...EMPTY.personal, ...(parsed.personal || {}) },
    experience:
      parsed.experience && parsed.experience.length
        ? parsed.experience
        : EMPTY.experience,
    education:
      parsed.education && parsed.education.length
        ? parsed.education
        : EMPTY.education,
    skills: { ...EMPTY.skills, ...(parsed.skills || {}) },
    projects:
      parsed.projects && parsed.projects.length ? parsed.projects : EMPTY.projects,
  };
}

async function exportNodeAsPdf(node, fileName) {
  if (!node) return;

  const canvas = await html2canvas(node, {
    scale: 2,
    useCORS: true,
    backgroundColor: "#ffffff",
  });

  const imgData = canvas.toDataURL("image/png");
  const pdf = new jsPDF("p", "pt", "a4");
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const imgHeight = (canvas.height * pageWidth) / canvas.width;

  let heightLeft = imgHeight;
  let position = 0;
  pdf.addImage(imgData, "PNG", 0, position, pageWidth, imgHeight);
  heightLeft -= pageHeight;

  while (heightLeft > 0) {
    position = heightLeft - imgHeight;
    pdf.addPage();
    pdf.addImage(imgData, "PNG", 0, position, pageWidth, imgHeight);
    heightLeft -= pageHeight;
  }

  pdf.save(`${sanitizePdfName(fileName)}.pdf`);
}

/* ── STEP FORMS ── */
function PersonalForm({ data, onChange }) {
  const fields = [
    ["name", "full_name", "text", "Suman Karmakar"],
    ["email", "email_address", "email", "suman@email.com"],
    ["phone", "phone_number", "text", "+91 98xxx xxxxx"],
    ["location", "city, country", "text", "Kolkata, India"],
    ["linkedin", "linkedin_url", "text", "linkedin.com/in/yourprofile"],
    ["github", "github_url", "text", "github.com/SumanKarmakar467"],
    ["headline", "professional_headline", "text", "Full Stack Developer | Java + React"],
  ];

  const handlePhotoUpload = (file) => {
    if (!file) return;
    if (!PHOTO_TYPES.includes(file.type)) {
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      onChange({ ...data, photoUrl: String(reader.result || "") });
    };
    reader.readAsDataURL(file);
  };

  return (
    <div>
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

      <div className="form-group">
        <label className="form-label">professional_summary</label>
        <textarea
          className="form-textarea"
          rows={4}
          placeholder="Write a concise summary with achievements and target role."
          value={data.summary || ""}
          onChange={(e) => onChange({ ...data, summary: e.target.value })}
        />
      </div>

      <div className="form-group">
        <label className="form-label">profile_photo (optional)</label>
        <input
          className="form-input"
          type="file"
          accept=".png,.jpg,.jpeg,.webp"
          onChange={(e) => handlePhotoUpload(e.target.files?.[0])}
        />
        {data.photoUrl ? (
          <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 10 }}>
            <img
              src={data.photoUrl}
              alt="profile preview"
              style={{
                width: 56,
                height: 56,
                objectFit: "cover",
                borderRadius: "50%",
                border: "2px solid var(--border)",
              }}
            />
            <button
              className="btn-ghost"
              onClick={() => onChange({ ...data, photoUrl: "" })}
              style={{ fontSize: 11, padding: "6px 10px" }}
            >
              remove_photo()
            </button>
          </div>
        ) : null}
      </div>
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

function ExportStep({
  onGenerate,
  onDownloadPdf,
  loading,
  error,
  generatedResume,
  pdfFileName,
  onPdfFileNameChange,
  jobDescription,
  onJobDescriptionChange,
  selectedTemplate,
  onTemplateChange,
}) {
  return (
    <div>
      <h3 style={{ fontSize: "1.4rem", fontWeight: 700, marginBottom: "0.5rem" }}>
        Export ATS Resume
      </h3>
      <p style={{ color: "var(--muted)", fontSize: 14, marginBottom: "1.2rem", lineHeight: 1.7 }}>
        Generate an improved resume, set a custom PDF name, and download.
      </p>

      <div className="form-group">
        <label className="form-label">choose_template</label>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
            gap: "0.6rem",
          }}
        >
          {RESUME_TEMPLATES.map((template) => (
            <button
              key={template.id}
              type="button"
              onClick={() => onTemplateChange(template.id)}
              style={{
                borderRadius: 10,
                border: `1px solid ${selectedTemplate === template.id ? template.primary : "var(--border)"}`,
                background: selectedTemplate === template.id ? `${template.primary}22` : "var(--d3)",
                color: selectedTemplate === template.id ? "#ffffff" : "var(--text)",
                padding: "10px",
                textAlign: "left",
                cursor: "pointer",
              }}
            >
              <div style={{ fontWeight: 700, fontSize: 12 }}>{template.name}</div>
              <div style={{ fontSize: 11, opacity: 0.86, marginTop: 4 }}>{template.description}</div>
            </button>
          ))}
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">job_description_for_optimization (optional)</label>
        <textarea
          className="form-textarea"
          rows={4}
          placeholder="Paste target role description to improve keyword matching."
          value={jobDescription}
          onChange={(e) => onJobDescriptionChange(e.target.value)}
        />
      </div>

      <div className="form-group">
        <label className="form-label">custom_pdf_name</label>
        <input
          className="form-input"
          value={pdfFileName}
          onChange={(e) => onPdfFileNameChange(e.target.value)}
          placeholder="resume_ats_optimized"
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
            textAlign: "left",
          }}
        >
          {error}
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
              marginBottom: "1rem",
              fontFamily: "var(--font-mono)",
              fontSize: 12,
              color: "var(--g)",
              textAlign: "left",
              lineHeight: 1.8,
              whiteSpace: "pre-wrap",
              maxHeight: 280,
              overflow: "auto",
            }}
          >
            {generatedResume}
          </div>
          <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
            <button className="btn-primary" style={{ fontSize: 14 }} onClick={onDownloadPdf} disabled={loading}>
              {loading ? "processing..." : "download_pdf()"}
            </button>
            <button className="btn-secondary" style={{ fontSize: 14 }} onClick={onGenerate} disabled={loading}>
              regenerate()
            </button>
          </div>
        </div>
      ) : (
        <button
          className="btn-primary"
          style={{ width: "100%", justifyContent: "center", fontSize: 14 }}
          onClick={onGenerate}
          disabled={loading}
        >
          {loading ? "generating with AI..." : "generate_ats_resume()"}
        </button>
      )}
    </div>
  );
}
function LivePreview({ formData, selectedTemplate }) {
  const { personal, experience, education, skills, projects } = formData;
  const template = RESUME_TEMPLATES.find((item) => item.id === selectedTemplate) || RESUME_TEMPLATES[0];

  const allSkills = [skills.technical, skills.tools, skills.languages]
    .filter(Boolean)
    .join(",")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  const sectionTitle = (label) => (
    <div
      style={{
        fontSize: 11,
        fontWeight: 700,
        textTransform: "uppercase",
        letterSpacing: 0.8,
        color: template.primary,
        borderBottom: `2px solid ${template.primary}`,
        paddingBottom: 3,
        margin: "14px 0 8px",
      }}
    >
      {label}
    </div>
  );

  if (template.id === "modern_split") {
    return (
      <div
        style={{
          background: template.background,
          color: template.text,
          fontSize: 11,
          lineHeight: 1.6,
          borderRadius: 8,
          minHeight: 720,
          border: "1px solid #dbeafe",
          overflow: "hidden",
        }}
      >
        <div style={{ display: "grid", gridTemplateColumns: "0.34fr 0.66fr", minHeight: 720 }}>
          <div style={{ background: "#eff6ff", padding: "18px 14px" }}>
            {personal.photoUrl ? (
              <img
                src={personal.photoUrl}
                alt="profile"
                style={{ width: 90, height: 90, objectFit: "cover", borderRadius: "50%", marginBottom: 12 }}
              />
            ) : null}
            <div style={{ fontSize: 10, color: "#1e3a8a", marginBottom: 4, fontWeight: 700 }}>CONTACT</div>
            <div style={{ fontSize: 10 }}>{personal.email}</div>
            <div style={{ fontSize: 10 }}>{personal.phone}</div>
            <div style={{ fontSize: 10 }}>{personal.location}</div>
            <div style={{ fontSize: 10 }}>{personal.linkedin}</div>
            <div style={{ fontSize: 10 }}>{personal.github}</div>

            {sectionTitle("Skills")}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
              {allSkills.map((item) => (
                <span
                  key={item}
                  style={{
                    fontSize: 9,
                    background: "#dbeafe",
                    color: "#1e3a8a",
                    borderRadius: 12,
                    padding: "2px 8px",
                    border: "1px solid #bfdbfe",
                  }}
                >
                  {item}
                </span>
              ))}
            </div>
          </div>

          <div style={{ padding: "20px 18px" }}>
            <div style={{ fontSize: 24, fontWeight: 800, color: "#1d4ed8", lineHeight: 1.1 }}>
              {personal.name || "Your Name"}
            </div>
            {personal.headline ? (
              <div style={{ fontSize: 12, marginTop: 4, color: "#1f2937", fontWeight: 600 }}>{personal.headline}</div>
            ) : null}
            {personal.summary ? (
              <div style={{ marginTop: 10, fontSize: 10.5, color: "#334155" }}>{personal.summary}</div>
            ) : null}

            {sectionTitle("Experience")}
            {experience.map((item, i) => (
              <div key={`exp-${i}`} style={{ marginBottom: 8 }}>
                <div style={{ fontWeight: 700, fontSize: 11 }}>{item.role || "Role"}</div>
                <div style={{ fontSize: 10, color: "#475569" }}>
                  {[item.company, item.duration].filter(Boolean).join(" | ")}
                </div>
                {item.bullets.filter(Boolean).map((bullet, idx) => (
                  <div key={`b-${idx}`} style={{ fontSize: 10, color: "#334155", marginTop: 3 }}>
                    - {bullet}
                  </div>
                ))}
              </div>
            ))}

            {sectionTitle("Education")}
            {education.map((item, i) => (
              <div key={`edu-${i}`} style={{ fontSize: 10.5, marginBottom: 5 }}>
                <strong>{item.institute}</strong> {[item.degree, item.year].filter(Boolean).join(" | ")}
              </div>
            ))}

            {projects.some((item) => item.name || item.desc) ? sectionTitle("Projects") : null}
            {projects.map((item, i) => (
              <div key={`project-${i}`} style={{ marginBottom: 6 }}>
                <div style={{ fontWeight: 700, fontSize: 10.5 }}>
                  {[item.name, item.link].filter(Boolean).join(" | ")}
                </div>
                <div style={{ fontSize: 10, color: "#374151" }}>{item.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        background: template.background,
        borderRadius: 8,
        padding: "1.4rem",
        color: template.text,
        fontSize: 11,
        lineHeight: 1.7,
        minHeight: 720,
        border: `1px solid ${template.id === "executive" ? "#fed7aa" : "#d1fae5"}`,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 14, borderBottom: `3px solid ${template.primary}`, paddingBottom: 10 }}>
        {personal.photoUrl ? (
          <img
            src={personal.photoUrl}
            alt="profile"
            style={{ width: 72, height: 72, borderRadius: "50%", objectFit: "cover", border: `2px solid ${template.primary}` }}
          />
        ) : null}
        <div>
          <div style={{ fontSize: 24, fontWeight: 800, color: template.primary }}>{personal.name || "Your Name"}</div>
          {personal.headline ? <div style={{ fontSize: 12, fontWeight: 600 }}>{personal.headline}</div> : null}
          <div style={{ fontSize: 10.5, marginTop: 3, color: "#4b5563" }}>
            {[personal.email, personal.phone, personal.location, personal.linkedin, personal.github]
              .filter(Boolean)
              .join(" | ")}
          </div>
        </div>
      </div>

      {personal.summary ? (
        <div style={{ marginTop: 10, background: template.sectionBg, borderRadius: 8, padding: "10px 12px", color: "#374151" }}>
          {personal.summary}
        </div>
      ) : null}

      {sectionTitle("Experience")}
      {experience.map((item, i) => (
        <div key={`exp-${i}`} style={{ marginBottom: 10 }}>
          <div style={{ fontWeight: 700, fontSize: 11.5 }}>{item.role || "Role"}</div>
          <div style={{ fontSize: 10.5, color: "#4b5563" }}>
            {[item.company, item.duration].filter(Boolean).join(" | ")}
          </div>
          {item.bullets.filter(Boolean).map((bullet, idx) => (
            <div key={`bullet-${idx}`} style={{ fontSize: 10.5, color: "#374151", marginTop: 3 }}>
              - {bullet}
            </div>
          ))}
        </div>
      ))}

      {sectionTitle("Education")}
      {education.map((item, i) => (
        <div key={`edu-${i}`} style={{ marginBottom: 5, fontSize: 10.5 }}>
          <strong>{item.institute}</strong> {[item.degree, item.year].filter(Boolean).join(" | ")}
        </div>
      ))}

      {allSkills.length ? sectionTitle("Skills") : null}
      {allSkills.length ? (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
          {allSkills.map((item) => (
            <span
              key={item}
              style={{
                fontSize: 9.5,
                background: template.sectionBg,
                border: `1px solid ${template.primary}55`,
                color: template.primary,
                padding: "2px 8px",
                borderRadius: 12,
              }}
            >
              {item}
            </span>
          ))}
        </div>
      ) : null}

      {projects.some((item) => item.name || item.desc) ? sectionTitle("Projects") : null}
      {projects.map((item, i) => (
        <div key={`project-${i}`} style={{ marginBottom: 7 }}>
          <div style={{ fontWeight: 700, fontSize: 10.5 }}>{[item.name, item.link].filter(Boolean).join(" | ")}</div>
          <div style={{ fontSize: 10, color: "#374151" }}>{item.desc}</div>
        </div>
      ))}
    </div>
  );
}
/* MAIN COMPONENT */
export default function ResumeBuilder({
  navigate,
  user,
  guestBuilderUsed,
  consumeGuestBuilderTry,
  requireAuth,
}) {
  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState(EMPTY);
  const [loading, setLoading] = useState(false);
  const [importLoading, setImportLoading] = useState(false);
  const [error, setError] = useState("");
  const [generatedResume, setGeneratedResume] = useState("");
  const [existingFile, setExistingFile] = useState(null);
  const [importMessage, setImportMessage] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [pdfFileName, setPdfFileName] = useState("resume_ats_optimized");
  const [selectedTemplate, setSelectedTemplate] = useState("ats_clean");
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [templateMessage, setTemplateMessage] = useState("");
  const previewRef = useRef(null);

  const buildResumeText = (d) => {
    const lines = [];
    const p = d.personal;
    lines.push(p.name || "Your Name");
    if (p.headline) lines.push(p.headline);
    lines.push([p.email, p.phone, p.location, p.linkedin, p.github].filter(Boolean).join(" | "));
    lines.push("");
    if (p.summary) {
      lines.push("SUMMARY");
      lines.push("-------");
      lines.push(p.summary);
      lines.push("");
    }

    if (d.experience.some((e) => e.role || e.company || e.bullets?.some(Boolean))) {
      lines.push("EXPERIENCE");
      lines.push("----------");
      d.experience.forEach((e) => {
        const header = [e.role, e.company].filter(Boolean).join(" @ ");
        lines.push([header, e.duration].filter(Boolean).join(" | "));
        e.bullets.filter(Boolean).forEach((b) => lines.push(`- ${b}`));
        lines.push("");
      });
    }

    if (d.education.some((e) => e.institute || e.degree || e.year)) {
      lines.push("EDUCATION");
      lines.push("---------");
      d.education.forEach((e) => lines.push([e.institute, e.degree, e.year].filter(Boolean).join(" | ")));
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

    if (d.projects.some((p) => p.name || p.link || p.desc)) {
      lines.push("PROJECTS");
      lines.push("--------");
      d.projects.forEach((p) => {
        lines.push([p.name, p.link].filter(Boolean).join(" | "));
        if (p.desc) lines.push(p.desc);
        lines.push("");
      });
    }

    return lines.join("\n").trim();
  };

  const extractTextFromAnalyze = (data) => {
    if (!data || typeof data !== "object") return "";
    const directFields = ["resumeText", "extractedText", "parsedText", "content", "rawText"];
    for (const field of directFields) {
      if (typeof data[field] === "string" && data[field].trim().length > 40) {
        return normalizeText(data[field]);
      }
    }
    if (data.sections && typeof data.sections === "object") {
      const sectionText = Object.values(data.sections)
        .filter((value) => typeof value === "string")
        .join("\n");
      if (sectionText.trim().length > 40) return normalizeText(sectionText);
    }
    return "";
  };

  const generateAtsResume = async (resumeText) => {
    const res = await fetch(`${API_BASE}/generate-ats`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        resumeText,
        jobDescription: jobDescription.trim(),
      }),
    });
    if (!res.ok) throw new Error(`Server error: ${res.status}`);
    const data = await res.json();
    return data.generatedResume || data.resume || resumeText;
  };

  const readExistingResumeText = async (file) => {
    if (file.type === "text/plain") {
      return normalizeText(await file.text());
    }

    const formDataPayload = new FormData();
    formDataPayload.append("file", file);
    if (jobDescription.trim()) {
      formDataPayload.append("jobDescription", jobDescription.trim());
    }

    try {
      const analyzeRes = await fetch(`${API_BASE}/analyze`, {
        method: "POST",
        body: formDataPayload,
      });
      if (analyzeRes.ok) {
        const analyzeData = await analyzeRes.json();
        const extracted = extractTextFromAnalyze(analyzeData);
        if (extracted) return extracted;
      }
    } catch (_e) {
      // Continue with local fallback.
    }

    const fallback = normalizeText(await file.text());
    if (fallback.length < 40) {
      throw new Error(
        "Could not extract resume text. For PDF/DOCX, ensure backend analyze response includes extracted text."
      );
    }
    return fallback;
  };

  const consumeBuilderGuestTryOrRedirect = () => {
    if (user) return true;
    if (guestBuilderUsed) {
      setError("Free builder try already used. Please register/login to continue.");
      requireAuth?.();
      return false;
    }
    const allowed = consumeGuestBuilderTry?.();
    if (!allowed) {
      setError("Free builder try already used. Please register/login to continue.");
      requireAuth?.();
      return false;
    }
    return true;
  };

  const handleImportExisting = async () => {
    if (!existingFile) {
      setError("Please select a resume file first.");
      return;
    }
    if (!ACCEPTED_TYPES.includes(existingFile.type)) {
      setError("Only PDF, DOCX, or TXT files are supported.");
      return;
    }

    setImportLoading(true);
    setError("");
    setImportMessage("");

    try {
      const extractedText = await readExistingResumeText(existingFile);
      const parsed = parseUploadedResumeText(extractedText);
      const mergedData = mergeIntoBuilderData(parsed);
      setFormData(mergedData);

      if (!consumeBuilderGuestTryOrRedirect()) {
        return;
      }

      try {
        const optimizedText = await generateAtsResume(buildResumeText(mergedData));
        setGeneratedResume(optimizedText);
      } catch (genErr) {
        setGeneratedResume(buildResumeText(mergedData));
        setError(`${genErr.message}. Using local optimized draft.`);
      }

      setStep(5);
      setImportMessage("Resume extracted and builder fields auto-filled. Review and download PDF.");
    } catch (err) {
      setError(err.message || "Failed to extract data from uploaded resume.");
    } finally {
      setImportLoading(false);
    }
  };

  const handleGenerate = async () => {
    if (!consumeBuilderGuestTryOrRedirect()) {
      return;
    }
    setLoading(true);
    setError("");
    try {
      const resumeText = buildResumeText(formData);
      const optimized = await generateAtsResume(resumeText);
      setGeneratedResume(optimized);
    } catch (err) {
      setError(`${err.message} - falling back to local export.`);
      setGeneratedResume(buildResumeText(formData));
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (!generatedResume.trim()) {
      setError("Generate resume first, then download PDF.");
      return;
    }
    if (!previewRef.current) {
      setError("Preview is not ready yet. Please try again.");
      return;
    }
    try {
      setIsExportingPdf(true);
      setTemplateMessage("");
      await exportNodeAsPdf(previewRef.current, pdfFileName);
      setTemplateMessage("Styled resume PDF downloaded successfully.");
    } catch (_err) {
      setError("Could not generate styled PDF. Please try again.");
    } finally {
      setIsExportingPdf(false);
    }
  };

  const progress = Math.round(((step + 1) / STEPS.length) * 100);

  return (
    <div>
      <Navbar navigate={navigate} user={user} />

      <div
        style={{ maxWidth: 1120, margin: "0 auto", padding: "3.5rem 2rem" }}
      >
        <div style={{ marginBottom: "1.5rem" }}>
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
            Build or improve your resume for a higher ATS score.
          </h1>
        </div>

        {!user && (
          <div
            style={{
              background: "rgba(0,229,255,0.06)",
              border: "1px solid rgba(0,229,255,0.2)",
              borderRadius: 8,
              padding: "10px 14px",
              fontFamily: "var(--font-mono)",
              fontSize: 12,
              color: "var(--c)",
              marginBottom: "1rem",
            }}
          >
            guest_limit: builder tries left = {guestBuilderUsed ? 0 : 1}
          </div>
        )}

        <div className="card" style={{ marginBottom: "1.5rem" }}>
          <div className="card-head">import_existing_resume()</div>
          <div style={{ padding: "1.25rem" }}>
            <p style={{ color: "var(--muted)", fontSize: 13, marginBottom: "0.9rem" }}>
              Already have a resume? Upload it to extract data, prefill this builder, and generate
              a stronger ATS-friendly version.
            </p>
            <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
              <input
                className="form-input"
                type="file"
                accept=".pdf,.docx,.txt"
                onChange={(e) => {
                  setExistingFile(e.target.files?.[0] || null);
                  setImportMessage("");
                }}
                style={{ maxWidth: 420 }}
              />
              <button className="btn-primary" onClick={handleImportExisting} disabled={importLoading}>
                {importLoading ? "extracting..." : "extract_and_prefill()"}
              </button>
            </div>
            {existingFile && (
              <div
                style={{
                  marginTop: "0.6rem",
                  fontFamily: "var(--font-mono)",
                  fontSize: 11,
                  color: "var(--muted)",
                }}
              >
                selected: {existingFile.name}
              </div>
            )}
            {importMessage && (
              <div
                style={{
                  marginTop: "0.9rem",
                  background: "rgba(0,255,136,0.06)",
                  border: "1px solid rgba(0,255,136,0.2)",
                  borderRadius: 8,
                  padding: "10px 14px",
                  fontFamily: "var(--font-mono)",
                  fontSize: 11,
                  color: "var(--g)",
                }}
              >
                {importMessage}
              </div>
            )}
          </div>
        </div>

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
            step_{step + 1} / {STEPS.length} - {STEPS[step]}
          </div>
        </div>

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
              {i < step ? "ok " : ""}
              {s.replace(" ", "_").toLowerCase()}
            </button>
          ))}
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "2rem",
            alignItems: "start",
          }}
        >
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
                  onGenerate={handleGenerate}
                  onDownloadPdf={handleDownloadPdf}
                  loading={loading || isExportingPdf}
                  error={error}
                  generatedResume={generatedResume}
                  pdfFileName={pdfFileName}
                  onPdfFileNameChange={setPdfFileName}
                  jobDescription={jobDescription}
                  onJobDescriptionChange={setJobDescription}
                  selectedTemplate={selectedTemplate}
                  onTemplateChange={setSelectedTemplate}
                />
              )}

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
                    prev()
                  </button>
                  <button
                    className="btn-primary"
                    onClick={() => setStep((s) => Math.min(STEPS.length - 1, s + 1))}
                  >
                    next()
                  </button>
                </div>
              )}
            </div>
          </div>

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
                  ATS-safe format
                </span>
              </div>
              <div style={{ padding: "1.25rem" }}>
                <div ref={previewRef}>
                  <LivePreview formData={formData} selectedTemplate={selectedTemplate} />
                </div>
              </div>
            </div>

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
              ats_tip: single-column format, no tables, no images, and role-specific keywords.
            </div>
            {templateMessage ? (
              <div
                style={{
                  marginTop: "0.7rem",
                  background: "rgba(0,255,136,0.06)",
                  border: "1px solid rgba(0,255,136,0.2)",
                  borderRadius: 8,
                  padding: "10px 14px",
                  fontFamily: "var(--font-mono)",
                  fontSize: 11,
                  color: "var(--g)",
                }}
              >
                {templateMessage}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

