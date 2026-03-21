// Purpose: Render an animated ATS score meter with color-coded ring.
import { useEffect, useMemo, useState } from 'react';

const clampScore = (value) => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return 0;
  return Math.max(0, Math.min(100, Math.round(numeric)));
};

const scoreColor = (score) => {
  if (score < 50) return '#EF4444';
  if (score < 75) return '#F59E0B';
  return '#22C55E';
};

function ScoreMeter({ score = 0 }) {
  const safeScore = useMemo(() => clampScore(score), [score]);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => setProgress(safeScore), 40);
    return () => clearTimeout(timer);
  }, [safeScore]);

  const radius = 52;
  const center = 70;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (progress / 100) * circumference;
  const ringColor = scoreColor(safeScore);

  return (
    <div className="flex flex-col items-center">
      <svg width="140" height="140" role="img" aria-label={`ATS score ${safeScore} out of 100`}>
        <circle cx={center} cy={center} r={radius} fill="none" stroke="var(--border-color)" strokeWidth="12" />
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={ringColor}
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          style={{ transition: 'stroke-dashoffset 1.2s ease-out' }}
          transform={`rotate(-90 ${center} ${center})`}
        />
        <text
          x="50%"
          y="50%"
          textAnchor="middle"
          dominantBaseline="middle"
          style={{ fill: ringColor, fontSize: '28px', fontWeight: 800 }}
        >
          {safeScore}
        </text>
      </svg>
      <p className="mt-2 text-sm font-semibold">ATS Compatibility Score</p>
    </div>
  );
}

export default ScoreMeter;
