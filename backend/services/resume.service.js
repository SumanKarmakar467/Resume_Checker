// Purpose: AI-backed resume analysis and ATS optimization helpers.
const { GoogleGenerativeAI } = require('@google/generative-ai');
const {
  parseStructuredResumeData,
  sanitizeStructuredResume,
  normalizeText,
} = require('./resumeParser');

const STOP_WORDS = new Set([
  'the',
  'and',
  'for',
  'with',
  'that',
  'this',
  'from',
  'have',
  'has',
  'was',
  'were',
  'will',
  'into',
  'your',
  'you',
  'job',
  'role',
  'work',
  'must',
  'should',
  'required',
  'preferred',
  'experience',
  'years',
  'year',
  'team',
  'ability',
]);

const STRICT_GENERATION_SYSTEM_PROMPT =
  'You are a professional resume writer. Generate a resume using ONLY the data provided below. Do NOT add fictional data, do NOT remove any provided data. Structure the resume with these exact sections in order: 1) Contact Information 2) Professional Summary 3) Skills 4) Work Experience 5) Education 6) Projects (if provided) 7) Certifications (if provided). Each section must be clearly labeled. Omit any section that has no data (especially Work Experience). For Work Experience, list each role with: Job Title, Company, Duration, and bullet points for responsibilities. For Projects, each project MUST be a separate entry and MUST use this shape: first line Project Name (optionally with "Demo/Source" links), second line pipe-separated tech stack, then bullet points. Never merge multiple projects into one paragraph. Output in clean plain text with clear section separators.';

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

function parseJsonSafely(rawText = '') {
  const text = String(rawText || '').trim();
  if (!text) return null;

  const clean = text.replace(/^```json/i, '').replace(/^```/i, '').replace(/```$/, '').trim();

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

function getGeminiModel() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  if (!geminiModelCache) {
    const genAI = new GoogleGenerativeAI(apiKey);
    geminiModelCache = genAI.getGenerativeModel({
      model: process.env.GEMINI_MODEL || 'gemini-1.5-flash',
    });
  }

  return geminiModelCache;
}

function hasStructuredData(data = {}) {
  if (!data || typeof data !== 'object') return false;
  if (data.name || data.email || data.phone || data.summary || data.linkedin || data.github) return true;
  if (Array.isArray(data.skills) && data.skills.length) return true;
  if (Array.isArray(data.experience) && data.experience.length) return true;
  if (Array.isArray(data.education) && data.education.length) return true;
  if (Array.isArray(data.projects) && data.projects.length) return true;
  if (Array.isArray(data.certifications) && data.certifications.length) return true;
  return false;
}

function normalizeStructuredInput(input = '', options = {}) {
  const sourceText = normalizeText(options.sourceResumeText || '');

  if (typeof input === 'string') {
    const parsed = parseStructuredResumeData(input);
    if (hasStructuredData(parsed)) return parsed;
  }

  if (input && typeof input === 'object' && !Array.isArray(input)) {
    const sanitized = sanitizeStructuredResume(input);
    if (hasStructuredData(sanitized)) return sanitized;
  }

  if (sourceText) {
    return parseStructuredResumeData(sourceText);
  }

  return sanitizeStructuredResume({});
}

function mergeStructuredResume(base = {}, candidate = {}) {
  const baseSafe = sanitizeStructuredResume(base);
  const candidateSafe = sanitizeStructuredResume(candidate);

  const merged = {
    name: candidateSafe.name || baseSafe.name,
    email: candidateSafe.email || baseSafe.email,
    phone: candidateSafe.phone || baseSafe.phone,
    linkedin: candidateSafe.linkedin || baseSafe.linkedin,
    github: candidateSafe.github || baseSafe.github,
    summary: candidateSafe.summary || baseSafe.summary,
    skills: candidateSafe.skills.length ? candidateSafe.skills : baseSafe.skills,
    experience: candidateSafe.experience.length ? candidateSafe.experience : baseSafe.experience,
    education: candidateSafe.education.length ? candidateSafe.education : baseSafe.education,
    projects: candidateSafe.projects.length ? candidateSafe.projects : baseSafe.projects,
    certifications: candidateSafe.certifications.length
      ? candidateSafe.certifications
      : baseSafe.certifications,
  };

  return sanitizeStructuredResume(merged);
}

function renderStructuredResumeText(structuredResume = {}) {
  const data = sanitizeStructuredResume(structuredResume);
  const lines = [];

  lines.push('Contact Information');
  lines.push('-------------------');
  const contactParts = [data.name, data.email, data.phone].filter(Boolean);
  if (contactParts.length) lines.push(contactParts.join(' | '));
  if (data.linkedin) lines.push(`LinkedIn: ${data.linkedin}`);
  if (data.github) lines.push(`GitHub: ${data.github}`);
  if (!contactParts.length && !data.linkedin && !data.github) lines.push('N/A');
  lines.push('');

  lines.push('Professional Summary');
  lines.push('--------------------');
  lines.push(data.summary || 'N/A');
  lines.push('');

  lines.push('Skills');
  lines.push('------');
  lines.push(data.skills.length ? data.skills.join(', ') : 'N/A');
  lines.push('');
  const hasExperience = data.experience.some(
    (item) => item.title || item.company || item.duration || normalizeText(item.description)
  );
  if (hasExperience) {
    lines.push('Work Experience');
    lines.push('---------------');
    data.experience.forEach((item) => {
      lines.push(`Job Title: ${item.title || 'N/A'}`);
      lines.push(`Company: ${item.company || 'N/A'}`);
      lines.push(`Duration: ${item.duration || 'N/A'}`);
      const bullets = normalizeText(item.description).split('\n').map((line) => line.trim()).filter(Boolean);
      if (bullets.length) {
        bullets.forEach((bullet) => lines.push(`- ${bullet.replace(/^[-*\u2022]\s*/, '')}`));
      } else {
        lines.push('- N/A');
      }
      lines.push('');
    });
  }

  lines.push('Education');
  lines.push('---------');
  if (data.education.length) {
    data.education.forEach((item) =>
      lines.push(
        [item.degree, item.institution, item.year, item.percentage && `Percentage: ${item.percentage}`]
          .filter(Boolean)
          .join(' | ') || 'N/A'
      )
    );
  } else {
    lines.push('N/A');
  }
  lines.push('');

  if (data.projects.length) {
    lines.push('Projects');
    lines.push('--------');
    data.projects.forEach((item) => {
      lines.push(item.name || 'Project');
      lines.push(item.techStack || 'N/A');
      const bullets = normalizeText(item.description).split('\n').map((line) => line.trim()).filter(Boolean);
      if (bullets.length) {
        bullets.forEach((bullet) => lines.push(`- ${bullet.replace(/^[-*]\s*/, '')}`));
      } else {
        lines.push('- N/A');
      }
      lines.push('');
    });
  }

  if (data.certifications.length) {
    lines.push('Certifications');
    lines.push('--------------');
    data.certifications.forEach((item) => lines.push(`- ${item}`));
    lines.push('');
  }

  return lines.join('\n').trim();
}

function buildFallbackOptimizedResume(structuredResume = {}) {
  return renderStructuredResumeText(structuredResume);
}

function runFallbackAnalysis(resumeText = '', jobDescription = '') {
  const normalizedResume = String(resumeText || '').toLowerCase();
  const keywords = extractKeywords(jobDescription);

  const matchedKeywords = keywords.filter((kw) => normalizedResume.includes(kw)).slice(0, 20);
  const missingKeywords = keywords.filter((kw) => !normalizedResume.includes(kw)).slice(0, 20);

  const keywordScore = keywords.length ? Math.round((matchedKeywords.length * 100) / keywords.length) : 70;

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

  const structuredResume = parseStructuredResumeData(resumeText);
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
    optimizedResume: buildFallbackOptimizedResume(structuredResume),
    structuredResume,
  };
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
    resumeText || '(empty)',
  ].join('\n');

  const response = await model.generateContent({
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0.3,
      responseMimeType: 'application/json',
    },
  });

  const rawText = response.response.text();
  const payload = parseJsonSafely(rawText);

  if (!payload) {
    throw new Error('Failed to parse Gemini JSON output.');
  }

  return sanitizeAnalysisPayload(payload, resumeText, jobDescription);
}

async function runGeminiGenerate(structuredResume, jobDescription, options = {}) {
  const model = getGeminiModel();
  if (!model) {
    throw new Error('GEMINI_API_KEY missing.');
  }

  const templateName = String(options.templateName || '').trim();
  const sourceResumeText = normalizeText(options.sourceResumeText || '');

  const prompt = [
    STRICT_GENERATION_SYSTEM_PROMPT,
    '',
    'Use the following structured candidate data as the single source of truth.',
    'If any field is empty, keep that section concise and do not invent data.',
    '',
    'TEMPLATE STYLE:',
    templateName || 'General ATS Resume',
    '',
    'JOB DESCRIPTION:',
    normalizeText(jobDescription) || '(not provided)',
    '',
    'STRUCTURED USER DATA (JSON):',
    JSON.stringify(structuredResume, null, 2),
  ];

  if (sourceResumeText) {
    prompt.push('', 'SOURCE RESUME TEXT (for validation only):', sourceResumeText);
  }

  const response = await model.generateContent({
    contents: [{ role: 'user', parts: [{ text: prompt.join('\n') }] }],
    generationConfig: {
      temperature: 0.2,
    },
  });

  const output = String(response.response.text() || '')
    .trim()
    .replace(/^```[a-zA-Z]*\n?/, '')
    .replace(/```$/, '')
    .trim();

  if (!output) {
    throw new Error('Gemini returned empty resume output.');
  }

  const parsedFromOutput = parseStructuredResumeData(output);
  const merged = mergeStructuredResume(structuredResume, parsedFromOutput);

  return {
    optimizedResume: renderStructuredResumeText(merged),
    structuredResume: merged,
  };
}

async function analyzeResume(resumeText = '', jobDescription = '') {
  const safeResume = normalizeText(resumeText);
  const safeJobDescription = normalizeText(jobDescription);

  try {
    const analysis = await runGeminiAnalysis(safeResume, safeJobDescription);
    return {
      ...analysis,
      structuredResume: parseStructuredResumeData(analysis.optimizedResume || safeResume),
    };
  } catch (error) {
    console.warn('[ai] Gemini analysis fallback:', error.message);
    return runFallbackAnalysis(safeResume, safeJobDescription);
  }
}

async function generateAtsResume(resumeInput = '', jobDescription = '', options = {}) {
  const safeJobDescription = normalizeText(jobDescription);
  const structuredResume = normalizeStructuredInput(resumeInput, options);

  try {
    const generated = await runGeminiGenerate(structuredResume, safeJobDescription, options);
    if (generated.optimizedResume) {
      return generated;
    }
  } catch (error) {
    console.warn('[ai] Gemini generate fallback:', error.message);
  }

  return {
    optimizedResume: buildFallbackOptimizedResume(structuredResume),
    structuredResume,
  };
}

module.exports = {
  analyzeResume,
  generateAtsResume,
  extractKeywords,
  renderStructuredResumeText,
  mergeStructuredResume,
};

