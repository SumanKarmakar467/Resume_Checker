function BreakdownCard({ sections = [] }) {
  if (!sections.length) return null;

  const getBarColor = (score) => {
    if (score >= 80) return '#22c55e';
    if (score >= 65) return '#3b82f6';
    if (score >= 50) return '#f59e0b';
    return '#ef4444';
  };

  const getBadgeStyle = (score) => {
    if (score >= 80) return { background: 'var(--success-bg)', color: 'var(--success-text)', border: '1px solid var(--success-border)' };
    if (score >= 65) return { background: 'var(--accent-bg)', color: 'var(--accent)', border: '1px solid var(--accent-border)' };
    if (score >= 50) return { background: 'var(--warning-bg)', color: 'var(--warning-text)', border: '1px solid var(--warning-border)' };
    return { background: 'var(--error-bg)', color: 'var(--error-text)', border: '1px solid var(--error-border)' };
  };

  return (
    <div className="theme-card p-5">
      <h3 className="text-sm font-bold uppercase tracking-wide mb-4" style={{ letterSpacing: '0.6px' }}>
        Section-wise Score
      </h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {sections.map((section) => {
          const score = section.score || 0;
          return (
            <div key={section.section} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 12, color: 'var(--text-muted)', width: 100, flexShrink: 0 }}>
                {section.section}
              </span>
              <div className="breakdown-bar-track">
                <div
                  className="breakdown-bar-fill"
                  style={{ width: `${score}%`, background: getBarColor(score) }}
                />
              </div>
              <span style={{
                fontSize: 11,
                fontWeight: 700,
                width: 42,
                textAlign: 'right',
                padding: '2px 6px',
                borderRadius: 6,
                ...getBadgeStyle(score)
              }}>
                {score}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default BreakdownCard;
