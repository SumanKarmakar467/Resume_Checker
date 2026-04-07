const {
  getAllUsers,
  getAllAnalysisRecords,
  getAllBuildRecords,
} = require('../services/records.service');

function mapUserRecord(item = {}) {
  return {
    id: item._id || item.id || null,
    email: item.email || 'anonymous',
    createdAt: item.createdAt || null,
    lastActive: item.lastActiveAt || item.lastActive || null,
  };
}

function mapAnalysisRecord(item = {}) {
  return {
    id: item._id || item.id || null,
    userEmail: item.userEmail || 'anonymous',
    filename: item.filename || '',
    jobDescription: item.jobDescription || '',
    atsScore: Number.isFinite(Number(item.atsScore)) ? Number(item.atsScore) : 0,
    analyzedAt: item.analyzedAt || null,
  };
}

function mapBuildRecord(item = {}) {
  return {
    id: item._id || item.id || null,
    userEmail: item.userEmail || 'anonymous',
    templateName: item.templateName || '',
    builtAt: item.builtAt || null,
    downloadCount: Number.isFinite(Number(item.downloadCount)) ? Number(item.downloadCount) : 0,
  };
}

async function getUsersController(req, res, next) {
  try {
    const users = await getAllUsers();
    return res.status(200).json(users.map(mapUserRecord));
  } catch (error) {
    return next(error);
  }
}

async function getAnalysesController(req, res, next) {
  try {
    const analyses = await getAllAnalysisRecords();
    return res.status(200).json(analyses.map(mapAnalysisRecord));
  } catch (error) {
    return next(error);
  }
}

async function getBuildsController(req, res, next) {
  try {
    const builds = await getAllBuildRecords();
    return res.status(200).json(builds.map(mapBuildRecord));
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  getUsersController,
  getAnalysesController,
  getBuildsController,
};
