import { useEffect, useRef, useState } from "react";
import Navbar from "../components/Navbar";
import { incrementUserCounter } from "../services/firestoreUsers";
import { fetchPaymentStatus, requestBulkAnalyze, requestResumeApi } from "../api/resumeApi";
import { MESSAGES, RESUME_FILE_ACCEPT } from "../constants/resumeCheckerConstants";
import { isSupportedResumeFileType, isWithinResumeSizeLimit } from "../utils/resumeFileValidation";

function formatSize(bytes = 0) {
  return `${(Number(bytes || 0) / 1024).toFixed(1)} KB`;
}

function scoreColor(score) {
  if (score >= 80) return "#16a34a";
  if (score >= 50) return "#ca8a04";
  return "#dc2626";
}

export default function UploadResume({
  navigate,
  setAnalysisResult,
  user,
  guestAnalyzerUsed,
  consumeGuestAnalyzerTry,
  requireAuth,
  onLogout,
}) {
  const PRO_STORAGE_KEY = "resume_ai_is_pro";
  const [uploadMode, setUploadMode] = useState("single");
  const [file, setFile] = useState(null);
  const [bulkFiles, setBulkFiles] = useState([]);
  const [bulkResults, setBulkResults] = useState([]);
  const [bulkProgress, setBulkProgress] = useState({ current: 0, total: 0 });
  const [jobDesc, setJobDesc] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showProModal, setShowProModal] = useState(false);
  const [isPro, setIsPro] = useState(localStorage.getItem(PRO_STORAGE_KEY) === "true");
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef();
  const progressTimerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (progressTimerRef.current) {
        window.clearInterval(progressTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    const syncPro = async () => {
      if (!user?.email) {
        if (mounted) setIsPro(localStorage.getItem(PRO_STORAGE_KEY) === "true");
        return;
      }
      try {
        const result = await fetchPaymentStatus(user.email);
        if (!mounted) return;
        const pro = Boolean(result?.isPro);
        setIsPro(pro);
        localStorage.setItem(PRO_STORAGE_KEY, pro ? "true" : "false");
      } catch (_err) {
        if (mounted) setIsPro(localStorage.getItem(PRO_STORAGE_KEY) === "true");
      }
    };
    syncPro();
    return () => {
      mounted = false;
    };
  }, [user?.email]);

  const validateFile = (f) => {
    if (!f) return MESSAGES.uploadRequired;
    if (!isSupportedResumeFileType(f)) return MESSAGES.uploadInvalidType;
    if (!isWithinResumeSizeLimit(f)) return MESSAGES.uploadSizeExceeded;
    return "";
  };

  const handleFile = (f) => {
    const validationError = validateFile(f);
    if (validationError) {
      setError(validationError);
      return;
    }
    setError("");
    setFile(f);
  };

  const handleBulkFiles = (list) => {
    const next = [];
    for (const item of list) {
      const validationError = validateFile(item);
      if (validationError) {
        setError(validationError);
        continue;
      }
      next.push(item);
    }
    setError("");
    if (next.length) {
      setBulkFiles((prev) => [...prev, ...next]);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    if (uploadMode === "single") {
      if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
      return;
    }
    if (e.dataTransfer.files?.length) handleBulkFiles(Array.from(e.dataTransfer.files));
  };

  const runSingleAnalyze = async () => {
    if (!file) {
      setError("Please upload a resume first.");
      return;
    }
    if (!user && guestAnalyzerUsed) {
      setError("Free analyzer try already used. Please register/login to continue.");
      requireAuth?.();
      return;
    }

    setLoading(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append("file", file);
      if (jobDesc.trim()) formData.append("jobDescription", jobDesc.trim());
      formData.append("userEmail", user?.email || "anonymous");

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
        incrementUserCounter(user.uid, "resumesChecked").catch(() => {});
      }
      setAnalysisResult(data);
      navigate("result");
    } catch (err) {
      setError(err.message || "Something went wrong. Make sure the backend is running.");
    } finally {
      setLoading(false);
    }
  };

  const runBulkAnalyze = async () => {
    if (!isPro) {
      setShowProModal(true);
      return;
    }
    if (!bulkFiles.length) {
      setError("Please add at least one resume file.");
      return;
    }
    setLoading(true);
    setError("");
    setBulkResults([]);
    setBulkProgress({ current: 0, total: bulkFiles.length });
    let progressValue = 0;
    progressTimerRef.current = window.setInterval(() => {
      progressValue = Math.min(progressValue + 1, bulkFiles.length);
      setBulkProgress({ current: progressValue, total: bulkFiles.length });
    }, 450);

    try {
      const formData = new FormData();
      bulkFiles.forEach((item) => formData.append("files", item));
      if (jobDesc.trim()) formData.append("jobDescription", jobDesc.trim());
      formData.append("userEmail", user?.email || "anonymous");

      const data = await requestBulkAnalyze(formData);
      setBulkResults(Array.isArray(data) ? data : []);
      setBulkProgress({ current: bulkFiles.length, total: bulkFiles.length });

      if (user?.uid) {
        incrementUserCounter(user.uid, "resumesChecked").catch(() => {});
      }
    } catch (err) {
      setError(err.message || "Bulk analysis failed.");
    } finally {
      if (progressTimerRef.current) {
        window.clearInterval(progressTimerRef.current);
        progressTimerRef.current = null;
      }
      setLoading(false);
    }
  };

  const handleAnalyze = async () => {
    if (uploadMode === "single") {
      await runSingleAnalyze();
      return;
    }
    await runBulkAnalyze();
  };

  const totalBulk = bulkProgress.total;
  const currentBulk = Math.min(bulkProgress.current, totalBulk);

  return (
    <div>
      <Navbar navigate={navigate} user={user} onLogout={onLogout} />

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "3rem 2rem", animation: "fadeUp 0.6s ease" }}>
        <div style={{ marginBottom: "1.5rem" }}>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--g)", marginBottom: "0.75rem" }}>
            # analyze_resume()
          </div>
          <h1 style={{ fontSize: "clamp(1.8rem, 4vw, 2.6rem)", fontWeight: 700, marginBottom: "0.75rem" }}>
            Upload your resume
          </h1>
          <p style={{ color: "var(--muted)", fontSize: 15, lineHeight: 1.7 }}>
            Single mode keeps your original flow. Bulk mode analyzes multiple resumes in one run.
          </p>
        </div>

        <div className="card" style={{ padding: "0.8rem", marginBottom: "1rem", display: "flex", gap: 8 }}>
          <button
            className={uploadMode === "single" ? "btn-primary" : "btn-ghost"}
            onClick={() => {
              setUploadMode("single");
              setError("");
            }}
          >
            Single Upload
          </button>
          <button
            className={uploadMode === "bulk" ? "btn-primary" : "btn-ghost"}
            onClick={() => {
              if (!isPro) {
                setShowProModal(true);
                return;
              }
              setUploadMode("bulk");
              setError("");
            }}
          >
            Bulk Upload
          </button>
        </div>

        <div
          className={`drop-zone${dragOver ? " drag-over" : ""}`}
          onClick={() => fileRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          style={{ marginBottom: "1rem" }}
        >
          <input
            type="file"
            ref={fileRef}
            style={{ display: "none" }}
            accept={RESUME_FILE_ACCEPT}
            multiple={uploadMode === "bulk"}
            onChange={(e) => {
              const files = Array.from(e.target.files || []);
              if (!files.length) return;
              if (uploadMode === "single") {
                handleFile(files[0]);
              } else {
                handleBulkFiles(files);
              }
            }}
          />

          {uploadMode === "single" ? (
            file ? (
              <div>
                <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>[FILE]</div>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: 14, color: "var(--g)", marginBottom: 6 }}>{file.name}</div>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--muted)" }}>
                  {formatSize(file.size)} -{" "}
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
              </div>
            )
          ) : (
            <div>
              <div className="drop-icon">[BULK]</div>
              <div className="drop-text">
                <strong>Click to select multiple files</strong> or drag & drop
              </div>
            </div>
          )}
        </div>

        {uploadMode === "bulk" && bulkFiles.length ? (
          <div className="card" style={{ padding: "0.9rem", marginBottom: "1rem" }}>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--g)", marginBottom: 8 }}>
              selected_files({bulkFiles.length})
            </div>
            <div style={{ display: "grid", gap: 6 }}>
              {bulkFiles.map((item, index) => (
                <div key={`${item.name}-${index}`} style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                  <div style={{ fontSize: 13 }}>{item.name}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 11, color: "var(--muted)" }}>{formatSize(item.size)}</span>
                    <button
                      className="btn-ghost"
                      onClick={() => setBulkFiles((prev) => prev.filter((_, i) => i !== index))}
                      style={{ padding: "4px 10px" }}
                    >
                      remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        <div style={{ marginBottom: "1rem" }}>
          <label className="form-label">job_description (optional)</label>
          <textarea
            className="form-textarea"
            rows={5}
            placeholder="Paste the job description here..."
            value={jobDesc}
            onChange={(e) => setJobDesc(e.target.value)}
          />
        </div>

        {!user ? (
          <div style={{ background: "rgba(0,229,255,0.06)", border: "1px solid rgba(0,229,255,0.2)", borderRadius: 8, padding: "10px 14px", fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--c)", marginBottom: "1rem" }}>
            guest_limit: analyzer tries left = {guestAnalyzerUsed ? 0 : 1}
          </div>
        ) : null}

        {error ? (
          <div style={{ background: "rgba(255,85,85,0.08)", border: "1px solid rgba(255,85,85,0.25)", borderRadius: 8, padding: "10px 14px", fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--r)", marginBottom: "1rem" }}>
            x {error}
          </div>
        ) : null}

        {loading && uploadMode === "bulk" && totalBulk > 0 ? (
          <div className="card" style={{ padding: "0.8rem", marginBottom: "1rem", fontFamily: "var(--font-mono)", fontSize: 12 }}>
            Analyzing {currentBulk} of {totalBulk} resumes...
          </div>
        ) : null}

        <button className="btn-primary" style={{ width: "100%", justifyContent: "center", fontSize: 14 }} onClick={handleAnalyze} disabled={loading}>
          {loading ? "analyzing..." : uploadMode === "single" ? "-> run_ats_analysis()" : "-> run_bulk_analysis()"}
        </button>

        {uploadMode === "bulk" && bulkResults.length ? (
          <div className="card" style={{ padding: "1rem", marginTop: "1rem" }}>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--g)", marginBottom: 8 }}>
              bulk_results({bulkResults.length})
            </div>
            <div style={{ display: "grid", gap: 7 }}>
              {bulkResults.map((item, index) => (
                <div key={`${item.id || item.fileName || index}`} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: 10, alignItems: "center", borderBottom: "1px solid var(--border)", paddingBottom: 7 }}>
                  <div style={{ fontSize: 13 }}>{item.fileName || item.filename || "resume"}</div>
                  <div style={{ fontFamily: "var(--font-mono)", color: scoreColor(Number(item.atsScore || 0)) }}>
                    {Number(item.atsScore || 0)}%
                  </div>
                  <div style={{ fontSize: 12, color: item.status === "FAILED" ? "#dc2626" : "#16a34a" }}>{item.status || "COMPLETED"}</div>
                </div>
              ))}
            </div>
            <button className="btn-secondary" onClick={() => navigate("history")} style={{ marginTop: 12 }}>
              Go to Dashboard
            </button>
          </div>
        ) : null}
      </div>

      {showProModal ? (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(2, 6, 23, 0.65)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 500,
            padding: 16,
          }}
        >
          <div className="card" style={{ maxWidth: 460, width: "100%", padding: "1.1rem" }}>
            <h3 style={{ marginBottom: 8 }}>This is a Pro feature</h3>
            <p style={{ color: "var(--muted)", marginBottom: 12 }}>
              Bulk upload is available in the Pro one-time plan.
            </p>
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button className="btn-ghost" onClick={() => setShowProModal(false)}>
                close
              </button>
              <button
                className="btn-primary"
                onClick={() => {
                  setShowProModal(false);
                  navigate("pricing");
                }}
              >
                go_to_pricing()
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
