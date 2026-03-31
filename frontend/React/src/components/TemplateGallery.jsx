import { useMemo, useState } from "react";

const TEMPLATE_META = {
  ats_clean: { type: "Professional", vibe: "Formal", photoTag: "No photo" },
  modern_split: { type: "Modern", vibe: "Balanced", photoTag: "No photo" },
  minimal_mono: { type: "Minimal", vibe: "Clean", photoTag: "No photo" },
  executive: { type: "Executive", vibe: "Leadership", photoTag: "Photo included" },
  impact_edge: { type: "Creative", vibe: "Accent", photoTag: "No photo" },
  tech_blueprint: { type: "Developer", vibe: "Technical", photoTag: "No photo" },
};

function Thumbnail({ templateId }) {
  if (templateId === "modern_split") {
    return (
      <div className="relative h-44 w-full overflow-hidden rounded-xl border border-slate-300 bg-slate-50 shadow-inner">
        <div className="absolute inset-y-0 left-0 w-[34%] bg-slate-800 p-3">
          <div className="mb-2 h-2 rounded bg-slate-500" />
          <div className="mb-1.5 h-1.5 rounded bg-slate-600" />
          <div className="mb-1.5 h-1.5 rounded bg-slate-600" />
          <div className="h-1.5 rounded bg-slate-600" />
        </div>
        <div className="ml-[34%] h-full p-3">
          <div className="mb-3 h-2 rounded bg-blue-300" />
          <div className="mb-1.5 h-1.5 rounded bg-slate-300" />
          <div className="mb-1.5 h-1.5 rounded bg-slate-300" />
          <div className="mb-1.5 h-1.5 rounded bg-slate-300" />
          <div className="h-1.5 rounded bg-slate-300" />
        </div>
      </div>
    );
  }

  if (templateId === "executive") {
    return (
      <div className="relative h-44 w-full overflow-hidden rounded-xl border border-slate-300 bg-white shadow-inner">
        <div className="flex h-14 items-center gap-3 bg-slate-900 px-4">
          <div className="h-8 w-8 rounded-full border border-slate-400 bg-slate-700" />
          <div className="h-2 w-32 rounded bg-slate-500" />
        </div>
        <div className="p-3">
          <div className="mb-2 h-2 rounded bg-slate-300" />
          <div className="mb-1.5 h-1.5 rounded bg-slate-200" />
          <div className="mb-1.5 h-1.5 rounded bg-slate-200" />
          <div className="mb-1.5 h-1.5 rounded bg-slate-200" />
          <div className="h-1.5 rounded bg-slate-200" />
        </div>
      </div>
    );
  }

  if (templateId === "impact_edge") {
    return (
      <div className="h-44 w-full rounded-xl border border-slate-300 bg-white p-3 shadow-inner">
        <div className="mb-2 h-2 rounded border-l-4 border-rose-500 bg-rose-100/70" />
        <div className="mb-2 h-2 rounded border-l-4 border-rose-500 bg-rose-100/70" />
        <div className="mb-2 h-2 rounded border-l-4 border-rose-500 bg-rose-100/70" />
        <div className="mb-2 h-2 rounded border-l-4 border-rose-500 bg-rose-100/70" />
        <div className="h-2 rounded border-l-4 border-rose-500 bg-rose-100/70" />
      </div>
    );
  }

  if (templateId === "tech_blueprint") {
    return (
      <div className="h-44 w-full overflow-hidden rounded-xl border border-cyan-300/60 bg-slate-950 p-3 shadow-inner">
        <div className="mb-3 flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-cyan-400" />
          <span className="h-2 w-2 rounded-full bg-cyan-500/70" />
          <span className="h-2 w-2 rounded-full bg-cyan-700/70" />
        </div>
        <div className="mb-2 h-2 w-24 rounded bg-cyan-300/90" />
        <div className="mb-1.5 h-1.5 rounded bg-slate-700" />
        <div className="mb-1.5 h-1.5 w-11/12 rounded bg-slate-700" />
        <div className="mb-1.5 h-1.5 w-10/12 rounded bg-slate-700" />
        <div className="mt-2 flex gap-1.5">
          <span className="rounded bg-cyan-800/40 px-1.5 py-0.5 text-[9px] text-cyan-200">React</span>
          <span className="rounded bg-cyan-800/40 px-1.5 py-0.5 text-[9px] text-cyan-200">Node</span>
          <span className="rounded bg-cyan-800/40 px-1.5 py-0.5 text-[9px] text-cyan-200">MongoDB</span>
        </div>
      </div>
    );
  }

  if (templateId === "minimal_mono") {
    return (
      <div className="h-44 w-full rounded-xl border border-slate-300 bg-white p-3 shadow-inner">
        <div className="mb-2 h-2 rounded bg-slate-300" />
        <div className="mb-3 h-px bg-slate-200" />
        <div className="mb-1.5 h-1.5 rounded bg-slate-200" />
        <div className="mb-1.5 h-1.5 rounded bg-slate-200" />
        <div className="mb-1.5 h-1.5 rounded bg-slate-200" />
        <div className="h-1.5 rounded bg-slate-200" />
      </div>
    );
  }

  return (
    <div className="h-44 w-full rounded-xl border border-slate-300 bg-white p-3 shadow-inner">
      <div className="mb-3 h-2 rounded bg-blue-300" />
      <div className="mb-1.5 h-1.5 rounded bg-slate-200" />
      <div className="mb-1.5 h-1.5 rounded bg-slate-200" />
      <div className="mb-1.5 h-1.5 rounded bg-slate-200" />
      <div className="mb-1.5 h-1.5 rounded bg-slate-200" />
      <div className="h-1.5 rounded bg-slate-200" />
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

  const availableTypes = useMemo(() => {
    const types = templates.map((template) => TEMPLATE_META[template.id]?.type || "General");
    return ["All", ...Array.from(new Set(types))];
  }, [templates]);

  const visibleTemplates = useMemo(() => {
    if (activeType === "All") return templates;
    return templates.filter((template) => (TEMPLATE_META[template.id]?.type || "General") === activeType);
  }, [activeType, templates]);

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
              className={`group relative overflow-hidden rounded-2xl border p-3 transition-all ${
                selected
                  ? "border-blue-400 bg-slate-900/95 ring-2 ring-blue-500/40"
                  : "border-slate-700 bg-slate-900/75 hover:-translate-y-0.5 hover:border-slate-500 hover:bg-slate-900/90"
              }`}
            >
              <div className="mb-3">
                <Thumbnail templateId={template.id} />
              </div>

              <div className="mb-2 flex flex-wrap items-center gap-2">
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

              <h4 className="text-base font-semibold text-slate-100">{template.name}</h4>
              <p className="mt-1 text-xs text-slate-400">{template.description}</p>
              <div className="mt-2 text-xs text-cyan-300/90">Style: {meta.vibe}</div>

              {selected ? (
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    onConfirm(template.id);
                  }}
                  disabled={loading}
                  className="mt-3 w-full rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:bg-blue-900"
                >
                  {loading ? "Generating..." : "Use this template"}
                </button>
              ) : (
                <div className="mt-3 rounded-lg border border-dashed border-slate-700 px-3 py-2 text-center text-xs text-slate-500">
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
