// Purpose: Display section-wise ATS score breakdown with progress bars.
const scoreColor = (score) => {
  if (score < 50) return '#EF4444';
  if (score < 75) return '#F59E0B';
  return '#22C55E';
};

const getSectionScore = (sections, name) => {
  const match = (sections || []).find((section) => section.section === name);
  return match?.score ?? 0;
};

function BreakdownCard({ sections = [] }) {
  const rows = [
    { label: 'Keywords', key: 'Keyword Match' },
    { label: 'Skills', key: 'Skills' },
    { label: 'Experience', key: 'Experience' },
    { label: 'Formatting', key: 'Formatting' },
    { label: 'Contact', key: 'Contact Information' }
  ];

  return (
    <section className="mt-5 rounded-2xl border border-[var(--border-color)] bg-[var(--surface-soft)] p-4">
      <h3 className="text-sm font-bold uppercase tracking-wide">Section-wise Breakdown</h3>
      <div className="mt-4 space-y-3">
        {rows.map((row) => {
          const score = getSectionScore(sections, row.key);
          const color = scoreColor(score);
          return (
            <div key={row.key} className="flex items-center gap-3">
              <span className="w-28 text-sm font-semibold">{row.label}</span>
              <div className="h-2 flex-1 rounded-full bg-slate-200/70 dark:bg-slate-700/60">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${score}%`, backgroundColor: color }}
                />
              </div>
              <span className="w-10 text-right text-sm font-semibold" style={{ color }}>
                {score}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export default BreakdownCard;
