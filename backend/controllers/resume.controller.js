// Purpose: HTTP controllers for resume analyze, generation, and history endpoints.
const path = require('path');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const mongoose = require('mongoose');

const ResumeAnalysis = require('../models/ResumeAnalysis');
const { analyzeResume, generateAtsResume } = require('../services/resume.service');
const { saveHistory, getHistory } = require('../services/history.store');

async function extractTextFromFile(file) {
  if (!file || !file.buffer) {
    const error = new Error('Resume file is missing.');
    error.status = 400;
    throw error;
  }

  const originalName = String(file.originalname || '').toLowerCase();
  const extension = path.extname(originalName);

  const isPdf = file.mimetype === 'application/pdf' || extension === '.pdf';
  const isDocx =
    file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    extension === '.docx';
  const isTxt = file.mimetype === 'text/plain' || extension === '.txt';

  if (isPdf) {
    const data = await pdfParse(file.buffer);
    return String(data.text || '').trim();
  }

  if (isDocx) {
    const data = await mammoth.extractRawText({ buffer: file.buffer });
    return String(data.value || '').trim();
  }

  if (isTxt) {
    return file.buffer.toString('utf8').trim();
  }

  const error = new Error('Unsupported file type. Upload PDF, DOCX, or TXT.');
  error.status = 400;
  throw error;
}

async function analyzeResumeController(req, res, next) {
  try {
    const { jobDescription = '' } = req.body;
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
    const optimizedResume = analysis.optimizedResume || (await generateAtsResume(resumeText, jobDescription));

    const payload = {
      filename: file.originalname,
      resumeText,
      jobDescription,
      atsScore: analysis.atsScore,
      matchedKeywords: analysis.matchedKeywords,
      missingKeywords: analysis.missingKeywords,
      feedback: analysis.feedback,
      suggestions: analysis.suggestions,
      optimizedResume,
    };

    const isMongoConnected = mongoose.connection.readyState === 1;
    const saved = isMongoConnected
      ? await ResumeAnalysis.create(payload)
      : saveHistory(payload);

    return res.status(200).json({
      id: saved._id,
      filename: saved.filename,
      resumeText: saved.resumeText,
      jobDescription: saved.jobDescription,
      atsScore: saved.atsScore,
      matchedKeywords: saved.matchedKeywords,
      missingKeywords: saved.missingKeywords,
      feedback: saved.feedback,
      suggestions: saved.suggestions,
      optimizedResume: saved.optimizedResume,
      createdAt: saved.createdAt,
    });
  } catch (error) {
    return next(error);
  }
}

async function generateAtsController(req, res, next) {
  try {
    const { resumeText = '', jobDescription = '' } = req.body || {};

    if (!String(resumeText).trim()) {
      const error = new Error('resumeText is required.');
      error.status = 400;
      throw error;
    }

    const optimizedResume = await generateAtsResume(resumeText, jobDescription);
    return res.status(200).json({ optimizedResume });
  } catch (error) {
    return next(error);
  }
}

async function getHistoryController(req, res, next) {
  try {
    const isMongoConnected = mongoose.connection.readyState === 1;
    const history = isMongoConnected
      ? await ResumeAnalysis.find({})
          .sort({ createdAt: -1 })
          .lean()
      : getHistory();

    return res.status(200).json(history);
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  analyzeResumeController,
  generateAtsController,
  getHistoryController,
};
