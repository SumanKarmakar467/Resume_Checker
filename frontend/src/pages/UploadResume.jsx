import { useEffect, useRef, useState } from "react";
import Navbar from "../components/Navbar";
import LoadingScreen from "../components/LoadingScreen";
import { incrementUserCounter } from "../services/firestoreUsers";
import { fetchPaymentStatus, requestBulkAnalyze, requestResumeApi } from "../api/resumeApi";
import { MESSAGES, RESUME_FILE_ACCEPT } from "../constants/resumeCheckerConstants";
import { isSupportedResumeFileType, isWithinResumeSizeLimit } from "../utils/resumeFileValidation";

const PRO_STORAGE_KEY = "resume_ai_is_pro";

function formatSize(bytes = 0) {
  return `${(Number(bytes || 0) / 1024).toFixed(1)} KB`;
}

function scoreColor(score) {
  if (score >= 80) return "#5dcaa5";
  if (score >= 50) return "#ef9f27";
  return "#e24b4a";
}

function modeButtonStyle(active) {
  return {
    flex: 1,
    borderRadius: 12,
    border: active ? "0.5px solid rgba(124,111,247,0.45)" : "0.5px solid rgba(255,255,255,0.08)",
    background: active ? "rgba(124,111,247,0.18)" : "rgba(255,255,255,0.03)",
    color: active ? "#fff" : "rgba(255,255,255,0.55)",
    padding: "12px 14px",
    cursor: "pointer",
    fontFamily: "inherit",
    fontSize: 13,
    fontWeight: 500,
    transition: "all 0.2s ease",
  };
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

  const validateFile = (candidate) => {
    if (!candidate) return MESSAGES.uploadRequired;
    if (!isSupportedResumeFileType(candidate)) return MESSAGES.uploadInvalidType;
    if (!isWithinResumeSizeLimit(candidate)) return MESSAGES.uploadSizeExceeded;
    return "";
  };

  const handleFile = (candidate) => {
    const validationError = validateFile(candidate);
    if (validationError) {
      setError(validationError);
      return;
    }
    setError("");
    setFile(candidate);
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
    if (next.length) {
      setError("");
      setBulkFiles((prev) => [...prev, ...next]);
    }
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setDragOver(false);
    if (uploadMode === "single") {
      if (event.dataTransfer.files[0]) handleFile(event.dataTransfer.files[0]);
      return;
    }
    if (event.dataTransfer.files?.length) handleBulkFiles(Array.from(event.dataTransfer.files));
  };

  const runSingleAnalyze = async () => {
    if (!file) {
      setError("Please upload a resume first.");
      return;
    }
    if (!user && guestAnalyzerUsed) {
      setError("Free analyzer try already used. Please register or login to continue.");
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
          setError("Free analyzer try already used. Please register or login to continue.");
          requireAuth?.();
          return;
        }
      }
      if (user?.uid) {
        incrementUserCounter(user.uid, "resumesChecked").catch(() => {});
      }
      setAnalysisResult(data);
      window.setTimeout(() => navigate("result"), 700);
    } catch (err) {
      setError(err.message || "Something went wrong. Make sure the backend is running.");
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

      {loading && uploadMode === "single" ? (
        <LoadingScreen />
      ) : (
        <main style={{ textAlign: "center", padding: "72px 24px 56px", animation: "slideUp 0.6s ease" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              fontSize: 12,
              color: "#9d94fa",
              background: "rgba(124,111,247,0.1)",
              border: "0.5px solid rgba(124,111,247,0.25)",
              padding: "5px 14px",
              borderRadius: 20,
              marginBottom: 28,
            }}
          >
            Smart resume analysis
          </div>

          <h1
            style={{
              fontSize: "clamp(2.3rem, 6vw, 3rem)",
              fontWeight: 500,
              lineHeight: 1.15,
              color: "#fff",
              marginBottom: 16,
              letterSpacing: 0,
            }}
          >
            Beat the ATS,
            <br />
            land the <span style={{ color: "#7c6ff7" }}>interview</span>
          </h1>
          <p
            style={{
              fontSize: 16,
              color: "rgba(255,255,255,0.42)",
              maxWidth: 560,
              margin: "0 auto 42px",
              lineHeight: 1.7,
            }}
          >
            Upload your resume and get instant feedback on compatibility, keyword gaps, formatting, and improvements.
          </p>

          <section style={{ maxWidth: 620, margin: "0 auto", textAlign: "left" }}>
            <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
              <button
                style={modeButtonStyle(uploadMode === "single")}
                onClick={() => {
                  setUploadMode("single");
                  setError("");
                }}
              >
                Single upload
              </button>
              <button
                style={modeButtonStyle(uploadMode === "bulk")}
                onClick={() => {
                  if (!isPro) {
                    setShowProModal(true);
                    return;
                  }
                  setUploadMode("bulk");
                  setError("");
                }}
              >
                Bulk upload
              </button>
            </div>

            <div
              onClick={() => fileRef.current?.click()}
              onDragOver={(event) => {
                event.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              style={{
                border: `1.5px dashed ${dragOver ? "#7c6ff7" : "rgba(124,111,247,0.35)"}`,
                borderRadius: 20,
                padding: "48px 32px",
                cursor: "pointer",
                background: dragOver ? "rgba(124,111,247,0.08)" : "rgba(124,111,247,0.03)",
                transform: dragOver ? "scale(1.01)" : "scale(1)",
                transition: "all 0.3s ease",
                textAlign: "center",
              }}
            >
              <input
                ref={fileRef}
                type="file"
                accept={RESUME_FILE_ACCEPT}
                multiple={uploadMode === "bulk"}
                style={{ display: "none" }}
                onChange={(event) => {
                  const files = Array.from(event.target.files || []);
                  if (!files.length) return;
                  if (uploadMode === "single") {
                    handleFile(files[0]);
                  } else {
                    handleBulkFiles(files);
                  }
                }}
              />

              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 16,
                  background: "rgba(124,111,247,0.12)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 20px",
                  fontSize: 24,
                  color: "#7c6ff7",
                  animation: "float 3s ease-in-out infinite",
                }}
              >
                UP
              </div>
              <div style={{ fontSize: 16, fontWeight: 500, color: "#fff", marginBottom: 8 }}>
                {uploadMode === "single"
                  ? file?.name || "Drop your resume here"
                  : bulkFiles.length
                    ? `${bulkFiles.length} resumes selected`
                    : "Drop multiple resumes here"}
              </div>
              <div style={{ fontSize: 13, color: "rgba(255,255,255,0.35)" }}>
                {uploadMode === "single" && file
                  ? "Ready to analyze"
                  : "or browse files from your computer"}
              </div>
              <div style={{ display: "flex", gap: 8, justifyContent: "center", marginTop: 20 }}>
                {["PDF", "DOCX", "TXT"].map((type) => (
                  <span
                    key={type}
                    style={{
                      fontSize: 11,
                      padding: "3px 10px",
                      borderRadius: 6,
                      background: "rgba(255,255,255,0.05)",
                      color: "rgba(255,255,255,0.4)",
                      border: "0.5px solid rgba(255,255,255,0.08)",
                    }}
                  >
                    {type}
                  </span>
                ))}
              </div>
            </div>

            {uploadMode === "single" && file ? (
              <button
                className="btn-ghost"
                style={{ marginTop: 10 }}
                onClick={() => setFile(null)}
              >
                Remove {formatSize(file.size)}
              </button>
            ) : null}

            {uploadMode === "bulk" && bulkFiles.length ? (
              <div className="card" style={{ padding: 16, marginTop: 16 }}>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.42)", marginBottom: 10 }}>
                  Selected files ({bulkFiles.length})
                </div>
                <div style={{ display: "grid", gap: 8 }}>
                  {bulkFiles.map((item, index) => (
                    <div
                      key={`${item.name}-${index}`}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: 10,
                        color: "rgba(255,255,255,0.72)",
                        fontSize: 13,
                      }}
                    >
                      <span>{item.name}</span>
                      <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <small style={{ color: "rgba(255,255,255,0.35)" }}>{formatSize(item.size)}</small>
                        <button
                          className="btn-ghost"
                          onClick={() => setBulkFiles((prev) => prev.filter((_, fileIndex) => fileIndex !== index))}
                          style={{ padding: "4px 10px" }}
                        >
                          Remove
                        </button>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            <div style={{ marginTop: 20 }}>
              <div
                style={{
                  fontSize: 13,
                  color: "rgba(255,255,255,0.42)",
                  marginBottom: 8,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                Job description
                <span
                  style={{
                    fontSize: 10,
                    background: "rgba(255,255,255,0.06)",
                    padding: "2px 7px",
                    borderRadius: 4,
                    color: "rgba(255,255,255,0.3)",
                  }}
                >
                  optional
                </span>
              </div>
              <textarea
                value={jobDesc}
                onChange={(event) => setJobDesc(event.target.value)}
                placeholder="Paste the job description here to get a targeted compatibility score..."
                style={{
                  width: "100%",
                  background: "rgba(255,255,255,0.03)",
                  border: "0.5px solid rgba(255,255,255,0.08)",
                  borderRadius: 12,
                  padding: "14px 16px",
                  color: "#e8e8f0",
                  fontSize: 14,
                  fontFamily: "inherit",
                  resize: "vertical",
                  minHeight: 110,
                  outline: "none",
                  transition: "border-color 0.2s",
                }}
                onFocus={(event) => {
                  event.currentTarget.style.borderColor = "rgba(124,111,247,0.5)";
                }}
                onBlur={(event) => {
                  event.currentTarget.style.borderColor = "rgba(255,255,255,0.08)";
                }}
              />
            </div>

            {!user ? (
              <div
                style={{
                  background: "rgba(93,202,165,0.08)",
                  border: "0.5px solid rgba(93,202,165,0.24)",
                  borderRadius: 12,
                  padding: "10px 14px",
                  fontSize: 12,
                  color: "#5dcaa5",
                  marginTop: 16,
                }}
              >
                Guest analyzer tries left: {guestAnalyzerUsed ? 0 : 1}
              </div>
            ) : null}

            {error ? (
              <div
                style={{
                  background: "rgba(226,75,74,0.1)",
                  border: "0.5px solid rgba(226,75,74,0.28)",
                  borderRadius: 12,
                  padding: "10px 14px",
                  fontSize: 13,
                  color: "#f09595",
                  marginTop: 16,
                }}
              >
                {error}
              </div>
            ) : null}

            {loading && uploadMode === "bulk" && totalBulk > 0 ? (
              <div className="card" style={{ padding: 16, marginTop: 16 }}>
                <LoadingScreen compact progressLabel={`Analyzing ${currentBulk} of ${totalBulk} resumes...`} />
              </div>
            ) : null}

            <button
              onClick={handleAnalyze}
              disabled={loading || (uploadMode === "single" ? !file : !bulkFiles.length)}
              style={{
                display: "block",
                width: "100%",
                marginTop: 20,
                padding: 16,
                borderRadius: 14,
                background:
                  loading || (uploadMode === "single" ? !file : !bulkFiles.length)
                    ? "rgba(124,111,247,0.3)"
                    : "#7c6ff7",
                border: "none",
                color: "#fff",
                fontSize: 15,
                fontWeight: 500,
                cursor: loading || (uploadMode === "single" ? !file : !bulkFiles.length) ? "not-allowed" : "pointer",
                fontFamily: "inherit",
                transition: "all 0.2s",
              }}
            >
              {loading ? "Analyzing..." : uploadMode === "single" ? "Analyze my resume" : "Analyze selected resumes"}
            </button>

            {uploadMode === "bulk" && bulkResults.length ? (
              <div className="card" style={{ padding: 18, marginTop: 20 }}>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.42)", marginBottom: 12 }}>
                  Bulk results ({bulkResults.length})
                </div>
                <div style={{ display: "grid", gap: 9 }}>
                  {bulkResults.map((item, index) => (
                    <div
                      key={`${item.id || item.fileName || index}`}
                      style={{
                        display: "grid",
                        gridTemplateColumns: "minmax(0, 2fr) 80px 92px",
                        gap: 10,
                        alignItems: "center",
                        color: "rgba(255,255,255,0.72)",
                        borderBottom: "0.5px solid rgba(255,255,255,0.07)",
                        paddingBottom: 9,
                      }}
                    >
                      <div style={{ fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {item.fileName || item.filename || "resume"}
                      </div>
                      <div style={{ color: scoreColor(Number(item.atsScore || 0)), fontWeight: 500 }}>
                        {Number(item.atsScore || 0)}%
                      </div>
                      <div style={{ fontSize: 12, color: item.status === "FAILED" ? "#f09595" : "#5dcaa5" }}>
                        {item.status || "COMPLETED"}
                      </div>
                    </div>
                  ))}
                </div>
                <button className="btn-secondary" onClick={() => navigate("history")} style={{ marginTop: 14 }}>
                  Go to dashboard
                </button>
              </div>
            ) : null}
          </section>
        </main>
      )}

      {showProModal ? (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(10,10,15,0.78)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 500,
            padding: 16,
          }}
        >
          <div className="card" style={{ maxWidth: 460, width: "100%", padding: 22 }}>
            <h3 style={{ marginBottom: 8, color: "#fff", fontWeight: 500 }}>This is a Pro feature</h3>
            <p style={{ color: "rgba(255,255,255,0.46)", marginBottom: 16 }}>
              Bulk upload is available in the Pro one-time plan.
            </p>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button className="btn-ghost" onClick={() => setShowProModal(false)}>
                Close
              </button>
              <button
                className="btn-primary"
                onClick={() => {
                  setShowProModal(false);
                  navigate("pricing");
                }}
              >
                View pricing
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
