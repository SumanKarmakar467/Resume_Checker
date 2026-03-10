function ScoreBar({ score }) {
  const safeScore = Math.max(0, Math.min(score || 0, 100));
  const colorClass =
    safeScore >= 80
      ? 'from-emerald-500 to-green-400'
      : safeScore >= 60
        ? 'from-amber-500 to-orange-400'
        : 'from-rose-500 to-red-400';

  return (
    <div className="h-3 w-full rounded-full bg-slate-200 dark:bg-slate-700">
      <div className={`h-3 rounded-full bg-gradient-to-r ${colorClass} transition-all duration-500`} style={{ width: `${safeScore}%` }} />
    </div>
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

function Result({ analysis, generatedResume }) {
  const lowSections = (analysis.sections || []).filter((section) => section.score < 70);

  return (
    <section className="mt-8 space-y-6 text-slate-900 dark:text-slate-100 reveal-up">
      <div className="rounded-2xl border border-slate-200 bg-white/80 p-5 shadow-sm dark:border-slate-700 dark:bg-slate-950/40">
        <h2 className="text-xl font-semibold">ATS Score</h2>
        <p className="mt-2 text-4xl font-extrabold">{analysis.overallScore}/100</p>
        <div className="mt-3">
          <ScoreBar score={analysis.overallScore} />
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white/80 p-5 shadow-sm dark:border-slate-700 dark:bg-slate-950/40">
        <h3 className="text-lg font-semibold">Section Analysis</h3>
        <div className="mt-4 space-y-4">
          {(analysis.sections || []).map((section) => (
            <div key={section.section} className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800/70">
              <div className="flex items-center justify-between gap-4">
                <p className="font-medium">{section.section}</p>
                <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                  {section.score}/100 ({section.status})
                </p>
              </div>
              <div className="mt-2">
                <ScoreBar score={section.score} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-rose-200 bg-rose-50/90 p-5 dark:border-rose-800/70 dark:bg-rose-950/30">
        <h3 className="text-lg font-semibold text-rose-900 dark:text-rose-200">Highlighted Low-Score Portions</h3>
        {lowSections.length === 0 ? (
          <p className="mt-2 text-rose-700 dark:text-rose-300">No low sections detected. Keep tailoring for each job description.</p>
        ) : (
          <div className="mt-3 space-y-3">
            {lowSections.map((section) => (
              <div key={section.section} className="rounded-xl bg-white/90 p-4 dark:bg-slate-900/70">
                <p className="font-semibold">
                  {section.section} ({section.score}/100)
                </p>
                {(section.issues || []).length > 0 ? (
                  <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700 dark:text-slate-300">
                    {section.issues.map((issue) => (
                      <li key={issue}>{issue}</li>
                    ))}
                  </ul>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-amber-200 bg-amber-50/90 p-5 dark:border-amber-700/60 dark:bg-amber-950/25">
        <h3 className="text-lg font-semibold text-amber-900 dark:text-amber-200">Suggestions To Improve ATS Score</h3>
        {(analysis.suggestions || []).length > 0 ? (
          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-amber-900 dark:text-amber-100">
            {analysis.suggestions.map((suggestion) => (
              <li key={suggestion}>{suggestion}</li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-amber-900 dark:text-amber-100">No specific suggestions generated.</p>
        )}
      </div>

      <div className="rounded-2xl border border-sky-200 bg-sky-50/90 p-5 dark:border-sky-700/60 dark:bg-sky-950/25">
        <h3 className="text-lg font-semibold text-sky-900 dark:text-sky-200">Missing Keywords</h3>
        {(analysis.missingKeywords || []).length > 0 ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {analysis.missingKeywords.map((keyword) => (
              <span key={keyword} className="rounded-full bg-white px-3 py-1 text-sm font-medium text-sky-900 shadow-sm dark:bg-slate-900 dark:text-sky-200">
                {keyword}
              </span>
            ))}
          </div>
        ) : (
          <p className="mt-2 text-sky-900 dark:text-sky-200">Good keyword coverage for this job description.</p>
        )}
      </div>

      {generatedResume ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/90 p-5 dark:border-emerald-700/60 dark:bg-emerald-950/20">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-lg font-semibold text-emerald-900 dark:text-emerald-200">ATS-Friendly Resume Draft</h3>
            <button
              type="button"
              onClick={() => downloadAsText(generatedResume)}
              className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-800"
            >
              Download .txt
            </button>
          </div>
          <pre className="mt-3 max-h-[420px] overflow-auto whitespace-pre-wrap rounded-xl bg-white p-4 text-sm text-slate-800 dark:bg-slate-900 dark:text-slate-100">
            {generatedResume}
          </pre>
        </div>
      ) : null}
    </section>
  );
}

export default Result;
