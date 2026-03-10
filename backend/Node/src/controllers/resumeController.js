const pdfParse = require('pdf-parse');
const Analysis = require('../models/Analysis');
const { analyzeResume, generateAtsFriendlyResume } = require('../services/analysisService');

async function analyze(req, res) {
  try {
    const file = req.file;
    const { jobDescription = '' } = req.body;

    if (!file) {
      return res.status(400).json({ error: 'Please upload a PDF resume file.' });
    }

    const parsed = await pdfParse(file.buffer);
    const resumeText = parsed.text || '';

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
    const isPdfReadIssue = /(formaterror|invalid pdf|xref|password|encrypted|unsupported|bad)/i.test(rawMessage);

    if (isPdfReadIssue) {
      return res.status(400).json({
        error: 'Unable to read this PDF. Please upload a text-based, non-password-protected PDF.'
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
