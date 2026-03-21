// Purpose: Show matched and missing ATS keywords with summary stats.
function KeywordPills({ matchedKeywords = [], missingKeywords = [] }) {
  const matchedCount = Array.isArray(matchedKeywords) ? matchedKeywords.length : 0;
  const missingCount = Array.isArray(missingKeywords) ? missingKeywords.length : 0;
  const total = matchedCount + missingCount;
  const percent = total === 0 ? 0 : Math.round((matchedCount / total) * 100);

  return (
    <section className="mt-4 space-y-4">
      <p className="theme-muted text-sm">
        {matchedCount} of {total} keywords matched ({percent}%)
      </p>

      <div className="grid gap-4 md:grid-cols-2">
        <article className="rounded-2xl border border-[var(--border-color)] bg-[var(--surface-soft)] p-4">
          <h3 className="text-sm font-bold uppercase tracking-wide">Found in your resume</h3>
          <div className="mt-2 flex flex-wrap gap-2">
            {matchedCount ? (
              matchedKeywords.map((keyword) => (
                <span key={keyword} className="keyword-chip keyword-chip-strong">
                  {keyword}
                </span>
              ))
            ) : (
              <span className="theme-muted text-sm">No matched keywords yet.</span>
            )}
          </div>
        </article>

        <article className="rounded-2xl border border-[var(--border-color)] bg-[var(--surface-soft)] p-4">
          <h3 className="text-sm font-bold uppercase tracking-wide">Missing from your resume</h3>
          <div className="mt-2 flex flex-wrap gap-2">
            {missingCount ? (
              missingKeywords.map((keyword) => (
                <span key={keyword} className="keyword-chip keyword-chip-weak">
                  + {keyword}
                </span>
              ))
            ) : (
              <span className="theme-muted text-sm">No missing keywords.</span>
            )}
          </div>
        </article>
      </div>
    </section>
  );
}

export default KeywordPills;
