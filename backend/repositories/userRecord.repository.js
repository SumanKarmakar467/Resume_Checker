const UserRecord = require('../models/UserRecord');

async function upsertByEmail(email) {
  return UserRecord.findOneAndUpdate(
    { email },
    {
      $set: { lastActiveAt: new Date() },
      $setOnInsert: { createdAt: new Date() },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true, lean: true }
  );
}

async function findAll() {
  return UserRecord.find({}).sort({ createdAt: -1 }).lean();
}

module.exports = {
  upsertByEmail,
  findAll,
};
