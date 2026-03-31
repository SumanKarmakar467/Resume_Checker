// Purpose: Persist ATS analysis outputs for history and reporting.
const mongoose = require('mongoose');

const ResumeAnalysisSchema = new mongoose.Schema({
  filename: String,
  resumeText: String,
  jobDescription: String,
  atsScore: Number,
  matchedKeywords: [String],
  missingKeywords: [String],
  feedback: String,
  suggestions: [String],
  optimizedResume: String,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('ResumeAnalysis', ResumeAnalysisSchema);
