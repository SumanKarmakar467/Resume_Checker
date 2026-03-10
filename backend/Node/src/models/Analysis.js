const mongoose = require('mongoose');

const sectionFeedbackSchema = new mongoose.Schema(
  {
    section: String,
    score: Number,
    status: String,
    issues: [String],
    suggestions: [String]
  },
  { _id: false }
);

const analysisSchema = new mongoose.Schema(
  {
    overallScore: Number,
    sections: [sectionFeedbackSchema],
    missingKeywords: [String],
    suggestions: [String],
    extractedText: String,
    jobDescription: String
  },
  { timestamps: true }
);

module.exports = mongoose.model('Analysis', analysisSchema);
