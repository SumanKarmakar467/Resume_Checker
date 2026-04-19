import { useMemo, useState } from "react";

const TEMPLATE_META = {
  ats_clean: { type: "Professional", vibe: "Formal", photoTag: "No photo" },
  modern_split: { type: "Modern", vibe: "Balanced", photoTag: "No photo" },
  minimal_mono: { type: "Minimal", vibe: "Clean", photoTag: "No photo" },
  executive: { type: "Executive", vibe: "Leadership", photoTag: "Photo included" },
  impact_edge: { type: "Creative", vibe: "Accent", photoTag: "No photo" },
  tech_blueprint: { type: "Developer", vibe: "Technical", photoTag: "No photo" },
};

const SAMPLE_PERSONAS = [
  {
    name: "Arjun Mehta",
    role: "Frontend Engineer",
    email: "arjun.mehta@example.com",
    summary: "Builds high-performance React apps with accessibility-first UI systems.",
    institution: "NIT Surat",
    degree: "B.Tech CSE",
    year: "2023",
    skills: ["React", "TypeScript", "Tailwind"],
  },
  {
    name: "Neha Roy",
    role: "Data Analyst",
    email: "neha.roy@example.com",
    summary: "Transforms product data into actionable dashboards and growth insights.",
    institution: "Jadavpur University",
    degree: "B.Sc Statistics",
    year: "2022",
    skills: ["SQL", "Python", "Power BI"],
  },
  {
    name: "Rahul Singh",
    role: "Backend Developer",
    email: "rahul.singh@example.com",
    summary: "Designs secure APIs, optimizes database performance, and scales services.",
    institution: "IIIT Lucknow",
    degree: "B.Tech IT",
    year: "2021",
    skills: ["Node.js", "MongoDB", "Redis"],
  },
  {
    name: "Priya Das",
    role: "Product Designer",
    email: "priya.das@example.com",
    summary: "Creates intuitive design systems and user journeys for SaaS products.",
    institution: "IIT Guwahati",
    degree: "B.Des",
    year: "2020",
    skills: ["Figma", "UX Research", "Design Systems"],
  },
  {
    name: "Karan Patel",
    role: "DevOps Engineer",
    email: "karan.patel@example.com",
    summary: "Automates CI/CD pipelines and deploys resilient cloud infrastructure.",
    institution: "DAIICT",
    degree: "B.Tech ICT",
    year: "2019",
    skills: ["Docker", "Kubernetes", "AWS"],
  },
  {
    name: "Sneha Iyer",
    role: "Software Engineer",
    email: "sneha.iyer@example.com",
    summary: "Builds end-to-end web products with clean architecture and testing discipline.",
    institution: "VIT Vellore",
    degree: "B.Tech CSE",
    year: "2024",
    skills: ["Java", "Spring", "PostgreSQL"],
  },
  {
    name: "Aman Verma",
    role: "Mobile Developer",
    email: "aman.verma@example.com",
    summary: "Delivers fast cross-platform apps with native-like UX and offline support.",
    institution: "SRM Institute",
    degree: "B.Tech ECE",
    year: "2022",
    skills: ["Flutter", "Dart", "Firebase"],
  },
  {
    name: "Riya Chakraborty",
    role: "QA Automation Engineer",
    email: "riya.chakraborty@example.com",
    summary: "Builds reliable automation suites and strengthens release quality.",
    institution: "University of Calcutta",
    degree: "MCA",
    year: "2021",
    skills: ["Selenium", "Cypress", "Jest"],
  },
];

function hashString(value = "") {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }
  return hash;
}

function compact(value, fallback) {
  const text = String(value || "").trim();
  return text || fallback;
}

function normalizePreviewData(data = {}) {
  const firstExperience = Array.isArray(data?.experience) ? data.experience.find((item) => item?.title || item?.company) : null;
  const firstEducation = Array.isArray(data?.education) ? data.education.find((item) => item?.degree || item?.institution) : null;
  const skills = Array.isArray(data?.skills) ? data.skills.filter(Boolean).slice(0, 3) : [];

  return {
    name: compact(data?.name, "Your Name"),
    role: compact(firstExperience?.title, "Software Developer"),
    email: compact(data?.email, "you@example.com"),
    summary: compact(data?.summary, "Build scalable products with clean architecture and strong delivery."),
    institution: compact(firstEducation?.institution, "Your Institution"),
    degree: compact(firstEducation?.degree, "Degree"),
    year: compact(firstEducation?.year, "2022"),
    skills: skills.length ? skills : ["React", "Node.js", "MongoDB"],
  };
}

function PlaceholderLines({ lines = 4, tone = "bg-slate-300" }) {
  return (
    <>
      {Array.from({ length: lines }).map((_, index) => (
        <div
          key={`line-${index}`}
          className={`mb-1.5 h-1.5 rounded ${tone} ${index === lines - 1 ? "w-10/12" : "w-full"}`}
        />
      ))}
    </>
  );
}

function Thumbnail({ templateId, data }) {
  const visual = normalizePreviewData(data);

  if (templateId === "modern_split") {
    return (
      <div className="relative h-36 w-full overflow-hidden rounded-xl border border-slate-300 bg-slate-50 shadow-inner sm:h-40 md:h-44">
        <div className="absolute inset-y-0 left-0 w-[34%] bg-slate-800 p-3 text-[8px] text-slate-100">
          <div className="truncate text-[9px] font-semibold">{visual.name}</div>
          <div className="mt-0.5 truncate text-slate-300">{visual.email}</div>
          <div className="mt-2 border-t border-slate-600 pt-1 text-slate-300">SKILLS</div>
          <div className="mt-1 flex flex-wrap gap-1">
            {visual.skills.map((skill) => (
              <span key={skill} className="rounded bg-slate-700 px-1 py-0.5 text-[7px] text-slate-200">
                {skill}
              </span>
            ))}
          </div>
        </div>
        <div className="ml-[34%] h-full p-3 text-[8px] text-slate-700">
          <div className="mb-1 truncate text-[9px] font-semibold text-blue-700">{visual.role}</div>
          <div className="mb-1 text-[7px] uppercase tracking-wide text-slate-500">Summary</div>
          <PlaceholderLines lines={3} tone="bg-slate-300" />
          <div className="mt-2 mb-1 text-[7px] uppercase tracking-wide text-slate-500">Education</div>
          <div className="truncate text-[8px] font-medium">{visual.degree}</div>
          <div className="truncate text-[8px]">{visual.institution}</div>
          <div className="text-[7px] text-slate-500">{visual.year}</div>
        </div>
      </div>
    );
  }

  if (templateId === "executive") {
    return (
      <div className="relative h-36 w-full overflow-hidden rounded-xl border border-slate-300 bg-white shadow-inner sm:h-40 md:h-44">
        <div className="flex h-14 items-center gap-3 bg-slate-900 px-4 text-slate-200">
          <div className="h-8 w-8 rounded-full border border-slate-400 bg-slate-700" />
          <div>
            <div className="w-24 truncate text-[9px] font-semibold">{visual.name}</div>
            <div className="w-24 truncate text-[7px] text-slate-400">{visual.role}</div>
          </div>
        </div>
        <div className="p-3 text-[8px] text-slate-700">
          <div className="mb-1 text-[7px] uppercase tracking-wide text-slate-500">Professional Summary</div>
          <PlaceholderLines lines={3} tone="bg-slate-200" />
          <div className="mt-2 truncate text-[8px] font-medium">
            {visual.degree} | {visual.institution}
          </div>
        </div>
      </div>
    );
  }

  if (templateId === "impact_edge") {
    return (
      <div className="h-36 w-full rounded-xl border border-slate-300 bg-white p-3 shadow-inner sm:h-40 md:h-44">
        <div className="mb-2 truncate border-l-4 border-rose-500 bg-rose-100/70 px-2 py-1 text-[9px] font-semibold text-rose-900">
          {visual.name}
        </div>
        <div className="mb-2 truncate border-l-4 border-rose-500 bg-rose-100/70 px-2 py-1 text-[8px] text-rose-900">
          {visual.role}
        </div>
        <div className="mb-2 rounded border-l-4 border-rose-500 bg-rose-100/70 px-2 py-1 text-[7px] text-rose-900">
          {visual.summary.slice(0, 70)}
        </div>
        <div className="rounded border-l-4 border-rose-500 bg-rose-100/70 px-2 py-1 text-[7px] text-rose-900">
          {visual.degree} | {visual.year}
        </div>
      </div>
    );
  }

  if (templateId === "tech_blueprint") {
    return (
      <div className="h-36 w-full overflow-hidden rounded-xl border border-cyan-300/60 bg-slate-950 p-3 shadow-inner sm:h-40 md:h-44">
        <div className="mb-3 flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-cyan-400" />
          <span className="h-2 w-2 rounded-full bg-cyan-500/70" />
          <span className="h-2 w-2 rounded-full bg-cyan-700/70" />
        </div>
        <div className="mb-2 truncate text-[9px] font-semibold text-cyan-200">{visual.name}</div>
        <div className="mb-1 truncate text-[8px] text-cyan-300">{visual.role}</div>
        <PlaceholderLines lines={3} tone="bg-slate-700" />
        <div className="mt-2 flex gap-1.5">
          {visual.skills.map((skill) => (
            <span key={skill} className="rounded bg-cyan-800/40 px-1.5 py-0.5 text-[9px] text-cyan-200">
              {skill}
            </span>
          ))}
        </div>
      </div>
    );
  }

  if (templateId === "minimal_mono") {
    return (
      <div className="h-36 w-full rounded-xl border border-slate-300 bg-white p-3 shadow-inner sm:h-40 md:h-44">
        <div className="mb-2 truncate text-[9px] font-semibold text-slate-700">{visual.name}</div>
        <div className="mb-3 h-px bg-slate-200" />
        <div className="mb-1 truncate text-[8px] text-slate-600">{visual.role}</div>
        <PlaceholderLines lines={3} tone="bg-slate-200" />
        <div className="mt-2 truncate text-[8px] text-slate-600">
          {visual.degree} | {visual.year}
        </div>
      </div>
    );
  }

  return (
    <div className="h-36 w-full rounded-xl border border-slate-300 bg-white p-3 shadow-inner sm:h-40 md:h-44">
      <div className="mb-2 truncate text-[9px] font-semibold text-blue-700">{visual.name}</div>
      <div className="mb-2 truncate text-[8px] text-slate-600">{visual.role}</div>
      <PlaceholderLines lines={4} tone="bg-slate-200" />
      <div className="mt-2 truncate text-[8px] text-slate-600">
        {visual.institution} | {visual.year}
      </div>
    </div>
  );
}

export default function TemplateGallery({
  templates,
  selectedTemplate,
  onSelect,
  onConfirm,
  loading,
}) {
  const [activeType, setActiveType] = useState("All");
  const [personaSeed] = useState(() => Math.floor(Math.random() * 1000000));

  const availableTypes = useMemo(() => {
    const types = templates.map((template) => TEMPLATE_META[template.id]?.type || "General");
    return ["All", ...Array.from(new Set(types))];
  }, [templates]);

  const visibleTemplates = useMemo(() => {
    if (activeType === "All") return templates;
    return templates.filter((template) => (TEMPLATE_META[template.id]?.type || "General") === activeType);
  }, [activeType, templates]);

  const personaByTemplate = useMemo(() => {
    const map = {};
    templates.forEach((template, templateIndex) => {
      const key = `${template.id}-${templateIndex}-${personaSeed}`;
      const personaIndex = hashString(key) % SAMPLE_PERSONAS.length;
      map[template.id] = SAMPLE_PERSONAS[personaIndex];
    });
    return map;
  }, [personaSeed, templates]);

  return (
    <div className="rounded-2xl border border-slate-700/70 bg-slate-950/50 p-3 md:p-4">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        {availableTypes.map((type) => {
          const active = type === activeType;
          return (
            <button
              key={type}
              type="button"
              onClick={() => setActiveType(type)}
              className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
                active
                  ? "border-cyan-400 bg-cyan-500/15 text-cyan-200"
                  : "border-slate-700 bg-slate-900/70 text-slate-300 hover:border-slate-500"
              }`}
            >
              {type}
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {visibleTemplates.map((template) => {
          const selected = selectedTemplate === template.id;
          const meta = TEMPLATE_META[template.id] || {
            type: "General",
            vibe: "Balanced",
            photoTag: template.photoIncluded ? "Photo included" : "No photo",
          };

          return (
            <article
              key={template.id}
              role="button"
              tabIndex={0}
              onClick={() => onSelect(template.id)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  onSelect(template.id);
                }
              }}
              className={`group relative flex h-full flex-col overflow-hidden rounded-2xl border p-2.5 transition-all md:p-3 ${
                selected
                  ? "border-blue-400 bg-slate-900/95 ring-2 ring-blue-500/40"
                  : "border-slate-700 bg-slate-900/75 hover:-translate-y-0.5 hover:border-slate-500 hover:bg-slate-900/90"
              }`}
            >
              <div className="mb-2 shrink-0 md:mb-3">
                <Thumbnail templateId={template.id} data={personaByTemplate[template.id]} />
              </div>

              <div className="mb-2 flex min-h-[28px] flex-wrap items-center gap-2">
                <span className="rounded-full border border-slate-600 bg-slate-800 px-2 py-0.5 text-[11px] font-medium text-slate-300">
                  {meta.type}
                </span>
                <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-300">
                  ATS {template.atsScore}%
                </span>
                <span className="rounded-full border border-slate-600 bg-slate-800 px-2 py-0.5 text-[11px] font-medium text-slate-400">
                  {meta.photoTag}
                </span>
              </div>

              <h4 className="min-h-[40px] text-base font-semibold leading-6 text-slate-100 md:min-h-[48px]">{template.name}</h4>
              <p className="mt-1 min-h-[30px] text-xs leading-5 text-slate-400 md:min-h-[34px]">{template.description}</p>
              <div className="mt-2 text-xs text-cyan-300/90">Style: {meta.vibe}</div>

              {selected ? (
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    onConfirm(template.id);
                  }}
                  disabled={loading}
                  className="mt-auto w-full rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:bg-blue-900"
                >
                  {loading ? "Generating..." : "Use this template"}
                </button>
              ) : (
                <div className="mt-auto rounded-lg border border-dashed border-slate-700 px-3 py-2 text-center text-xs text-slate-500">
                  Click card to select
                </div>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
}
