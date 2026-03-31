function TemplateThumb({ templateId }) {
  if (templateId === "modern_split") {
    return (
      <div className="flex h-28 w-full overflow-hidden rounded-lg border border-slate-300 bg-white">
        <div className="w-1/3 bg-slate-800 p-2">
          <div className="mb-2 h-2 rounded bg-slate-500" />
          <div className="mb-1 h-1.5 rounded bg-slate-600" />
          <div className="mb-1 h-1.5 rounded bg-slate-600" />
        </div>
        <div className="flex-1 p-2">
          <div className="mb-2 h-2 rounded bg-blue-300" />
          <div className="mb-1 h-1.5 rounded bg-slate-200" />
          <div className="mb-1 h-1.5 rounded bg-slate-200" />
          <div className="h-1.5 rounded bg-slate-200" />
        </div>
      </div>
    );
  }

  if (templateId === "executive") {
    return (
      <div className="h-28 w-full overflow-hidden rounded-lg border border-slate-300 bg-white">
        <div className="flex h-10 items-center gap-2 bg-slate-900 px-3">
          <div className="h-6 w-6 rounded-full border border-slate-400 bg-slate-700" />
          <div className="h-2 w-24 rounded bg-slate-500" />
        </div>
        <div className="p-2">
          <div className="mb-1 h-2 rounded bg-slate-200" />
          <div className="mb-1 h-2 rounded bg-slate-200" />
          <div className="h-2 rounded bg-slate-200" />
        </div>
      </div>
    );
  }

  if (templateId === "impact_edge") {
    return (
      <div className="h-28 w-full rounded-lg border border-slate-300 bg-white p-2">
        <div className="mb-2 h-2 border-l-4 border-rose-500 bg-rose-50" />
        <div className="mb-2 h-2 border-l-4 border-rose-500 bg-rose-50" />
        <div className="mb-2 h-2 border-l-4 border-rose-500 bg-rose-50" />
        <div className="h-2 border-l-4 border-rose-500 bg-rose-50" />
      </div>
    );
  }

  if (templateId === "tech_blueprint") {
    return (
      <div className="h-28 w-full overflow-hidden rounded-lg border border-slate-300 bg-slate-950 p-2 font-mono">
        <div className="mb-2 h-2 w-24 rounded bg-cyan-300" />
        <div className="mb-1 h-1.5 w-full rounded bg-slate-700" />
        <div className="mb-1 h-1.5 w-11/12 rounded bg-slate-700" />
        <div className="flex gap-1 pt-1">
          <span className="rounded bg-cyan-700/40 px-1 text-[8px] text-cyan-200">React</span>
          <span className="rounded bg-cyan-700/40 px-1 text-[8px] text-cyan-200">Spring</span>
        </div>
      </div>
    );
  }

  if (templateId === "minimal_mono") {
    return (
      <div className="h-28 w-full rounded-lg border border-slate-300 bg-white p-2">
        <div className="mb-2 h-2 rounded bg-slate-300" />
        <div className="mb-2 h-px bg-slate-200" />
        <div className="mb-1 h-1.5 rounded bg-slate-200" />
        <div className="mb-1 h-1.5 rounded bg-slate-200" />
        <div className="h-1.5 rounded bg-slate-200" />
      </div>
    );
  }

  return (
    <div className="h-28 w-full rounded-lg border border-slate-300 bg-white p-2">
      <div className="mb-2 h-2 rounded bg-blue-300" />
      <div className="mb-1 h-1.5 rounded bg-slate-200" />
      <div className="mb-1 h-1.5 rounded bg-slate-200" />
      <div className="mb-1 h-1.5 rounded bg-slate-200" />
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
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      {templates.map((template) => {
        const selected = selectedTemplate === template.id;

        return (
          <div
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
            className={`rounded-xl border bg-slate-900/40 p-3 transition ${
              selected ? "border-blue-500 ring-2 ring-blue-500/30" : "border-slate-700 hover:border-slate-500"
            }`}
          >
            <TemplateThumb templateId={template.id} />
            <div className="mt-3 flex items-center justify-between gap-2">
              <h4 className="text-sm font-semibold text-slate-100">{template.name}</h4>
              <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-xs font-medium text-emerald-300">
                ATS: {template.atsScore}%
              </span>
            </div>
            <div className="mt-1 text-xs text-slate-400">{template.photoIncluded ? "Photo included" : "No photo"}</div>

            {selected ? (
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  onConfirm(template.id);
                }}
                disabled={loading}
                className="mt-3 w-full rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:bg-blue-900"
              >
                {loading ? "Generating..." : "Use this template"}
              </button>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
