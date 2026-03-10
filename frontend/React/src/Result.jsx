function ScoreGauge({ score }) {
  const safeScore = Math.max(0, Math.min(score || 0, 100));
  const radius = 70;
  const circumference = Math.PI * radius;
  const offset = circumference - (safeScore / 100) * circumference;

  return (
    <div className="mx-auto w-[190px] pt-2 text-center">
      <svg viewBox="0 0 180 110" className="h-[120px] w-full">
        <path d="M20 90 A70 70 0 0 1 160 90" fill="none" stroke="rgb(226 232 240)" strokeWidth="18" strokeLinecap="round" />
        <path
          d="M20 90 A70 70 0 0 1 160 90"
          fill="none"
          stroke="url(#scoreGradient)"
          strokeWidth="18"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 600ms ease' }}
        />
        <defs>
          <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#fb923c" />
            <stop offset="100%" stopColor="#f59e0b" />
          </linearGradient>
        </defs>
        <line x1="26" y1="90" x2="154" y2="90" stroke="rgb(100 116 139)" strokeWidth="2" />
        <circle cx="90" cy="90" r="4" fill="rgb(71 85 105)" />
      </svg>

      <p className="-mt-1 text-4xl font-extrabold text-amber-500">{safeScore}/100</p>
    </div>
  );
}

function ScorePill({ score }) {
  const safe = Math.max(0, Math.min(score || 0, 100));
  const tone = safe >= 80 ? 'bg-emerald-100 text-emerald-700' : safe >= 60 ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700';

  return <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${tone}`}>{safe}%</span>;
}

function metricStatus(hasIssue) {
  return hasIssue ? '1 issue' : 'No issues';
}

function renderLinePreview(line, index) {
  if (!line.trim()) return <div key={`sp-${index}`} className="h-3" />;
  if (line.toUpperCase() === line && line.length <= 44) {
    return (
      <h4 key={`${line}-${index}`} className="mt-4 text-sm font-extrabold tracking-wide text-slate-800 dark:text-slate-100">
        {line}
      </h4>
    );
  }

  if (line.startsWith('-')) {
    return (
      <li key={`${line}-${index}`} className="ml-4 list-disc text-sm text-slate-700 dark:text-slate-200">
        {line.slice(1).trim()}
      </li>
    );
  }

  return (
    <p key={`${line}-${index}`} className="text-sm leading-relaxed text-slate-700 dark:text-slate-200">
      {line}
    </p>
  );
}

function downloadAsText(content) {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'ats-friendly-resume.txt';
  link.click();
  URL.revokeObjectURL(url);
}

function Result({ analysis, resumeDraft, setResumeDraft, onGenerate, loading }) {
  const issuesCount = (analysis.sections || []).filter((section) => section.score < 70).length;
  const panelScores = analysis.panelScores || {};

  const parseSection = (analysis.sections || []).find((section) => section.section === 'Formatting');
  const impactSection = (analysis.sections || []).find((section) => section.section === 'Experience');
  const keywordSection = (analysis.sections || []).find((section) => section.section === 'Keyword Match');
  const grammarSection = (analysis.sections || []).find((section) => section.section === 'Professional Summary');

  const contentRows = [
    {
      name: 'ATS Parse Rate',
      bad: (parseSection?.issues || []).length > 0,
      score: parseSection?.score || 0
    },
    {
      name: 'Quantifying Impact',
      bad: (impactSection?.issues || []).some((issue) => issue.toLowerCase().includes('measurable')),
      score: impactSection?.score || 0
    },
    {
      name: 'Repetition',
      bad: (keywordSection?.issues || []).length > 0,
      score: keywordSection?.score || 0
    },
    {
      name: 'Spelling & Grammar',
      bad: (grammarSection?.issues || []).length > 0,
      score: grammarSection?.score || 0
    }
  ];

  const previewLines = resumeDraft.split('\n').slice(0, 46);

  return (
    <section className="mt-8 grid gap-6 xl:grid-cols-[360px_1fr]">
      <aside className="rounded-[28px] border border-slate-200 bg-white/90 p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900/80">
        <h2 className="text-center text-4xl font-light tracking-tight">Your Score</h2>
        <ScoreGauge score={analysis.overallScore} />
        <p className="mt-1 text-center text-lg text-slate-600 dark:text-slate-300">{issuesCount} Issues</p>

        <div className="mt-6 border-t border-slate-200 pt-5 dark:border-slate-700">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs font-bold tracking-[0.16em] text-slate-500">CONTENT</p>
            <ScorePill score={panelScores.contentScore || 0} />
          </div>

          <div className="space-y-3">
            {contentRows.map((row) => (
              <div key={row.name} className="flex items-center justify-between gap-3">
                <p className="text-sm text-slate-800 dark:text-slate-100">
                  <span className={`mr-2 inline-block text-base ${row.bad ? 'text-rose-500' : 'text-emerald-500'}`}>{row.bad ? 'x' : '?'}</span>
                  {row.name}
                </p>
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                    row.bad ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-200' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-200'
                  }`}
                >
                  {metricStatus(row.bad)}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-5 space-y-2 border-t border-slate-200 pt-4 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold tracking-[0.16em] text-slate-500">SECTIONS</p>
              <ScorePill score={panelScores.sectionsScore || 0} />
            </div>
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold tracking-[0.16em] text-slate-500">ATS ESSENTIALS</p>
              <ScorePill score={panelScores.atsEssentialsScore || 0} />
            </div>
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold tracking-[0.16em] text-slate-500">TAILORING</p>
              <ScorePill score={panelScores.tailoringScore || 0} />
            </div>
          </div>
        </div>
      </aside>

      <section className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900/80">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-2xl font-bold">ATS Friendly Resume Builder</h3>
            <p className="text-sm text-slate-600 dark:text-slate-300">Edit your ATS draft directly. The preview updates instantly.</p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onGenerate}
              disabled={loading}
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60"
            >
              {loading ? 'Building...' : 'Rebuild Draft'}
            </button>
            <button
              type="button"
              onClick={() => downloadAsText(resumeDraft || '')}
              disabled={!resumeDraft}
              className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-900 disabled:opacity-60"
            >
              Download
            </button>
          </div>
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <div className="space-y-4">
            <div>
              <div className="mb-2 flex items-center justify-between">
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Editable ATS Resume</p>
                <span className="text-xs text-slate-500">{(resumeDraft || '').split(/\s+/).filter(Boolean).length} words</span>
              </div>
              <textarea
                value={resumeDraft}
                onChange={(event) => setResumeDraft(event.target.value)}
                placeholder="Your ATS-friendly resume will appear here after analysis."
                rows="20"
                className="w-full rounded-xl border border-slate-300 bg-white p-3 font-mono text-sm text-slate-800 shadow-sm outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200 dark:border-slate-700 dark:bg-slate-950/35 dark:text-slate-100"
              />
            </div>

            <div>
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Missing Keywords</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {(analysis.missingKeywords || []).slice(0, 16).map((keyword) => (
                  <button
                    key={keyword}
                    type="button"
                    onClick={() => setResumeDraft((current) => `${current}\n- ${keyword}`.trim())}
                    className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700 transition hover:bg-amber-200 dark:bg-amber-950/40 dark:text-amber-200"
                  >
                    + {keyword}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-950/25">
            <p className="mb-2 text-sm font-semibold text-slate-700 dark:text-slate-200">Live ATS Resume Preview</p>
            <div className="max-h-[520px] overflow-auto rounded-lg bg-white p-4 shadow-sm dark:bg-slate-900">
              {previewLines.length ? previewLines.map((line, index) => renderLinePreview(line, index)) : <p className="text-sm text-slate-500">No draft yet.</p>}
            </div>

            <div className="mt-4">
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Matched Keywords</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {(analysis.matchedKeywords || []).slice(0, 20).map((keyword) => (
                  <span
                    key={keyword}
                    className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-200"
                  >
                    {keyword}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {(analysis.suggestions || []).length > 0 ? (
          <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950/25">
            <p className="text-sm font-semibold text-amber-800 dark:text-amber-200">Improvement Suggestions</p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-amber-900 dark:text-amber-100">
              {analysis.suggestions.slice(0, 8).map((suggestion) => (
                <li key={suggestion}>{suggestion}</li>
              ))}
            </ul>
          </div>
        ) : null}
      </section>
    </section>
  );
}

export default Result;
