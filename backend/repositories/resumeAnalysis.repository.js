const ResumeAnalysis = require('../models/ResumeAnalysis');

async function createRecord(payload = {}) {
  return ResumeAnalysis.create(payload);
}

async function findAllNewestFirst(limit = 100) {
  const safeLimit = Number.isFinite(Number(limit)) ? Math.min(Math.max(Number(limit), 1), 500) : 100;
  return ResumeAnalysis.find({}).sort({ analyzedAt: -1, createdAt: -1 }).limit(safeLimit).lean();
}

async function findByMinScore(minScore = 0, limit = 100) {
  const safeScore = Number.isFinite(Number(minScore)) ? Math.max(0, Math.round(Number(minScore))) : 0;
  const safeLimit = Number.isFinite(Number(limit)) ? Math.min(Math.max(Number(limit), 1), 500) : 100;
  return ResumeAnalysis.find({ atsScore: { $gte: safeScore } })
    .sort({ analyzedAt: -1, createdAt: -1 })
    .limit(safeLimit)
    .lean();
}

async function deleteById(id) {
  return ResumeAnalysis.findByIdAndDelete(id);
}

module.exports = {
  createRecord,
  findAllNewestFirst,
  findByMinScore,
  deleteById,
};

