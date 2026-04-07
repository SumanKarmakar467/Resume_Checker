// Purpose: HTTP controllers for resume analyze, generation, and history endpoints.
const mongoose = require('mongoose');

const ResumeAnalysis = require('../models/ResumeAnalysis');
const { analyzeResume, generateAtsResume } = require('../services/resume.service');
const { saveHistory, getHistory } = require('../services/history.store');
const { toAnalysisResponse } = require('../utils/analysis.serializer');
const { extractTextFromFile, parseStructuredResumeData, normalizeText } = require('../services/resumeParser');
const {
  normalizeUserEmail,
  createAnalysisRecord,
  createBuildRecord,
  incrementBuildDownload,
  ensureUserRecord,
} = require('../services/records.service');

async function analyzeResumeController(req, res, next) {
  try {
    const { jobDescription = '', userEmail = '' } = req.body || {};
    const file = req.file;

    if (!file) {
      const error = new Error('Please upload a PDF, DOCX, or TXT resume file.');
      error.status = 400;
      throw error;
    }

    const resumeText = await extractTextFromFile(file);
    if (!resumeText) {
      const error = new Error('Could not extract text from file. Upload a text-based resume.');
      error.status = 400;
      throw error;
    }

    const analysis = await analyzeResume(resumeText, jobDescription);
    const generated =
      analysis.optimizedResume && analysis.structuredResume
        ? {
            optimizedResume: analysis.optimizedResume,
            structuredResume: analysis.structuredResume,
          }
        : await generateAtsResume(analysis.structuredResume || resumeText, jobDescription, {
            sourceResumeText: resumeText,
            templateName: 'General ATS Resume',
          });

    const normalizedEmail = normalizeUserEmail(userEmail);

    const payload = {
      filename: file.originalname,
      resumeText,
      jobDescription: normalizeText(jobDescription),
      userEmail: normalizedEmail,
      atsScore: analysis.atsScore,
      matchedKeywords: analysis.matchedKeywords,
      missingKeywords: analysis.missingKeywords,
      feedback: analysis.feedback,
      suggestions: analysis.suggestions,
      optimizedResume: generated.optimizedResume,
      structuredResume: generated.structuredResume,
    };

    const isMongoConnected = mongoose.connection.readyState === 1;
    const saved = isMongoConnected ? await ResumeAnalysis.create(payload) : saveHistory(payload);

    try {
      await createAnalysisRecord({
        userEmail: normalizedEmail,
        filename: file.originalname,
        jobDescription: normalizeText(jobDescription),
        atsScore: analysis.atsScore,
        analyzedAt: new Date(),
      });
    } catch (recordError) {
      console.warn('[records] failed to save analysis record:', recordError.message);
    }

    return res.status(200).json(
      toAnalysisResponse(saved, {
        includeText: true,
        includeOptimizedResume: true,
        includeStructuredResume: true,
      })
    );
  } catch (error) {
    return next(error);
  }
}

async function parseBuilderResumeController(req, res, next) {
  try {
    const file = req.file;
    if (!file) {
      const error = new Error('Please upload a PDF, DOCX, or TXT resume file.');
      error.status = 400;
      throw error;
    }

    const resumeText = await extractTextFromFile(file);
    if (!resumeText) {
      const error = new Error('Could not extract text from file. Upload a text-based resume.');
      error.status = 400;
      throw error;
    }

    const structuredData = parseStructuredResumeData(resumeText);
    return res.status(200).json({
      filename: file.originalname,
      resumeText,
      structuredData,
    });
  } catch (error) {
    return next(error);
  }
}

async function generateAtsController(req, res, next) {
  try {
    const {
      resumeText = '',
      structuredResume = null,
      jobDescription = '',
      sourceResumeText = '',
      templateName = '',
      userEmail = '',
    } = req.body || {};

    if (!normalizeText(resumeText) && (!structuredResume || typeof structuredResume !== 'object')) {
      const error = new Error('structuredResume or resumeText is required.');
      error.status = 400;
      throw error;
    }

    const generated = await generateAtsResume(structuredResume || resumeText, jobDescription, {
      sourceResumeText,
      templateName,
    });

    const normalizedEmail = normalizeUserEmail(userEmail);
    let buildRecord = null;
    try {
      buildRecord = await createBuildRecord({
        userEmail: normalizedEmail,
        templateName: String(templateName || 'General ATS Resume'),
        builtAt: new Date(),
        downloadCount: 0,
      });
    } catch (recordError) {
      console.warn('[records] failed to save build record:', recordError.message);
    }

    return res.status(200).json({
      optimizedResume: generated.optimizedResume || '',
      structuredResume: generated.structuredResume || parseStructuredResumeData(generated.optimizedResume || ''),
      buildId: buildRecord?._id || buildRecord?.id || null,
    });
  } catch (error) {
    return next(error);
  }
}

async function markBuildDownloadController(req, res, next) {
  try {
    const buildId = String(req.params.buildId || '').trim();
    const userEmail = normalizeUserEmail(req.body?.userEmail);
    if (!buildId) {
      const error = new Error('buildId is required.');
      error.status = 400;
      throw error;
    }

    const updated = await incrementBuildDownload(buildId);
    if (!updated) {
      const error = new Error('Build record not found.');
      error.status = 404;
      throw error;
    }

    try {
      await ensureUserRecord(userEmail);
    } catch (recordError) {
      console.warn('[records] failed to update user activity:', recordError.message);
    }

    return res.status(200).json({
      id: updated._id || updated.id,
      downloadCount: Number(updated.downloadCount || 0),
    });
  } catch (error) {
    return next(error);
  }
}

function parseHistoryLimit(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 25;
  return Math.min(Math.max(Math.round(parsed), 1), 100);
}

function parseIncludeText(value) {
  const normalized = String(value || '').trim().toLowerCase();
  return normalized === '1' || normalized === 'true' || normalized === 'yes';
}

async function getHistoryController(req, res, next) {
  try {
    const limit = parseHistoryLimit(req.query?.limit);
    const includeText = parseIncludeText(req.query?.includeText);

    const isMongoConnected = mongoose.connection.readyState === 1;
    const history = isMongoConnected
      ? await ResumeAnalysis.find({}).sort({ createdAt: -1 }).limit(limit).lean()
      : getHistory(limit);

    return res.status(200).json(
      history.map((item) =>
        toAnalysisResponse(item, {
          includeText,
          includeOptimizedResume: true,
          includeStructuredResume: true,
        })
      )
    );
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  analyzeResumeController,
  parseBuilderResumeController,
  generateAtsController,
  markBuildDownloadController,
  getHistoryController,
};
