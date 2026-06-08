import { useEffect, useState } from "react";

const STEPS = [
  { label: "Parsing document", sub: "Extracting resume text and structure" },
  { label: "Analyzing keywords", sub: "Matching against job requirements" },
  { label: "Scoring compatibility", sub: "Running ATS checks" },
  { label: "Generating suggestions", sub: "Building your personalized report" },
];

export default function LoadingScreen({ compact = false, progressLabel = "" }) {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const timers = STEPS.map((_, index) =>
      window.setTimeout(() => setCurrent(Math.min(index + 1, STEPS.length - 1)), index * 900)
    );
    return () => timers.forEach(window.clearTimeout);
  }, []);

  const activeStep = STEPS[Math.min(current, STEPS.length - 1)];

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: compact ? "32px 18px" : "80px 40px",
        minHeight: compact ? "auto" : "calc(100vh - 72px)",
        animation: "fadeIn 0.4s ease",
        textAlign: "center",
      }}
    >
      <div style={{ position: "relative", width: 120, height: 120, marginBottom: 36 }}>
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: "50%",
            border: "1.5px solid rgba(124,111,247,0.18)",
            animation: "spin 3s linear infinite",
          }}
        >
          <span
            style={{
              position: "absolute",
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: "#7c6ff7",
              top: -4,
              left: "50%",
              marginLeft: -4,
            }}
          />
        </div>
        <div
          style={{
            position: "absolute",
            inset: 14,
            borderRadius: "50%",
            border: "1.5px solid rgba(93,202,165,0.22)",
            animation: "spin 5s linear infinite reverse",
          }}
        >
          <span
            style={{
              position: "absolute",
              width: 7,
              height: 7,
              borderRadius: "50%",
              background: "#5dcaa5",
              top: "50%",
              right: -3.5,
              marginTop: -3.5,
            }}
          />
        </div>
        <div
          style={{
            position: "absolute",
            inset: 28,
            borderRadius: "50%",
            border: "1.5px solid rgba(239,159,39,0.18)",
            animation: "spin 2s linear infinite",
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 40,
            borderRadius: "50%",
            background: "rgba(124,111,247,0.15)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 18,
            color: "#7c6ff7",
            fontWeight: 500,
          }}
        >
          AI
        </div>
      </div>

      <div style={{ fontSize: 15, fontWeight: 500, color: "var(--text)", marginBottom: 8 }}>
        {progressLabel || `${activeStep.label}...`}
      </div>
      <div style={{ fontSize: 13, color: "var(--muted)", marginBottom: 30 }}>
        {activeStep.sub}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12, width: "100%", maxWidth: 340 }}>
        {STEPS.map((step, index) => {
          const done = index < current;
          const active = index === current;
          return (
            <div
              key={step.label}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                fontSize: 13,
                color: done ? "var(--muted)" : active ? "var(--text)" : "var(--muted)",
                transition: "all 0.3s",
              }}
            >
              <div
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: "50%",
                  flexShrink: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 11,
                  border: done
                    ? "1px solid #1d9e75"
                    : active
                      ? "1px solid #7c6ff7"
                      : "1px solid rgba(255,255,255,0.1)",
                  background: done
                    ? "rgba(29,158,117,0.1)"
                    : active
                      ? "rgba(124,111,247,0.1)"
                      : "transparent",
                  color: done ? "#5dcaa5" : active ? "#7c6ff7" : "rgba(255,255,255,0.2)",
                }}
              >
                {done ? "OK" : index + 1}
              </div>
              {step.label}
            </div>
          );
        })}
      </div>
    </div>
  );
}
