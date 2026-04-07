// Purpose: Normalize analysis records for API responses.
function toStringArray(value) {
  if (!Array.isArray(value)) return [];
  return value.map((item) => String(item || "").trim()).filter(Boolean);
}

function toAnalysisResponse(record = {}, options = {}) {
  const { includeText = true, includeOptimizedResume = true, includeStructuredResume = false } = options;

  const output = {
    id: record._id || record.id || null,
    userEmail: record.userEmail || 'anonymous',
    filename: record.filename || "",
    jobDescription: record.jobDescription || "",
    atsScore: Number.isFinite(Number(record.atsScore)) ? Number(record.atsScore) : 0,
    matchedKeywords: toStringArray(record.matchedKeywords),
    missingKeywords: toStringArray(record.missingKeywords),
    feedback: record.feedback || "",
    suggestions: toStringArray(record.suggestions),
    createdAt: record.createdAt || null,
  };

  if (includeText) {
    output.resumeText = String(record.resumeText || "");
  }

  if (includeOptimizedResume) {
    output.optimizedResume = String(record.optimizedResume || "");
  }

  if (includeStructuredResume) {
    output.structuredResume = record.structuredResume && typeof record.structuredResume === 'object'
      ? record.structuredResume
      : null;
  }

  return output;
}

module.exports = {
  toAnalysisResponse,
};
