// Purpose: Lightweight in-memory fallback for analysis history when MongoDB is unavailable.
const memoryHistory = [];

function saveHistory(record) {
  const item = {
    ...record,
    _id: `mem_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    createdAt: record.createdAt || new Date().toISOString(),
  };

  memoryHistory.unshift(item);
  return item;
}

function getHistory(limit = 25) {
  const safeLimit = Number.isFinite(Number(limit)) ? Math.min(Math.max(Number(limit), 1), 100) : 25;
  return memoryHistory.slice(0, safeLimit);
}

function deleteHistoryById(id = '') {
  const key = String(id || '').trim();
  if (!key) return null;
  const index = memoryHistory.findIndex((item) => String(item._id || item.id || '') === key);
  if (index < 0) return null;
  const [removed] = memoryHistory.splice(index, 1);
  return removed;
}

module.exports = {
  saveHistory,
  getHistory,
  deleteHistoryById,
};
