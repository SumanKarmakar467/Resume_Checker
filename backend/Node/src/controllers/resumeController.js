const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const Analysis = require('../models/Analysis');
const {
  analyzeResume,
  generateAtsFriendlyResume,
  extractProfileFromResumeText,
  generateRewriteSuggestions
} = require('../services/analysisService');
const { saveAnalysisForUser } = require('../services/memoryStore');

async function extractResumeText(file) {
  const fileName = file.originalname.toLowerCase();
  const isPdf = file.mimetype === 'application/pdf' || fileName.endsWith('.pdf');
  const isDocx =
    file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    fileName.endsWith('.docx');
  const isTxt = file.mimetype === 'text/plain' || fileName.endsWith('.txt');

  if (isPdf) {
    const parsed = await pdfParse(file.buffer);
    return parsed.text || '';
  }

  if (isDocx) {
    const parsed = await mammoth.extractRawText({ buffer: file.buffer });
    return parsed.value || '';
  }

  if (isTxt) {
    return file.buffer.toString('utf8');
  }

  throw new Error('Unsupported resume file type. Use PDF, DOCX, or TXT.');
}

async function analyze(req, res) {
  try {
    const file = req.file;
    const { jobDescription = '', jobTitle = '' } = req.body;

    if (!file) {
      return res.status(400).json({ error: 'Please upload a PDF, DOCX, or TXT resume file.' });
    }

    const resumeText = await extractResumeText(file);

    const result = analyzeResume(resumeText, jobDescription);
    const userId = req.user?.id || null;
    const historyPayload = {
      ...result,
      userId,
      jobDescription,
      jobTitle,
      resumeFileName: file.originalname
    };

    if (userId && Analysis?.db?.readyState === 1) {
      await Analysis.create(historyPayload);
    } else if (userId) {
      saveAnalysisForUser(userId, historyPayload);
    }

    return res.json(result);
  } catch (error) {
    console.error('[analyze] Failed to process resume:', error);
    const rawMessage = error?.message || 'Unable to analyze resume.';
    const isReadIssue = /(formaterror|invalid pdf|xref|password|encrypted|unsupported|bad|docx|txt|zip|mammoth)/i.test(rawMessage);

    if (isReadIssue) {
      return res.status(400).json({
        error: 'Unable to read this file. Upload a text-based, non-password-protected PDF/DOCX resume.'
      });
    }

    return res.status(500).json({ error: rawMessage });
  }
}

async function generateAts(req, res) {
  try {
    const { resumeText = '', jobDescription = '', profile = null } = req.body;

    const generatedResume = generateAtsFriendlyResume(resumeText, jobDescription, profile);
    const generatedAnalysis = analyzeResume(generatedResume, jobDescription);

    return res.json({
      generatedResume,
      generatedAtsScore: generatedAnalysis.atsScore,
      bestFitRole: generatedAnalysis.bestFitRole,
      roleSuggestion: generatedAnalysis.roleSuggestion
    });
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Unable to generate ATS-friendly resume.' });
  }
}

async function suggestions(req, res) {
  try {
    const { resumeText = '', jobDescription = '' } = req.body;
    if (!resumeText.trim()) {
      return res.status(400).json({ error: 'resumeText is required.' });
    }

    const generated = generateRewriteSuggestions(resumeText, jobDescription);
    return res.json({ suggestions: generated });
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Unable to generate suggestions.' });
  }
}

async function extractProfile(req, res) {
  try {
    const file = req.file;
    const { jobDescription = '' } = req.body;

    if (!file) {
      return res.status(400).json({ error: 'Please upload a resume file.' });
    }

    const resumeText = await extractResumeText(file);
    const extracted = extractProfileFromResumeText(resumeText, jobDescription);

    return res.json({
      ...extracted,
      extractedText: resumeText
    });
  } catch (error) {
    const message = error?.message || 'Unable to extract profile details from this file.';
    return res.status(500).json({ error: message });
  }
}

module.exports = {
  analyze,
  generateAts,
  suggestions,
  extractProfile
};
