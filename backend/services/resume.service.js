// Purpose: AI-backed resume analysis and ATS optimization helpers.
const { GoogleGenerativeAI } = require('@google/generative-ai');

const STOP_WORDS = new Set([
  'the', 'and', 'for', 'with', 'that', 'this', 'from', 'have', 'has', 'was', 'were', 'will', 'into', 'your', 'you',
  'job', 'role', 'work', 'must', 'should', 'required', 'preferred', 'experience', 'years', 'year', 'team', 'ability'
]);

let geminiModelCache = null;

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function toStringArray(value, limit = 20) {
  if (!Array.isArray(value)) return [];
  const seen = new Set();
  const output = [];

  for (const item of value) {
    const normalized = String(item || '').trim();
    if (!normalized) continue;
    const key = normalized.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    output.push(normalized);
    if (output.length >= limit) break;
  }

  return output;
}

function extractKeywords(jobDescription = '') {
  const tokens = String(jobDescription || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);

  const seen = new Set();
  const keywords = [];

  for (const token of tokens) {
    if (token.length < 3 || STOP_WORDS.has(token) || seen.has(token)) continue;
    seen.add(token);
    keywords.push(token);
    if (keywords.length >= 35) break;
  }

  return keywords;
}

function buildFallbackOptimizedResume(resumeText = '', jobDescription = '') {
  const keywords = extractKeywords(jobDescription).slice(0, 10);
  const cleanResume = String(resumeText || '').trim();

  const header = [
    'ATS-OPTIMIZED RESUME DRAFT',
    '==========================='
  ];

  const summary = [
    'PROFESSIONAL SUMMARY',
    'Results-driven candidate with strong execution, collaboration, and measurable outcomes across projects.',
  ];

  const skillLine = keywords.length
    ? `CORE KEYWORDS: ${keywords.join(', ')}`
    : 'CORE KEYWORDS: Communication, Problem Solving, Collaboration, Delivery';

  const sections = [
    'EXPERIENCE',
    '- Use role-specific action verbs and quantify outcomes where possible.',
    '- Include metrics (%, count, time saved) in every key bullet.',
    'EDUCATION',
    '- Mention degree, institution, and graduation year clearly.',
  ];

  const notes = [
    'ATS NOTES',
    '- Keep formatting simple and single-column.',
    '- Mirror the job description language naturally in summary and skills.'
  ];

  return [
    ...header,
    '',
    ...summary,
    '',
    skillLine,
    '',
    ...sections,
    '',
    ...notes,
    '',
    'SOURCE CONTENT',
    cleanResume || '(No resume text provided)'
  ].join('\n');
}

function runFallbackAnalysis(resumeText = '', jobDescription = '') {
  const normalizedResume = String(resumeText || '').toLowerCase();
  const keywords = extractKeywords(jobDescription);

  const matchedKeywords = keywords.filter((kw) => normalizedResume.includes(kw)).slice(0, 20);
  const missingKeywords = keywords.filter((kw) => !normalizedResume.includes(kw)).slice(0, 20);

  const keywordScore = keywords.length
    ? Math.round((matchedKeywords.length * 100) / keywords.length)
    : 70;

  const hasEmail = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/.test(resumeText);
  const hasPhone = /(?:\+?\d{1,3}[\s-]?)?(?:\(?\d{3}\)?[\s-]?)?\d{3}[\s-]?\d{4}/.test(resumeText);
  const hasSkillsHeading = /\bskills\b/i.test(resumeText);
  const hasExperienceHeading = /\bexperience\b/i.test(resumeText);

  let atsScore = 45;
  if (hasEmail) atsScore += 10;
  if (hasPhone) atsScore += 10;
  if (hasSkillsHeading) atsScore += 10;
  if (hasExperienceHeading) atsScore += 10;
  atsScore += Math.round(keywordScore * 0.3);
  atsScore = clamp(atsScore, 0, 100);

  const suggestions = [];
  if (!hasEmail || !hasPhone) {
    suggestions.push('Add clear contact details (email and phone) in the resume header.');
  }
  if (!hasSkillsHeading) {
    suggestions.push('Create a dedicated Skills section with role-relevant tools and technologies.');
  }
  if (!hasExperienceHeading) {
    suggestions.push('Add an Experience section with achievements and measurable results.');
  }
  if (missingKeywords.length) {
    suggestions.push(`Include missing role keywords naturally: ${missingKeywords.slice(0, 6).join(', ')}.`);
  }
  if (!suggestions.length) {
    suggestions.push('Strong baseline resume. Tailor your summary and bullets to each job description.');
  }

  const feedback =
    keywordScore >= 75
      ? 'Good alignment with job keywords. Improve impact metrics and section clarity for stronger ATS performance.'
      : 'Resume needs better keyword alignment and clearer section structure to improve ATS ranking.';

  return {
    atsScore,
    matchedKeywords,
    missingKeywords,
    feedback,
    suggestions,
    optimizedResume: buildFallbackOptimizedResume(resumeText, jobDescription),
  };
}

function sanitizeAnalysisPayload(payload = {}, resumeText = '', jobDescription = '') {
  const fallback = runFallbackAnalysis(resumeText, jobDescription);

  const parsedScore = Number(payload.atsScore);
  const atsScore = Number.isFinite(parsedScore) ? clamp(Math.round(parsedScore), 0, 100) : fallback.atsScore;

  const matchedKeywords = toStringArray(payload.matchedKeywords);
  const missingKeywords = toStringArray(payload.missingKeywords);
  const suggestions = toStringArray(payload.suggestions, 10);

  const feedback = String(payload.feedback || '').trim() || fallback.feedback;
  const optimizedResume = String(payload.optimizedResume || '').trim() || fallback.optimizedResume;

  return {
    atsScore,
    matchedKeywords: matchedKeywords.length ? matchedKeywords : fallback.matchedKeywords,
    missingKeywords: missingKeywords.length ? missingKeywords : fallback.missingKeywords,
    feedback,
    suggestions: suggestions.length ? suggestions : fallback.suggestions,
    optimizedResume,
  };
}

function parseJsonSafely(rawText = '') {
  const text = String(rawText || '').trim();
  if (!text) return null;

  const clean = text
    .replace(/^```json/i, '')
    .replace(/^```/i, '')
    .replace(/```$/, '')
    .trim();

  try {
    return JSON.parse(clean);
  } catch (_err) {
    const firstBrace = clean.indexOf('{');
    const lastBrace = clean.lastIndexOf('}');
    if (firstBrace >= 0 && lastBrace > firstBrace) {
      try {
        return JSON.parse(clean.slice(firstBrace, lastBrace + 1));
      } catch (_err2) {
        return null;
      }
    }
    return null;
  }
}

function getGeminiModel() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  if (!geminiModelCache) {
    const genAI = new GoogleGenerativeAI(apiKey);
    geminiModelCache = genAI.getGenerativeModel({ model: process.env.GEMINI_MODEL || 'gemini-1.5-flash' });
  }

  return geminiModelCache;
}

async function runGeminiAnalysis(resumeText, jobDescription) {
  const model = getGeminiModel();
  if (!model) {
    throw new Error('GEMINI_API_KEY missing.');
  }

  const prompt = [
    'You are an ATS resume reviewer.',
    'Analyze the resume against the job description and return STRICT JSON only.',
    'Required JSON keys:',
    '{',
    '  "atsScore": number (0-100),',
    '  "matchedKeywords": string[],',
    '  "missingKeywords": string[],',
    '  "feedback": string,',
    '  "suggestions": string[],',
    '  "optimizedResume": string',
    '}',
    'Keep suggestions concise and actionable (max 8).',
    '',
    'JOB DESCRIPTION:',
    jobDescription || '(not provided)',
    '',
    'RESUME TEXT:',
    resumeText || '(empty)'
  ].join('\n');

  const response = await model.generateContent({
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0.3,
      responseMimeType: 'application/json'
    }
  });

  const rawText = response.response.text();
  const payload = parseJsonSafely(rawText);

  if (!payload) {
    throw new Error('Failed to parse Gemini JSON output.');
  }

  return sanitizeAnalysisPayload(payload, resumeText, jobDescription);
}

async function runGeminiGenerate(resumeText, jobDescription, options = {}) {
  const model = getGeminiModel();
  if (!model) {
    throw new Error('GEMINI_API_KEY missing.');
  }

  const templateName = String(options.templateName || '').trim();
  const sourceResumeText = String(options.sourceResumeText || '').trim();

  const prompt = [
    'Rewrite this resume for ATS optimization while preserving original candidate data.',
    'Return plain text only (no markdown fences).',
    'Rules:',
    '- Preserve every factual detail from source resume data (roles, companies, dates, projects, education, certifications, achievements, links).',
    '- Do not remove existing sections; you may reorder and improve phrasing.',
    '- Preserve honesty and never invent experience.',
    '- Use clean section headings, concise bullets, role keywords, and quantifiable impact language.',
    '- Keep formatting ATS-friendly and readable.',
    '',
    'TARGET TEMPLATE STYLE:',
    templateName || 'General ATS Resume',
    '',
    'JOB DESCRIPTION:',
    jobDescription || '(not provided)',
    '',
    'STRUCTURED RESUME TEXT:',
    resumeText || '(empty)'
  ];

  if (sourceResumeText) {
    prompt.push(
      '',
      'ORIGINAL SOURCE RESUME (HIGH PRIORITY DATA TO PRESERVE):',
      sourceResumeText
    );
  }

  const response = await model.generateContent({
    contents: [{ role: 'user', parts: [{ text: prompt.join('\n') }] }],
    generationConfig: {
      temperature: 0.35,
    }
  });

  const output = String(response.response.text() || '').trim();
  return output.replace(/^```[a-zA-Z]*\n?/, '').replace(/```$/, '').trim();
}

async function analyzeResume(resumeText = '', jobDescription = '') {
  const safeResume = String(resumeText || '').trim();
  const safeJobDescription = String(jobDescription || '').trim();

  try {
    return await runGeminiAnalysis(safeResume, safeJobDescription);
  } catch (error) {
    console.warn('[ai] Gemini analysis fallback:', error.message);
    return runFallbackAnalysis(safeResume, safeJobDescription);
  }
}

async function generateAtsResume(resumeText = '', jobDescription = '', options = {}) {
  const safeResume = String(resumeText || '').trim();
  const safeJobDescription = String(jobDescription || '').trim();

  try {
    const generated = await runGeminiGenerate(safeResume, safeJobDescription, options);
    if (generated) return generated;
  } catch (error) {
    console.warn('[ai] Gemini generate fallback:', error.message);
  }

  return buildFallbackOptimizedResume(safeResume, safeJobDescription);
}

module.exports = {
  analyzeResume,
  generateAtsResume,
  extractKeywords,
};
