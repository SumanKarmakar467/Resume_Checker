const mongoose = require('mongoose');
const ResumeAnalysis = require('../models/ResumeAnalysis');
const { normalizeUserEmail, isUserPro } = require('../services/records.service');

function readUserEmail(req) {
  return normalizeUserEmail(
    req.body?.userEmail ||
      req.query?.userEmail ||
      req.headers['x-user-email'] ||
      req.headers['x-user']
  );
}

async function requireProFeature(req, res, next) {
  try {
    const userEmail = readUserEmail(req);
    if (!userEmail || userEmail === 'anonymous') {
      return res.status(403).json({ error: 'Upgrade to Pro' });
    }

    const pro = await isUserPro(userEmail);
    if (!pro) {
      return res.status(403).json({ error: 'Upgrade to Pro' });
    }
    return next();
  } catch (error) {
    return next(error);
  }
}

async function enforceFreeAnalyzeLimit(req, res, next) {
  try {
    const userEmail = readUserEmail(req);
    if (!userEmail || userEmail === 'anonymous') {
      return next();
    }

    const pro = await isUserPro(userEmail);
    if (pro) return next();

    if (mongoose.connection.readyState !== 1) return next();

    const start = new Date();
    start.setHours(0, 0, 0, 0);

    const count = await ResumeAnalysis.countDocuments({
      userEmail,
      status: { $ne: 'FAILED' },
      $or: [{ analyzedAt: { $gte: start } }, { createdAt: { $gte: start } }],
    });

    if (count >= 3) {
      return res.status(403).json({ error: 'Free plan limit reached (3 analyses/day). Upgrade to Pro.' });
    }

    return next();
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  requireProFeature,
  enforceFreeAnalyzeLimit,
};

