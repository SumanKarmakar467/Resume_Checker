function KeywordPills({ matchedKeywords = [], missingKeywords = [] }) {
  return (
    <div className="theme-card p-5">
      <h3 className="text-sm font-bold uppercase tracking-wide mb-4" style={{ letterSpacing: '0.6px' }}>
        Keyword Analysis
      </h3>

      {matchedKeywords.length > 0 && (
        <div className="mb-4">
          <p style={{
            fontSize: 11,
            fontWeight: 700,
            color: 'var(--success-text)',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            marginBottom: 8
          }}>
            Matched ({matchedKeywords.length})
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {matchedKeywords.map((kw) => (
              <span key={kw} className="keyword-matched">{kw}</span>
            ))}
          </div>
        </div>
      )}

      {missingKeywords.length > 0 && (
        <div>
          <p style={{
            fontSize: 11,
            fontWeight: 700,
            color: 'var(--error-text)',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            marginBottom: 8
          }}>
            Missing ({missingKeywords.length})
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {missingKeywords.map((kw) => (
              <span key={kw} className="keyword-missing">{kw}</span>
            ))}
          </div>
        </div>
      )}

      {matchedKeywords.length === 0 && missingKeywords.length === 0 && (
        <p className="theme-muted text-sm">No keyword data available. Add a job description and re-analyze.</p>
      )}
    </div>
  );
}

export default KeywordPills;
