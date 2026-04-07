const path = require('path');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');

const PHONE_REGEX = /(?:\+?\d{1,3}[\s.-]?)?(?:\(?\d{2,4}\)?[\s.-]?)?\d{3,4}[\s.-]?\d{3,4}/;
const EMAIL_REGEX = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/;
const DATE_RANGE_REGEX =
  /((?:19|20)\d{2}\s*(?:-|to)\s*(?:present|current|now|(?:19|20)\d{2}))|(?:\b(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+(?:19|20)\d{2}\s*(?:-|to)\s*(?:present|current|now|(?:\b(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+(?:19|20)\d{2})))/i;

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
    const value = cleanLine(item).replace(/^[-*•]\s*/, '');
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
  const candidateFromContact = contactLines.find((line) => {
    const value = cleanLine(line);
    if (!value) return false;
    if (EMAIL_REGEX.test(value) || PHONE_REGEX.test(value)) return false;
    if (/linkedin|github|http|www\./i.test(value)) return false;
    return /^[A-Za-z][A-Za-z .'-]{1,70}$/.test(value);
  });

  if (candidateFromContact) return candidateFromContact;

  const firstLine = cleanLine(normalizeText(fullText).split('\n')[0] || '');
  if (/^[A-Za-z][A-Za-z .'-]{1,70}$/.test(firstLine)) {
    return firstLine;
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
    .replace(/^[-*•]\s*/, '')
    .split(/,|\/|\||;|•/)
    .map((token) => cleanLine(token))
    .filter((token) => token && token.length <= 48);
}

function parseSkills(skillLines = []) {
  const tokens = [];
  for (const line of skillLines) {
    const normalized = cleanLine(line).replace(/^skills?\s*:/i, '');
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
    const lines = paragraph.map((line) => line.replace(/^[-*•]\s*/, '')).filter(Boolean);
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
      const dashSplit = header.split(/\s(?:-|–|—)\s/).map(cleanLine).filter(Boolean);
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
  const paragraphs = splitParagraphs(educationLines);
  const items = [];
  const degreeRegex =
    /(b\.?tech|bachelor|m\.?tech|master|b\.?e|m\.?e|bsc|msc|bca|mca|phd|diploma|high school|h\.?s)/i;
  const yearRegex = /(19|20)\d{2}(?:\s*-\s*(?:19|20)\d{2}|(?:\s*-\s*present))?/i;

  for (const paragraph of paragraphs) {
    const text = paragraph.join(' | ');
    const degree = pickFirstMatch(text, degreeRegex);
    const year = pickFirstMatch(text, yearRegex);
    const first = paragraph[0] || '';
    const parts = first.split('|').map(cleanLine).filter(Boolean);

    let institution = parts[0] || first;
    if (degree) institution = institution.replace(new RegExp(degree, 'i'), '').trim();
    if (year) institution = institution.replace(new RegExp(year, 'i'), '').trim();
    institution = institution.replace(/[,-]+$/g, '').trim();

    const normalizedDegree = degree || parts[1] || '';
    const normalizedYear = year || parts[2] || '';

    if (institution || normalizedDegree || normalizedYear) {
      items.push({
        degree: normalizedDegree,
        institution,
        year: normalizedYear,
      });
    }
  }

  return items;
}

function parseCertifications(certificationLines = []) {
  return toUniqueList(
    certificationLines.map((line) =>
      cleanLine(String(line || '').replace(/^[-*•]\s*/, '').replace(/^(certification|certificate)\s*:/i, ''))
    ),
    40
  );
}

function parseProjects(projectLines = []) {
  const paragraphs = splitParagraphs(projectLines);
  const items = [];

  for (const paragraph of paragraphs) {
    const lines = paragraph.map((line) => line.replace(/^[-*•]\s*/, '')).filter(Boolean);
    if (!lines.length) continue;

    const firstLine = lines[0];
    const techStackMatch = lines.join(' ').match(/(?:tech stack|technologies|stack)\s*:\s*([^|]+)$/i);
    const techStack = techStackMatch ? cleanLine(techStackMatch[1]) : '';

    let name = firstLine;
    if (name.includes('|')) {
      name = cleanLine(name.split('|')[0] || '');
    }
    name = cleanLine(name.replace(/^(project)\s*:/i, ''));

    const description = cleanLine(lines.slice(1).join(' '));

    if (name || description || techStack) {
      items.push({
        name,
        description,
        techStack,
      });
    }
  }

  return items;
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
          }))
          .filter((item) => item.degree || item.institution || item.year)
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
