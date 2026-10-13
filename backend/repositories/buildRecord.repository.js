const BuildRecord = require('../models/BuildRecord');

async function createRecord(payload = {}) {
  const created = await BuildRecord.create(payload);
  return created.toObject();
}

async function incrementDownload(buildId) {
  return BuildRecord.findByIdAndUpdate(
    buildId,
    { $inc: { downloadCount: 1 } },
    { new: true, lean: true }
  );
}

async function findAll() {
  return BuildRecord.find({}).sort({ builtAt: -1 }).lean();
}

module.exports = {
  createRecord,
  incrementDownload,
  findAll,
};
