const Analysis = require('../models/Analysis');
const { getHistoryForUser, deleteHistoryItemForUser } = require('../services/memoryStore');

function isDbReady() {
  return Analysis?.db?.readyState === 1;
}

function toHistoryItem(record) {
  return {
    id: String(record._id || record.id || ''),
    atsScore: record.atsScore ?? record.overallScore ?? 0,
    overallScore: record.overallScore ?? record.atsScore ?? 0,
    jobTitle: record.jobTitle || '',
    resumeFileName: record.resumeFileName || '',
    matchedKeywords: record.matchedKeywords || [],
    missingKeywords: record.missingKeywords || [],
    bestFitRole: record.bestFitRole || '',
    roleSuggestion: record.roleSuggestion || '',
    createdAt: record.createdAt || null
  };
}

async function getHistory(req, res) {
  const userId = req.user?.id;
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized. Please log in.' });
  }

  try {
    if (isDbReady()) {
      const rows = await Analysis.find({ userId })
        .sort({ createdAt: -1 })
        .limit(10)
        .lean();
      return res.json(rows.map(toHistoryItem));
    }

    return res.json(getHistoryForUser(userId, 10).map(toHistoryItem));
  } catch (error) {
    return res.status(500).json({ error: 'Unable to load history right now.' });
  }
}

async function deleteHistory(req, res) {
  const userId = req.user?.id;
  const itemId = req.params?.id;

  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized. Please log in.' });
  }
  if (!itemId) {
    return res.status(400).json({ error: 'History id is required.' });
  }

  try {
    if (isDbReady()) {
      const result = await Analysis.deleteOne({ _id: itemId, userId });
      if (result.deletedCount === 0) {
        return res.status(404).json({ error: 'History item not found.' });
      }
      return res.status(204).send();
    }

    const deleted = deleteHistoryItemForUser(userId, itemId);
    if (!deleted) {
      return res.status(404).json({ error: 'History item not found.' });
    }
    return res.status(204).send();
  } catch (error) {
    return res.status(500).json({ error: 'Unable to delete history right now.' });
  }
}

module.exports = {
  getHistory,
  deleteHistory
};
