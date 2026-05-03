// Purpose: HTTP controllers for resume analyze, generation, and history endpoints.
const mongoose = require('mongoose');

const ResumeAnalysis = require('../models/ResumeAnalysis');
const { analyzeResume, generateAtsResume } = require('../services/resume.service');
const { saveHistory, getHistory, deleteHistoryById } = require('../services/history.store');
const { toAnalysisResponse } = require('../utils/analysis.serializer');
const { extractTextFromFile, parseStructuredResumeData, normalizeText } = require('../services/resumeParser');
const resumeAnalysisRepository = require('../repositories/resumeAnalysis.repository');
const {
  normalizeUserEmail,
  createAnalysisRecord,
  createBuildRecord,
  incrementBuildDownload,
  ensureUserRecord,
} = require('../services/records.service');

async function runSingleAnalysis(file, jobDescription = '', userEmail = '') {
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

  return {
    filename: file.originalname,
    fileName: file.originalname,
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
    status: 'COMPLETED',
    analyzedAt: new Date(),
  };
}

async function analyzeResumeController(req, res, next) {
  try {
    const { jobDescription = '', userEmail = '' } = req.body || {};
    const file = req.file;

    if (!file) {
      const error = new Error('Please upload a PDF, DOCX, or TXT resume file.');
      error.status = 400;
      throw error;
    }

    const payload = await runSingleAnalysis(file, jobDescription, userEmail);

    const isMongoConnected = mongoose.connection.readyState === 1;
    const saved = isMongoConnected ? await resumeAnalysisRepository.createRecord(payload) : saveHistory(payload);

    try {
      await createAnalysisRecord({
        userEmail: payload.userEmail,
        filename: file.originalname,
        jobDescription: normalizeText(jobDescription),
        atsScore: payload.atsScore,
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

function parseMinScore(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 0;
  return Math.min(Math.max(Math.round(parsed), 0), 100);
}

async function getHistoryController(req, res, next) {
  try {
    const limit = parseHistoryLimit(req.query?.limit);
    const includeText = parseIncludeText(req.query?.includeText);
    const minScore = parseMinScore(req.query?.minScore);

    const isMongoConnected = mongoose.connection.readyState === 1;
    const history = isMongoConnected
      ? (minScore > 0
          ? await resumeAnalysisRepository.findByMinScore(minScore, limit)
          : await resumeAnalysisRepository.findAllNewestFirst(limit))
      : getHistory(limit).filter((item) => Number(item.atsScore || 0) >= minScore);

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

async function deleteHistoryItemController(req, res, next) {
  try {
    const id = String(req.params.id || '').trim();
    if (!id) {
      const error = new Error('History id is required.');
      error.status = 400;
      throw error;
    }

    const isMongoConnected = mongoose.connection.readyState === 1;
    const removed = isMongoConnected
      ? await resumeAnalysisRepository.deleteById(id)
      : deleteHistoryById(id);

    if (!removed) {
      const error = new Error('History record not found.');
      error.status = 404;
      throw error;
    }

    return res.status(200).json({ success: true, id });
  } catch (error) {
    return next(error);
  }
}

async function bulkAnalyzeResumeController(req, res, next) {
  try {
    const files = Array.isArray(req.files) ? req.files : [];
    const { jobDescription = '', userEmail = '' } = req.body || {};
    if (!files.length) {
      const error = new Error('Please upload one or more PDF, DOCX, or TXT resume files.');
      error.status = 400;
      throw error;
    }

    const isMongoConnected = mongoose.connection.readyState === 1;
    const results = [];

    for (const file of files) {
      try {
        const payload = await runSingleAnalysis(file, jobDescription, userEmail);
        let saved = payload;
        try {
          saved = isMongoConnected ? await resumeAnalysisRepository.createRecord(payload) : saveHistory(payload);
        } catch (saveError) {
          console.warn('[history] failed to persist bulk analysis:', saveError.message);
        }

        try {
          await createAnalysisRecord({
            userEmail: payload.userEmail,
            filename: payload.filename,
            jobDescription: payload.jobDescription,
            atsScore: payload.atsScore,
            analyzedAt: payload.analyzedAt,
          });
        } catch (recordError) {
          console.warn('[records] failed to save bulk analysis record:', recordError.message);
        }

        results.push(
          toAnalysisResponse(saved, {
            includeText: true,
            includeOptimizedResume: true,
            includeStructuredResume: true,
          })
        );
      } catch (fileError) {
        const fallback = {
          filename: file.originalname,
          fileName: file.originalname,
          jobDescription: normalizeText(jobDescription),
          userEmail: normalizeUserEmail(userEmail),
          atsScore: 0,
          matchedKeywords: [],
          missingKeywords: [],
          feedback: fileError.message || 'Analysis failed.',
          suggestions: [],
          optimizedResume: '',
          structuredResume: null,
          status: 'FAILED',
          analyzedAt: new Date(),
          createdAt: new Date(),
        };
        let savedFallback = fallback;
        try {
          savedFallback = isMongoConnected
            ? await resumeAnalysisRepository.createRecord(fallback)
            : saveHistory(fallback);
        } catch (saveError) {
          console.warn('[history] failed to persist failed bulk record:', saveError.message);
        }
        results.push(
          toAnalysisResponse(savedFallback, {
            includeText: false,
            includeOptimizedResume: false,
            includeStructuredResume: false,
          })
        );
      }
    }

    return res.status(201).json(results);
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
  deleteHistoryItemController,
  bulkAnalyzeResumeController,
};
