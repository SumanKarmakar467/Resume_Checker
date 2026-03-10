const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const Analysis = require('../models/Analysis');
const { analyzeResume, generateAtsFriendlyResume } = require('../services/analysisService');

async function extractResumeText(file) {
  const fileName = file.originalname.toLowerCase();
  const isPdf = file.mimetype === 'application/pdf' || fileName.endsWith('.pdf');
  const isDocx =
    file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    fileName.endsWith('.docx');

  if (isPdf) {
    const parsed = await pdfParse(file.buffer);
    return parsed.text || '';
  }

  if (isDocx) {
    const parsed = await mammoth.extractRawText({ buffer: file.buffer });
    return parsed.value || '';
  }

  throw new Error('Unsupported resume file type.');
}

async function analyze(req, res) {
  try {
    const file = req.file;
    const { jobDescription = '' } = req.body;

    if (!file) {
      return res.status(400).json({ error: 'Please upload a PDF or DOCX resume file.' });
    }

    const resumeText = await extractResumeText(file);

    const result = analyzeResume(resumeText, jobDescription);

    if (Analysis?.db?.readyState === 1) {
      await Analysis.create({
        ...result,
        jobDescription
      });
    }

    return res.json(result);
  } catch (error) {
    console.error('[analyze] Failed to process resume:', error);
    const rawMessage = error?.message || 'Unable to analyze resume.';
    const isReadIssue = /(formaterror|invalid pdf|xref|password|encrypted|unsupported|bad|docx|zip|mammoth)/i.test(rawMessage);

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
    const { resumeText, jobDescription = '' } = req.body;
    if (!resumeText || !resumeText.trim()) {
      return res.status(400).json({ error: 'resumeText is required.' });
    }

    const generatedResume = generateAtsFriendlyResume(resumeText, jobDescription);
    return res.json({ generatedResume });
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Unable to generate ATS-friendly resume.' });
  }
}

module.exports = {
  analyze,
  generateAts
};
