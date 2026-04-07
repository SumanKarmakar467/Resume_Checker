const mongoose = require('mongoose');

const AnalysisRecordSchema = new mongoose.Schema(
  {
    userEmail: { type: String, required: true, trim: true, lowercase: true, index: true },
    filename: { type: String, default: '' },
    jobDescription: { type: String, default: '' },
    atsScore: { type: Number, default: 0 },
    analyzedAt: { type: Date, default: Date.now, index: true },
  },
  { versionKey: false }
);

module.exports = mongoose.model('AnalysisRecord', AnalysisRecordSchema);
