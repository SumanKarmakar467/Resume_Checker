const STOP_WORDS = new Set([
  'the', 'and', 'for', 'with', 'your', 'from', 'that', 'this', 'have', 'has', 'was', 'are', 'you',
  'our', 'their', 'about', 'will', 'would', 'there', 'what', 'when', 'where', 'into', 'onto', 'able',
  'years', 'year', 'work', 'role', 'team', 'using', 'skills', 'skill', 'experience', 'resume', 'job',
  'candidate', 'strong', 'required', 'preferred', 'plus', 'knowledge'
]);

const ROLE_MATCHERS = [
  {
    role: 'Frontend Developer',
    keywords: ['react', 'next.js', 'vue', 'angular', 'javascript', 'typescript', 'html', 'css', 'tailwind', 'redux', 'ui', 'frontend']
  },
  {
    role: 'Backend Developer',
    keywords: ['node', 'express', 'java', 'spring', 'python', 'django', 'flask', 'api', 'microservice', 'backend', 'server']
  },
  {
    role: 'Full Stack Developer',
    keywords: ['full stack', 'react', 'node', 'express', 'mongodb', 'postgres', 'rest api', 'frontend', 'backend']
  },
  {
    role: 'Data Analyst',
    keywords: ['sql', 'excel', 'power bi', 'tableau', 'analytics', 'python', 'pandas', 'visualization']
  },
  {
    role: 'DevOps Engineer',
    keywords: ['docker', 'kubernetes', 'aws', 'ci/cd', 'terraform', 'linux', 'devops', 'jenkins']
  }
];

function normalize(text = '') {
  return String(text).toLowerCase().replace(/\s+/g, ' ').trim();
}

function deduplicate(values) {
  return [...new Set(values.filter(Boolean))];
}

function average(values) {
  if (!values.length) return 0;
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

function countMatches(text, words) {
  return words.reduce((acc, word) => (text.includes(word) ? acc + 1 : acc), 0);
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
    normalizedResume.includes('objective') ||
    normalizedResume.includes('about me');

  const wordCount = normalizedResume.split(/\s+/).length;
  let score = 0;

  if (hasSummaryHeading) score += 60;
  else {
    issues.push('Summary or objective section heading not found.');
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
    'java', 'spring', 'react', 'sql', 'python', 'aws', 'docker', 'git', 'rest', 'api', 'javascript', 'node', 'mongodb'
  ]);

  let score = 0;
  if (hasSkillsHeading) score += 55;
  else {
    issues.push('Skills section heading not detected.');
    suggestions.push("Create a dedicated 'Skills' section with relevant tools and technologies.");
  }

  score += Math.min(detectedSkills * 4, 45);
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
    issues.push('Degree or institute details look incomplete.');
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
    issues.push('Job description was not provided, so keyword alignment is estimated.');
    suggestions.push('Add the job description for role-specific keyword matching.');
    return { feedback: buildFeedback('Keyword Match', 70, issues, suggestions), missingKeywords, matchedKeywords };
  }

  let matched = 0;
  for (const keyword of keywords) {
    if (normalizedResume.includes(keyword)) {
      matched += 1;
      matchedKeywords.push(keyword);
    } else {
      missingKeywords.push(keyword);
    }
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
  const bulletCount = lines.filter((line) => /^[-*]\s+/.test(line)).length;

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
    suggestions.push('Use bullet points in experience or projects for easier parsing.');
  }

  return buildFeedback('Formatting', score, issues, suggestions);
}

function calculatePanelScores(sections) {
  const findScore = (name) => sections.find((section) => section.section === name)?.score || 0;

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

function inferBestFitRole(text = '') {
  const normalized = normalize(text);

  const scoredRoles = ROLE_MATCHERS.map((roleMatcher) => ({
    role: roleMatcher.role,
    score: roleMatcher.keywords.reduce((sum, keyword) => (normalized.includes(keyword) ? sum + 1 : sum), 0)
  }));

  scoredRoles.sort((a, b) => b.score - a.score);
  const best = scoredRoles[0] || { role: 'General Software Developer', score: 0 };

  if (best.score <= 1) {
    return { role: 'General Software Developer', score: best.score };
  }

  return best;
}

function roleSuggestionText(role, score) {
  if (!role || role === 'General Software Developer') {
    return 'Your resume is broadly aligned for software roles. Tailor keywords to each job description before applying.';
  }

  if (score >= 5) {
    return `Your resume is strong for ${role.toLowerCase()} openings. You can confidently apply to ${role.toLowerCase()} jobs.`;
  }

  return `Your resume currently leans toward ${role.toLowerCase()} roles. Strengthen project impact and job-specific keywords for better match.`;
}

function analyzeResume(resumeText = '', jobDescription = '') {
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

  const overallScore = average(sections.map((section) => section.score));
  const suggestions = deduplicate(sections.filter((section) => section.score < 70).flatMap((section) => section.suggestions));
  const panelScores = calculatePanelScores(sections);
  const bestRole = inferBestFitRole(`${resumeText}\n${jobDescription}`);

  return {
    atsScore: overallScore,
    overallScore,
    sections,
    matchedKeywords: keywordResult.matchedKeywords,
    missingKeywords: keywordResult.missingKeywords,
    panelScores,
    suggestions: suggestions.length
      ? suggestions
      : ['Great baseline ATS compatibility. Tailor your resume for each job description before applying.'],
    bestFitRole: bestRole.role,
    roleSuggestion: roleSuggestionText(bestRole.role, bestRole.score),
    extractedText: resumeText
  };
}

function firstMatch(text, regex, fallback = '') {
  const match = String(text || '').match(regex);
  return (match && match[0] ? match[0].trim() : fallback) || fallback;
}

function toTitleCase(value = '') {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

function headingKey(line = '') {
  const normalized = line.toLowerCase().replace(/[^a-z\s]/g, ' ').replace(/\s+/g, ' ').trim();
  if (!normalized) return '';

  if (['summary', 'professional summary', 'about', 'about me', 'profile', 'objective'].includes(normalized)) return 'summary';
  if (['skills', 'technical skills', 'core skills', 'tech stack'].includes(normalized)) return 'skills';
  if (['projects', 'project experience', 'key projects'].includes(normalized)) return 'projects';
  if (['experience', 'work experience', 'professional experience', 'work history'].includes(normalized)) return 'experience';
  if (['education', 'academic background'].includes(normalized)) return 'education';
  return '';
}

function splitSections(rawText = '') {
  const sections = {
    header: [],
    summary: [],
    skills: [],
    projects: [],
    experience: [],
    education: []
  };

  let active = 'header';
  const lines = rawText.split(/\r?\n/);

  for (const line of lines) {
    const trimmed = line.trim();
    const key = headingKey(trimmed);
    if (key) {
      active = key;
      continue;
    }
    if (!trimmed) continue;
    sections[active].push(trimmed);
  }

  return sections;
}

function uniqueDetectedSkills(text, words) {
  const normalizedText = normalize(text);
  return words.filter((word) => normalizedText.includes(word));
}

function parseProjects(projectLines = []) {
  if (!projectLines.length) return [];

  const projects = [];
  let current = null;

  const flush = () => {
    if (!current) return;
    const description = current.description.join(' ').trim();
    projects.push({
      name: current.name || 'Project',
      description,
      liveLink: current.liveLink || '',
      sourceCode: current.sourceCode || ''
    });
    current = null;
  };

  for (const rawLine of projectLines) {
    const line = rawLine.replace(/^[-*]\s*/, '').trim();
    if (!line) continue;

    const url = firstMatch(line, /https?:\/\/\S+/i, '');
    if (/project/i.test(line) || /^\d+[.)]/.test(rawLine) || /^[A-Z][A-Za-z0-9\s&().+-]{2,50}(\||-|:)/.test(line)) {
      flush();
      const name = line.split(/[|:-]/)[0].trim();
      current = { name: toTitleCase(name), description: [], liveLink: '', sourceCode: '' };
      if (url && /github|gitlab/i.test(url)) current.sourceCode = url;
      else if (url) current.liveLink = url;
      continue;
    }

    if (!current) {
      current = { name: 'Project', description: [], liveLink: '', sourceCode: '' };
    }

    if (url) {
      if (/github|gitlab/i.test(url)) current.sourceCode = current.sourceCode || url;
      else current.liveLink = current.liveLink || url;
    } else {
      current.description.push(line);
    }
  }

  flush();
  return projects.slice(0, 4);
}

function parseEducation(educationLines = []) {
  const rows = educationLines
    .map((line) => line.replace(/^[-*]\s*/, '').trim())
    .filter(Boolean);

  if (!rows.length) return [];

  return rows.slice(0, 3).map((line) => {
    const yearMatch = line.match(/(19|20)\d{2}/g);
    return {
      level: /b\.tech|bachelor|bsc|be\b/i.test(line)
        ? 'Undergraduate'
        : /m\.tech|master|msc/i.test(line)
          ? 'Postgraduate'
          : /12|higher secondary/i.test(line)
            ? '12th'
            : /10|secondary/i.test(line)
              ? '10th'
              : 'Education',
      board: line,
      percentage: firstMatch(line, /\b\d{1,2}(?:\.\d{1,2})?%\b|\b\d\.\d{1,2}\s*CGPA\b/i, ''),
      year: yearMatch ? yearMatch.join(' - ') : ''
    };
  });
}

function buildAbout(profile) {
  const topSkills = [
    ...(profile.skills.frontend ? profile.skills.frontend.split(',') : []),
    ...(profile.skills.backend ? profile.skills.backend.split(',') : []),
    ...(profile.skills.database ? profile.skills.database.split(',') : [])
  ]
    .map((skill) => skill.trim())
    .filter(Boolean)
    .slice(0, 6);

  const projects = profile.projects.map((project) => project.name).filter(Boolean).slice(0, 2);
  const role = profile.targetRole || 'software developer';

  const parts = [
    `I am a ${role.toLowerCase()} focused on building production-ready applications with clean, ATS-friendly communication.`
  ];

  if (topSkills.length) {
    parts.push(`My core stack includes ${topSkills.join(', ')}.`);
  }

  if (projects.length) {
    parts.push(`Recent work includes ${projects.join(' and ')} with measurable delivery focus.`);
  }

  return parts.join(' ');
}

function extractProfileFromResumeText(resumeText = '', jobDescription = '') {
  const cleanText = String(resumeText || '').replace(/\u0000/g, ' ');
  const lines = cleanText.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const sections = splitSections(cleanText);

  const nameFromHeader = lines.find((line) =>
    /^[A-Za-z][A-Za-z\s.'-]{2,45}$/.test(line) &&
    !/@/.test(line) &&
    !/^\d+$/.test(line) &&
    !headingKey(line)
  );

  const email = firstMatch(cleanText, /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/, '');
  const phone = firstMatch(cleanText, /(?:\+?\d{1,3}[\s-]?)?(?:\(?\d{3}\)?[\s-]?)?\d{3}[\s-]?\d{4}/, '');

  const links = deduplicate((cleanText.match(/https?:\/\/[^\s)\]]+/gi) || []));
  const linkedin = links.find((url) => /linkedin\.com/i.test(url)) || '';
  const github = links.find((url) => /github\.com/i.test(url)) || '';

  const locationLine = lines.find((line) =>
    /,/.test(line) &&
    !/@/.test(line) &&
    !/https?:\/\//i.test(line) &&
    /[A-Za-z]{2,}/.test(line)
  );

  const frontendSkills = uniqueDetectedSkills(cleanText, [
    'react', 'next.js', 'vue', 'angular', 'javascript', 'typescript', 'html', 'css', 'tailwind', 'redux', 'vite'
  ]);
  const backendSkills = uniqueDetectedSkills(cleanText, [
    'node', 'express', 'spring', 'java', 'python', 'django', 'flask', 'php', 'laravel', 'go', 'rest api'
  ]);
  const databaseSkills = uniqueDetectedSkills(cleanText, [
    'mongodb', 'mysql', 'postgresql', 'postgres', 'redis', 'firebase', 'sql'
  ]);
  const toolSkills = uniqueDetectedSkills(cleanText, [
    'git', 'docker', 'aws', 'gcp', 'azure', 'postman', 'jira', 'linux', 'figma'
  ]);

  const inferredRole = inferBestFitRole(cleanText);
  const summary = sections.summary.join(' ').trim();

  const profile = {
    fullName: nameFromHeader ? toTitleCase(nameFromHeader) : 'Your Name',
    email,
    phone,
    location: locationLine || '',
    linkedin,
    github,
    targetRole: inferredRole.role,
    summary: summary || '',
    about: '',
    experience: sections.experience.join('\n'),
    projects: parseProjects(sections.projects),
    education: parseEducation(sections.education),
    skills: {
      frontend: frontendSkills.join(', '),
      backend: backendSkills.join(', '),
      database: databaseSkills.join(', '),
      tools: toolSkills.join(', ')
    }
  };

  profile.about = buildAbout(profile);

  const generatedResume = generateAtsFriendlyResume(cleanText, jobDescription, profile);
  const generatedAnalysis = analyzeResume(generatedResume, jobDescription);

  return {
    profile,
    generatedResume,
    generatedAtsScore: generatedAnalysis.atsScore,
    bestFitRole: generatedAnalysis.bestFitRole,
    roleSuggestion: generatedAnalysis.roleSuggestion
  };
}

function resumeFromProfile(profile = {}) {
  const skillsBuckets = [
    ['Frontend', profile.skills?.frontend],
    ['Backend', profile.skills?.backend],
    ['Database', profile.skills?.database],
    ['Tools', profile.skills?.tools]
  ].filter(([, value]) => value && value.trim());

  const projectBlocks = (profile.projects || []).slice(0, 4).map((project) => {
    const bullets = [];
    if (project.description) bullets.push(`- ${project.description}`);
    if (project.liveLink) bullets.push(`- Live: ${project.liveLink}`);
    if (project.sourceCode) bullets.push(`- Code: ${project.sourceCode}`);
    return `${project.name || 'Project'}\n${bullets.join('\n')}`.trim();
  });

  const educationBlocks = (profile.education || []).slice(0, 3).map((item) => {
    const parts = [item.board || item.level || 'Education'];
    if (item.percentage) parts.push(item.percentage);
    if (item.year) parts.push(item.year);
    return `- ${parts.join(' | ')}`;
  });

  const experienceLines = String(profile.experience || '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 4);

  const contactParts = [profile.email, profile.phone, profile.location, profile.linkedin, profile.github].filter(Boolean);

  let output = '';
  output += `${(profile.fullName || 'Your Name').toUpperCase()}\n`;
  output += `${profile.targetRole || 'SOFTWARE DEVELOPER'}\n`;
  output += `${contactParts.join(' | ')}\n\n`;

  output += 'ABOUT\n';
  output += `${profile.about || profile.summary || 'Professional with strong execution focus and a recruiter-friendly communication style.'}\n\n`;

  output += 'PROFESSIONAL SUMMARY\n';
  output += `${profile.summary || 'Delivered practical software solutions with measurable outcomes, clear ownership, and collaborative delivery.'}\n\n`;

  output += 'CORE SKILLS\n';
  if (skillsBuckets.length) {
    output += `${skillsBuckets.map(([label, value]) => `- ${label}: ${value}`).join('\n')}\n\n`;
  } else {
    output += '- Add 8-12 role-specific technical keywords here.\n\n';
  }

  output += 'PROJECT EXPERIENCE\n';
  output += `${projectBlocks.length ? projectBlocks.join('\n\n') : '- Add project name, tech stack, and measurable impact bullets.'}\n\n`;

  output += 'PROFESSIONAL EXPERIENCE\n';
  if (experienceLines.length) {
    output += `${experienceLines.map((line) => (line.startsWith('-') ? line : `- ${line}`)).join('\n')}\n\n`;
  } else {
    output += '- Built and improved features that increased usability and delivery speed.\n';
    output += '- Collaborated with stakeholders and shipped production-ready modules.\n';
    output += '- Documented outcomes with clear impact metrics where possible.\n\n';
  }

  output += 'EDUCATION\n';
  output += `${educationBlocks.length ? educationBlocks.join('\n') : '- Add degree, institution, score, and year.'}`;

  return output.trim();
}

function generateAtsFriendlyResume(resumeText = '', jobDescription = '', profileInput = null) {
  const profile = profileInput || extractProfileFromResumeText(resumeText, jobDescription).profile;
  const keywords = extractKeywords(jobDescription);
  const base = resumeFromProfile(profile);

  if (!keywords.length) return base;

  const existing = normalize(base);
  const missing = keywords.filter((keyword) => !existing.includes(keyword)).slice(0, 12);

  if (!missing.length) return base;

  const keywordLine = `\n\nTARGET KEYWORDS\n- ${missing.map((keyword) => toTitleCase(keyword)).join(', ')}`;
  return `${base}${keywordLine}`;
}

function findLine(text, patterns = []) {
  const lines = String(text || '').split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  return lines.find((line) => patterns.some((pattern) => pattern.test(line))) || '';
}

function generateRewriteSuggestions(resumeText = '', jobDescription = '') {
  const analysis = analyzeResume(resumeText, jobDescription);
  const suggestions = [];

  if ((analysis.missingKeywords || []).length) {
    suggestions.push({
      section: 'Keyword Match',
      originalLine: 'Resume misses role-specific keywords from the job description.',
      improvedLine: `Add these keywords naturally in summary or project bullets: ${(analysis.missingKeywords || []).slice(0, 6).join(', ')}`,
      reason: 'Keyword overlap helps ATS ranking and recruiter relevance checks.'
    });
  }

  if ((analysis.sections || []).find((section) => section.section === 'Professional Summary')?.score < 70) {
    suggestions.push({
      section: 'Summary',
      originalLine: findLine(resumeText, [/summary/i, /objective/i]) || 'Summary is missing.',
      improvedLine: 'Results-driven developer with hands-on delivery experience, strong ownership, and clear impact metrics aligned to the role.',
      reason: 'A concise and role-specific summary improves first-pass recruiter review.'
    });
  }

  if ((analysis.sections || []).find((section) => section.section === 'Experience')?.score < 70) {
    suggestions.push({
      section: 'Experience',
      originalLine: findLine(resumeText, [/built/i, /developed/i, /implemented/i]) || 'Experience bullets are generic.',
      improvedLine: 'Developed and shipped key features, improving task completion by 28% and reducing response time by 35%.',
      reason: 'Metrics plus action verbs make your experience more credible and recruiter-friendly.'
    });
  }

  if ((analysis.sections || []).find((section) => section.section === 'Skills')?.score < 70) {
    suggestions.push({
      section: 'Skills',
      originalLine: findLine(resumeText, [/skills/i]) || 'Skills section is weak.',
      improvedLine: 'Skills: React, JavaScript, TypeScript, Node.js, Express, MongoDB, REST API, Git, Docker',
      reason: 'Specific technical skills improve ATS parsing and role matching.'
    });
  }

  if ((analysis.sections || []).find((section) => section.section === 'Formatting')?.score < 70) {
    suggestions.push({
      section: 'Formatting',
      originalLine: 'Section structure is inconsistent.',
      improvedLine: 'Use consistent headings: SUMMARY, SKILLS, EXPERIENCE, PROJECTS, EDUCATION with bullet points.',
      reason: 'Standard structure is easier for ATS parsers and recruiters to scan quickly.'
    });
  }

  return suggestions.slice(0, 5);
}

module.exports = {
  analyzeResume,
  extractKeywords,
  inferBestFitRole,
  extractProfileFromResumeText,
  generateAtsFriendlyResume,
  generateRewriteSuggestions
};
