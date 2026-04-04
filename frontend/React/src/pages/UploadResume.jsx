import { useState, useRef } from "react";
import Navbar from "../components/Navbar";
import { incrementUserCounter } from "../services/firestoreUsers";
import { requestResumeApi } from "../api/resumeApi";
import { MESSAGES, RESUME_FILE_ACCEPT } from "../constants/resumeCheckerConstants";
import {
  isSupportedResumeFileType,
  isWithinResumeSizeLimit,
} from "../utils/resumeFileValidation";

export default function UploadResume({
  navigate,
  setAnalysisResult,
  user,
  guestAnalyzerUsed,
  consumeGuestAnalyzerTry,
  requireAuth,
  onLogout,
}) {
  const [file, setFile] = useState(null);
  const [jobDesc, setJobDesc] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef();

  const handleFile = (f) => {
    if (!f) {
      setError(MESSAGES.uploadRequired);
      return;
    }
    if (!isSupportedResumeFileType(f)) {
      setError(MESSAGES.uploadInvalidType);
      return;
    }
    if (!isWithinResumeSizeLimit(f)) {
      setError(MESSAGES.uploadSizeExceeded);
      return;
    }
    setError("");
    setFile(f);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
  };

  const handleAnalyze = async () => {
    if (!file) { setError("Please upload a resume first."); return; }
    if (!user) {
      if (guestAnalyzerUsed) {
        setError("Free analyzer try already used. Please register/login to continue.");
        requireAuth?.();
        return;
      }
    }
    setLoading(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append("file", file);
      if (jobDesc.trim()) formData.append("jobDescription", jobDesc.trim());

      const data = await requestResumeApi("/analyze", {
        method: "POST",
        body: formData,
      });
      if (!user) {
        const allowed = consumeGuestAnalyzerTry?.();
        if (!allowed) {
          setError("Free analyzer try already used. Please register/login to continue.");
          requireAuth?.();
          return;
        }
      }
      if (user?.uid) {
        incrementUserCounter(user.uid, "resumesChecked").catch(() => {
          // Metrics sync should not block analysis flow.
        });
      }
      setAnalysisResult(data);
      navigate("result");
    } catch (err) {
      setError(err.message || "Something went wrong. Make sure the backend is running.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Navbar navigate={navigate} user={user} onLogout={onLogout} />

      <div
        style={{
          maxWidth: 720,
          margin: "0 auto",
          padding: "4rem 2rem",
          animation: "fadeUp 0.6s ease",
        }}
      >
        {/* Header */}
        <div style={{ marginBottom: "2.5rem" }}>
          <div
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 11,
              color: "var(--g)",
              marginBottom: "0.75rem",
            }}
          >
            # analyze_resume()
          </div>
          <h1
            style={{
              fontSize: "clamp(1.8rem, 4vw, 2.6rem)",
              fontWeight: 700,
              marginBottom: "0.75rem",
            }}
          >
            Upload your resume.
          </h1>
          <p style={{ color: "var(--muted)", fontSize: 15, lineHeight: 1.7 }}>
            Get an instant ATS score, keyword analysis, and improvement tips.
            PDF, DOCX, or TXT supported.
          </p>
        </div>

        {/* Step indicator */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 0,
            marginBottom: "2.5rem",
          }}
        >
          {[
            { n: "1", label: "Upload", active: true },
            { n: "2", label: "Add JD", active: false },
            { n: "3", label: "Results", active: false },
          ].map((s, i, arr) => (
            <div key={s.n} style={{ display: "flex", alignItems: "center" }}>
              <div style={{ textAlign: "center" }}>
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontFamily: "var(--font-mono)",
                    fontSize: 12,
                    fontWeight: 600,
                    background: s.active ? "var(--g)" : "var(--d2)",
                    color: s.active ? "var(--dark)" : "var(--muted)",
                    border: `1.5px solid ${s.active ? "var(--g)" : "var(--border)"}`,
                    transition: "all 0.3s",
                  }}
                >
                  {s.n}
                </div>
                <div
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: 10,
                    color: "var(--muted)",
                    marginTop: 5,
                  }}
                >
                  {s.label}
                </div>
              </div>
              {i < arr.length - 1 && (
                <div
                  style={{
                    width: 60,
                    height: 1,
                    background: "var(--border)",
                    marginBottom: 16,
                    marginLeft: 4,
                    marginRight: 4,
                  }}
                />
              )}
            </div>
          ))}
        </div>

        {/* Drop Zone */}
        <div
          className={`drop-zone${dragOver ? " drag-over" : ""}`}
          onClick={() => fileRef.current.click()}
          onDrop={handleDrop}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          style={{ marginBottom: "1.5rem" }}
        >
          <input
            type="file"
            ref={fileRef}
            style={{ display: "none" }}
            accept={RESUME_FILE_ACCEPT}
            onChange={(e) => e.target.files[0] && handleFile(e.target.files[0])}
          />
          {file ? (
            <div>
              <div style={{ fontSize: "2.5rem", marginBottom: "0.75rem" }}>[FILE]</div>
              <div
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 14,
                  color: "var(--g)",
                  marginBottom: 6,
                }}
              >
                {file.name}
              </div>
              <div
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 11,
                  color: "var(--muted)",
                }}
              >
                {(file.size / 1024).toFixed(1)} KB -{" "}
                <span
                  style={{ color: "var(--r)", cursor: "pointer" }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setFile(null);
                  }}
                >
                  remove
                </span>
              </div>
            </div>
          ) : (
            <div>
              <div className="drop-icon">[UPLOAD]</div>
              <div className="drop-text">
                <strong>Click to browse</strong> or drag & drop your resume
              </div>
              <div
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 11,
                  color: "var(--muted)",
                  marginTop: 8,
                }}
              >
                PDF - DOCX - TXT supported
              </div>
            </div>
          )}
        </div>

        {/* Job Description */}
        <div style={{ marginBottom: "1.5rem" }}>
          <label className="form-label">
            job_description{" "}
            <span
              style={{
                color: "var(--muted)",
                fontFamily: "var(--font-mono)",
                fontSize: 10,
              }}
            >
              (optional - enables keyword matching)
            </span>
          </label>
          <textarea
            className="form-textarea"
            rows={5}
            placeholder="Paste the job description here..."
            value={jobDesc}
            onChange={(e) => setJobDesc(e.target.value)}
          />
        </div>

        {!user && (
          <div
            style={{
              background: "rgba(0,229,255,0.06)",
              border: "1px solid rgba(0,229,255,0.2)",
              borderRadius: 8,
              padding: "10px 14px",
              fontFamily: "var(--font-mono)",
              fontSize: 12,
              color: "var(--c)",
              marginBottom: "1rem",
            }}
          >
            guest_limit: analyzer tries left = {guestAnalyzerUsed ? 0 : 1}
          </div>
        )}

        {/* Error */}
        {error && (
          <div
            style={{
              background: "rgba(255,85,85,0.08)",
              border: "1px solid rgba(255,85,85,0.25)",
              borderRadius: 8,
              padding: "10px 14px",
              fontFamily: "var(--font-mono)",
              fontSize: 12,
              color: "var(--r)",
              marginBottom: "1.5rem",
            }}
          >
            x {error}
          </div>
        )}

        {/* Submit */}
        <button
          className="btn-primary"
          style={{ width: "100%", justifyContent: "center", fontSize: 14 }}
          onClick={handleAnalyze}
          disabled={loading}
        >
          {loading ? (
            <>
              <span
                style={{
                  display: "inline-block",
                  width: 14,
                  height: 14,
                  border: "2px solid var(--dark)",
                  borderTopColor: "transparent",
                  borderRadius: "50%",
                  animation: "spin 0.8s linear infinite",
                }}
              />
              analyzing...
            </>
          ) : (
            "-> run_ats_analysis()"
          )}
        </button>

        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );
}

