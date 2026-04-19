const path = require('path');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');

const PHONE_REGEX = /(?:\+?\d{1,3}[\s.-]?)?(?:\(?\d{2,4}\)?[\s.-]?)?\d{3,4}[\s.-]?\d{3,4}/;
const EMAIL_REGEX = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/;
const DATE_RANGE_REGEX =
  /((?:19|20)\d{2}\s*(?:-|to)\s*(?:present|current|now|(?:19|20)\d{2}))|(?:\b(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+(?:19|20)\d{2}\s*(?:-|to)\s*(?:present|current|now|(?:\b(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+(?:19|20)\d{2})))/i;
const BULLET_PREFIX_REGEX = /^(?:[\u2022\u25CF\u25AA\u25E6\u00B7*\u25A0\u25C6\u25B6\u25BA-])+\s*/;

function normalizeText(text = '') {
  return String(text || '')
    .replace(/\r/g, '')
    .replace(/\t/g, ' ')
    .replace(/[ ]{2,}/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function cleanLine(line = '') {
  return String(line || '').replace(/\s+/g, ' ').trim();
}

function isHeadingLine(line = '') {
  const normalized = cleanLine(line)
    .toLowerCase()
    .replace(/^[0-9]+[\).:-]?\s*/, '')
    .replace(/[:\-]+$/, '');

  const headingMap = {
    contact: ['contact information', 'contact'],
    summary: ['professional summary', 'summary', 'profile', 'objective', 'about'],
    skills: ['skills', 'technical skills', 'core skills', 'skillset'],
    experience: ['work experience', 'professional experience', 'experience', 'employment history'],
    education: ['education', 'academic background', 'academics'],
    projects: ['projects', 'key projects', 'project experience'],
    certifications: ['certifications', 'certification', 'licenses', 'license'],
  };

  for (const [key, names] of Object.entries(headingMap)) {
    if (names.some((name) => normalized === name || normalized.startsWith(`${name} `))) {
      return key;
    }
  }

  return '';
}

function splitSections(rawText = '') {
  const text = normalizeText(rawText);
  const rawLines = text.split('\n');
  const sections = {
    contact: [],
    summary: [],
    skills: [],
    experience: [],
    education: [],
    projects: [],
    certifications: [],
  };

  let currentSection = 'contact';
  let firstHeadingSeen = false;

  for (const rawLine of rawLines) {
    const line = cleanLine(rawLine);
    if (!line) {
      sections[currentSection].push('');
      continue;
    }

    const heading = isHeadingLine(line);
    if (heading) {
      currentSection = heading;
      firstHeadingSeen = true;

      const inline = line.split(':').slice(1).join(':').trim();
      if (inline) {
        sections[currentSection].push(inline);
      }
      continue;
    }

    if (!firstHeadingSeen) {
      sections.contact.push(line);
    } else {
      sections[currentSection].push(line);
    }
  }

  return sections;
}

function pickFirstMatch(text = '', regex) {
  const match = String(text || '').match(regex);
  return match ? String(match[0] || '').trim() : '';
}

function toUniqueList(items = [], max = 40) {
  const seen = new Set();
  const output = [];

  for (const item of items) {
    const value = cleanLine(item).replace(BULLET_PREFIX_REGEX, '');
    if (!value) continue;
    const key = value.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    output.push(value);
    if (output.length >= max) break;
  }

  return output;
}

function parseName(contactLines = [], fullText = '') {
  const cleanCandidateName = (value = '') => {
    const normalized = cleanLine(value).replace(/([a-z])([A-Z])/g, '$1 $2');
    const words = normalized.split(/\s+/).filter(Boolean);
    const roleStart = words.findIndex((word) =>
      /^(mern|full-stack|fullstack|software|frontend|backend|developer|engineer|intern)$/i.test(word)
    );
    if (roleStart >= 2) {
      return words.slice(0, roleStart).join(' ');
    }
    return normalized;
  };

  const candidateFromContact = contactLines.find((line) => {
    const value = cleanLine(line);
    if (!value) return false;
    if (EMAIL_REGEX.test(value) || PHONE_REGEX.test(value)) return false;
    if (/linkedin|github|http|www\./i.test(value)) return false;
    return /^[A-Za-z][A-Za-z .'-]{1,70}$/.test(value);
  });

  if (candidateFromContact) return cleanCandidateName(candidateFromContact);

  const firstLine = cleanLine(normalizeText(fullText).split('\n')[0] || '');
  if (/^[A-Za-z][A-Za-z .'-]{1,70}$/.test(firstLine)) {
    return cleanCandidateName(firstLine);
  }
  return '';
}

function parseSummary(summaryLines = [], fullText = '') {
  const summary = normalizeText(summaryLines.join(' '));
  if (summary) return summary;

  const firstLongLine = normalizeText(fullText)
    .split('\n')
    .map(cleanLine)
    .find((line) => line.length >= 60 && line.length <= 320);
  return firstLongLine || '';
}

function splitSkillTokens(value = '') {
  return String(value || '')
    .replace(BULLET_PREFIX_REGEX, '')
    .split(/,|\/|\||;|\u2022|\u25CF|\u25AA|\u00B7/)
    .map((token) => cleanLine(token))
    .filter((token) => token && token.length <= 48);
}

function parseSkills(skillLines = []) {
  const tokens = [];
  for (const line of skillLines) {
    const normalized = cleanLine(line)
      .replace(/^(?:skills?)\s*:/i, '')
      .replace(
        /\b(Languages|Frontend|Backend|Database|Core CS|Tools\s*&\s*Platforms|Languages Spoken)(?=[A-Za-z])/gi,
        '$1: '
      )
      .replace(/^(?:Languages|Frontend|Backend|Database|Core CS|Tools\s*&\s*Platforms|Languages Spoken)\s*:\s*/i, '');
    tokens.push(...splitSkillTokens(normalized));
  }
  return toUniqueList(tokens, 60);
}

function splitParagraphs(lines = []) {
  const paragraphs = [];
  let current = [];

  for (const rawLine of lines) {
    const line = cleanLine(rawLine);
    if (!line) {
      if (current.length) {
        paragraphs.push(current);
        current = [];
      }
      continue;
    }
    current.push(line);
  }

  if (current.length) paragraphs.push(current);
  return paragraphs;
}

function parseExperience(experienceLines = []) {
  const paragraphs = splitParagraphs(experienceLines);
  const items = [];

  for (const paragraph of paragraphs) {
    const lines = paragraph.map((line) => line.replace(BULLET_PREFIX_REGEX, '')).filter(Boolean);
    if (!lines.length) continue;

    const header = lines[0];
    const duration = pickFirstMatch(lines.join(' '), DATE_RANGE_REGEX);
    let title = '';
    let company = '';

    if (header.includes('@')) {
      const [left, right] = header.split('@').map(cleanLine);
      title = left || '';
      company = String(right || '').split('|')[0].trim();
    } else if (header.includes('|')) {
      const parts = header.split('|').map(cleanLine).filter(Boolean);
      title = parts[0] || '';
      company = parts[1] || '';
    } else {
      const dashSplit = header.split(/\s(?:-|\u2013|\u2014)\s/).map(cleanLine).filter(Boolean);
      title = dashSplit[0] || header;
      company = dashSplit[1] || '';
    }

    const descriptionLines = lines.slice(1);
    const description = descriptionLines.length ? descriptionLines.join('\n') : '';

    if (title || company || duration || description) {
      items.push({
        title: title || '',
        company: company || '',
        duration: duration || '',
        description: description || '',
      });
    }
  }

  return items;
}

function parseEducation(educationLines = []) {
  const degreeRegex =
    /\b(b\.?\s?tech|bachelor(?:\s+of\s+technology)?|m\.?\s?tech|master|b\.?\s?e|m\.?\s?e|bsc|msc|bca|mca|phd|diploma|class\s*xii|class\s*x\b|10th|12th|higher\s+secondary|secondary|ssc|hsc)\b/i;
  const yearRegex = /((?:19|20)\d{2}\s*[-\u2013\u2014]\s*(?:19|20)\d{2})|((?:19|20)\d{2})/i;
  const percentageRegex =
    /\b(?:percentage|percent|marks?|score|cgpa|gpa)\b\s*[:\-]?\s*\d{1,2}(?:\.\d{1,2})?(?:\s*%|\s*\/\s*10)?|\d{1,2}(?:\.\d{1,2})?\s*%|\d(?:\.\d{1,2})?\s*\/\s*10|\d{1,2}(?:\.\d{1,2})?\s*cgpa|\d{1,2}(?:\.\d{1,2})?\s*gpa/i;
  const institutionRegex = /\b(college|school|university|institute|academy|management|polytechnic)\b/i;
  const detailRegex =
    /\b(class\s*x|class\s*xii|10th|12th|b\.?\s?tech|bachelor|master|m\.?\s?tech|diploma|ssc|hsc|wbbse|wbchse|cgpa|gpa)\b|((?:19|20)\d{2})|(\d{1,2}(?:\.\d{1,2})?\s*%)/i;

  const normalizeDegree = (value = '') => {
    const raw = cleanLine(value).toLowerCase();
    if (!raw) return '';
    if (/(b\.?\s?tech|bachelor)/i.test(raw)) return 'B.Tech';
    if (/(m\.?\s?tech|master)/i.test(raw)) return 'M.Tech';
    if (/(class\s*xii|12th|higher\s+secondary|hsc|h\.?s)/i.test(raw)) return 'Class XII';
    if (/(class\s*x\b|10th|secondary|ssc)/i.test(raw)) return 'Class X';
    return cleanLine(value);
  };

  const lines = educationLines
    .map((line) => cleanLine(String(line || '').replace(BULLET_PREFIX_REGEX, '').replace(/([a-z])([A-Z])/g, '$1 $2')))
    .filter((line) => line && !/^education$/i.test(line));

  const rows = [];
  const buildRow = (institutionPart = '', detailPart = '') => {
    const joined = cleanLine([institutionPart, detailPart].filter(Boolean).join(' '));
    const degree = normalizeDegree(pickFirstMatch(detailPart || joined, degreeRegex));
    const year = pickFirstMatch(joined, yearRegex);
    const percentage = cleanLine(pickFirstMatch(joined, percentageRegex)).toUpperCase();
    const institution = cleanLine(institutionPart)
      .replace(/[|]+/g, ' ')
      .replace(/\s{2,}/g, ' ')
      .replace(/[,-]+$/g, '')
      .trim();

    if (!institution && !degree && !year && !percentage) return null;
    return { degree, institution, year: cleanLine(year), percentage };
  };

  for (let index = 0; index < lines.length; index += 1) {
    const current = lines[index];
    const next = lines[index + 1] || '';

    if (current.includes('|')) {
      const parts = current.split('|').map(cleanLine).filter(Boolean);
      const joined = cleanLine(parts.join(' '));
      const degreeFromJoined = normalizeDegree(pickFirstMatch(joined, degreeRegex));
      const yearFromJoined = cleanLine(pickFirstMatch(joined, yearRegex));
      const percentageFromJoined = cleanLine(pickFirstMatch(joined, percentageRegex)).toUpperCase();

      const nonMetaPart = parts.find(
        (part) =>
          !degreeRegex.test(part) &&
          !yearRegex.test(part) &&
          !percentageRegex.test(part)
      );
      const institution = cleanLine(
        parts.find((part) => institutionRegex.test(part)) || nonMetaPart || parts[1] || ''
      );
      const degree = degreeFromJoined || normalizeDegree(parts[0] || '');

      if (degree || institution || yearFromJoined || percentageFromJoined) {
        rows.push({
          degree,
          institution,
          year: yearFromJoined,
          percentage: percentageFromJoined,
        });
      }
      continue;
    }

    if (institutionRegex.test(current) && detailRegex.test(next)) {
      const row = buildRow(current, next);
      if (row) rows.push(row);
      index += 1;
      continue;
    }

    if (detailRegex.test(current) && rows.length) {
      const previous = rows[rows.length - 1];
      if (!previous.degree) previous.degree = normalizeDegree(pickFirstMatch(current, degreeRegex));
      if (!previous.year) previous.year = cleanLine(pickFirstMatch(current, yearRegex));
      if (!previous.percentage) previous.percentage = cleanLine(pickFirstMatch(current, percentageRegex)).toUpperCase();
      continue;
    }

    const row = buildRow(current, '');
    if (row) rows.push(row);
  }

  const deduped = [];
  for (const row of rows) {
    const degree = cleanLine(row.degree);
    const institution = cleanLine(row.institution);
    const year = cleanLine(row.year);
    const percentage = cleanLine(row.percentage).toUpperCase();
    if (!degree && !institution && !year && !percentage) continue;

    const key = `${degree.toLowerCase()}|${institution.toLowerCase()}`;
    const existing = deduped.find((item) => `${item.degree.toLowerCase()}|${item.institution.toLowerCase()}` === key);
    if (existing) {
      if (!existing.year && year) existing.year = year;
      if (!existing.percentage && percentage) existing.percentage = percentage;
      continue;
    }
    deduped.push({ degree, institution, year, percentage });
  }

  return deduped;
}

function parseCertifications(certificationLines = []) {
  return toUniqueList(
    certificationLines.map((line) =>
      cleanLine(String(line || '').replace(BULLET_PREFIX_REGEX, '').replace(/^(certification|certificate)\s*:/i, ''))
    ),
    40
  );
}

function parseProjects(projectLines = []) {
  const lines = projectLines.map((raw) => String(raw || '').trim()).filter(Boolean);
  if (!lines.length) return [];

  const isLikelyProjectHeader = (line = '') => {
    const clean = cleanLine(line);
    if (!clean) return false;
    if (/demo/i.test(clean) && /source/i.test(clean)) return true;
    if (/[-\u2014]\s*(full[-\s]?stack|project|website|platform|tracker)/i.test(clean)) return true;
    return false;
  };

  const isLikelyTechStack = (line = '') => {
    const clean = cleanLine(line);
    return clean.includes('|') && !/[.!?]$/.test(clean);
  };

  const projects = [];
  let current = null;
  let pendingBullet = false;
  let currentBullet = '';

  const flushBullet = () => {
    if (!current || !currentBullet) return;
    current.bullets.push(cleanLine(currentBullet));
    currentBullet = '';
  };

  const flushCurrent = () => {
    if (!current) return;
    flushBullet();
    const description = current.bullets.join('\n').trim();
    if (current.name || description || current.techStack) {
      projects.push({
        name: cleanLine(current.name),
        techStack: cleanLine(current.techStack),
        description,
      });
    }
    current = null;
    pendingBullet = false;
  };

  for (const rawLine of lines) {
    const line = cleanLine(rawLine);
    if (!line) continue;

    if (isLikelyProjectHeader(line)) {
      flushCurrent();
      current = { name: line, techStack: '', bullets: [] };
      continue;
    }

    if (!current) {
      current = { name: line, techStack: '', bullets: [] };
      continue;
    }

    if (!current.techStack && isLikelyTechStack(line)) {
      current.techStack = line;
      continue;
    }

    if (BULLET_PREFIX_REGEX.test(line)) {
      flushBullet();
      const bulletText = line.replace(BULLET_PREFIX_REGEX, '');
      if (bulletText) {
        currentBullet = bulletText;
        pendingBullet = false;
      } else {
        pendingBullet = true;
      }
      continue;
    }

    if (pendingBullet) {
      flushBullet();
      currentBullet = line;
      pendingBullet = false;
      continue;
    }

    if (currentBullet) {
      currentBullet = [currentBullet, line].join(' ').trim();
    } else {
      currentBullet = line;
    }
  }

  flushCurrent();
  return projects;
}

function sanitizeStructuredResume(input = {}) {
  const normalizeExperience = (items) =>
    Array.isArray(items)
      ? items
          .map((item) => ({
            title: cleanLine(item?.title),
            company: cleanLine(item?.company),
            duration: cleanLine(item?.duration),
            description: normalizeText(item?.description),
          }))
          .filter((item) => item.title || item.company || item.duration || item.description)
      : [];

  const normalizeEducation = (items) =>
    Array.isArray(items)
      ? items
          .map((item) => ({
            degree: cleanLine(item?.degree),
            institution: cleanLine(item?.institution),
            year: cleanLine(item?.year),
            percentage: cleanLine(item?.percentage).toUpperCase(),
          }))
          .filter((item) => item.degree || item.institution || item.year || item.percentage)
      : [];

  const normalizeProjects = (items) =>
    Array.isArray(items)
      ? items
          .map((item) => ({
            name: cleanLine(item?.name),
            description: normalizeText(item?.description),
            techStack: cleanLine(item?.techStack),
          }))
          .filter((item) => item.name || item.description || item.techStack)
      : [];

  return {
    name: cleanLine(input.name),
    email: cleanLine(input.email),
    phone: cleanLine(input.phone),
    linkedin: cleanLine(input.linkedin),
    github: cleanLine(input.github),
    summary: normalizeText(input.summary),
    skills: toUniqueList(Array.isArray(input.skills) ? input.skills : splitSkillTokens(input.skills || ''), 60),
    experience: normalizeExperience(input.experience),
    education: normalizeEducation(input.education),
    certifications: toUniqueList(Array.isArray(input.certifications) ? input.certifications : [], 40),
    projects: normalizeProjects(input.projects),
  };
}

function parseStructuredResumeData(rawText = '') {
  const text = normalizeText(rawText);
  const sections = splitSections(text);
  const contactText = sections.contact.join('\n');

  const structured = {
    name: parseName(sections.contact, text),
    email: pickFirstMatch(contactText || text, EMAIL_REGEX),
    phone: pickFirstMatch(contactText || text, PHONE_REGEX),
    linkedin: pickFirstMatch(text, /(?:https?:\/\/)?(?:www\.)?linkedin\.com\/[^\s]+/i),
    github: pickFirstMatch(text, /(?:https?:\/\/)?(?:www\.)?github\.com\/[^\s]+/i),
    summary: parseSummary(sections.summary, text),
    skills: parseSkills(sections.skills),
    experience: parseExperience(sections.experience),
    education: parseEducation(sections.education),
    certifications: parseCertifications(sections.certifications),
    projects: parseProjects(sections.projects),
  };

  return sanitizeStructuredResume(structured);
}

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
    return normalizeText(data.text || '');
  }

  if (isDocx) {
    const data = await mammoth.extractRawText({ buffer: file.buffer });
    return normalizeText(data.value || '');
  }

  if (isTxt) {
    return normalizeText(file.buffer.toString('utf8'));
  }

  const error = new Error('Unsupported file type. Upload PDF, DOCX, or TXT.');
  error.status = 400;
  throw error;
}

module.exports = {
  extractTextFromFile,
  normalizeText,
  parseStructuredResumeData,
  sanitizeStructuredResume,
};

