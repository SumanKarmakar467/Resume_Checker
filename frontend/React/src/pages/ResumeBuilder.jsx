import { useMemo, useRef, useState } from "react";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
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
  education: [{ degree: "", institution: "", year: "" }],
  certifications: [""],
  projects: [{ name: "", description: "", techStack: "" }],
};

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
        }))
        .filter((item) => item.degree || item.institution || item.year)
    : [];

  const projects = Array.isArray(safe.projects)
    ? safe.projects
        .map((item) => ({
          name: cleanValue(item?.name),
          description: cleanText(item?.description),
          techStack: cleanValue(item?.techStack),
        }))
        .filter((item) => item.name || item.description || item.techStack)
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
    education: education.length ? education : [{ degree: "", institution: "", year: "" }],
    certifications: certifications.length ? certifications : [""],
    projects: projects.length ? projects : [{ name: "", description: "", techStack: "" }],
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

async function exportNodeAsPdf(node, fileName) {
  if (!node) return;

  const canvas = await html2canvas(node, {
    scale: 2,
    useCORS: true,
    backgroundColor: "#f5f5f5",
  });

  const pdf = new jsPDF("p", "pt", "a4");
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 20;
  const printableWidth = pageWidth - margin * 2;
  const printableHeight = pageHeight - margin * 2;
  const scaleRatio = printableWidth / canvas.width;
  const pageSliceHeightPx = Math.max(1, Math.floor(printableHeight / scaleRatio));

  let sourceY = 0;
  let pageIndex = 0;

  while (sourceY < canvas.height) {
    const sliceHeight = Math.min(pageSliceHeightPx, canvas.height - sourceY);
    const sliceCanvas = document.createElement("canvas");
    sliceCanvas.width = canvas.width;
    sliceCanvas.height = sliceHeight;
    const context = sliceCanvas.getContext("2d");
    if (!context) break;

    context.fillStyle = "#f5f5f5";
    context.fillRect(0, 0, sliceCanvas.width, sliceCanvas.height);
    context.drawImage(
      canvas,
      0,
      sourceY,
      canvas.width,
      sliceHeight,
      0,
      0,
      canvas.width,
      sliceHeight
    );

    const pageImage = sliceCanvas.toDataURL("image/png");
    if (pageIndex > 0) pdf.addPage("a4", "p");
    const renderHeight = sliceHeight * scaleRatio;
    pdf.addImage(pageImage, "PNG", margin, margin, printableWidth, renderHeight, undefined, "FAST");

    sourceY += sliceHeight;
    pageIndex += 1;
  }

  pdf.save(`${sanitizePdfName(fileName)}.pdf`);
}

function SectionTitle({ label, color }) {
  return (
    <div
      style={{
        marginTop: 12,
        marginBottom: 6,
        fontSize: 11,
        fontWeight: 800,
        letterSpacing: 0.6,
        textTransform: "uppercase",
        color,
        borderBottom: `1px solid ${color}`,
        paddingBottom: 2,
      }}
    >
      {label}
    </div>
  );
}

function ResumeTemplateBase({ theme, data }) {
  const safe = sanitizeStructuredData(data);

  if (theme.split) {
    return (
      <div
        style={{
          background: theme.paper,
          border: `1px solid ${theme.border}`,
          borderRadius: 8,
          color: "#1a1a1a",
          fontSize: 11,
          lineHeight: 1.6,
          padding: 14,
          minHeight: 860,
        }}
      >
        <div style={{ display: "grid", gridTemplateColumns: "0.33fr 0.67fr", minHeight: 830 }}>
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
            <div style={{ fontSize: 10, marginTop: 8 }}>{safe.email || "email@example.com"}</div>
            <div style={{ fontSize: 10 }}>{safe.phone || "+00 0000 0000"}</div>
            {safe.linkedin ? <div style={{ fontSize: 10, marginTop: 4 }}>{safe.linkedin}</div> : null}
            {safe.github ? <div style={{ fontSize: 10 }}>{safe.github}</div> : null}

            <SectionTitle label="Skills" color="#ffffff" />
            <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
              {safe.skills.length
                ? safe.skills.map((skill) => (
                    <span
                      key={skill}
                      style={{
                        border: "1px solid rgba(255,255,255,0.45)",
                        borderRadius: 999,
                        fontSize: 9,
                        padding: "2px 8px",
                        color: "#ffffff",
                        background: "rgba(255,255,255,0.12)",
                      }}
                    >
                      {skill}
                    </span>
                  ))
                : <span style={{ fontSize: 9, color: "rgba(255,255,255,0.85)" }}>No skills added</span>}
            </div>
          </div>

          <div style={{ padding: "0 2px" }}>
            <SectionTitle label="Professional Summary" color={theme.heading} />
            <div>{safe.summary || "Add a concise summary for your profile."}</div>

            <SectionTitle label="Work Experience" color={theme.heading} />
            {safe.experience.map((item, index) => (
              <div key={`${item.title}-${index}`} style={{ marginBottom: 8 }}>
                <div style={{ fontWeight: 700 }}>{item.title || "Role"}</div>
                <div style={{ color: "#334155", fontSize: 10.5 }}>
                  {[item.company, item.duration].filter(Boolean).join(" | ")}
                </div>
                <div style={{ whiteSpace: "pre-wrap" }}>{item.description || "No description provided."}</div>
              </div>
            ))}

            <SectionTitle label="Education" color={theme.heading} />
            {safe.education.map((item, index) => (
              <div key={`${item.degree}-${index}`} style={{ marginBottom: 5 }}>
                <strong>{item.degree || "Degree"}</strong> {[item.institution, item.year].filter(Boolean).join(" | ")}
              </div>
            ))}

            {safe.projects.some((item) => item.name || item.description || item.techStack)
              ? <SectionTitle label="Projects" color={theme.heading} />
              : null}
            {safe.projects.map((item, index) => (
              <div key={`${item.name}-${index}`} style={{ marginBottom: 6 }}>
                <div style={{ fontWeight: 700 }}>{item.name || "Project"}</div>
                {item.techStack ? <div style={{ fontSize: 10, color: "#475569" }}>Tech: {item.techStack}</div> : null}
                <div>{item.description || "No description provided."}</div>
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
        fontSize: 11,
        lineHeight: 1.6,
        padding: 14,
        minHeight: 860,
      }}
    >
      <div style={{ borderBottom: `2px solid ${theme.accent}`, paddingBottom: 8 }}>
        <div style={{ fontSize: 24, fontWeight: 800, color: theme.heading }}>{safe.name || "Your Name"}</div>
        <div style={{ fontSize: 10.5, color: "#334155", marginTop: 4 }}>
          {[safe.email, safe.phone, safe.linkedin, safe.github].filter(Boolean).join(" | ")}
        </div>
      </div>

      <SectionTitle label="Professional Summary" color={theme.heading} />
      <div>{safe.summary || "Add a concise summary for your profile."}</div>

      <SectionTitle label="Skills" color={theme.heading} />
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {safe.skills.length
          ? safe.skills.map((skill) => (
              <span
                key={skill}
                style={{
                  border: `1px solid ${theme.border}`,
                  borderRadius: 999,
                  background: "#f8fafc",
                  color: "#1a1a1a",
                  fontSize: 10,
                  padding: "2px 9px",
                }}
              >
                {skill}
              </span>
            ))
          : <span style={{ color: "#64748b", fontSize: 10.5 }}>No skills added</span>}
      </div>

      <SectionTitle label="Work Experience" color={theme.heading} />
      {safe.experience.map((item, index) => (
        <div key={`${item.title}-${index}`} style={{ marginBottom: 8 }}>
          <div style={{ fontWeight: 700, color: "#1a1a1a" }}>{item.title || "Role"}</div>
          <div style={{ fontSize: 10.5, color: "#334155" }}>
            {[item.company, item.duration].filter(Boolean).join(" | ")}
          </div>
          <div style={{ whiteSpace: "pre-wrap", color: "#1f2937" }}>{item.description || "No description provided."}</div>
        </div>
      ))}

      <SectionTitle label="Education" color={theme.heading} />
      {safe.education.map((item, index) => (
        <div key={`${item.degree}-${index}`} style={{ marginBottom: 5, color: "#1f2937" }}>
          <strong>{item.degree || "Degree"}</strong> {[item.institution, item.year].filter(Boolean).join(" | ")}
        </div>
      ))}

      {safe.projects.some((item) => item.name || item.description || item.techStack)
        ? <SectionTitle label="Projects" color={theme.heading} />
        : null}
      {safe.projects.map((item, index) => (
        <div key={`${item.name}-${index}`} style={{ marginBottom: 6 }}>
          <div style={{ fontWeight: 700 }}>{item.name || "Project"}</div>
          {item.techStack ? <div style={{ fontSize: 10.5, color: "#334155" }}>Tech: {item.techStack}</div> : null}
          <div style={{ color: "#1f2937" }}>{item.description || "No description provided."}</div>
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
  const addEntry = () => onChange([...education, { degree: "", institution: "", year: "" }]);
  const removeEntry = (index) => onChange(education.filter((_, itemIndex) => itemIndex !== index));

  return (
    <div>
      {education.map((item, index) => (
        <div key={`education-${index}`} style={{ border: "1px solid var(--border)", borderRadius: 10, padding: 12, marginBottom: 12, background: "var(--d3)" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 10 }}>
            <TextInput label="degree" value={item.degree} onChange={(value) => updateEntry(index, { degree: value })} />
            <TextInput label="institution" value={item.institution} onChange={(value) => updateEntry(index, { institution: value })} />
            <TextInput label="year" value={item.year} onChange={(value) => updateEntry(index, { year: value })} />
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
  const addEntry = () => onChange([...projects, { name: "", description: "", techStack: "" }]);
  const removeEntry = (index) => onChange(projects.filter((_, itemIndex) => itemIndex !== index));

  return (
    <div>
      {projects.map((item, index) => (
        <div key={`project-${index}`} style={{ border: "1px solid var(--border)", borderRadius: 10, padding: 12, marginBottom: 12, background: "var(--d3)" }}>
          <TextInput label="project_name" value={item.name} onChange={(value) => updateEntry(index, { name: value })} />
          <TextInput label="tech_stack" value={item.techStack} onChange={(value) => updateEntry(index, { techStack: value })} />
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
      const structured = sanitizeStructuredData(parsed?.structuredData || {});
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
      setGeneratedStructured(sanitizeStructuredData(response?.structuredResume || safeData));
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
    if (!previewRef.current) {
      setError("Preview is not ready yet. Please try again.");
      return;
    }
    setIsExportingPdf(true);
    setError("");
    try {
      await exportNodeAsPdf(previewRef.current, pdfFileName);
      if (buildId) {
        await markBuildDownload(buildId, user?.email || "anonymous");
      }
    } catch (err) {
      setError(err.message || "Could not generate styled PDF. Please try again.");
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
