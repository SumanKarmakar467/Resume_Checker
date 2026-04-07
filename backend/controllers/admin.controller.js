const jwt = require('jsonwebtoken');

const {
  getAllUsers,
  getAllAnalysisRecords,
  getAllBuildRecords,
} = require('../services/records.service');

const DEFAULT_ADMIN_EMAIL = 'karmakarsuman12138@gmail.com';
const DEFAULT_ADMIN_PASSWORD = 'Suman@2004';

function normalizeEmail(value) {
  return String(value || '').trim().toLowerCase();
}

function resolveAdminEmail() {
  return normalizeEmail(process.env.ADMIN_EMAIL || DEFAULT_ADMIN_EMAIL);
}

function resolveAdminPassword() {
  return String(process.env.ADMIN_PASSWORD || DEFAULT_ADMIN_PASSWORD);
}

function resolveJwtSecret() {
  return String(process.env.JWT_SECRET || '').trim();
}

function resolveTokenTtl() {
  return String(process.env.JWT_EXPIRES_IN || '12h').trim();
}

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

async function adminLoginController(req, res, next) {
  try {
    const email = normalizeEmail(req.body?.email);
    const password = String(req.body?.password || '');

    if (!email || !password) {
      const error = new Error('Email and password are required.');
      error.status = 400;
      throw error;
    }

    const adminEmail = resolveAdminEmail();
    const adminPassword = resolveAdminPassword();
    if (!adminEmail || !adminPassword) {
      const error = new Error('Admin credentials are not configured.');
      error.status = 500;
      throw error;
    }

    if (email !== adminEmail || password !== adminPassword) {
      const error = new Error('Invalid admin email or password.');
      error.status = 401;
      throw error;
    }

    const jwtSecret = resolveJwtSecret();
    if (!jwtSecret) {
      const error = new Error('JWT secret is missing.');
      error.status = 500;
      throw error;
    }

    const token = jwt.sign(
      {
        role: 'admin',
        email: adminEmail,
      },
      jwtSecret,
      { expiresIn: resolveTokenTtl() }
    );

    return res.status(200).json({
      token,
      tokenType: 'Bearer',
      admin: {
        email: adminEmail,
      },
    });
  } catch (error) {
    return next(error);
  }
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
  adminLoginController,
  getUsersController,
  getAnalysesController,
  getBuildsController,
};
