const mongoose = require('mongoose');

const memoryStore = require('./admin.store');
const userRecordRepository = require('../repositories/userRecord.repository');
const analysisRecordRepository = require('../repositories/analysisRecord.repository');
const buildRecordRepository = require('../repositories/buildRecord.repository');

function isMongoConnected() {
  return mongoose.connection.readyState === 1;
}

function normalizeUserEmail(value) {
  return memoryStore.normalizeEmail(value);
}

async function ensureUserRecord(userEmail) {
  const normalizedEmail = normalizeUserEmail(userEmail);
  if (isMongoConnected()) {
    return userRecordRepository.upsertByEmail(normalizedEmail);
  }

  return memoryStore.upsertUser(normalizedEmail);
}

async function createAnalysisRecord(payload = {}) {
  const normalizedEmail = normalizeUserEmail(payload.userEmail);
  await ensureUserRecord(normalizedEmail);

  if (isMongoConnected()) {
    return analysisRecordRepository.createRecord({
      userEmail: normalizedEmail,
      filename: String(payload.filename || ''),
      jobDescription: String(payload.jobDescription || ''),
      atsScore: Number.isFinite(Number(payload.atsScore)) ? Number(payload.atsScore) : 0,
      analyzedAt: payload.analyzedAt ? new Date(payload.analyzedAt) : new Date(),
    });
  }

  return memoryStore.addAnalysis({
    ...payload,
    userEmail: normalizedEmail,
  });
}

async function createBuildRecord(payload = {}) {
  const normalizedEmail = normalizeUserEmail(payload.userEmail);
  await ensureUserRecord(normalizedEmail);

  if (isMongoConnected()) {
    return buildRecordRepository.createRecord({
      userEmail: normalizedEmail,
      templateName: String(payload.templateName || ''),
      builtAt: payload.builtAt ? new Date(payload.builtAt) : new Date(),
      downloadCount: Number.isFinite(Number(payload.downloadCount)) ? Number(payload.downloadCount) : 0,
    });
  }

  return memoryStore.addBuild({
    ...payload,
    userEmail: normalizedEmail,
  });
}

async function incrementBuildDownload(buildId) {
  if (!buildId) return null;

  if (isMongoConnected()) {
    return buildRecordRepository.incrementDownload(buildId);
  }

  return memoryStore.incrementBuildDownload(buildId);
}

async function getAllUsers() {
  if (isMongoConnected()) {
    return userRecordRepository.findAll();
  }
  return memoryStore.getUsers();
}

async function getAllAnalysisRecords() {
  if (isMongoConnected()) {
    return analysisRecordRepository.findAll();
  }
  return memoryStore.getAnalyses();
}

async function getAllBuildRecords() {
  if (isMongoConnected()) {
    return buildRecordRepository.findAll();
  }
  return memoryStore.getBuilds();
}

module.exports = {
  normalizeUserEmail,
  ensureUserRecord,
  createAnalysisRecord,
  createBuildRecord,
  incrementBuildDownload,
  getAllUsers,
  getAllAnalysisRecords,
  getAllBuildRecords,
};
