function SummaryCard({ label, value, tone = "default" }) {
  const colorMap = {
    default: "var(--c)",
    success: "#16a34a",
    warning: "#ca8a04",
    danger: "#dc2626",
  };

  return (
    <div className="card" style={{ padding: "0.9rem 1rem", minWidth: 180 }}>
      <div style={{ fontSize: 11, color: "var(--muted)", fontFamily: "var(--font-mono)" }}>{label}</div>
      <div style={{ marginTop: 6, fontSize: 24, fontWeight: 800, color: colorMap[tone] || colorMap.default }}>{value}</div>
    </div>
  );
}

export default function StatsSummary({ stats }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12, marginBottom: 16 }}>
      <SummaryCard label="Total Analyses" value={stats.total} />
      <SummaryCard label="Average ATS Score" value={`${stats.average}%`} tone="warning" />
      <SummaryCard label="Good Match (>=80)" value={stats.good} tone="success" />
      <SummaryCard label="Poor Match (<50)" value={stats.poor} tone="danger" />
    </div>
  );
}

