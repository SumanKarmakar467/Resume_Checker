const UserRecord = require('../models/UserRecord');

async function upsertByEmail(email) {
  return UserRecord.findOneAndUpdate(
    { email },
    {
      $set: { lastActiveAt: new Date() },
      $setOnInsert: { createdAt: new Date(), plan: 'FREE', isPro: false },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true, lean: true }
  );
}

async function markProByEmail(email) {
  return UserRecord.findOneAndUpdate(
    { email },
    {
      $set: {
        isPro: true,
        plan: 'PRO',
        proActivatedAt: new Date(),
        lastActiveAt: new Date(),
      },
      $setOnInsert: { createdAt: new Date() },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true, lean: true }
  );
}

async function findByEmail(email) {
  return UserRecord.findOne({ email }).lean();
}

async function findAll() {
  return UserRecord.find({}).sort({ createdAt: -1 }).lean();
}

module.exports = {
  upsertByEmail,
  markProByEmail,
  findByEmail,
  findAll,
};
