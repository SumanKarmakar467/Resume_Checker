const usersByEmail = new Map();
const historyByUserId = new Map();

let sequence = 1;

function nextId(prefix) {
  const value = `${prefix}_${Date.now()}_${sequence}`;
  sequence += 1;
  return value;
}

function createUser(email, passwordHash) {
  const normalizedEmail = String(email || '').toLowerCase().trim();
  if (!normalizedEmail) {
    throw new Error('Email is required.');
  }
  if (usersByEmail.has(normalizedEmail)) {
    throw new Error('User already exists.');
  }

  const now = new Date();
  const user = {
    id: nextId('usr'),
    email: normalizedEmail,
    passwordHash,
    createdAt: now,
    updatedAt: now
  };
  usersByEmail.set(normalizedEmail, user);
  return user;
}

function findUserByEmail(email) {
  const normalizedEmail = String(email || '').toLowerCase().trim();
  if (!normalizedEmail) return null;
  return usersByEmail.get(normalizedEmail) || null;
}

function saveAnalysisForUser(userId, analysisPayload) {
  if (!userId) return null;

  const collection = historyByUserId.get(userId) || [];
  const now = new Date();
  const record = {
    id: nextId('analysis'),
    createdAt: now,
    updatedAt: now,
    ...analysisPayload
  };

  collection.unshift(record);
  historyByUserId.set(userId, collection.slice(0, 50));
  return record;
}

function getHistoryForUser(userId, limit = 10) {
  const collection = historyByUserId.get(userId) || [];
  return collection.slice(0, Math.max(1, limit));
}

function deleteHistoryItemForUser(userId, itemId) {
  const collection = historyByUserId.get(userId) || [];
  const next = collection.filter((item) => item.id !== itemId);
  historyByUserId.set(userId, next);
  return next.length !== collection.length;
}

module.exports = {
  createUser,
  findUserByEmail,
  saveAnalysisForUser,
  getHistoryForUser,
  deleteHistoryItemForUser
};
