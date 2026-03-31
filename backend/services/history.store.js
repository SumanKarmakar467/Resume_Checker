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

function getHistory() {
  return [...memoryHistory];
}

module.exports = {
  saveHistory,
  getHistory,
};
