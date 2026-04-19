import { useMemo, useRef, useState } from "react";
import { jsPDF } from "jspdf";
import Navbar from "../components/Navbar";
import TemplateGallery from "../components/TemplateGallery";
import { incrementUserCounter } from "../services/firestoreUsers";
import {
  requestGenerateStructuredResume,
  requestParseBuilderResume,
  markBuildDownload,
} from "../api/resumeApi";
import {
  MESSAGES,
  RESUME_FILE_ACCEPT,
} from "../constants/resumeCheckerConstants";
import {
  isSupportedResumeFileType,
  isWithinResumeSizeLimit,
} from "../utils/resumeFileValidation";

const STEPS = [
  "Contact",
  "Summary",
  "Skills",
  "Experience",
  "Education",
  "Projects",
  "Certifications",
  "Export",
];

const EMPTY_STRUCTURED = {
  name: "",
  email: "",
  phone: "",
  linkedin: "",
  github: "",
  summary: "",
  skills: [],
  experience: [{ title: "", company: "", duration: "", description: "" }],
  education: [{ degree: "", institution: "", year: "", percentage: "" }],
  certifications: [""],
  projects: [{ name: "", description: "", techStack: "", demoLink: "", sourceLink: "" }],
};

const PROFILE_SKILLS = [
  "Java",
  "JavaScript (ES6+)",
  "HTML5",
  "CSS3",
  "React.js",
  "Tailwind CSS",
  "Responsive UI Design",
  "Component Architecture",
  "Vite",
  "Node.js",
  "Express.js",
  "Spring Boot",
  "REST API Development",
  "JWT Authentication",
  "MongoDB",
  "Mongoose ODM",
  "Data Structures & Algorithms",
  "OOP",
  "MVC Architecture",
  "Git",
  "GitHub",
  "Vercel",
  "Render",
  "GitHub Pages",
  "VS Code",
];

const PROFILE_EDUCATION = [
  {
    degree: "Bachelor of Technology in Computer Science & Engineering",
    institution: "Greater Kolkata College of Engineering & Management, Kolkata, WB",
    year: "Aug 2022 - May 2026",
    percentage: "",
  },
  {
    degree: "Class XII - WBCHSE",
    institution: "R.B.B. High (H.S) School, West Bengal",
    year: "2021 - 2022",
    percentage: "88.60%",
  },
  {
    degree: "Class X - WBBSE",
    institution: "R.B.B. High (H.S) School, West Bengal",
    year: "2019 - 2020",
    percentage: "70.57%",
  },
];

const PROFILE_PROJECTS = [
  {
    name: "ATS Resume Checker",
    techStack: "React.js | Spring Boot | Java | REST API | Vercel",
    demoLink: "",
    sourceLink: "",
    description: `Built a full-stack ATS resume analysis tool with React.js frontend and Spring Boot (Java) backend; users upload PDF/DOCX/TXT resumes and receive real-time compatibility scores with optional job-description matching.
Designed REST endpoints /analyze and /generate-ats with multipart upload; implemented ResumeParser and ResumeAnalysisService in Java to evaluate keyword density and formatting quality.
Deployed frontend on Vercel; managed structured monorepo with Git and GitHub version control.`,
  },
  {
    name: "GymForge - Full-Stack Fitness Platform",
    techStack: "MongoDB | Express.js | React.js | Node.js | Tailwind CSS | JWT | Vercel | Render",
    demoLink: "",
    sourceLink: "",
    description: `Developed a complete MERN-stack fitness app featuring JWT authentication, AI-generated workout plans, To-Do tracker, and dynamic wallpaper generator across multiple protected React pages.
Architected a RESTful Node.js/Express backend with MongoDB/Mongoose models (User, WorkoutPlan, TodoItem); deployed backend on Render, frontend on Vercel with proper CORS configuration.
Implemented custom React hooks (useAuth, useTodos, useWorkoutPlan) and context-based auth system with fully protected client-side routing.`,
  },
  {
    name: "LeetCode Metrics Tracker",
    techStack: "React.js | REST API | Vercel",
    demoLink: "",
    sourceLink: "",
    description: `Engineered a real-time coding analytics dashboard fetching live LeetCode user statistics including problem-solving progress and category-wise performance via public API integration.
Designed a responsive UI with dynamic data rendering; deployed on Vercel with Git-based CI/CD achieving fast load times through optimized API call handling.`,
  },
  {
    name: "Personal Portfolio Website",
    techStack: "React.js | Tailwind CSS | JavaScript | Vite | Vercel",
    demoLink: "",
    sourceLink: "",
    description: `Designed and deployed a fully responsive portfolio showcasing projects, skills, and professional profile; hosted on GitHub Pages with semantic HTML for strong SEO and accessibility compliance.`,
  },
];

const RESUME_TEMPLATES = [
  { id: "ats_clean", name: "Classic Professional", description: "Single-column ATS-safe layout.", atsScore: 96, photoIncluded: false },
  { id: "modern_split", name: "Modern Sidebar", description: "Two-column layout with focused sidebar.", atsScore: 94, photoIncluded: false },
  { id: "executive", name: "Executive", description: "Leadership-focused layout.", atsScore: 92, photoIncluded: false },
  { id: "minimal_mono", name: "Minimal Clean", description: "Whitespace-heavy and readable.", atsScore: 97, photoIncluded: false },
  { id: "impact_edge", name: "Creative Accent", description: "Subtle accent styling.", atsScore: 91, photoIncluded: false },
  { id: "tech_blueprint", name: "Tech Blueprint", description: "Engineering-focused section rhythm.", atsScore: 95, photoIncluded: false },
];

const TEMPLATE_THEME = {
  ats_clean: { accent: "#0b5ed7", paper: "#ffffff", border: "#d1d5db", heading: "#0b5ed7", split: false },
  modern_split: { accent: "#0b5ed7", paper: "#ffffff", border: "#d1d5db", heading: "#1d4ed8", split: true },
  executive: { accent: "#8b4513", paper: "#fffdf8", border: "#e5d7c6", heading: "#8b4513", split: false },
  minimal_mono: { accent: "#111827", paper: "#ffffff", border: "#d1d5db", heading: "#111827", split: false },
  impact_edge: { accent: "#be123c", paper: "#ffffff", border: "#f3c2cf", heading: "#be123c", split: false },
  tech_blueprint: { accent: "#0f766e", paper: "#f8fafc", border: "#99f6e4", heading: "#0f766e", split: false },
};

function cleanValue(value) {
  return String(value || "").trim();
}

function cleanText(value) {
  return String(value || "")
    .replace(/\r/g, "")
    .replace(/[ ]{2,}/g, " ")
    .trim();
}

function parseCsvToList(value = "") {
  return String(value || "")
    .split(",")
    .map((item) => cleanValue(item))
    .filter(Boolean);
}

function listToCsv(list = []) {
  return Array.isArray(list) ? list.filter(Boolean).join(", ") : "";
}

function uniqueList(items = []) {
  const seen = new Set();
  const output = [];
  items.forEach((item) => {
    const value = cleanValue(item);
    if (!value) return;
    const key = value.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    output.push(value);
  });
  return output;
}

function sanitizeStructuredData(data = {}) {
  const safe = data && typeof data === "object" ? data : {};

  const experience = Array.isArray(safe.experience)
    ? safe.experience
        .map((item) => ({
          title: cleanValue(item?.title),
          company: cleanValue(item?.company),
          duration: cleanValue(item?.duration),
          description: cleanText(item?.description),
        }))
        .filter((item) => item.title || item.company || item.duration || item.description)
    : [];

  const education = Array.isArray(safe.education)
    ? safe.education
        .map((item) => ({
          degree: cleanValue(item?.degree),
          institution: cleanValue(item?.institution),
          year: cleanValue(item?.year),
          percentage: cleanValue(item?.percentage),
        }))
        .filter((item) => item.degree || item.institution || item.year || item.percentage)
    : [];

  const projects = Array.isArray(safe.projects)
    ? safe.projects
        .map((item) => ({
          name: cleanValue(item?.name),
          description: cleanText(item?.description),
          techStack: cleanValue(item?.techStack),
          demoLink: cleanValue(item?.demoLink),
          sourceLink: cleanValue(item?.sourceLink),
        }))
        .filter((item) => item.name || item.description || item.techStack || item.demoLink || item.sourceLink)
    : [];

  const skills = uniqueList(Array.isArray(safe.skills) ? safe.skills : parseCsvToList(safe.skills));
  const certifications = uniqueList(
    Array.isArray(safe.certifications) ? safe.certifications : parseCsvToList(safe.certifications)
  );

  return {
    name: cleanValue(safe.name),
    email: cleanValue(safe.email),
    phone: cleanValue(safe.phone),
    linkedin: cleanValue(safe.linkedin),
    github: cleanValue(safe.github),
    summary: cleanText(safe.summary),
    skills,
    experience: experience.length ? experience : [{ title: "", company: "", duration: "", description: "" }],
    education: education.length ? education : [{ degree: "", institution: "", year: "", percentage: "" }],
    certifications: certifications.length ? certifications : [""],
    projects: projects.length ? projects : [{ name: "", description: "", techStack: "", demoLink: "", sourceLink: "" }],
  };
}

function applyRequestedSectionPreset(data = {}) {
  const safe = data && typeof data === "object" ? data : {};
  return {
    ...safe,
    skills: [...PROFILE_SKILLS],
    education: PROFILE_EDUCATION.map((item) => ({ ...item })),
    projects: PROFILE_PROJECTS.map((item) => ({ ...item })),
  };
}

function sanitizePdfName(name) {
  const cleaned = String(name || "")
    .trim()
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, "")
    .replace(/\s+/g, "_")
    .slice(0, 80);
  return cleaned || "resume_ats_optimized";
}

function drawPdfLink(pdf, label, href, x, y) {
  const url = normalizeUrl(href);
  if (!url) return;
  pdf.setTextColor(0, 90, 190);
  pdf.textWithLink(label, x, y, { url });
  const width = pdf.getTextWidth(label);
  pdf.setDrawColor(0, 90, 190);
  pdf.line(x, y + 1.5, x + width, y + 1.5);
  pdf.setTextColor(26, 26, 26);
}

function exportStructuredResumeAsPdf(data, fileName) {
  const safe = sanitizeStructuredData(data);
  const pdf = new jsPDF("p", "pt", "a4");
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 34;
  const contentWidth = pageWidth - margin * 2;
  const lineHeight = 14;
  let y = margin;

  const ensureSpace = (height = lineHeight) => {
    if (y + height > pageHeight - margin) {
      pdf.addPage();
      y = margin;
    }
  };

  const writeWrapped = (text, options = {}) => {
    const indent = options.indent || 0;
    const font = options.font || "helvetica";
    const style = options.style || "normal";
    const size = options.size || 10.5;
    const color = options.color || [31, 41, 55];
    const maxWidth = options.maxWidth || (contentWidth - indent);
    const value = cleanText(text);
    if (!value) return;

    pdf.setFont(font, style);
    pdf.setFontSize(size);
    pdf.setTextColor(...color);
    const lines = pdf.splitTextToSize(value, maxWidth);
    lines.forEach((line) => {
      ensureSpace(lineHeight);
      pdf.text(line, margin + indent, y);
      y += lineHeight;
    });
  };

  const writeSection = (label) => {
    y += 8;
    ensureSpace(20);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(11);
    pdf.setTextColor(11, 94, 215);
    pdf.text(String(label || "").toUpperCase(), margin, y);
    const textWidth = pdf.getTextWidth(String(label || "").toUpperCase());
    pdf.setDrawColor(11, 94, 215);
    pdf.setLineWidth(0.7);
    pdf.line(margin + textWidth + 8, y - 3, pageWidth - margin, y - 3);
    y += 10;
  };

  const list = (items = []) => items.filter(Boolean).join(" | ");
  const skillLines = buildSkillsLines(safe.skills);
  const hasExperience = safe.experience.some((item) => item.title || item.company || item.duration || item.description);
  const hasProjects = safe.projects.some((item) => item.name || item.description || item.techStack || item.demoLink || item.sourceLink);
  const hasCerts = safe.certifications.some(Boolean);

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(24);
  pdf.setTextColor(11, 94, 215);
  pdf.text(safe.name || "Your Name", margin, y);
  y += 18;

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(10.5);
  pdf.setTextColor(51, 65, 85);

  const contacts = [
    safe.email ? { label: safe.email, href: `mailto:${safe.email}` } : null,
    safe.phone ? { label: safe.phone, href: `tel:${safe.phone}` } : null,
    safe.linkedin ? { label: safe.linkedin, href: safe.linkedin } : null,
    safe.github ? { label: safe.github, href: safe.github } : null,
  ].filter(Boolean);

  let xCursor = margin;
  contacts.forEach((contact, index) => {
    const labelWidth = pdf.getTextWidth(contact.label);
    const sepWidth = index > 0 ? pdf.getTextWidth(" | ") : 0;
    if (xCursor + sepWidth + labelWidth > pageWidth - margin) {
      y += lineHeight;
      xCursor = margin;
    }
    if (index > 0 && xCursor > margin) {
      pdf.setTextColor(51, 65, 85);
      pdf.text(" | ", xCursor, y);
      xCursor += sepWidth;
    }
    drawPdfLink(pdf, contact.label, contact.href, xCursor, y);
    xCursor += labelWidth;
  });
  y += 10;
  pdf.setDrawColor(11, 94, 215);
  pdf.setLineWidth(1);
  pdf.line(margin, y, pageWidth - margin, y);
  y += 10;

  writeSection("Professional Summary");
  writeWrapped(safe.summary || "Add a concise summary for your profile.");

  writeSection("Technical Skills");
  skillLines.forEach((line) => writeWrapped(line));

  if (hasExperience) {
    writeSection("Work Experience");
    safe.experience.forEach((item) => {
      const heading = item.title || "Role";
      writeWrapped(heading, { style: "bold", color: [26, 26, 26] });
      writeWrapped(list([item.company, item.duration]), { color: [71, 85, 105] });
      writeWrapped(item.description || "No description provided.");
      y += 4;
    });
  }

  writeSection("Education");
  safe.education.forEach((item) => {
    const percentageText = extractEducationPercentage(item);
    writeWrapped(item.degree || "Degree", { style: "bold", color: [26, 26, 26] });
    writeWrapped(list([item.institution, item.year, percentageText && `Percentage: ${percentageText}`]));
    y += 2;
  });

  if (hasProjects) {
    writeSection("Projects");
    safe.projects.forEach((item) => {
      ensureSpace(lineHeight);
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(10.5);
      pdf.setTextColor(26, 26, 26);
      const projectName = item.name || "Project";
      pdf.text(projectName, margin, y);
      let projectX = margin + pdf.getTextWidth(projectName);
      if (item.demoLink || item.sourceLink) {
        pdf.setFont("helvetica", "normal");
        pdf.setTextColor(100, 116, 139);
        pdf.text(" - ", projectX + 3, y);
        projectX += pdf.getTextWidth(" - ") + 3;
        if (item.demoLink) {
          drawPdfLink(pdf, "Demo", item.demoLink, projectX, y);
          projectX += pdf.getTextWidth("Demo") + 10;
        }
        if (item.sourceLink) {
          if (item.demoLink) {
            pdf.setTextColor(100, 116, 139);
            pdf.text("|", projectX, y);
            projectX += pdf.getTextWidth("|") + 8;
          }
          drawPdfLink(pdf, "Source", item.sourceLink, projectX, y);
        }
      }
      y += lineHeight;
      if (item.techStack) writeWrapped(item.techStack, { color: [71, 85, 105] });
      getProjectBulletPoints(item.description).forEach((line) => {
        writeWrapped(`- ${line}`);
      });
      y += 4;
    });
  }

  if (hasCerts) {
    writeSection("Certifications");
    safe.certifications.filter(Boolean).forEach((item) => {
      writeWrapped(`- ${item}`);
    });
  }

  pdf.save(`${sanitizePdfName(fileName)}.pdf`);
}

function SectionTitle({ label, color }) {
  return (
    <div style={{ marginTop: 12, marginBottom: 6, display: "flex", alignItems: "center", gap: 8 }}>
      <span
        style={{
          fontSize: 11,
          fontWeight: 800,
          letterSpacing: 0.6,
          textTransform: "uppercase",
          color,
          lineHeight: 1.2,
          whiteSpace: "nowrap",
        }}
      >
        {label}
      </span>
      <span style={{ flex: 1, height: 1, background: color, opacity: 0.5 }} />
    </div>
  );
}

function normalizeUrl(value) {
  const text = cleanValue(value);
  if (!text) return "";
  if (/^(https?:\/\/|mailto:|tel:)/i.test(text)) return text;
  return `https://${text}`;
}

function extractEducationPercentage(item = {}) {
  if (cleanValue(item.percentage)) return cleanValue(item.percentage);
  const combined = [item.degree, item.institution, item.year].filter(Boolean).join(" ");
  const percentMatch = combined.match(/\b\d{1,2}(?:\.\d+)?%/);
  if (percentMatch) return percentMatch[0];
  const cgpaMatch = combined.match(/\b\d(?:\.\d+)?\s*CGPA\b/i);
  if (cgpaMatch) return cgpaMatch[0].toUpperCase();
  return "";
}

function splitSkillsIntoGroups(skills = []) {
  const groups = {
    languages: [],
    frontend: [],
    backend: [],
    database: [],
    coreCs: [],
    toolsPlatforms: [],
    other: [],
  };

  skills.forEach((skill) => {
    const value = cleanValue(skill);
    if (!value) return;
    const key = value.toLowerCase();
    if (/(^java$|javascript|html|css)/.test(key)) {
      groups.languages.push(value);
      return;
    }
    if (/(react|tailwind|responsive|component architecture|vite|frontend|ui design|angular|vue|next\.?js)/.test(key)) {
      groups.frontend.push(value);
      return;
    }
    if (/(node|express|spring|backend|rest|api|jwt|auth)/.test(key)) {
      groups.backend.push(value);
      return;
    }
    if (/(mongo|mongoose|sql|postgres|mysql|redis|database|odm)/.test(key)) {
      groups.database.push(value);
      return;
    }
    if (/(data structures|algorithms|oop|object oriented|mvc|architecture|core cs)/.test(key)) {
      groups.coreCs.push(value);
      return;
    }
    if (/(git|github|vercel|render|pages|vs code|tools|platform)/.test(key)) {
      groups.toolsPlatforms.push(value);
      return;
    }
    groups.other.push(value);
  });

  const unique = (list) => [...new Set(list)];
  return {
    languages: unique(groups.languages),
    frontend: unique(groups.frontend),
    backend: unique(groups.backend),
    database: unique(groups.database),
    coreCs: unique(groups.coreCs),
    toolsPlatforms: unique(groups.toolsPlatforms),
    other: unique(groups.other),
  };
}

function buildSkillsLines(skills = []) {
  const grouped = splitSkillsIntoGroups(skills);
  const lines = [];
  if (grouped.languages.length) lines.push(`Languages ${grouped.languages.join(", ")}`);
  if (grouped.frontend.length) lines.push(`Frontend ${grouped.frontend.join(", ")}`);
  if (grouped.backend.length) lines.push(`Backend ${grouped.backend.join(", ")}`);
  if (grouped.database.length) lines.push(`Database ${grouped.database.join(", ")}`);
  if (grouped.coreCs.length) lines.push(`Core CS ${grouped.coreCs.join(", ")}`);
  if (grouped.toolsPlatforms.length) lines.push(`Tools & Platforms ${grouped.toolsPlatforms.join(", ")}`);
  if (grouped.other.length) lines.push(`Other ${grouped.other.join(", ")}`);

  if (!lines.length) {
    return [
      "Languages Java, JavaScript (ES6+), HTML5, CSS3",
      "Frontend React.js, Tailwind CSS, Responsive UI Design, Component Architecture, Vite",
      "Backend Node.js, Express.js, Spring Boot, REST API Development, JWT Authentication",
      "Database MongoDB, Mongoose ODM",
      "Core CS Data Structures & Algorithms, OOP, MVC Architecture",
      "Tools & Platforms Git, GitHub, Vercel, Render, GitHub Pages, VS Code",
    ];
  }
  return lines;
}

function clampText(value, max = 110) {
  const text = cleanText(value);
  if (!text) return "";
  return text.length <= max ? text : `${text.slice(0, max - 3).trim()}...`;
}

function getProjectBulletPoints(description) {
  const lines = String(description || "")
    .split("\n")
    .map((line) => line.replace(/^[-*]\s*/, "").trim())
    .filter(Boolean);
  const points = lines.slice(0, 3).map((line) => cleanText(line)).filter(Boolean);
  return points.length ? points : ["Built and delivered a complete solution."];
}

function ProjectHeadingWithLinks({ item, fontSize = 10.5 }) {
  const hasDemo = Boolean(item?.demoLink);
  const hasSource = Boolean(item?.sourceLink);
  return (
    <div style={{ display: "flex", alignItems: "baseline", flexWrap: "wrap", gap: 8 }}>
      <span style={{ fontWeight: 700 }}>{item?.name || "Project"}</span>
      {(hasDemo || hasSource) ? (
        <span style={{ fontSize, whiteSpace: "nowrap" }}>
          {hasDemo ? (
            <a href={normalizeUrl(item.demoLink)} target="_blank" rel="noreferrer" style={{ color: "#0b5ed7", textDecoration: "none" }}>
              Demo
            </a>
          ) : null}
          {(hasDemo && hasSource) ? <span style={{ color: "#64748b" }}> | </span> : null}
          {hasSource ? (
            <a href={normalizeUrl(item.sourceLink)} target="_blank" rel="noreferrer" style={{ color: "#0b5ed7", textDecoration: "none" }}>
              Source
            </a>
          ) : null}
        </span>
      ) : null}
    </div>
  );
}

function ResumeTemplateBase({ theme, data }) {
  const safe = sanitizeStructuredData(data);
  const skillLines = buildSkillsLines(safe.skills);
  const hasExperience = safe.experience.some(
    (item) => item.title || item.company || item.duration || String(item.description || "").trim()
  );
  const hasProjects = safe.projects.some((item) => item.name || item.description || item.techStack || item.demoLink || item.sourceLink);

  if (theme.split) {
    return (
      <div
        style={{
          background: theme.paper,
          border: `1px solid ${theme.border}`,
          borderRadius: 8,
          color: "#1a1a1a",
          fontSize: 10.5,
          lineHeight: 1.4,
          padding: 12,
        }}
      >
        <div style={{ display: "grid", gridTemplateColumns: "0.33fr 0.67fr" }}>
          <div
            style={{
              background: "#1e293b",
              color: "#ffffff",
              borderRadius: 6,
              padding: 12,
              marginRight: 10,
            }}
          >
            <div style={{ fontSize: 18, fontWeight: 800, lineHeight: 1.2 }}>{safe.name || "Your Name"}</div>
            <div style={{ fontSize: 10, marginTop: 8 }}>
              {safe.email ? <a href={`mailto:${safe.email}`} style={{ color: "inherit", textDecoration: "none" }}>{safe.email}</a> : "email@example.com"}
            </div>
            <div style={{ fontSize: 10 }}>
              {safe.phone ? <a href={`tel:${safe.phone}`} style={{ color: "inherit", textDecoration: "none" }}>{safe.phone}</a> : "+00 0000 0000"}
            </div>
            {safe.linkedin ? (
              <div style={{ fontSize: 10, marginTop: 4 }}>
                <a href={normalizeUrl(safe.linkedin)} target="_blank" rel="noreferrer" style={{ color: "inherit", textDecoration: "none" }}>
                  {safe.linkedin}
                </a>
              </div>
            ) : null}
            {safe.github ? (
              <div style={{ fontSize: 10 }}>
                <a href={normalizeUrl(safe.github)} target="_blank" rel="noreferrer" style={{ color: "inherit", textDecoration: "none" }}>
                  {safe.github}
                </a>
              </div>
            ) : null}

            <SectionTitle label="Technical Skills" color="#ffffff" />
            <div style={{ display: "grid", gap: 3 }}>
              {skillLines.map((line) => (
                <div key={line} style={{ fontSize: 9.3, lineHeight: 1.35, color: "rgba(255,255,255,0.95)" }}>
                  {line}
                </div>
              ))}
            </div>
          </div>

          <div style={{ padding: "0 2px" }}>
            <SectionTitle label="Professional Summary" color={theme.heading} />
            <div>{safe.summary || "Add a concise summary for your profile."}</div>

            {hasExperience ? <SectionTitle label="Work Experience" color={theme.heading} /> : null}
            {hasExperience
              ? safe.experience.map((item, index) => (
                  <div key={`${item.title}-${index}`} style={{ marginBottom: 8 }}>
                    <div style={{ fontWeight: 700 }}>{item.title || "Role"}</div>
                    <div style={{ color: "#334155", fontSize: 10.5 }}>
                      {[item.company, item.duration].filter(Boolean).join(" | ")}
                    </div>
                    <div style={{ whiteSpace: "pre-wrap" }}>{item.description || "No description provided."}</div>
                  </div>
                ))
              : null}

            <SectionTitle label="Education" color={theme.heading} />
            {safe.education.map((item, index) => (
              <div key={`${item.degree}-${index}`} style={{ marginBottom: 5 }}>
                {(() => {
                  const percentageText = extractEducationPercentage(item);
                  return (
                    <>
                      <strong>{item.degree || "Degree"}</strong>{" "}
                      {[item.institution, item.year, percentageText && `Percentage: ${percentageText}`]
                        .filter(Boolean)
                        .join(" | ")}
                    </>
                  );
                })()}
              </div>
            ))}

            {hasProjects ? <SectionTitle label="Projects" color={theme.heading} /> : null}
            {safe.projects.map((item, index) => (
              <div key={`${item.name}-${index}`} style={{ marginBottom: 6 }}>
                <ProjectHeadingWithLinks item={item} fontSize={10} />
                {item.techStack ? <div style={{ fontSize: 10, color: "#475569" }}>{item.techStack}</div> : null}
                {getProjectBulletPoints(item.description).map((line, bulletIndex) => (
                  <div key={`${item.name}-${index}-bullet-${bulletIndex}`} style={{ color: "#1f2937" }}>
                    - {line}
                  </div>
                ))}
              </div>
            ))}

            {safe.certifications.some(Boolean) ? <SectionTitle label="Certifications" color={theme.heading} /> : null}
            {safe.certifications.filter(Boolean).map((item, index) => (
              <div key={`${item}-${index}`}>- {item}</div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        background: theme.paper,
        border: `1px solid ${theme.border}`,
        borderRadius: 8,
        color: "#1a1a1a",
        fontSize: 10.5,
        lineHeight: 1.4,
        padding: 12,
      }}
    >
      <div style={{ borderBottom: `2px solid ${theme.accent}`, paddingBottom: 8 }}>
        <div style={{ fontSize: 24, fontWeight: 800, color: theme.heading }}>{safe.name || "Your Name"}</div>
        <div style={{ fontSize: 10.1, color: "#334155", marginTop: 4, display: "flex", flexWrap: "wrap", alignItems: "center", rowGap: 2 }}>
          {[safe.email && (
            <a key="email" href={`mailto:${safe.email}`} style={{ color: "inherit", textDecoration: "none" }}>{safe.email}</a>
          ), safe.phone && (
            <a key="phone" href={`tel:${safe.phone}`} style={{ color: "inherit", textDecoration: "none" }}>{safe.phone}</a>
          ), safe.linkedin && (
            <a
              key="linkedin"
              href={normalizeUrl(safe.linkedin)}
              target="_blank"
              rel="noreferrer"
              style={{ color: "inherit", textDecoration: "none" }}
            >
              {safe.linkedin}
            </a>
          ), safe.github && (
            <a
              key="github"
              href={normalizeUrl(safe.github)}
              target="_blank"
              rel="noreferrer"
              style={{ color: "inherit", textDecoration: "none" }}
            >
              {safe.github}
            </a>
          )]
            .filter(Boolean)
            .flatMap((item, index) => (index === 0 ? [item] : [<span key={`sep-${index}`} style={{ margin: "0 6px" }}>|</span>, item]))}
        </div>
      </div>

      <SectionTitle label="Professional Summary" color={theme.heading} />
      <div>{safe.summary || "Add a concise summary for your profile."}</div>

      <SectionTitle label="Technical Skills" color={theme.heading} />
      <div style={{ display: "grid", gap: 4 }}>
        {skillLines.map((line) => (
          <div key={line} style={{ color: "#1f2937" }}>
            {line}
          </div>
        ))}
      </div>

      {hasExperience ? <SectionTitle label="Work Experience" color={theme.heading} /> : null}
      {hasExperience
        ? safe.experience.map((item, index) => (
            <div key={`${item.title}-${index}`} style={{ marginBottom: 8 }}>
              <div style={{ fontWeight: 700, color: "#1a1a1a" }}>{item.title || "Role"}</div>
              <div style={{ fontSize: 10.5, color: "#334155" }}>
                {[item.company, item.duration].filter(Boolean).join(" | ")}
              </div>
              <div style={{ whiteSpace: "pre-wrap", color: "#1f2937" }}>{item.description || "No description provided."}</div>
            </div>
          ))
        : null}

      <SectionTitle label="Education" color={theme.heading} />
      {safe.education.map((item, index) => (
        <div key={`${item.degree}-${index}`} style={{ marginBottom: 5, color: "#1f2937" }}>
          {(() => {
            const percentageText = extractEducationPercentage(item);
            return (
              <>
                <strong>{item.degree || "Degree"}</strong>{" "}
                {[item.institution, item.year, percentageText && `Percentage: ${percentageText}`]
                  .filter(Boolean)
                  .join(" | ")}
              </>
            );
          })()}
        </div>
      ))}

      {hasProjects ? <SectionTitle label="Projects" color={theme.heading} /> : null}
      {safe.projects.map((item, index) => (
        <div key={`${item.name}-${index}`} style={{ marginBottom: 6 }}>
          <ProjectHeadingWithLinks item={item} fontSize={10.5} />
          {item.techStack ? <div style={{ fontSize: 10.5, color: "#334155" }}>{item.techStack}</div> : null}
          {getProjectBulletPoints(item.description).map((line, bulletIndex) => (
            <div key={`${item.name}-${index}-bullet-${bulletIndex}`} style={{ color: "#1f2937" }}>
              - {line}
            </div>
          ))}
        </div>
      ))}

      {safe.certifications.some(Boolean) ? <SectionTitle label="Certifications" color={theme.heading} /> : null}
      {safe.certifications.filter(Boolean).map((item, index) => (
        <div key={`${item}-${index}`} style={{ color: "#1f2937" }}>
          - {item}
        </div>
      ))}
    </div>
  );
}

function AtsCleanTemplate({ name, email, phone, summary, skills, experience, education, projects, certifications, linkedin, github }) {
  return <ResumeTemplateBase theme={TEMPLATE_THEME.ats_clean} data={{ name, email, phone, summary, skills, experience, education, projects, certifications, linkedin, github }} />;
}

function ModernSplitTemplate({ name, email, phone, summary, skills, experience, education, projects, certifications, linkedin, github }) {
  return <ResumeTemplateBase theme={TEMPLATE_THEME.modern_split} data={{ name, email, phone, summary, skills, experience, education, projects, certifications, linkedin, github }} />;
}

function ExecutiveTemplate({ name, email, phone, summary, skills, experience, education, projects, certifications, linkedin, github }) {
  return <ResumeTemplateBase theme={TEMPLATE_THEME.executive} data={{ name, email, phone, summary, skills, experience, education, projects, certifications, linkedin, github }} />;
}

function MinimalMonoTemplate({ name, email, phone, summary, skills, experience, education, projects, certifications, linkedin, github }) {
  return <ResumeTemplateBase theme={TEMPLATE_THEME.minimal_mono} data={{ name, email, phone, summary, skills, experience, education, projects, certifications, linkedin, github }} />;
}

function ImpactEdgeTemplate({ name, email, phone, summary, skills, experience, education, projects, certifications, linkedin, github }) {
  return <ResumeTemplateBase theme={TEMPLATE_THEME.impact_edge} data={{ name, email, phone, summary, skills, experience, education, projects, certifications, linkedin, github }} />;
}

function TechBlueprintTemplate({ name, email, phone, summary, skills, experience, education, projects, certifications, linkedin, github }) {
  return <ResumeTemplateBase theme={TEMPLATE_THEME.tech_blueprint} data={{ name, email, phone, summary, skills, experience, education, projects, certifications, linkedin, github }} />;
}

const TEMPLATE_COMPONENTS = {
  ats_clean: AtsCleanTemplate,
  modern_split: ModernSplitTemplate,
  executive: ExecutiveTemplate,
  minimal_mono: MinimalMonoTemplate,
  impact_edge: ImpactEdgeTemplate,
  tech_blueprint: TechBlueprintTemplate,
};

function LivePreview({ structuredData, selectedTemplate }) {
  const safe = sanitizeStructuredData(structuredData);
  const Template = TEMPLATE_COMPONENTS[selectedTemplate] || AtsCleanTemplate;
  return (
    <div style={{ background: "#f5f5f5", border: "1px solid #d1d5db", borderRadius: 10, padding: 12, color: "#1a1a1a" }}>
      <Template {...safe} />
    </div>
  );
}

function TextInput({ label, value, onChange, placeholder, type = "text" }) {
  return (
    <div className="form-group">
      <label className="form-label">{label}</label>
      <input
        className="form-input"
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder || ""}
      />
    </div>
  );
}

function ContactStep({ data, onChange }) {
  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
        <TextInput label="name" value={data.name} onChange={(value) => onChange({ ...data, name: value })} />
        <TextInput label="email" type="email" value={data.email} onChange={(value) => onChange({ ...data, email: value })} />
        <TextInput label="phone" value={data.phone} onChange={(value) => onChange({ ...data, phone: value })} />
        <TextInput label="linkedin" value={data.linkedin} onChange={(value) => onChange({ ...data, linkedin: value })} />
        <TextInput label="github" value={data.github} onChange={(value) => onChange({ ...data, github: value })} />
      </div>
    </div>
  );
}

function SummaryStep({ summary, onChange }) {
  return (
    <div className="form-group">
      <label className="form-label">professional_summary</label>
      <textarea
        className="form-textarea"
        rows={6}
        value={summary}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Write a concise professional summary aligned to your target role."
      />
    </div>
  );
}

function SkillsStep({ skills, onChange }) {
  return (
    <div className="form-group">
      <label className="form-label">skills (comma separated)</label>
      <textarea
        className="form-textarea"
        rows={5}
        value={listToCsv(skills)}
        onChange={(event) => onChange(uniqueList(parseCsvToList(event.target.value)))}
        placeholder="React, Node.js, Spring Boot, SQL, Docker"
      />
    </div>
  );
}

function ExperienceStep({ experience, onChange }) {
  const updateEntry = (index, patch) => {
    const updated = [...experience];
    updated[index] = { ...updated[index], ...patch };
    onChange(updated);
  };
  const addEntry = () => onChange([...experience, { title: "", company: "", duration: "", description: "" }]);
  const removeEntry = (index) => onChange(experience.filter((_, itemIndex) => itemIndex !== index));

  return (
    <div>
      {experience.map((item, index) => (
        <div key={`experience-${index}`} style={{ border: "1px solid var(--border)", borderRadius: 10, padding: 12, marginBottom: 12, background: "var(--d3)" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 10 }}>
            <TextInput label="job_title" value={item.title} onChange={(value) => updateEntry(index, { title: value })} />
            <TextInput label="company" value={item.company} onChange={(value) => updateEntry(index, { company: value })} />
            <TextInput label="duration" value={item.duration} onChange={(value) => updateEntry(index, { duration: value })} />
          </div>
          <div className="form-group">
            <label className="form-label">description / responsibilities</label>
            <textarea
              className="form-textarea"
              rows={4}
              value={item.description}
              onChange={(event) => updateEntry(index, { description: event.target.value })}
              placeholder="- Built feature...&#10;- Improved process..."
            />
          </div>
          <button className="btn-ghost" onClick={() => removeEntry(index)} disabled={experience.length <= 1}>
            remove_experience()
          </button>
        </div>
      ))}
      <button className="btn-ghost" onClick={addEntry}>+ add_experience()</button>
    </div>
  );
}

function EducationStep({ education, onChange }) {
  const updateEntry = (index, patch) => {
    const updated = [...education];
    updated[index] = { ...updated[index], ...patch };
    onChange(updated);
  };
  const addEntry = () => onChange([...education, { degree: "", institution: "", year: "", percentage: "" }]);
  const removeEntry = (index) => onChange(education.filter((_, itemIndex) => itemIndex !== index));

  return (
    <div>
      {education.map((item, index) => (
        <div key={`education-${index}`} style={{ border: "1px solid var(--border)", borderRadius: 10, padding: 12, marginBottom: 12, background: "var(--d3)" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 10 }}>
            <TextInput label="degree" value={item.degree} onChange={(value) => updateEntry(index, { degree: value })} />
            <TextInput label="institution" value={item.institution} onChange={(value) => updateEntry(index, { institution: value })} />
            <TextInput label="year" value={item.year} onChange={(value) => updateEntry(index, { year: value })} />
            <TextInput label="percentage / cgpa" value={item.percentage || ""} onChange={(value) => updateEntry(index, { percentage: value })} placeholder="89.2% or 8.7 CGPA" />
          </div>
          <button className="btn-ghost" onClick={() => removeEntry(index)} disabled={education.length <= 1}>
            remove_education()
          </button>
        </div>
      ))}
      <button className="btn-ghost" onClick={addEntry}>+ add_education()</button>
    </div>
  );
}

function ProjectsStep({ projects, onChange }) {
  const updateEntry = (index, patch) => {
    const updated = [...projects];
    updated[index] = { ...updated[index], ...patch };
    onChange(updated);
  };
  const addEntry = () => onChange([...projects, { name: "", description: "", techStack: "", demoLink: "", sourceLink: "" }]);
  const removeEntry = (index) => onChange(projects.filter((_, itemIndex) => itemIndex !== index));

  return (
    <div>
      {projects.map((item, index) => (
        <div key={`project-${index}`} style={{ border: "1px solid var(--border)", borderRadius: 10, padding: 12, marginBottom: 12, background: "var(--d3)" }}>
          <TextInput label="project_name" value={item.name} onChange={(value) => updateEntry(index, { name: value })} />
          <TextInput label="tech_stack" value={item.techStack} onChange={(value) => updateEntry(index, { techStack: value })} />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 10 }}>
            <TextInput
              label="demo_link"
              value={item.demoLink || ""}
              onChange={(value) => updateEntry(index, { demoLink: value })}
              placeholder="https://..."
            />
            <TextInput
              label="source_link"
              value={item.sourceLink || ""}
              onChange={(value) => updateEntry(index, { sourceLink: value })}
              placeholder="https://github.com/..."
            />
          </div>
          <div className="form-group">
            <label className="form-label">project_description</label>
            <textarea
              className="form-textarea"
              rows={4}
              value={item.description}
              onChange={(event) => updateEntry(index, { description: event.target.value })}
            />
          </div>
          <button className="btn-ghost" onClick={() => removeEntry(index)} disabled={projects.length <= 1}>
            remove_project()
          </button>
        </div>
      ))}
      <button className="btn-ghost" onClick={addEntry}>+ add_project()</button>
    </div>
  );
}

function CertificationsStep({ certifications, onChange }) {
  const updateEntry = (index, value) => {
    const updated = [...certifications];
    updated[index] = value;
    onChange(updated);
  };
  const addEntry = () => onChange([...certifications, ""]);
  const removeEntry = (index) => onChange(certifications.filter((_, itemIndex) => itemIndex !== index));

  return (
    <div>
      {certifications.map((item, index) => (
        <div key={`cert-${index}`} style={{ display: "flex", gap: 8, marginBottom: 8 }}>
          <input
            className="form-input"
            value={item}
            onChange={(event) => updateEntry(index, event.target.value)}
            placeholder="AWS Certified Developer"
          />
          <button className="btn-ghost" onClick={() => removeEntry(index)} disabled={certifications.length <= 1}>
            remove
          </button>
        </div>
      ))}
      <button className="btn-ghost" onClick={addEntry}>+ add_certification()</button>
    </div>
  );
}

export default function ResumeBuilder({
  navigate,
  user,
  guestBuilderUsed,
  consumeGuestBuilderTry,
  requireAuth,
  onLogout,
}) {
  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState(EMPTY_STRUCTURED);
  const [generatedStructured, setGeneratedStructured] = useState(null);
  const [generatedResume, setGeneratedResume] = useState("");
  const [buildId, setBuildId] = useState(null);
  const [selectedTemplate, setSelectedTemplate] = useState("ats_clean");
  const [jobDescription, setJobDescription] = useState("");
  const [pdfFileName, setPdfFileName] = useState("resume_ats_optimized");
  const [sourceResumeText, setSourceResumeText] = useState("");
  const [existingFile, setExistingFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [importLoading, setImportLoading] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [error, setError] = useState("");
  const [importMessage, setImportMessage] = useState("");

  const previewRef = useRef(null);

  const previewData = useMemo(
    () => sanitizeStructuredData(generatedStructured || formData),
    [generatedStructured, formData]
  );
  const atsTextExtractable = useMemo(() => {
    const textBlob = [
      previewData.name,
      previewData.email,
      previewData.phone,
      previewData.linkedin,
      previewData.github,
      previewData.summary,
      ...(previewData.skills || []),
      ...(previewData.experience || []).flatMap((item) => [item.title, item.company, item.duration, item.description]),
      ...(previewData.education || []).flatMap((item) => [item.degree, item.institution, item.year, item.percentage]),
      ...(previewData.projects || []).flatMap((item) => [item.name, item.techStack, item.description, item.demoLink, item.sourceLink]),
      ...(previewData.certifications || []),
    ]
      .filter(Boolean)
      .join(" ")
      .trim();
    return textBlob.length >= 30;
  }, [previewData]);

  const progress = Math.round(((step + 1) / STEPS.length) * 100);

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
    if (!isSupportedResumeFileType(existingFile)) {
      setError(MESSAGES.uploadInvalidType);
      return;
    }
    if (!isWithinResumeSizeLimit(existingFile)) {
      setError(MESSAGES.uploadSizeExceeded);
      return;
    }

    setImportLoading(true);
    setError("");
    setImportMessage("");
    try {
      const payload = new FormData();
      payload.append("file", existingFile);
      const parsed = await requestParseBuilderResume(payload);
      const structured = sanitizeStructuredData(applyRequestedSectionPreset(parsed?.structuredData || {}));
      setFormData(structured);
      setGeneratedStructured(null);
      setGeneratedResume("");
      setBuildId(null);
      setSourceResumeText(cleanText(parsed?.resumeText));
      setImportMessage("Resume extracted and pre-filled. Review and edit any field before generation.");
      setStep(0);
    } catch (err) {
      setError(err.message || "Failed to extract structured resume data.");
    } finally {
      setImportLoading(false);
    }
  };

  const handleGenerate = async (templateId = selectedTemplate) => {
    if (!consumeBuilderGuestTryOrRedirect()) return;

    setLoading(true);
    setError("");
    try {
      const templateMeta = RESUME_TEMPLATES.find((template) => template.id === templateId) || RESUME_TEMPLATES[0];
      const safeData = sanitizeStructuredData(formData);
      const response = await requestGenerateStructuredResume({
        structuredResume: safeData,
        jobDescription: cleanText(jobDescription),
        templateName: templateMeta.name,
        sourceResumeText: cleanText(sourceResumeText),
        userEmail: user?.email || "anonymous",
      });

      setGeneratedResume(cleanText(response?.optimizedResume));
      setGeneratedStructured(
        sanitizeStructuredData(applyRequestedSectionPreset(response?.structuredResume || safeData))
      );
      setBuildId(response?.buildId || null);
      setStep(STEPS.length - 1);

      if (user?.uid) {
        incrementUserCounter(user.uid, "resumesGenerated").catch(() => {
          // Metrics sync should not block generate flow.
        });
      }
    } catch (err) {
      setError(err.message || "Failed to generate resume.");
    } finally {
      setLoading(false);
    }
  };

  const handleTemplateConfirm = (templateId) => {
    if (templateId && templateId !== selectedTemplate) {
      setSelectedTemplate(templateId);
    }
    handleGenerate(templateId || selectedTemplate);
  };

  const handleDownloadPdf = async () => {
    if (!atsTextExtractable) {
      setError("Please add resume content first. ATS extractable text is currently too low.");
      return;
    }
    setIsExportingPdf(true);
    setError("");
    try {
      exportStructuredResumeAsPdf(previewData, pdfFileName);
      if (buildId) {
        await markBuildDownload(buildId, user?.email || "anonymous");
      }
    } catch (err) {
      setError(err.message || "Could not generate ATS-safe PDF. Please try again.");
    } finally {
      setIsExportingPdf(false);
    }
  };

  const sectionRenderer = () => {
    if (step === 0) {
      return <ContactStep data={formData} onChange={(next) => setFormData(sanitizeStructuredData(next))} />;
    }
    if (step === 1) {
      return <SummaryStep summary={formData.summary} onChange={(value) => setFormData(sanitizeStructuredData({ ...formData, summary: value }))} />;
    }
    if (step === 2) {
      return <SkillsStep skills={formData.skills} onChange={(skills) => setFormData(sanitizeStructuredData({ ...formData, skills }))} />;
    }
    if (step === 3) {
      return <ExperienceStep experience={formData.experience} onChange={(experience) => setFormData(sanitizeStructuredData({ ...formData, experience }))} />;
    }
    if (step === 4) {
      return <EducationStep education={formData.education} onChange={(education) => setFormData(sanitizeStructuredData({ ...formData, education }))} />;
    }
    if (step === 5) {
      return <ProjectsStep projects={formData.projects} onChange={(projects) => setFormData(sanitizeStructuredData({ ...formData, projects }))} />;
    }
    if (step === 6) {
      return <CertificationsStep certifications={formData.certifications} onChange={(certifications) => setFormData(sanitizeStructuredData({ ...formData, certifications }))} />;
    }

    return (
      <div>
        <div className="form-group">
          <label className="form-label">choose_template</label>
          <TemplateGallery
            templates={RESUME_TEMPLATES}
            selectedTemplate={selectedTemplate}
            onSelect={setSelectedTemplate}
            onConfirm={handleTemplateConfirm}
            loading={loading}
          />
        </div>
        <div className="form-group">
          <label className="form-label">job_description_for_optimization (optional)</label>
          <textarea
            className="form-textarea"
            rows={4}
            value={jobDescription}
            onChange={(event) => setJobDescription(event.target.value)}
            placeholder="Paste target job description..."
          />
        </div>
        <div className="form-group">
          <label className="form-label">custom_pdf_name</label>
          <input
            className="form-input"
            value={pdfFileName}
            onChange={(event) => setPdfFileName(event.target.value)}
            placeholder="resume_ats_optimized"
          />
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 10 }}>
          <button className="btn-primary" onClick={() => handleGenerate(selectedTemplate)} disabled={loading}>
            {loading ? "generating..." : "generate_resume()"}
          </button>
          <button className="btn-secondary" onClick={handleDownloadPdf} disabled={isExportingPdf}>
            {isExportingPdf ? "exporting..." : "download_pdf()"}
          </button>
        </div>
        <div style={{ marginTop: 8, fontFamily: "var(--font-mono)", fontSize: 11, color: atsTextExtractable ? "#166534" : "#991b1b" }}>
          ATS text extractable: {atsTextExtractable ? "Yes" : "No"}
        </div>
        {generatedResume ? (
          <div style={{ marginTop: 12 }}>
            <label className="form-label">generated_output_preview</label>
            <pre
              style={{
                background: "#f5f5f5",
                border: "1px solid #d1d5db",
                borderRadius: 8,
                padding: 12,
                maxHeight: 280,
                overflow: "auto",
                color: "#1a1a1a",
                fontFamily: "var(--font-mono)",
                fontSize: 11,
                whiteSpace: "pre-wrap",
              }}
            >
              {generatedResume}
            </pre>
          </div>
        ) : null}
      </div>
    );
  };

  return (
    <div>
      <Navbar navigate={navigate} user={user} onLogout={onLogout} />

      <div style={{ maxWidth: 1160, margin: "0 auto", padding: "3.5rem 2rem" }}>
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--g)", marginBottom: 6 }}>
            # resume_builder()
          </div>
          <h1 style={{ fontSize: "clamp(1.6rem, 3vw, 2.2rem)", fontWeight: 700 }}>
            Build or improve your resume with structured data.
          </h1>
        </div>

        <div className="card" style={{ marginBottom: 14 }}>
          <div className="card-head">import_existing_resume()</div>
          <div style={{ padding: 14 }}>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <input
                className="form-input"
                type="file"
                accept={RESUME_FILE_ACCEPT}
                onChange={(event) => {
                  setExistingFile(event.target.files?.[0] || null);
                  setImportMessage("");
                }}
                style={{ maxWidth: 420 }}
              />
              <button className="btn-primary" onClick={handleImportExisting} disabled={importLoading}>
                {importLoading ? "extracting..." : "extract_and_prefill()"}
              </button>
            </div>
            {existingFile ? (
              <div style={{ marginTop: 8, color: "var(--muted)", fontFamily: "var(--font-mono)", fontSize: 11 }}>
                selected: {existingFile.name}
              </div>
            ) : null}
            {importMessage ? (
              <div style={{ marginTop: 10, border: "1px solid rgba(22, 163, 74, 0.4)", background: "rgba(22, 163, 74, 0.08)", borderRadius: 8, padding: "9px 12px", color: "#166534", fontSize: 12 }}>
                {importMessage}
              </div>
            ) : null}
          </div>
        </div>

        {!user ? (
          <div style={{ background: "rgba(14, 165, 233, 0.08)", border: "1px solid rgba(14, 165, 233, 0.3)", borderRadius: 8, padding: "10px 14px", fontFamily: "var(--font-mono)", fontSize: 12, color: "#075985", marginBottom: 12 }}>
            guest_limit: builder tries left = {guestBuilderUsed ? 0 : 1}
          </div>
        ) : null}

        <div style={{ marginBottom: 16 }}>
          <div className="progress-wrap">
            <div className="progress-fill" style={{ width: `${progress}%` }} />
          </div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--muted)", marginTop: 6 }}>
            step_{step + 1} / {STEPS.length} - {STEPS[step]}
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 20 }}>
          <div className="card">
            <div className="card-head">{STEPS[step].toLowerCase()}.edit()</div>
            <div style={{ padding: 14 }}>
              {sectionRenderer()}

              {error ? (
                <div style={{ marginTop: 12, background: "rgba(220, 38, 38, 0.08)", border: "1px solid rgba(220, 38, 38, 0.25)", borderRadius: 8, padding: "10px 12px", color: "#991b1b", fontSize: 12 }}>
                  {error}
                </div>
              ) : null}

              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 16, paddingTop: 12, borderTop: "1px solid var(--border)" }}>
                <button className="btn-ghost" onClick={() => setStep((value) => Math.max(0, value - 1))} disabled={step === 0} style={{ opacity: step === 0 ? 0.5 : 1 }}>
                  prev()
                </button>
                <button className="btn-primary" onClick={() => setStep((value) => Math.min(STEPS.length - 1, value + 1))} disabled={step === STEPS.length - 1} style={{ opacity: step === STEPS.length - 1 ? 0.6 : 1 }}>
                  next()
                </button>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-head">live_preview</div>
            <div style={{ padding: 14 }}>
              <div ref={previewRef}>
                <LivePreview structuredData={previewData} selectedTemplate={selectedTemplate} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

