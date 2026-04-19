function SuggestionCard({ suggestion }) {
  if (!suggestion) return null;

  const original = suggestion.originalLine || suggestion.original_line || '';
  const improved = suggestion.improvedLine || suggestion.improved_line || '';
  const reason = suggestion.reason || '';
  const section = suggestion.section || '';

  return (
    <div className="suggestion-card">
      {section && (
        <span style={{
          display: 'inline-block',
          background: 'var(--accent-bg)',
          color: 'var(--accent)',
          border: '1px solid var(--accent-border)',
          borderRadius: 20,
          fontSize: 10,
          fontWeight: 700,
          padding: '2px 9px',
          marginBottom: 10,
          textTransform: 'uppercase',
          letterSpacing: '0.4px'
        }}>
          {section}
        </span>
      )}

      {original && (
        <div style={{ marginBottom: 10 }}>
          <p style={{
            fontSize: 10,
            fontWeight: 700,
            color: 'var(--error-text)',
            textTransform: 'uppercase',
            letterSpacing: '0.4px',
            marginBottom: 4
          }}>
            Current
          </p>
          <p style={{
            fontSize: 12,
            color: 'var(--text-secondary)',
            background: 'var(--error-bg)',
            border: '1px solid var(--error-border)',
            borderRadius: 8,
            padding: '8px 10px',
            lineHeight: 1.6
          }}>
            {original}
          </p>
        </div>
      )}

      {improved && (
        <div style={{ marginBottom: 10 }}>
          <p style={{
            fontSize: 10,
            fontWeight: 700,
            color: 'var(--success-text)',
            textTransform: 'uppercase',
            letterSpacing: '0.4px',
            marginBottom: 4
          }}>
            Suggested
          </p>
          <p style={{
            fontSize: 12,
            color: 'var(--text-secondary)',
            background: 'var(--success-bg)',
            border: '1px solid var(--success-border)',
            borderRadius: 8,
            padding: '8px 10px',
            lineHeight: 1.6
          }}>
            {improved}
          </p>
        </div>
      )}

      {reason && (
        <p style={{
          fontSize: 11,
          color: 'var(--text-muted)',
          lineHeight: 1.6,
          borderTop: '1px solid var(--border-color)',
          paddingTop: 8,
          marginTop: 4
        }}>
          {reason}
        </p>
      )}
    </div>
  );
}

export default SuggestionCard;
