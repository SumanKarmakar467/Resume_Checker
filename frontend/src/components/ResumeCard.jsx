import { useState } from "react";

function formatDate(value) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "-";
  return parsed.toLocaleString();
}

function scoreStyle(score) {
  if (score >= 80) return { color: "#16a34a", border: "1px solid rgba(22,163,74,0.35)", bg: "rgba(22,163,74,0.08)" };
  if (score >= 50) return { color: "#ca8a04", border: "1px solid rgba(202,138,4,0.35)", bg: "rgba(202,138,4,0.1)" };
  return { color: "#dc2626", border: "1px solid rgba(220,38,38,0.35)", bg: "rgba(220,38,38,0.09)" };
}

export default function ResumeCard({ item, onDelete, deleting = false }) {
  const [expanded, setExpanded] = useState(false);
  const score = Number(item?.atsScore || 0);
  const style = scoreStyle(score);

  return (
    <div className="card" style={{ padding: "1rem" }}>
      <div style={{ display: "grid", gridTemplateColumns: "2fr 0.7fr 2fr 1.5fr auto", gap: 10, alignItems: "center" }}>
        <div>
          <div style={{ fontWeight: 700 }}>{item.fileName || item.filename || "resume"}</div>
        </div>
        <div style={{ borderRadius: 999, padding: "4px 10px", width: "fit-content", fontSize: 12, fontFamily: "var(--font-mono)", ...{ color: style.color, border: style.border, background: style.bg } }}>
          {score}%
        </div>
        <div style={{ color: "var(--muted)", fontSize: 13, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {item.jobDescription || "-"}
        </div>
        <div style={{ color: "var(--muted)", fontSize: 12 }}>{formatDate(item.analyzedAt || item.createdAt)}</div>
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button className="btn-ghost" onClick={() => setExpanded((value) => !value)}>
            {expanded ? "hide" : "view"}
          </button>
          <button className="btn-ghost" onClick={onDelete} disabled={deleting}>
            {deleting ? "deleting..." : "delete"}
          </button>
        </div>
      </div>

      {expanded ? (
        <div style={{ marginTop: 12, borderTop: "1px solid var(--border)", paddingTop: 12 }}>
          <div style={{ fontSize: 12, marginBottom: 8 }}>
            <strong>Status:</strong> {item.status || "COMPLETED"}
          </div>
          <div style={{ fontSize: 12, marginBottom: 8 }}>
            <strong>Matched Keywords:</strong> {(item.matchedKeywords || []).join(", ") || "-"}
          </div>
          <div style={{ fontSize: 12, marginBottom: 8 }}>
            <strong>Missing Keywords:</strong> {(item.missingKeywords || []).join(", ") || "-"}
          </div>
          <div style={{ fontSize: 12, color: "var(--muted)" }}>
            <strong style={{ color: "var(--text)" }}>Feedback:</strong> {item.feedback || "-"}
          </div>
        </div>
      ) : null}
    </div>
  );
}

