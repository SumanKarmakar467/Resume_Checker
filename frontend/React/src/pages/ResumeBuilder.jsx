import { useMemo, useRef, useState } from "react";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import Navbar from "../components/Navbar";
import TemplateGallery from "../components/TemplateGallery";
import { incrementUserCounter } from "../services/firestoreUsers";
import { requestResumeApi } from "../api/resumeApi";
import {
  MESSAGES,
  RESUME_FILE_ACCEPT,
} from "../constants/resumeCheckerConstants";
import {
  isSupportedResumeFileType,
  isWithinResumeSizeLimit,
} from "../utils/resumeFileValidation";

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
    portfolio: "",
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
    name: "Classic Professional",
    description: "Single column with blue accent section headings.",
    useCase: "General professional applications.",
    atsScore: 96,
    photoIncluded: false,
    primary: "#0f766e",
    background: "#ffffff",
    text: "#111827",
    sectionBg: "#f8fafc",
    sideBg: "#f0fdfa",
    border: "#99f6e4",
  },
  {
    id: "modern_split",
    name: "Modern Sidebar",
    description: "Two-column resume with dark sidebar for contact and skills.",
    useCase: "Product, design, and full-stack roles.",
    atsScore: 94,
    photoIncluded: false,
    primary: "#1d4ed8",
    background: "#ffffff",
    text: "#0f172a",
    sectionBg: "#eff6ff",
    sideBg: "#eff6ff",
    border: "#bfdbfe",
  },
  {
    id: "executive",
    name: "With Photo - Executive",
    description: "Executive-style layout with strong header and photo area.",
    useCase: "Leadership and senior-level profiles.",
    atsScore: 92,
    photoIncluded: true,
    primary: "#7c2d12",
    background: "#fffdf7",
    text: "#1f2937",
    sectionBg: "#fffbeb",
    sideBg: "#fff7ed",
    border: "#fdba74",
  },
  {
    id: "minimal_mono",
    name: "Minimal Clean",
    description: "Thin dividers, maximum whitespace, no color styling.",
    useCase: "Clean ATS-friendly applications.",
    atsScore: 97,
    photoIncluded: false,
    primary: "#1f2937",
    background: "#ffffff",
    text: "#111827",
    sectionBg: "#f3f4f6",
    sideBg: "#f9fafb",
    border: "#d1d5db",
  },
  {
    id: "impact_edge",
    name: "Creative Accent",
    description: "Single column with colorful left-border accents.",
    useCase: "Marketing, content, and creative roles.",
    atsScore: 91,
    photoIncluded: false,
    primary: "#be123c",
    background: "#fffdfd",
    text: "#1f2937",
    sectionBg: "#fff1f2",
    sideBg: "#ffe4e6",
    border: "#fda4af",
  },
  {
    id: "tech_blueprint",
    name: "Tech / Developer",
    description: "Monospace, terminal-inspired visual language for developers.",
    useCase: "Software engineering and DevOps roles.",
    atsScore: 95,
    photoIncluded: false,
    primary: "#0f766e",
    background: "#f8fafc",
    text: "#0f172a",
    sectionBg: "#ecfeff",
    sideBg: "#cffafe",
    border: "#67e8f9",
  },
];

const ONE_PAGE_LIMITS = {
  summary: 320,
  headline: 90,
  experienceItems: 3,
  bulletsPerExperience: 3,
  bulletChars: 130,
  educationItems: 2,
  projects: 2,
  projectDescChars: 155,
  skills: 20,
};

const SECTION_COMPARE_RULES = [
  {
    id: "contact",
    label: "Contact Info",
    tip: "Add email, phone, and profile links in the header.",
    test: (text) =>
      /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i.test(text) &&
      (/(?:\+?\d{1,3}[\s-]?)?(?:\(?\d{2,4}\)?[\s-]?)?\d{3,4}[\s-]?\d{3,4}/.test(text) ||
        /(linkedin|github)/i.test(text)),
  },
  {
    id: "summary",
    label: "Summary / Objective",
    tip: "Keep a short summary aligned to your target role.",
    test: (text) => /\b(summary|professional summary|objective|profile|about)\b/i.test(text),
  },
  {
    id: "experience",
    label: "Experience",
    tip: "Include role, company, dates, and impact bullets.",
    test: (text) => /\b(experience|work experience|employment|professional experience)\b/i.test(text),
  },
  {
    id: "education",
    label: "Education",
    tip: "Add degree, institute, and passing year.",
    test: (text) => /\b(education|academic)\b/i.test(text),
  },
  {
    id: "skills",
    label: "Skills",
    tip: "Add a dedicated skills section with role keywords.",
    test: (text) => /\b(skills|technical skills|core skills|tech stack)\b/i.test(text),
  },
  {
    id: "projects",
    label: "Projects",
    tip: "Show 1-3 relevant projects with measurable outcomes.",
    test: (text) => /\b(projects|project experience|key projects)\b/i.test(text),
  },
  {
    id: "certifications",
    label: "Certifications",
    tip: "Include certifications that support the role.",
    test: (text) => /\b(certification|certifications|certificate|licenses?)\b/i.test(text),
  },
  {
    id: "achievements",
    label: "Achievements / Awards",
    tip: "Add awards or achievements to strengthen credibility.",
    test: (text) => /\b(achievement|achievements|award|awards|accomplishments?)\b/i.test(text),
  },
  {
    id: "internships",
    label: "Internships",
    tip: "List internships when they are relevant to target jobs.",
    test: (text) => /\b(internship|internships)\b/i.test(text),
  },
  {
    id: "languages",
    label: "Languages",
    tip: "Mention spoken or professional languages if useful.",
    test: (text) => /\b(languages?)\b/i.test(text),
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

function shortenText(value, maxLength) {
  const normalized = String(value || "").replace(/[ ]{2,}/g, " ").trim();
  if (normalized.length <= maxLength) return normalized;
  return `${normalized.slice(0, Math.max(0, maxLength - 1)).trim()}...`;
}

function parseSkillTokens(skills) {
  return [skills.technical, skills.tools, skills.languages]
    .filter(Boolean)
    .join(",")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function hasInternshipEntries(experience = []) {
  return experience.some((item) =>
    /intern(ship)?/i.test(
      [item.role, item.company, ...(item.bullets || [])]
        .filter(Boolean)
        .join(" ")
    )
  );
}

function compareResumeSections(originalText, generatedText) {
  const source = String(originalText || "").trim();
  if (!source) return null;

  const candidate = String(generatedText || "");

  const originalPresence = SECTION_COMPARE_RULES.map((rule) => ({
    id: rule.id,
    label: rule.label,
    tip: rule.tip,
    present: rule.test(source),
  }));
  const generatedPresence = SECTION_COMPARE_RULES.map((rule) => ({
    id: rule.id,
    label: rule.label,
    tip: rule.tip,
    present: rule.test(candidate),
  }));

  const generatedMap = new Map(generatedPresence.map((item) => [item.id, item]));
  const originalSections = originalPresence.filter((item) => item.present);
  const retainedSections = originalSections.filter((item) => generatedMap.get(item.id)?.present);
  const missingSections = originalSections.filter((item) => !generatedMap.get(item.id)?.present);
  const extraSections = generatedPresence.filter(
    (item) => item.present && !originalSections.some((original) => original.id === item.id)
  );

  const coverage = originalSections.length
    ? Math.round((retainedSections.length * 100) / originalSections.length)
    : 100;

  return {
    originalSections,
    retainedSections,
    missingSections,
    extraSections,
    coverage,
  };
}

function compactResumeForOnePage(data) {
  let trimmed = false;
  const markTrim = (condition) => {
    if (condition) trimmed = true;
  };

  const source = data || EMPTY;
  const skillTokens = parseSkillTokens(source.skills);
  const trimmedSkills = skillTokens.slice(0, ONE_PAGE_LIMITS.skills);
  markTrim(trimmedSkills.length < skillTokens.length);

  const personal = {
    ...source.personal,
    headline: shortenText(source.personal.headline, ONE_PAGE_LIMITS.headline),
    summary: shortenText(source.personal.summary, ONE_PAGE_LIMITS.summary),
  };
  markTrim(personal.headline !== (source.personal.headline || "").trim());
  markTrim(personal.summary !== (source.personal.summary || "").trim());

  const experienceInput = source.experience || [];
  const experience = experienceInput
    .filter((item) => item.role || item.company || item.duration || item.bullets?.some(Boolean))
    .slice(0, ONE_PAGE_LIMITS.experienceItems)
    .map((item) => {
      const bulletsInput = (item.bullets || []).filter(Boolean);
      const bullets = bulletsInput
        .slice(0, ONE_PAGE_LIMITS.bulletsPerExperience)
        .map((bullet) => shortenText(bullet, ONE_PAGE_LIMITS.bulletChars));
      markTrim(bullets.length < bulletsInput.length);
      return {
        ...item,
        role: shortenText(item.role, 56),
        company: shortenText(item.company, 56),
        duration: shortenText(item.duration, 30),
        bullets,
      };
    });
  markTrim(experience.length < experienceInput.filter((item) => item.role || item.company || item.duration || item.bullets?.some(Boolean)).length);

  const educationInput = source.education || [];
  const education = educationInput
    .filter((item) => item.institute || item.degree || item.year)
    .slice(0, ONE_PAGE_LIMITS.educationItems)
    .map((item) => ({
      ...item,
      institute: shortenText(item.institute, 70),
      degree: shortenText(item.degree, 56),
      year: shortenText(item.year, 30),
    }));
  markTrim(education.length < educationInput.filter((item) => item.institute || item.degree || item.year).length);

  const projectsInput = source.projects || [];
  const projects = projectsInput
    .filter((item) => item.name || item.link || item.desc)
    .slice(0, ONE_PAGE_LIMITS.projects)
    .map((item) => ({
      ...item,
      name: shortenText(item.name, 48),
      link: shortenText(item.link, 58),
      desc: shortenText(item.desc, ONE_PAGE_LIMITS.projectDescChars),
    }));
  markTrim(projects.length < projectsInput.filter((item) => item.name || item.link || item.desc).length);

  return {
    trimmed,
    data: {
      personal,
      experience: experience.length ? experience : EMPTY.experience,
      education: education.length ? education : EMPTY.education,
      skills: {
        technical: trimmedSkills.slice(0, 8).join(", "),
        tools: trimmedSkills.slice(8, 14).join(", "),
        languages: trimmedSkills.slice(14).join(", "),
      },
      projects: projects.length ? projects : EMPTY.projects,
    },
  };
}

function parseUploadedResumeText(rawText) {
  const text = normalizeText(rawText);
  const lines = text.split("\n").map((line) => line.trim()).filter(Boolean);

  const headingMatchers = {
    summary: /^(summary|professional summary|objective|profile|about)\b/i,
    experience: /^(experience|work experience|professional experience|internship|internships)\b/i,
    education: /^(education|academic)\b/i,
    skills: /^(skills|technical skills|core skills|tech stack)\b/i,
    projects: /^(projects|project experience|key projects)\b/i,
  };

  const sections = {
    header: [],
    summary: [],
    experience: [],
    education: [],
    skills: [],
    projects: [],
  };

  let currentSection = "header";
  lines.forEach((line) => {
    const normalized = line.replace(/\s+/g, " ").trim();
    const matchKey = Object.entries(headingMatchers).find(([, regex]) => regex.test(normalized))?.[0];
    if (matchKey) {
      currentSection = matchKey;
      const inline = normalized.split(":").slice(1).join(":").trim();
      if (inline.length > 2) {
        sections[currentSection].push(inline);
      }
      return;
    }
    sections[currentSection].push(normalized);
  });

  const email = pickMatch(text, /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
  const phone = pickMatch(
    text,
    /(?:\+?\d{1,3}[\s-]?)?(?:\(?\d{2,4}\)?[\s-]?)?\d{3,4}[\s-]?\d{3,4}/
  );
  const linkedin = pickMatch(text, /(?:https?:\/\/)?(?:www\.)?linkedin\.com\/[^\s]+/i);
  const github = pickMatch(text, /(?:https?:\/\/)?(?:www\.)?github\.com\/[^\s]+/i);

  const allUrls = Array.from(
    new Set(
      (text.match(/(?:https?:\/\/|www\.)[^\s)]+/gi) || []).map((url) =>
        url.replace(/[),.;]+$/g, "")
      )
    )
  );
  const portfolio =
    allUrls.find(
      (url) =>
        !/linkedin\.com/i.test(url) &&
        !/github\.com/i.test(url)
    ) || "";

  const maybeName =
    lines.find(
      (line) =>
        /^[A-Za-z][A-Za-z .'-]{2,45}$/.test(line) &&
        !/@/.test(line) &&
        !/(summary|objective|education|skills|projects|experience|internship)/i.test(line)
    ) || "";

  const maybeHeadline =
    sections.header.find(
      (line) =>
        line.length >= 8 &&
        line.length <= 80 &&
        !/@/.test(line) &&
        !/(linkedin|github|www\.|http)/i.test(line)
    ) || "";

  const maybeSummary = (sections.summary.length
    ? sections.summary.join(" ")
    : sections.header.find((line) => line.length > 70 && line.length < 320) || "").trim();

  const expLines = sections.experience.filter((line) => !headingMatchers.experience.test(line));
  const expHeader = expLines.find((line) => /@|\||\s-\s/.test(line)) || expLines[0] || "";
  let role = "";
  let company = "";
  let duration = pickMatch(
    [expHeader, ...expLines].join(" "),
    /((19|20)\d{2}\s*(?:-|to)\s*(?:present|(19|20)\d{2}))|(?:\b(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+(19|20)\d{2}\s*(?:-|to)\s*(?:present|(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+(19|20)\d{2}))/i
  );
  if (expHeader.includes("@")) {
    const [left, right] = expHeader.split("@").map((part) => part.trim());
    role = left;
    company = right?.split("|")?.[0]?.trim() || "";
  } else {
    const parts = expHeader.split("|").map((part) => part.trim()).filter(Boolean);
    if (parts.length >= 2) {
      role = parts[0];
      company = parts[1];
      duration = duration || parts[2] || "";
    } else {
      role = expHeader;
    }
  }
  if (!role && /intern(ship)?/i.test(expLines.join(" "))) {
    role = "Intern";
  }
  const bullets = expLines
    .filter((line) => /^[-*•]/.test(line) || /^(built|led|developed|implemented|improved|created|designed|optimized|managed)/i.test(line))
    .map((line) => line.replace(/^[-*•]\s*/, "").trim())
    .filter(Boolean)
    .slice(0, 6);

  const eduLines = sections.education.filter((line) => !headingMatchers.education.test(line));
  const eduLine = eduLines[0] || "";
  const degree = pickMatch(
    eduLine,
    /(b\.?tech|bachelor|m\.?tech|master|b\.?e|m\.?e|bsc|msc|bca|mca|phd|diploma|h\.?s|high school)[^,|]*/i
  );
  const year = pickMatch(eduLine, /(19|20)\d{2}(?:\s*-\s*(?:19|20)\d{2}|(?:\s*-\s*present))?/i);
  const institute = eduLine
    .replace(degree, "")
    .replace(year, "")
    .replace(/[|,-]/g, " ")
    .replace(/[ ]{2,}/g, " ")
    .trim();

  const skillsSource = sections.skills.length ? sections.skills.join(",") : text;
  const skillTokens = skillsSource
    .split(/,|\n|\||\/|•/)
    .map((item) => item.trim())
    .filter((item) => item && item.length <= 32 && /[A-Za-z]/.test(item))
    .filter((item, index, arr) => arr.findIndex((entry) => entry.toLowerCase() === item.toLowerCase()) === index)
    .slice(0, 24);

  const projectsLines = sections.projects.filter((line) => !headingMatchers.projects.test(line));
  const projectName = projectsLines.find((line) => !/(https?:\/\/|www\.)/i.test(line)) || "";
  const projectLink =
    projectsLines.find((line) => /(https?:\/\/|www\.)/i.test(line)) ||
    allUrls.find((url) => !/linkedin\.com|github\.com/i.test(url)) ||
    "";
  const projectDesc = projectsLines.slice(1, 4).join(" ");

  return {
    personal: {
      name: maybeName,
      email,
      phone,
      location: "",
      linkedin,
      portfolio,
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
        name: projectName,
        link: projectLink,
        desc: projectDesc,
      },
    ],
    rawText: text,
    sectionCount: Object.values(sections).filter((value) => value.length).length,
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
  const margin = 20;
  const maxWidth = pageWidth - margin * 2;
  const maxHeight = pageHeight - margin * 2;
  const fitRatio = Math.min(maxWidth / canvas.width, maxHeight / canvas.height);
  const renderWidth = canvas.width * fitRatio;
  const renderHeight = canvas.height * fitRatio;
  const x = (pageWidth - renderWidth) / 2;
  const y = (pageHeight - renderHeight) / 2;

  pdf.addImage(imgData, "PNG", x, y, renderWidth, renderHeight, undefined, "FAST");

  pdf.save(`${sanitizePdfName(fileName)}.pdf`);
}

/* STEP FORMS */
function PersonalForm({ data, onChange }) {
  const fields = [
    ["name", "full_name", "text", "Suman Karmakar"],
    ["email", "email_address", "email", "suman@email.com"],
    ["phone", "phone_number", "text", "+91 98xxx xxxxx"],
    ["location", "city, country", "text", "Kolkata, India"],
    ["linkedin", "linkedin_url", "text", "linkedin.com/in/yourprofile"],
    ["portfolio", "portfolio_url", "text", "yourportfolio.com"],
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
        <label className="form-label">about_section</label>
        <textarea
          className="form-textarea"
          rows={4}
          placeholder="Write a concise about section with achievements and target role."
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
                      field === "duration" ? "Jun 2023 - Present" : ""
                    }
                    value={exp[field]}
                    onChange={(e) => update(i, field, e.target.value)}
                  />
                </div>
              )
            )}
          </div>
          <label className="form-label">impact_bullets (experience / internship)</label>
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
        ["technical", "technical_skills", "JavaScript, Node.js + Express, React, REST API, MongoDB"],
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
        tip: separate skills with commas. ATS reads comma-separated lists best.
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
  onTemplateConfirm,
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
  onePageTrimmed,
  sectionComparison,
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
        <TemplateGallery
          templates={RESUME_TEMPLATES}
          selectedTemplate={selectedTemplate}
          onSelect={onTemplateChange}
          onConfirm={onTemplateConfirm}
          loading={loading}
        />
        <div
          style={{
            marginTop: 8,
            background: "rgba(0,255,136,0.06)",
            border: "1px solid rgba(0,255,136,0.18)",
            borderRadius: 8,
            padding: "8px 10px",
            fontFamily: "var(--font-mono)",
            fontSize: 10.5,
            color: "var(--g)",
          }}
        >
          one_page_mode: enabled (PDF export is always 1 page)
        </div>
        {onePageTrimmed ? (
          <div
            style={{
              marginTop: 8,
              background: "rgba(245,158,11,0.08)",
              border: "1px solid rgba(245,158,11,0.25)",
              borderRadius: 8,
              padding: "8px 10px",
              fontFamily: "var(--font-mono)",
              fontSize: 10.5,
              color: "var(--warning-text)",
            }}
          >
            note: extra content is auto-trimmed in preview/export to keep one page.
          </div>
        ) : null}
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

      {sectionComparison ? (
        <div className="form-group">
          <label className="form-label">section_comparison_with_original_resume</label>
          <div
            style={{
              border: "1px solid var(--border)",
              borderRadius: 10,
              background: "var(--d3)",
              padding: "10px 12px",
            }}
          >
            <div
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 11,
                color: "var(--text-primary)",
                marginBottom: 8,
              }}
            >
              coverage_from_original: {sectionComparison.coverage}% ({sectionComparison.retainedSections.length}/
              {sectionComparison.originalSections.length})
            </div>

            {sectionComparison.missingSections.length ? (
              <div style={{ marginBottom: 8 }}>
                <div
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: 10.5,
                    color: "var(--warning-text)",
                    marginBottom: 6,
                  }}
                >
                  missing_in_generated:
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {sectionComparison.missingSections.map((item) => (
                    <span
                      key={item.id}
                      style={{
                        border: "1px solid rgba(245,158,11,0.35)",
                        background: "rgba(245,158,11,0.12)",
                        color: "var(--warning-text)",
                        borderRadius: 999,
                        padding: "3px 9px",
                        fontSize: 11,
                        fontFamily: "var(--font-mono)",
                      }}
                      title={item.tip}
                    >
                      {item.label}
                    </span>
                  ))}
                </div>
              </div>
            ) : (
              <div
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 10.5,
                  color: "var(--g)",
                  marginBottom: 8,
                }}
              >
                missing_in_generated: none
              </div>
            )}

            {sectionComparison.extraSections.length ? (
              <div>
                <div
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: 10.5,
                    color: "var(--muted)",
                    marginBottom: 6,
                  }}
                >
                  added_in_generated:
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {sectionComparison.extraSections.map((item) => (
                    <span
                      key={item.id}
                      style={{
                        border: "1px solid rgba(0,255,136,0.28)",
                        background: "rgba(0,255,136,0.1)",
                        color: "var(--g)",
                        borderRadius: 999,
                        padding: "3px 9px",
                        fontSize: 11,
                        fontFamily: "var(--font-mono)",
                      }}
                    >
                      {item.label}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

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
              padding: "0.8rem",
              marginBottom: "1rem",
              overflow: "hidden",
            }}
          >
            <iframe
              title="generated-template-preview"
              srcDoc={generatedResume}
              style={{
                border: "none",
                width: "100%",
                height: 300,
                borderRadius: 8,
                background: "#fff",
              }}
            />
          </div>
          <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
            <button className="btn-primary" style={{ fontSize: 14 }} onClick={onDownloadPdf} disabled={loading}>
              {loading ? "processing..." : "download_pdf()"}
            </button>
            <button className="btn-secondary" style={{ fontSize: 14 }} onClick={onGenerate} disabled={loading}>
              regenerate_with_selected_template()
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
function LivePreview({ formData, selectedTemplate }) {
  const { personal, experience, education, skills, projects } = formData;
  const template = RESUME_TEMPLATES.find((item) => item.id === selectedTemplate) || RESUME_TEMPLATES[0];
  const allSkills = parseSkillTokens(skills);
  const hasExperienceContent = experience.some((item) => item.role || item.company || item.duration || item.bullets?.some(Boolean));
  const hasInternship = hasInternshipEntries(experience);
  const experienceTitle = hasInternship ? "Internship" : "Experience";
  const hasProjectsContent = !hasInternship && projects.some((item) => item.name || item.link || item.desc);

  const pageShell = {
    background: template.background,
    color: template.text,
    fontSize: 10.6,
    lineHeight: 1.52,
    borderRadius: 8,
    border: `1px solid ${template.border}`,
    overflow: "hidden",
    width: "100%",
    aspectRatio: "210 / 297",
    boxShadow: "0 8px 18px rgba(2, 6, 23, 0.08)",
  };

  const sectionTitle = (label) => (
    <div
      style={{
        fontSize: 10.2,
        fontWeight: 800,
        textTransform: "uppercase",
        letterSpacing: 0.7,
        color: template.primary,
        borderBottom: `1.5px solid ${template.primary}`,
        paddingBottom: 2,
        margin: "10px 0 6px",
      }}
    >
      {label}
    </div>
  );

  if (template.id === "modern_split") {
    return (
      <div style={pageShell}>
        <div style={{ display: "grid", gridTemplateColumns: "0.34fr 0.66fr", height: "100%" }}>
          <div style={{ background: template.sideBg, padding: "16px 12px" }}>
            {personal.photoUrl ? (
              <img
                src={personal.photoUrl}
                alt="profile"
                style={{ width: 74, height: 74, objectFit: "cover", borderRadius: "50%", marginBottom: 10 }}
              />
            ) : null}
            <div style={{ fontSize: 9.5, color: template.primary, marginBottom: 4, fontWeight: 800 }}>CONTACT</div>
            <div style={{ fontSize: 9.2 }}>{personal.email}</div>
            <div style={{ fontSize: 9.2 }}>{personal.phone}</div>
            <div style={{ fontSize: 9.2 }}>{personal.location}</div>
            <div style={{ fontSize: 9.2 }}>{personal.linkedin}</div>
            <div style={{ fontSize: 9.2 }}>{personal.portfolio}</div>
            <div style={{ fontSize: 9.2 }}>{personal.github}</div>

            {sectionTitle("Skills")}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
              {allSkills.map((item) => (
                <span
                  key={item}
                  style={{
                    fontSize: 8.8,
                    background: template.sectionBg,
                    color: template.primary,
                    borderRadius: 12,
                    padding: "2px 7px",
                    border: `1px solid ${template.primary}4D`,
                  }}
                >
                  {item}
                </span>
              ))}
            </div>
          </div>

          <div style={{ padding: "16px 14px" }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: template.primary, lineHeight: 1.08 }}>
              {personal.name || "Your Name"}
            </div>
            {personal.headline ? (
              <div style={{ fontSize: 10.8, marginTop: 3, color: template.text, fontWeight: 700 }}>{personal.headline}</div>
            ) : null}
            {personal.summary ? (
              <>
                {sectionTitle("About")}
                <div style={{ marginTop: 4, fontSize: 9.6, color: "#334155" }}>{personal.summary}</div>
              </>
            ) : null}

            {hasExperienceContent ? sectionTitle(experienceTitle) : null}
            {hasExperienceContent
              ? experience.map((item, i) => (
                  <div key={`exp-${i}`} style={{ marginBottom: 7 }}>
                    <div style={{ fontWeight: 700, fontSize: 10.2 }}>{item.role || "Role"}</div>
                    <div style={{ fontSize: 9.3, color: "#475569" }}>
                      {[item.company, item.duration].filter(Boolean).join(" | ")}
                    </div>
                    {item.bullets.filter(Boolean).map((bullet, idx) => (
                      <div key={`b-${idx}`} style={{ fontSize: 9.2, color: "#334155", marginTop: 2.5 }}>
                        - {bullet}
                      </div>
                    ))}
                  </div>
                ))
              : null}

            {sectionTitle("Education")}
            {education.map((item, i) => (
              <div key={`edu-${i}`} style={{ fontSize: 9.4, marginBottom: 4 }}>
                <strong>{item.institute}</strong> {[item.degree, item.year].filter(Boolean).join(" | ")}
              </div>
            ))}

            {hasProjectsContent ? sectionTitle("Projects") : null}
            {hasProjectsContent
              ? projects.map((item, i) => (
                  <div key={`project-${i}`} style={{ marginBottom: 5 }}>
                    <div style={{ fontWeight: 700, fontSize: 9.4 }}>
                      {[item.name, item.link].filter(Boolean).join(" | ")}
                    </div>
                    <div style={{ fontSize: 9.1, color: "#374151" }}>{item.desc}</div>
                  </div>
                ))
              : null}
          </div>
        </div>
      </div>
    );
  }

  const compactHeader = template.id === "minimal_mono" || template.id === "tech_blueprint";

  return (
    <div style={{ ...pageShell, padding: compactHeader ? "0.95rem 1rem" : "1.15rem 1.1rem" }}>
      {template.id === "impact_edge" ? (
        <div
          style={{
            height: 6,
            borderRadius: 999,
            background: `linear-gradient(90deg, ${template.primary}, #fb7185)`,
            marginBottom: 8,
          }}
        />
      ) : null}

      <div style={{ display: "flex", alignItems: "center", gap: 11, borderBottom: `2px solid ${template.primary}`, paddingBottom: 8 }}>
        {personal.photoUrl ? (
          <img
            src={personal.photoUrl}
            alt="profile"
            style={{ width: compactHeader ? 58 : 64, height: compactHeader ? 58 : 64, borderRadius: "50%", objectFit: "cover", border: `2px solid ${template.primary}` }}
          />
        ) : null}
        <div>
          <div style={{ fontSize: compactHeader ? 20 : 22, fontWeight: 800, color: template.primary, lineHeight: 1.1 }}>
            {personal.name || "Your Name"}
          </div>
          {personal.headline ? <div style={{ fontSize: 10.6, fontWeight: 700 }}>{personal.headline}</div> : null}
          <div style={{ fontSize: 9.1, marginTop: 3, color: "#4b5563" }}>
            {[personal.email, personal.phone, personal.location, personal.linkedin, personal.portfolio, personal.github]
              .filter(Boolean)
              .join(" | ")}
          </div>
        </div>
      </div>

      {personal.summary ? (
        <>
          {sectionTitle("About")}
          <div style={{ marginTop: 8, background: template.sectionBg, borderRadius: 7, padding: "8px 10px", color: "#374151", fontSize: 9.5 }}>
            {personal.summary}
          </div>
        </>
      ) : null}

      {hasExperienceContent ? sectionTitle(experienceTitle) : null}
      {hasExperienceContent
        ? experience.map((item, i) => (
            <div key={`exp-${i}`} style={{ marginBottom: 7 }}>
              <div style={{ fontWeight: 700, fontSize: 10.1 }}>{item.role || "Role"}</div>
              <div style={{ fontSize: 9.1, color: "#4b5563" }}>
                {[item.company, item.duration].filter(Boolean).join(" | ")}
              </div>
              {item.bullets.filter(Boolean).map((bullet, idx) => (
                <div key={`bullet-${idx}`} style={{ fontSize: 9.2, color: "#374151", marginTop: 2.5 }}>
                  - {bullet}
                </div>
              ))}
            </div>
          ))
        : null}

      {sectionTitle("Education")}
      {education.map((item, i) => (
        <div key={`edu-${i}`} style={{ marginBottom: 4, fontSize: 9.2 }}>
          <strong>{item.institute}</strong> {[item.degree, item.year].filter(Boolean).join(" | ")}
        </div>
      ))}

      {allSkills.length ? sectionTitle("Skills") : null}
      {allSkills.length ? (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
          {allSkills.map((item) => (
            <span
              key={item}
              style={{
                fontSize: 8.8,
                background: template.sectionBg,
                border: `1px solid ${template.primary}55`,
                color: template.primary,
                padding: "1.5px 7px",
                borderRadius: 12,
              }}
            >
              {item}
            </span>
          ))}
        </div>
      ) : null}

      {hasProjectsContent ? sectionTitle("Projects") : null}
      {hasProjectsContent
        ? projects.map((item, i) => (
            <div key={`project-${i}`} style={{ marginBottom: 5.5 }}>
              <div style={{ fontWeight: 700, fontSize: 9.3 }}>{[item.name, item.link].filter(Boolean).join(" | ")}</div>
              <div style={{ fontSize: 8.95, color: "#374151" }}>{item.desc}</div>
            </div>
          ))
        : null}
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
  onLogout,
}) {
  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState(EMPTY);
  const [loading, setLoading] = useState(false);
  const [importLoading, setImportLoading] = useState(false);
  const [error, setError] = useState("");
  const [generatedResume, setGeneratedResume] = useState("");
  const [sourceResumeText, setSourceResumeText] = useState("");
  const [existingFile, setExistingFile] = useState(null);
  const [importMessage, setImportMessage] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [pdfFileName, setPdfFileName] = useState("resume_ats_optimized");
  const [selectedTemplate, setSelectedTemplate] = useState("ats_clean");
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [templateMessage, setTemplateMessage] = useState("");
  const previewRef = useRef(null);
  const onePagePreview = useMemo(() => compactResumeForOnePage(formData), [formData]);

  const buildResumeText = (d) => {
    const lines = [];
    const p = d.personal;
    const hasInternship = hasInternshipEntries(d.experience);
    const showProjects = !hasInternship && d.projects.some((item) => item.name || item.link || item.desc);
    lines.push(p.name || "Your Name");
    if (p.headline) lines.push(p.headline);
    lines.push([p.email, p.phone, p.location, p.linkedin, p.portfolio, p.github].filter(Boolean).join(" | "));
    lines.push("");
    if (p.summary) {
      lines.push("ABOUT");
      lines.push("-----");
      lines.push(p.summary);
      lines.push("");
    }

    if (d.experience.some((e) => e.role || e.company || e.bullets?.some(Boolean))) {
      lines.push(hasInternship ? "INTERNSHIP" : "EXPERIENCE");
      lines.push(hasInternship ? "----------" : "----------");
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

    if (showProjects) {
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

  const comparisonGeneratedText =
    generatedResume.trim().replace(/<[^>]+>/g, " ") || buildResumeText(onePagePreview.data);
  const sectionComparison = useMemo(
    () => compareResumeSections(sourceResumeText, comparisonGeneratedText),
    [sourceResumeText, comparisonGeneratedText]
  );

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

  const generateAtsResume = async (resumeText, templateId = selectedTemplate) => {
    const templateMeta =
      RESUME_TEMPLATES.find((template) => template.id === templateId) || RESUME_TEMPLATES[0];
    const data = await requestResumeApi("/generate-ats", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        resumeText,
        jobDescription: jobDescription.trim(),
        templateName: templateMeta.name,
      }),
    });
    if (user?.uid) {
      incrementUserCounter(user.uid, "resumesGenerated").catch(() => {
        // Metrics sync should not block generate flow.
      });
    }
    return data.optimizedResume || data.generatedResume || data.resume || resumeText;
  };

  const readExistingResumeText = async (file) => {
    const isPlainText = file.type === "text/plain" || String(file.name || "").toLowerCase().endsWith(".txt");
    if (isPlainText) {
      return normalizeText(await file.text());
    }

    const formDataPayload = new FormData();
    formDataPayload.append("file", file);
    if (jobDescription.trim()) {
      formDataPayload.append("jobDescription", jobDescription.trim());
    }

    try {
      const analyzeData = await requestResumeApi("/analyze", {
        method: "POST",
        body: formDataPayload,
      });
      if (analyzeData && typeof analyzeData === "object") {
        if (user?.uid) {
          incrementUserCounter(user.uid, "resumesChecked").catch(() => {
            // Metrics sync should not block resume extraction.
          });
        }
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
      const extractedText = await readExistingResumeText(existingFile);
      const parsed = parseUploadedResumeText(extractedText);
      const mergedData = mergeIntoBuilderData(parsed);
      const importedOnePage = compactResumeForOnePage(mergedData);
      setFormData(mergedData);
      setSourceResumeText(extractedText);

      if (!consumeBuilderGuestTryOrRedirect()) {
        return;
      }

      try {
        const optimizedText = await generateAtsResume(buildResumeText(importedOnePage.data), selectedTemplate);
        setGeneratedResume(optimizedText);
      } catch (genErr) {
        setGeneratedResume(buildResumeText(importedOnePage.data));
        setError(`${genErr.message}. Using local optimized draft.`);
      }

      setStep(5);
      setImportMessage("Resume extracted and auto-filled. One-page preview is ready for template selection and download.");
    } catch (err) {
      setError(err.message || "Failed to extract data from uploaded resume.");
    } finally {
      setImportLoading(false);
    }
  };

  const handleGenerate = async (templateId = selectedTemplate) => {
    if (!consumeBuilderGuestTryOrRedirect()) {
      return;
    }
    setLoading(true);
    setError("");
    try {
      const resumeText = buildResumeText(onePagePreview.data);
      const optimized = await generateAtsResume(resumeText, templateId);
      setGeneratedResume(optimized);
    } catch (err) {
      setError(`${err.message} - falling back to local export.`);
      setGeneratedResume(buildResumeText(onePagePreview.data));
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
      setTemplateMessage("One-page resume PDF downloaded successfully.");
    } catch (_err) {
      setError("Could not generate styled PDF. Please try again.");
    } finally {
      setIsExportingPdf(false);
    }
  };

  const progress = Math.round(((step + 1) / STEPS.length) * 100);

  return (
    <div>
      <Navbar navigate={navigate} user={user} onLogout={onLogout} />

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
                accept={RESUME_FILE_ACCEPT}
                onChange={(e) => {
                  setExistingFile(e.target.files?.[0] || null);
                  setImportMessage("");
                  setSourceResumeText("");
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
                  onTemplateConfirm={handleTemplateConfirm}
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
                  onePageTrimmed={onePagePreview.trimmed}
                  sectionComparison={sectionComparison}
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
              <div style={{ padding: "1.25rem", overflowX: "auto" }}>
                <div ref={previewRef} style={{ minWidth: 320 }}>
                  <LivePreview formData={onePagePreview.data} selectedTemplate={selectedTemplate} />
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
              ats_tip: one page only, concise bullets, role-specific keywords, and clean section hierarchy.
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



