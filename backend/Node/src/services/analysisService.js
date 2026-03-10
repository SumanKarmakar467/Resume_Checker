const STOP_WORDS = new Set([
  'the', 'and', 'for', 'with', 'your', 'from', 'that', 'this', 'have', 'has', 'was', 'are', 'you',
  'our', 'their', 'about', 'will', 'would', 'there', 'what', 'when', 'where', 'into', 'onto', 'able',
  'years', 'year', 'work', 'role', 'team', 'using', 'skills', 'skill', 'experience', 'resume', 'job'
]);

function normalize(text = '') {
  return text.toLowerCase().replace(/\s+/g, ' ').trim();
}

function buildFeedback(section, score, issues, suggestions) {
  let status = 'Low';
  if (score >= 80) status = 'Strong';
  else if (score >= 60) status = 'Needs Improvement';

  return {
    section,
    score: Math.max(0, Math.min(100, score)),
    status,
    issues,
    suggestions
  };
}

function countMatches(text, words) {
  return words.reduce((acc, word) => (text.includes(word) ? acc + 1 : acc), 0);
}

function extractKeywords(jobDescription = '') {
  if (!jobDescription.trim()) return [];

  const normalized = jobDescription.toLowerCase().replace(/[^a-z0-9\s]/g, ' ');
  const tokens = normalized.split(/\s+/);
  const keywords = [];
  const seen = new Set();

  for (const token of tokens) {
    if (token.length < 3 || STOP_WORDS.has(token) || seen.has(token)) continue;
    seen.add(token);
    keywords.push(token);
    if (keywords.length >= 30) break;
  }

  return keywords;
}

function scoreContactInfo(normalizedResume, rawResume) {
  const issues = [];
  const suggestions = [];

  const hasEmail = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/.test(rawResume);
  const hasPhone = /(?:\+?\d{1,3}[\s-]?)?(?:\(?\d{3}\)?[\s-]?)?\d{3}[\s-]?\d{4}/.test(rawResume);
  const hasLinkedIn = normalizedResume.includes('linkedin');

  let score = 0;
  if (hasEmail) score += 40;
  else {
    issues.push('Email is missing or not detected.');
    suggestions.push('Add a professional email address in the resume header.');
  }

  if (hasPhone) score += 40;
  else {
    issues.push('Phone number is missing or not detected.');
    suggestions.push('Include a valid phone number with country code.');
  }

  if (hasLinkedIn) score += 20;
  else {
    issues.push('LinkedIn profile is missing.');
    suggestions.push('Add a LinkedIn profile URL to improve recruiter trust.');
  }

  return buildFeedback('Contact Information', score, issues, suggestions);
}

function scoreSummary(normalizedResume) {
  const issues = [];
  const suggestions = [];
  const hasSummaryHeading =
    normalizedResume.includes('summary') ||
    normalizedResume.includes('professional profile') ||
    normalizedResume.includes('objective');

  const wordCount = normalizedResume.split(/\s+/).length;
  let score = 0;

  if (hasSummaryHeading) score += 60;
  else {
    issues.push('Summary/objective section heading not found.');
    suggestions.push("Add a clear 'Professional Summary' section near the top.");
  }

  if (wordCount >= 180) score += 40;
  else {
    issues.push('Resume content appears very short.');
    suggestions.push('Expand summary with impact, tools, and role-specific strengths.');
  }

  return buildFeedback('Professional Summary', score, issues, suggestions);
}

function scoreSkills(normalizedResume) {
  const issues = [];
  const suggestions = [];
  const hasSkillsHeading = normalizedResume.includes('skills') || normalizedResume.includes('technical skills');
  const detectedSkills = countMatches(normalizedResume, [
    'java', 'spring', 'react', 'sql', 'python', 'aws', 'docker', 'git', 'rest', 'api'
  ]);

  let score = 0;
  if (hasSkillsHeading) score += 55;
  else {
    issues.push('Skills section heading not detected.');
    suggestions.push("Create a dedicated 'Skills' section with relevant tools and technologies.");
  }

  score += Math.min(detectedSkills * 5, 45);
  if (detectedSkills < 6) {
    issues.push('Limited technical keyword coverage.');
    suggestions.push('Add more role-aligned skills from the job description.');
  }

  return buildFeedback('Skills', score, issues, suggestions);
}

function scoreExperience(normalizedResume) {
  const issues = [];
  const suggestions = [];

  const hasExperienceHeading = normalizedResume.includes('experience') || normalizedResume.includes('work history');
  const actionVerbs = countMatches(normalizedResume, [
    'built', 'developed', 'designed', 'led', 'improved', 'implemented', 'optimized', 'delivered', 'created', 'managed'
  ]);
  const hasNumbers = /\b\d+%?\b/.test(normalizedResume);

  let score = 0;
  if (hasExperienceHeading) score += 45;
  else {
    issues.push('Work experience section heading not detected.');
    suggestions.push("Add an 'Experience' section with company, role, and dates.");
  }

  score += Math.min(actionVerbs * 4, 35);
  if (actionVerbs < 5) {
    issues.push('Experience bullets are not impact-oriented.');
    suggestions.push('Use strong action verbs at the start of each experience bullet.');
  }

  if (hasNumbers) score += 20;
  else {
    issues.push('No measurable outcomes found.');
    suggestions.push('Add metrics like %, counts, or time saved in experience points.');
  }

  return buildFeedback('Experience', score, issues, suggestions);
}

function scoreEducation(normalizedResume) {
  const issues = [];
  const suggestions = [];

  const hasEducationHeading = normalizedResume.includes('education');
  const hasDegreeKeyword = ['b.tech', 'bachelor', 'master', 'm.tech', 'bsc', 'msc', 'degree', 'university', 'college']
    .some((word) => normalizedResume.includes(word));

  let score = 0;
  if (hasEducationHeading) score += 55;
  else {
    issues.push('Education section heading not detected.');
    suggestions.push('Add an Education section with degree, college, and year.');
  }

  if (hasDegreeKeyword) score += 45;
  else {
    issues.push('Degree/institute details look incomplete.');
    suggestions.push('Include degree name, institute, and graduation year.');
  }

  return buildFeedback('Education', score, issues, suggestions);
}

function scoreKeywordMatch(normalizedResume, keywords) {
  const issues = [];
  const suggestions = [];
  const missingKeywords = [];
  const matchedKeywords = [];

  if (keywords.length === 0) {
    issues.push('Job description keywords were not provided.');
    suggestions.push('Paste the job description to get more accurate ATS matching.');
    return { feedback: buildFeedback('Keyword Match', 0, issues, suggestions), missingKeywords, matchedKeywords };
  }

  let matched = 0;
  for (const keyword of keywords) {
    if (normalizedResume.includes(keyword)) {
      matched += 1;
      matchedKeywords.push(keyword);
    } else missingKeywords.push(keyword);
  }

  const score = Math.round((matched * 100) / keywords.length);
  if (score < 70) {
    issues.push('Resume is missing important job-specific keywords.');
    suggestions.push('Naturally add missing keywords in summary, skills, and experience sections.');
  }

  return {
    feedback: buildFeedback('Keyword Match', score, issues, suggestions),
    missingKeywords: missingKeywords.slice(0, 20),
    matchedKeywords: matchedKeywords.slice(0, 20)
  };
}

function scoreFormatting(rawResume = '', normalizedResume = '') {
  const issues = [];
  const suggestions = [];

  const lines = rawResume.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const wordCount = normalizedResume.split(/\s+/).filter(Boolean).length;
  const headingCount = lines.filter((line) => /^[A-Z][A-Z\s&]{2,}$/.test(line)).length;
  const bulletCount = lines.filter((line) => /^[-*]/.test(line)).length;

  let score = 30;

  if (wordCount >= 250 && wordCount <= 900) score += 25;
  else {
    issues.push('Resume length may be too short or too long for ATS screening.');
    suggestions.push('Keep resume around one page with concise, impact-focused bullets.');
  }

  if (headingCount >= 3) score += 25;
  else {
    issues.push('Resume headings are weak or missing.');
    suggestions.push('Use clear headings like SUMMARY, SKILLS, EXPERIENCE, EDUCATION.');
  }

  if (bulletCount >= 6) score += 20;
  else {
    issues.push('Not enough bullet points for readable ATS structure.');
    suggestions.push('Use bullet points in experience/projects for easier parsing.');
  }

  return buildFeedback('Formatting', score, issues, suggestions);
}

function calculatePanelScores(sections) {
  const findScore = (name) => sections.find((section) => section.section === name)?.score || 0;
  const average = (values) => Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);

  const contentScore = average([
    findScore('Professional Summary'),
    findScore('Skills'),
    findScore('Experience'),
    findScore('Keyword Match')
  ]);

  const sectionsScore = average([
    findScore('Contact Information'),
    findScore('Skills'),
    findScore('Experience'),
    findScore('Education')
  ]);

  const atsEssentialsScore = average([
    findScore('Keyword Match'),
    findScore('Formatting'),
    findScore('Contact Information')
  ]);

  const tailoringScore = average([
    findScore('Keyword Match'),
    findScore('Professional Summary')
  ]);

  return { contentScore, sectionsScore, atsEssentialsScore, tailoringScore };
}

function deduplicate(values) {
  return [...new Set(values)];
}

function analyzeResume(resumeText, jobDescription) {
  const normalizedResume = normalize(resumeText);
  const sections = [
    scoreContactInfo(normalizedResume, resumeText),
    scoreSummary(normalizedResume),
    scoreSkills(normalizedResume),
    scoreExperience(normalizedResume),
    scoreEducation(normalizedResume),
    scoreFormatting(resumeText, normalizedResume)
  ];

  const jobKeywords = extractKeywords(jobDescription);
  const keywordResult = scoreKeywordMatch(normalizedResume, jobKeywords);
  sections.push(keywordResult.feedback);

  const overallScore = Math.round(sections.reduce((sum, section) => sum + section.score, 0) / sections.length);

  const suggestions = deduplicate(sections.filter((s) => s.score < 70).flatMap((s) => s.suggestions));
  const panelScores = calculatePanelScores(sections);

  return {
    overallScore,
    sections,
    matchedKeywords: keywordResult.matchedKeywords,
    missingKeywords: keywordResult.missingKeywords,
    panelScores,
    suggestions: suggestions.length
      ? suggestions
      : ['Great baseline ATS compatibility. Tailor your resume for each job description before applying.'],
    extractedText: resumeText
  };
}

function findFirst(text, regex, fallback) {
  const match = text.match(regex);
  if (!match || !match[0]) return fallback;
  const value = match[0].trim();
  return value || fallback;
}

function capitalize(value) {
  if (!value) return value;
  return value[0].toUpperCase() + value.slice(1);
}

function generateAtsFriendlyResume(resumeText = '', jobDescription = '') {
  const normalizedResume = normalize(resumeText);
  const keywords = extractKeywords(jobDescription);
  const missingKeywords = keywords.filter((keyword) => !normalizedResume.includes(keyword));

  const name = findFirst(resumeText, /^(?:[A-Z][A-Za-z\s]{2,})$/m, 'Your Name');
  const email = findFirst(resumeText, /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/, 'youremail@example.com');
  const phone = findFirst(resumeText, /(?:\+?\d{1,3}[\s-]?)?(?:\(?\d{3}\)?[\s-]?)?\d{3}[\s-]?\d{4}/, '+1 000 000 0000');

  const summaryKeywords = missingKeywords.slice(0, 6);
  const skillKeywords = keywords.slice(0, 10);
  const notesKeywords = missingKeywords.slice(0, 15);

  let output = `${name}\n${email} | ${phone}\n\n`;
  output += 'PROFESSIONAL SUMMARY\n';
  output += 'Results-driven professional with experience delivering measurable outcomes and collaborating across teams. ';
  output += summaryKeywords.length
    ? `Core focus areas include ${summaryKeywords.join(', ')}.\n\n`
    : 'Experienced in aligning deliverables with role-specific requirements.\n\n';

  output += 'CORE SKILLS\n';
  if (skillKeywords.length) {
    output += skillKeywords.map((keyword) => `- ${capitalize(keyword)}`).join('\n') + '\n\n';
  } else {
    output += '- Communication\n- Problem Solving\n- Team Collaboration\n\n';
  }

  output += 'PROFESSIONAL EXPERIENCE\n';
  output += 'Job Title | Company Name | MM/YYYY - Present\n';
  output += '- Implemented key projects that improved process efficiency and quality metrics.\n';
  output += '- Collaborated with stakeholders to deliver outcomes aligned with business goals.\n';
  output += '- Used relevant tools and methods to solve problems and optimize delivery.\n\n';

  output += 'EDUCATION\n';
  output += 'Degree Name | University Name | Year\n\n';

  output += 'ATS OPTIMIZATION NOTES\n';
  output += notesKeywords.length
    ? `- Add these keywords naturally in summary/experience: ${notesKeywords.join(', ')}\n`
    : '- Resume already contains most job-description keywords.\n';
  output += '- Keep formatting simple (single column, standard headings, no text in images).\n';

  return output;
}

module.exports = {
  analyzeResume,
  generateAtsFriendlyResume
};
