function ScoreMeter({ score = 0 }) {
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  const color =
    score >= 80 ? '#15803d' :
    score >= 65 ? '#d97706' :
    '#dc2626';

  const bgColor =
    score >= 80 ? '#dcfce7' :
    score >= 65 ? '#fef9c3' :
    '#fee2e2';

  const label =
    score >= 80 ? 'Strong' :
    score >= 65 ? 'Good' :
    'Needs Work';

  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ position: 'relative', width: 130, height: 130, margin: '0 auto' }}>
        <svg width="130" height="130" viewBox="0 0 130 130" style={{ transform: 'rotate(-90deg)' }}>
          <circle
            cx="65" cy="65" r={radius}
            fill="none"
            stroke="var(--score-track)"
            strokeWidth="10"
          />
          <circle
            cx="65" cy="65" r={radius}
            fill="none"
            stroke={color}
            strokeWidth="10"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="score-meter-ring"
          />
        </svg>
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          textAlign: 'center'
        }}>
          <span style={{ fontSize: 30, fontWeight: 800, color, lineHeight: 1 }}>{score}</span>
          <small style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block' }}>/100</small>
        </div>
      </div>
      <div style={{
        marginTop: 8,
        display: 'inline-block',
        background: bgColor,
        color,
        border: `1px solid ${color}40`,
        borderRadius: 20,
        fontSize: 12,
        fontWeight: 700,
        padding: '3px 12px'
      }}>
        {label}
      </div>
    </div>
  );
}

export default ScoreMeter;
