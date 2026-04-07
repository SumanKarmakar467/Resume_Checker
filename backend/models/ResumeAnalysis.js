// Purpose: Persist ATS analysis outputs for history and reporting.
const mongoose = require('mongoose');

const ResumeAnalysisSchema = new mongoose.Schema({
  userEmail: { type: String, default: 'anonymous', lowercase: true, trim: true },
  filename: String,
  resumeText: String,
  jobDescription: String,
  atsScore: Number,
  matchedKeywords: [String],
  missingKeywords: [String],
  feedback: String,
  suggestions: [String],
  optimizedResume: String,
  structuredResume: {
    name: String,
    email: String,
    phone: String,
    linkedin: String,
    github: String,
    summary: String,
    skills: [String],
    experience: [
      {
        title: String,
        company: String,
        duration: String,
        description: String,
      },
    ],
    education: [
      {
        degree: String,
        institution: String,
        year: String,
      },
    ],
    certifications: [String],
    projects: [
      {
        name: String,
        description: String,
        techStack: String,
      },
    ],
  },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('ResumeAnalysis', ResumeAnalysisSchema);
