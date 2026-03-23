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
    userId: {
      type: mongoose.Schema.Types.Mixed,
      index: true,
      default: null
    },
    resumeFileName: String,
    jobTitle: String,
    atsScore: Number,
    overallScore: Number,
    sections: [sectionFeedbackSchema],
    matchedKeywords: [String],
    missingKeywords: [String],
    bestFitRole: String,
    roleSuggestion: String,
    panelScores: {
      contentScore: Number,
      sectionsScore: Number,
      atsEssentialsScore: Number,
      tailoringScore: Number
    },
    suggestions: [String],
    extractedText: String,
    jobDescription: String
  },
  { timestamps: true }
);

module.exports = mongoose.model('Analysis', analysisSchema);
