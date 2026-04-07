const AnalysisRecord = require('../models/AnalysisRecord');

async function createRecord(payload = {}) {
  const created = await AnalysisRecord.create(payload);
  return created.toObject();
}

async function findAll() {
  return AnalysisRecord.find({}).sort({ analyzedAt: -1 }).lean();
}

module.exports = {
  createRecord,
  findAll,
};
