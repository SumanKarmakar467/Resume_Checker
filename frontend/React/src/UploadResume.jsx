import { useEffect, useState } from 'react';
import { jsPDF } from 'jspdf';
import api from './api/axios';
import Result from './Result';
import {
  MAX_RESUME_FILE_SIZE_BYTES,
  MESSAGES,
  SUPPORTED_RESUME_EXTENSIONS
} from './constants/resumeCheckerConstants';

const emptyProject = () => ({ name: '', description: '', liveLink: '', sourceCode: '' });
const emptyEducation = () => ({ level: '10th', board: '', percentage: '', year: '' });

const initialBuilderData = {
  fullName: '',
  email: '',
  phone: '',
  github: '',
  location: '',
  linkedin: '',
  targetRole: '',
  useContactIcons: false,
  contactIconLinks: {
    email: '',
    phone: '',
    linkedin: '',
    github: ''
  },
  summary: '',
  experience: '',
  projects: [emptyProject()],
  education: [emptyEducation()],
  skills: { frontend: '', backend: '', database: '', codeEditor: '', aiTools: '' }
};

const templates = [
  {
    id: 'suman-resume-pdf-template',
    name: 'suman_resume.pdf Template',
    score: 94,
    description: 'Generated from uploaded file: suman_resume.pdf',
    preview: 'MERN + projects + ATS-friendly section flow',
    headshot: 'No Headshot',
    graphics: 'Minimal',
    columns: 'Single Column',
    color: 'Green',
    sampleResume: `SUMAN KARMAKAR
MERN STACK DEVELOPER & DSA ENTHUSIAST
GitHub | LinkedIn | Email | Phone

ABOUT ME
Final-year B.Tech student at GKCEM specializing in CSE with interest in real-world web projects.

PROJECTS
My Portfolio Website | Demo | Source
- Built modern responsive portfolio using HTML, CSS, JavaScript.

Bella Vista Restaurant | Demo | Source
- Built responsive restaurant website with structured UI components.

EDUCATION
GREATER KOLKATA COLLEGE OF ENGINEERING & MANAGEMENT (2022-2026)
B.Tech, Computer Science & Engineering
12th Board - WBCHSE | Percentage - 88.60
10th Board - WBBSE | Percentage - 70.57

ADDITIONAL INFORMATION
Technical Skills: Java, DSA, OOPS, HTML, CSS, JavaScript, Nodejs, Expressjs, Reactjs, MongoDB
Languages: English, Hindi, Bengali`
  },
  {
    id: 'suman-karmakar-2-pdf-template',
    name: 'Suman karmakar (2).pdf Template',
    score: 93,
    description: 'Generated from uploaded file: Suman karmakar (2).pdf',
    preview: 'About me + projects-first + education + additional info',
    headshot: 'No Headshot',
    graphics: 'Modern',
    columns: 'Single Column',
    color: 'Blue',
    sampleResume: `SUMAN KARMAKAR
MERN STACK DEVELOPER & DSA ENTHUSIAST
GitHub | LinkedIn | Email | Phone

ABOUT ME
Final-year B.Tech CSE student passionate about web development and practical projects.

PROJECTS
My Portfolio Website | Demo | Source
- Built responsive personal portfolio to showcase skills and projects.

My Food Project | Demo | Source
- Developed responsive food website with interactive UI components.

Bella Vista Restaurant | Demo | Source
- Built restaurant website with modern UI and structured sections.

EDUCATION
GREATER KOLKATA COLLEGE OF ENGINEERING & MANAGEMENT (2022-2026)
Bachelor of Technology, Computer Science & Engineering
12th Board - WBCHSE, Percentage - 88.60
10th Board - WBBSE, Percentage - 70.57

ADDITIONAL INFORMATION
Technical Skills: Java, DSA, OOPS, HTML, CSS, JavaScript, Nodejs, Expressjs, Reactjs, MongoDB
Languages: English, Hindi, Bengali`
  },
  {
    id: 'suman-karmakar-1-pdf-template',
    name: 'Suman karmakar (1).pdf Template',
    score: 92,
    description: 'Generated from uploaded file: Suman karmakar (1).pdf',
    preview: 'Student resume format with recruiter-friendly headings',
    headshot: 'No Headshot',
    graphics: 'Minimal',
    columns: 'Single Column',
    color: 'Navy',
    sampleResume: `SUMAN KARMAKAR
MERN STACK DEVELOPER & DSA ENTHUSIAST
GitHub | LinkedIn | Email | Phone

ABOUT ME
Final-year CSE student with strong interest in MERN development and DSA.

PROJECTS
Portfolio Website | Demo | Source
Food Project | Demo | Source
Bella Vista Restaurant | Demo | Source
Leet Code Metrics | Demo | Source

EDUCATION
GKCEM - B.Tech CSE (2022-2026)
12th WBCHSE - 88.60
10th WBBSE - 70.57

ADDITIONAL INFORMATION
Skills: Java, DSA, OOPS, HTML, CSS, JavaScript, Nodejs, Expressjs, Reactjs, MongoDB
Languages: English, Hindi, Bengali`
  },
  {
    id: 'clean-pro',
    name: 'Student Pro ATS',
    score: 92,
    description: 'Matches your latest resume style with strong ATS headings.',
    preview: 'Projects-first student layout + clear skills/education',
    headshot: 'Headshot',
    graphics: 'Minimal',
    columns: 'Single Column',
    color: 'Blue',
    sampleResume: `SUMAN KUMAR
MERN STACK DEVELOPER | KOLKATA
Email | Phone | GitHub | LinkedIn

ABOUT ME
Final-year B.Tech CSE student with hands-on MERN projects and strong DSA practice.

PROJECTS
LeetCode Metrics Tracker | Demo | Source
- Built real-time coding analytics dashboard with API integration.
- Improved tracking efficiency and optimized load speed.

Bella Vista Restaurant Website | Demo | Source
- Designed responsive UI and improved user navigation.

EDUCATION
B.Tech CSE, GKCEM (2022-2026)
12th WBCHSE - 88.60%
10th WBBSE - 70.57%

ADDITIONAL INFORMATION
Skills: React, Node.js, Express.js, MongoDB, Java, DSA, OOP
Languages: English, Hindi, Bengali`
  },
  {
    id: 'photo-premium-1',
    name: 'Photo Premium ATS',
    score: 91,
    description: 'Modern ATS template with headshot section and compact summary.',
    preview: 'Photo + two-column highlights + project impact',
    headshot: 'Headshot',
    graphics: 'Modern',
    columns: 'Two Column',
    color: 'Blue',
    sampleResume: `SUMAN KARMAKAR
MERN STACK DEVELOPER | KOLKATA
[PHOTO] | Email | Phone | LinkedIn | GitHub

SUMMARY
Final-year B.Tech CSE student focused on MERN products and DSA.

PROJECTS
LeetCode Metrics Tracker | Demo | Source
Portfolio Website | Live | Source

SKILLS
React, Node.js, Express.js, MongoDB, Java, DSA
EDUCATION
GKCEM (2022-2026), 12th-88.60, 10th-70.57`
  },
  {
    id: 'photo-premium-2',
    name: 'Executive Photo ATS',
    score: 90,
    description: 'Photo-ready ATS template for profiles needing visual identity.',
    preview: 'Headshot card + recruiter-facing summary + clear sections',
    headshot: 'Headshot',
    graphics: 'Minimal',
    columns: 'Single Column',
    color: 'Navy',
    sampleResume: `SUMAN KARMAKAR
SOFTWARE DEVELOPER | RESUME RATING TEMPLATE
[PHOTO] | Email | Phone | LinkedIn | GitHub

ABOUT ME
Hands-on full stack developer with project deployment experience.

EXPERIENCE / PROJECTS
Food Project, Bella Vista, Portfolio, LeetCode Metrics

EDUCATION
B.Tech CSE (2022-2026) | WBCHSE 88.60 | WBBSE 70.57

SKILLS
Frontend, Backend, Database, AI Tools, Code Editor`
  },
  {
    id: 'impact-first',
    name: 'Impact MERN ATS',
    score: 89,
    description: 'Quantified project bullets for better recruiter impact.',
    preview: 'Achievement-focused bullets with ATS-friendly structure',
    headshot: 'No Headshot',
    graphics: 'Modern',
    columns: 'Two Column',
    color: 'Navy',
    sampleResume: `SUMAN KUMAR
MERN STACK DEVELOPER & DSA ENTHUSIAST
Email | Phone | GitHub | LinkedIn

PROFESSIONAL SUMMARY
Built and deployed full-stack web projects with measurable UI and performance improvements.

KEY PROJECTS
Portfolio Website | Demo | Source
- Built responsive portfolio; improved profile visibility.
- Deployed on GitHub Pages with version-controlled releases.

Food Showcase App | Demo | Source
- Created interactive responsive UI with modern layout.
- Improved mobile usability and loading consistency.

TECHNICAL SKILLS
Frontend: HTML, CSS, JavaScript, React
Backend: Node.js, Express.js
Database: MongoDB
Core: Java, DSA, OOP

EDUCATION
B.Tech CSE (2022-2026), GKCEM
12th - 88.60%, 10th - 70.57%`
  },
  {
    id: 'minimal-ats',
    name: 'Classic Fresher ATS',
    score: 86,
    description: 'Simple fresher resume format inspired by your PDF structure.',
    preview: 'Clean one-page ATS style for internships and fresher roles',
    headshot: 'No Headshot',
    graphics: 'Minimal',
    columns: 'Single Column',
    color: 'Gray',
    sampleResume: `SUMAN KUMAR | Email | Phone | GitHub | LinkedIn | Kolkata

TARGET ROLE
Software Engineer / MERN Developer

SUMMARY
Final-year CSE student with practical full-stack project experience.

PROJECTS
1) LeetCode Metrics Tracker - React, API, Vercel (Demo | Source)
2) Restaurant Website - HTML, CSS, JS (Demo | Source)
3) Portfolio Website - HTML, CSS, JS (Live | Source)

EDUCATION
B.Tech CSE - 2022-2026
12th WBCHSE - 88.60%
10th WBBSE - 70.57%

SKILLS
Java, JavaScript, React, Node.js, Express.js, MongoDB, Git, GitHub, VS Code`
  }
];

const hasText = (v) => typeof v === 'string' && v.trim().length > 0;

const keywordsFromJd = (jd) =>
  jd
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w, i, a) => w.length > 2 && a.indexOf(w) === i)
    .slice(0, 12);

const scoreDraft = (draft, jd) => {
  const text = draft.toLowerCase();
  let score = 35;
  if (/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i.test(draft)) score += 10;
  if (/summary/i.test(draft)) score += 10;
  if (/skills/i.test(draft)) score += 10;
  if (/experience/i.test(draft)) score += 10;
  if (/education/i.test(draft)) score += 10;
  if (/\d+%|\d+\+/.test(draft)) score += 5;

  const keys = keywordsFromJd(jd);
  if (keys.length) score += Math.round((keys.filter((k) => text.includes(k)).length / keys.length) * 10);
  return Math.max(0, Math.min(100, score));
};

function buildDraft(data, jdKeywords, templateName) {
  const ensureUrl = (value) => {
    if (!value) return '';
    return /^https?:\/\//i.test(value) ? value : `https://${value}`;
  };

  const contactItems = [];
  if (hasText(data.email)) {
    contactItems.push({
      label: data.email.trim(),
      href: `mailto:${data.email.trim()}`,
      symbol: '✉',
      icon: data.contactIconLinks?.email || ''
    });
  }
  if (hasText(data.phone)) {
    contactItems.push({
      label: data.phone.trim(),
      href: `tel:${data.phone.trim()}`,
      symbol: '☎',
      icon: data.contactIconLinks?.phone || ''
    });
  }
  if (hasText(data.linkedin)) {
    contactItems.push({
      label: data.linkedin.trim(),
      href: ensureUrl(data.linkedin.trim()),
      symbol: 'in',
      icon: data.contactIconLinks?.linkedin || ''
    });
  }
  if (hasText(data.github)) {
    contactItems.push({
      label: data.github.trim(),
      href: ensureUrl(data.github.trim()),
      symbol: 'GH',
      icon: data.contactIconLinks?.github || ''
    });
  }

  const contactWithIcons = contactItems
    .map((item) => {
      const iconMarkup = hasText(item.icon)
        ? `<img src="${item.icon}" alt="${item.symbol}" width="14" height="14" />`
        : item.symbol;
      return `<a href="${item.href}" target="_blank" rel="noopener noreferrer">${iconMarkup} ${item.label}</a>`;
    })
    .join(' | ');

  const contact =
    [data.email, data.phone, data.location, data.linkedin, data.github].filter((x) => hasText(x)).join(' | ') ||
    'yourmail@example.com | +1 000 000 0000';
  const finalContactLine = data.useContactIcons ? contactWithIcons || contact : contact;

  const skills =
    Object.entries({
      Frontend: data.skills.frontend,
      Backend: data.skills.backend,
      Database: data.skills.database,
      'Code Editor': data.skills.codeEditor,
      'AI Tools': data.skills.aiTools
    })
      .filter(([, v]) => hasText(v))
      .map(([k, v]) => `- ${k}: ${v}`)
      .join('\n') || '- Skills are optional';

  const projects =
    data.projects
      .filter((p) => [p.name, p.description, p.liveLink, p.sourceCode].some(hasText))
      .map(
        (p) =>
          `- ${p.name || 'N/A'}\n  Description: ${p.description || 'N/A'}\n  Live Link: ${p.liveLink || 'N/A'}\n  Source Code: ${p.sourceCode || 'N/A'}`
      )
      .join('\n') || '- Projects are optional';

  const education =
    (data.education || [])
      .filter((e) => [e.level, e.board, e.percentage, e.year].some(hasText))
      .map((e) => `- ${e.level || 'UG'}: ${e.board || 'Board'} | ${e.percentage || 'Percentage'} | ${e.year || 'Year'}`)
      .join('\n') || '- Education is optional';

  const exp = hasText(data.experience)
    ? data.experience
        .split('\n')
        .filter(Boolean)
        .map((l) => `- ${l}`)
        .join('\n')
    : '- Experience is optional';

  const keys = jdKeywords || 'No JD keywords provided';

  const compactSkills = Object.values(data.skills)
    .filter(hasText)
    .join(', ');

  if (templateName.includes('.pdf Template') || templateName === 'Suman PDF Style (Exact)') {
    const profileLine = data.useContactIcons
      ? contactWithIcons ||
        [data.github || 'GitHub', data.linkedin || 'linkedIn', data.email || 'Email', data.phone || 'Phone']
          .filter(hasText)
          .join('   ')
      : [data.github || 'GitHub', data.linkedin || 'linkedIn', data.email || 'Email', data.phone || 'Phone']
          .filter(hasText)
          .join('   ');

    const aboutMeText =
      data.summary ||
      'I am a final-year B.Tech student specializing in Computer Science & Engineering, passionate about web development and real-world projects.';

    const projectBlocks = data.projects
      .filter((p) => [p.name, p.description, p.liveLink, p.sourceCode].some(hasText))
      .map((p) => `${p.name || 'Project Name'}${p.liveLink ? `   ${p.liveLink}` : ''}${p.sourceCode ? `   ${p.sourceCode}` : ''}\n${p.description || 'Project description.'}`);

    const educationLines = (data.education || [])
      .filter((e) => [e.level, e.board, e.percentage, e.year].some(hasText))
      .map(
        (e) =>
          `${e.level || 'UG'} - ${e.board || 'Board'}${e.percentage ? `, Percentage - ${e.percentage}` : ''}${e.year ? `   ${e.year}` : ''}`
      );

    return `${(data.fullName || 'SUMAN KARMAKAR').toUpperCase()}
${(data.targetRole || 'MERN STACK DEVELOPER & DSA ENTHUSIAST').toUpperCase()}

${profileLine}

ABOUT ME
${aboutMeText}

PROJECTS
${projectBlocks.length ? projectBlocks.join('\n\n') : 'My Portfolio Website   Demo   Source\nDeveloped a personal portfolio website using HTML, CSS, and JavaScript.'}

EDUCATION
${educationLines.length ? educationLines.join('\n') : 'GREATER KOLKATA COLLEGE OF ENGINEERING & MANAGEMENT   2022-2026\nBachelor of Technology, Computer Science & Engineering\n12th Board - WBCHSE, Percentage - 88.60\n10th Board - WBBSE, Percentage - 70.57'}

ADDITIONAL INFORMATION
Technical Skills: ${compactSkills || 'Java, DSA, OOPS, HTML, CSS, JavaScript, Nodejs, Expressjs, Reactjs, MongoDB'}
Keywords: ${keys}
`;
  }

  return `${templateName}
${data.fullName || 'Your Name'}
${finalContactLine}

TARGET ROLE
${data.targetRole || 'Optional'}

SUMMARY
${data.summary || 'Optional summary'}

SKILLS
${skills}

EXPERIENCE
${exp}

PROJECTS
${projects}

EDUCATION
${education}

ATS KEYWORDS
${keys}
`;
}

/**
 * Main page for resume checking and ATS resume builder workflows.
 */
function UploadResume() {
  const [activeView, setActiveView] = useState('home');
  const [builderStep, setBuilderStep] = useState('templates');
  const [file, setFile] = useState(null);
  const [checkerJobDescription, setCheckerJobDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [analysis, setAnalysis] = useState(null);
  const [resumeDraft, setResumeDraft] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState(templates[0].id);
  const [builderData, setBuilderData] = useState(initialBuilderData);
  const [builderJobDescription, setBuilderJobDescription] = useState('');
  const [builderDraft, setBuilderDraft] = useState('');
  const [pdfFileName, setPdfFileName] = useState('resume-rating-draft');
  const [builderScore, setBuilderScore] = useState(0);
  const [templateStyleMode, setTemplateStyleMode] = useState('all');
  const [templatePreviewMode, setTemplatePreviewMode] = useState('thumbnail');
  const [templateCountMode, setTemplateCountMode] = useState('all');
  const [templateFilter, setTemplateFilter] = useState({
    headshot: 'All',
    graphics: 'All',
    columns: 'All',
    color: 'All'
  });
  const [builderLoading, setBuilderLoading] = useState(false);
  const [builderError, setBuilderError] = useState('');
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('theme');
    const dark = stored ? stored === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;
    setIsDark(dark);
    document.documentElement.classList.toggle('dark', dark);
  }, []);

  useEffect(() => {
    if (activeView !== 'home') return;
    const elements = document.querySelectorAll('.reveal-on-scroll');
    if (!elements.length) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) entry.target.classList.add('is-visible');
        });
      },
      { threshold: 0.16 }
    );
    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [activeView]);

  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.classList.toggle('dark', next);
    localStorage.setItem('theme', next ? 'dark' : 'light');
  };

  const fetchAtsDraft = async (resumeText, jobDescription) =>
    (await api.post('/api/resume/generate-ats', { resumeText, jobDescription }))?.data?.generatedResume || '';

  const getJobTitleFromDescription = (description) => {
    if (!description?.trim()) return '';
    const firstLine = description.trim().split(/\r?\n/)[0]?.trim() || '';
    return firstLine.slice(0, 120);
  };

  const handleAnalyze = async (event) => {
    event.preventDefault();
    if (!file) return setError(MESSAGES.uploadRequired);

    const fileName = file.name.toLowerCase();
    const hasSupportedExtension = SUPPORTED_RESUME_EXTENSIONS.some((extension) => fileName.endsWith(extension));
    if (!hasSupportedExtension) {
      return setError(MESSAGES.uploadInvalidType);
    }
    if (file.size > MAX_RESUME_FILE_SIZE_BYTES) {
      return setError(MESSAGES.uploadSizeExceeded);
    }

    setLoading(true);
    setError('');
    setAnalysis(null);
    setResumeDraft('');

    try {
      const form = new FormData();
      form.append('file', file);
      form.append('jobDescription', checkerJobDescription);
      form.append('jobTitle', getJobTitleFromDescription(checkerJobDescription));

      const res = await api.post('/api/resume/analyze', form, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setAnalysis(res.data);
      if (res.data?.extractedText) setResumeDraft(await fetchAtsDraft(res.data.extractedText, checkerJobDescription));
    } catch (e) {
      setError(e?.response?.data?.error || e?.response?.data?.message || e?.message || MESSAGES.analyzeFailed);
    } finally {
      setLoading(false);
    }
  };

  const handleBuild = (e) => {
    e.preventDefault();
    setBuilderError('');

    if (!hasText(builderData.fullName) || !hasText(builderData.email) || !hasText(builderData.phone)) {
      setBuilderError('Name, Email and Phone are mandatory.');
      return;
    }

    const t = templates.find((x) => x.id === selectedTemplate) || templates[0];
    const keys = keywordsFromJd(builderJobDescription).join(', ');
    const draft = buildDraft(builderData, keys, t.name);
    setBuilderDraft(draft);
    setBuilderScore(scoreDraft(draft, builderJobDescription));
  };

  const updateTop = (k, v) => setBuilderData((c) => ({ ...c, [k]: v }));
  const updateProject = (i, k, v) =>
    setBuilderData((c) => ({
      ...c,
      projects: c.projects.map((p, idx) => (idx === i ? { ...p, [k]: v } : p))
    }));
  const updateEducation = (lvl, k, v) =>
    setBuilderData((c) => ({
      ...c,
      education: { ...c.education, [lvl]: { ...c.education[lvl], [k]: v } }
    }));
  const updateSkill = (k, v) => setBuilderData((c) => ({ ...c, skills: { ...c.skills, [k]: v } }));
  const addProject = () => setBuilderData((c) => ({ ...c, projects: [...c.projects, emptyProject()] }));
  const removeProject = (i) =>
    setBuilderData((c) => ({
      ...c,
      projects: c.projects.length === 1 ? c.projects : c.projects.filter((_, idx) => idx !== i)
    }));

  const improveBuilder = async () => {
    if (!builderDraft.trim()) return setBuilderError('Build your resume draft first.');
    try {
      setBuilderLoading(true);
      const polished = await fetchAtsDraft(builderDraft, builderJobDescription);
      setBuilderDraft(polished);
      setBuilderScore(scoreDraft(polished, builderJobDescription));
    } catch (e) {
      setBuilderError(e?.response?.data?.error || e?.message || 'Unable to improve resume right now.');
    } finally {
      setBuilderLoading(false);
    }
  };

  const downloadBuilderPdf = () => {
    if (!builderDraft.trim()) {
      setBuilderError('Build your resume draft first before downloading PDF.');
      return;
    }

    const fileName = (pdfFileName || 'resume-rating-draft').trim().replace(/[<>:"/\\|?*\x00-\x1F]/g, '_');
    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    const marginX = 44;
    const marginY = 52;
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const maxWidth = pageWidth - marginX * 2;
    const lineHeight = 16;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);

    const lines = doc.splitTextToSize(builderDraft, maxWidth);
    let y = marginY;
    lines.forEach((line) => {
      if (y > pageHeight - marginY) {
        doc.addPage();
        y = marginY;
      }
      doc.text(line, marginX, y);
      y += lineHeight;
    });

    doc.save(`${fileName}.pdf`);
  };

  const selectedTemplateData = templates.find((x) => x.id === selectedTemplate) || templates[0];
  const filteredTemplates = templates.filter((template) => {
    const currentStyle = template.id.includes('.pdf-template') ? 'exact' : 'modern';
    const matchStyle = templateStyleMode === 'all' || currentStyle === templateStyleMode;
    const matchHeadshot = templateFilter.headshot === 'All' || template.headshot === templateFilter.headshot;
    const matchGraphics = templateFilter.graphics === 'All' || template.graphics === templateFilter.graphics;
    const matchColumns = templateFilter.columns === 'All' || template.columns === templateFilter.columns;
    const matchColor = templateFilter.color === 'All' || template.color === templateFilter.color;
    return matchStyle && matchHeadshot && matchGraphics && matchColumns && matchColor;
  });
  const visibleTemplates =
    templateCountMode === 'all' ? filteredTemplates : filteredTemplates.slice(0, Number(templateCountMode));

  const updateTemplateFilter = (key, value) => {
    setTemplateFilter((current) => ({ ...current, [key]: value }));
  };
  const goHome = () => {
    setActiveView('home');
    setBuilderStep('templates');
    setError('');
    setAnalysis(null);
    setResumeDraft('');
  };
  const openBuilder = () => {
    setActiveView('builder');
    setBuilderStep('templates');
    setBuilderError('');
  };

  return (
    <main className="theme-page min-h-screen px-4 py-8 transition-colors duration-300 md:px-6 md:py-12">
      <div className="mx-auto max-w-7xl">
        <header className="landing-topbar mb-6">
          <div className="landing-brand">
            <span className="brand-icon" />
            <div className="leading-tight">
              <p className="text-2xl font-extrabold">Resume</p>
              <p className="-mt-1 text-2xl font-extrabold">Rating</p>
            </div>
          </div>
          <div className="landing-nav-actions">
            <button type="button" onClick={goHome} className={`nav-pill ${activeView === 'home' ? 'nav-pill-active' : ''}`}>Home</button>
            <button type="button" onClick={() => setActiveView('checker')} className={`nav-pill ${activeView === 'checker' ? 'nav-pill-active' : ''}`}>ATS Checker</button>
            <button type="button" onClick={openBuilder} className={`nav-pill ${activeView === 'builder' ? 'nav-pill-active' : ''}`}>Resume Builder</button>
            <button type="button" onClick={toggleTheme} className="theme-toggle rounded-full px-4 py-2 text-sm font-semibold">
              {isDark ? 'Light Mode' : 'Dark Mode'}
            </button>
          </div>
        </header>

        {activeView === 'home' ? (
          <div className="space-y-8">
            <section className="landing-hero reveal-on-scroll">
              <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
                <div>
                  <p className="landing-badge">India's Top Resume Templates</p>
                  <h2 className="mt-4 text-4xl font-extrabold leading-tight md:text-5xl">
                    Create a resume that gets results.
                  </h2>
                  <p className="theme-muted mt-4 max-w-2xl text-sm md:text-base">
                    Get recruiter-approved templates and step-by-step recommendations to create a new resume or optimize your current one.
                  </p>
                  <div className="mt-6 flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={openBuilder}
                      className="landing-cta-primary rounded-xl px-5 py-3 text-sm font-bold text-white"
                    >
                      Create new resume
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveView('checker')}
                      className="landing-cta-secondary rounded-xl px-5 py-3 text-sm font-bold"
                    >
                      Optimize my resume
                    </button>
                  </div>

                  <div className="trust-strip">
                    <span className="font-bold">EXCELLENT</span>
                    <span className="trust-stars">★★★★★</span>
                    <span>4.5 out of 5 based on 16,286 reviews</span>
                    <span className="font-bold">Trustpilot</span>
                  </div>

                  <div className="choose-template-row">
                    <p className="text-3xl font-extrabold leading-tight md:text-5xl">Create a resume that gets results</p>
                    <button type="button" onClick={openBuilder} className="landing-cta-primary rounded-full px-8 py-3 text-base font-bold text-white">
                      Choose a template
                    </button>
                  </div>
                </div>

                <div className="hero-panel">
                  <div className="hero-glow" />
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] theme-accent">Enhance with AI</p>
                  <h3 className="mt-2 text-xl font-extrabold">Professional Resume Preview</h3>
                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    <div className="floating-stat">
                      <p className="text-2xl font-extrabold">Recruiter</p>
                      <p className="theme-muted text-xs">Approved Templates</p>
                    </div>
                    <div className="floating-stat">
                      <p className="text-2xl font-extrabold">15 Min</p>
                      <p className="theme-muted text-xs">Faster Resume Flow</p>
                    </div>
                    <div className="floating-stat sm:col-span-2">
                      <p className="text-sm font-bold">Smart ATS Optimization</p>
                      <p className="theme-muted text-xs">Choose template, add details, and improve content using ATS AI.</p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section className="landing-section reveal-on-scroll">
              <p className="section-kicker">Core Features</p>
              <div className="mt-4 grid gap-4 md:grid-cols-3">
                <article className="feature-card">
                  <h3 className="text-lg font-extrabold">ATS Checker</h3>
                  <p className="theme-muted mt-2 text-sm">Upload PDF/DOCX and get score, section-wise feedback, and improvement insights.</p>
                </article>
                <article className="feature-card">
                  <h3 className="text-lg font-extrabold">Template-First Builder</h3>
                  <p className="theme-muted mt-2 text-sm">Choose ATS-ready templates before entering details and generate cleaner drafts faster.</p>
                </article>
                <article className="feature-card">
                  <h3 className="text-lg font-extrabold">AI Enhancement</h3>
                  <p className="theme-muted mt-2 text-sm">Polish generated drafts with ATS-focused AI rewrite and keyword alignment support.</p>
                </article>
              </div>
            </section>

            <section className="landing-section reveal-on-scroll">
              <p className="section-kicker">How It Works</p>
              <div className="process-strip mt-4">
                <article className="process-item">
                  <p className="process-index">01</p>
                  <p className="font-bold">Select Path</p>
                  <p className="theme-muted text-sm">Use ATS Checker for analysis or Resume Builder for creating new resume drafts.</p>
                </article>
                <article className="process-item">
                  <p className="process-index">02</p>
                  <p className="font-bold">Add Only What You Want</p>
                  <p className="theme-muted text-sm">All major sections are optional, including experience, project links, and education details.</p>
                </article>
                <article className="process-item">
                  <p className="process-index">03</p>
                  <p className="font-bold">Generate And Improve</p>
                  <p className="theme-muted text-sm">Build the draft, review estimated ATS score, and run AI improvement in one click.</p>
                </article>
              </div>
            </section>
          </div>
        ) : null}

        {activeView === 'checker' ? (
          <section className="theme-card p-5 md:p-8">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-2xl font-extrabold">ATS Checker</h2>
              <button type="button" onClick={goHome} className="theme-button-secondary rounded-xl px-4 py-2 text-sm font-semibold">
                Back To Home
              </button>
            </div>
            <form onSubmit={handleAnalyze} className="space-y-5">
              <div className="file-input-shell">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold">Upload Resume</p>
                    <p className="theme-muted text-xs">PDF, DOCX, or TXT (max 5MB)</p>
                  </div>
                  <label className="theme-button-primary cursor-pointer rounded-xl px-4 py-2 text-xs font-bold text-white">
                    Choose File
                    <input
                      type="file"
                      accept=".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
                      onChange={(e) => setFile(e.target.files?.[0] || null)}
                      className="hidden"
                    />
                  </label>
                </div>
                <div className={`mt-3 rounded-lg px-3 py-2 text-sm ${file ? 'file-picked' : 'file-not-picked'}`}>
                  {file ? `Selected file: ${file.name}` : 'No file selected yet'}
                </div>
              </div>
              <textarea
                rows="3"
                value={checkerJobDescription}
                onChange={(e) => setCheckerJobDescription(e.target.value)}
                placeholder="Job Description (Optional)"
                className="theme-input w-full rounded-xl p-3 text-sm"
              />
              {error ? <p className="theme-error rounded-xl px-4 py-3 text-sm font-medium">{error}</p> : null}
              <button
                type="submit"
                disabled={loading}
                className="theme-button-primary rounded-xl px-5 py-2.5 text-sm font-bold text-white disabled:opacity-60"
              >
                {loading ? 'Analyzing...' : 'Check ATS Score'}
              </button>
              {loading ? (
                <div className="ats-loading-card">
                  <div className="scan-orb" />
                  <div>
                    <p className="text-sm font-bold">Scanning Resume For ATS Signals...</p>
                    <p className="theme-muted text-xs">Checking keywords, section quality, and formatting compatibility.</p>
                    <div className="loading-bars mt-2">
                      <span />
                      <span />
                      <span />
                    </div>
                  </div>
                </div>
              ) : null}
            </form>
            {analysis ? (
              <Result
                analysis={analysis}
                resumeDraft={resumeDraft}
                setResumeDraft={setResumeDraft}
                onGenerate={async () => setResumeDraft(await fetchAtsDraft(analysis.extractedText, checkerJobDescription))}
                loading={loading}
                jobDescription={checkerJobDescription}
              />
            ) : null}
          </section>
        ) : null}

        {activeView === 'builder' ? (
          <section className="theme-card p-5 md:p-8">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-2xl font-extrabold">ATS Friendly Resume Builder</h2>
              <button
                type="button"
                onClick={builderStep === 'templates' ? goHome : () => setBuilderStep('templates')}
                className="theme-button-secondary rounded-xl px-4 py-2 text-sm font-semibold"
              >
                {builderStep === 'templates' ? 'Back To Home' : 'Back To Templates'}
              </button>
            </div>

            {builderStep === 'templates' ? (
              <>
                <h3 className="text-2xl font-extrabold text-center">Templates we recommend for you</h3>
                <p className="mb-4 mt-2 text-center text-sm theme-muted">You can always change your template later.</p>

                <div className="template-filter-panel">
                  <div className="template-filter-row">
                    <span className="text-xs font-bold">Filter by</span>
                    <select value={templateStyleMode} onChange={(e) => setTemplateStyleMode(e.target.value)} className="template-select">
                      <option value="all">All Styles</option>
                      <option value="exact">Exact PDF Style</option>
                      <option value="modern">Modern ATS Style</option>
                    </select>
                    <select value={templateFilter.headshot} onChange={(e) => updateTemplateFilter('headshot', e.target.value)} className="template-select">
                      <option>All</option>
                      <option>Headshot</option>
                      <option>No Headshot</option>
                    </select>
                    <select value={templateFilter.graphics} onChange={(e) => updateTemplateFilter('graphics', e.target.value)} className="template-select">
                      <option>All</option>
                      <option>Minimal</option>
                      <option>Modern</option>
                    </select>
                    <select value={templateFilter.columns} onChange={(e) => updateTemplateFilter('columns', e.target.value)} className="template-select">
                      <option>All</option>
                      <option>Single Column</option>
                      <option>Two Column</option>
                    </select>
                    <select value={templateFilter.color} onChange={(e) => updateTemplateFilter('color', e.target.value)} className="template-select">
                      <option>All</option>
                      <option>Blue</option>
                      <option>Green</option>
                      <option>Navy</option>
                      <option>Gray</option>
                    </select>
                    <select value={templatePreviewMode} onChange={(e) => setTemplatePreviewMode(e.target.value)} className="template-select">
                      <option value="thumbnail">Image-like Preview</option>
                      <option value="text">Text Preview</option>
                    </select>
                    <select value={templateCountMode} onChange={(e) => setTemplateCountMode(e.target.value)} className="template-select">
                      <option value="all">Show All</option>
                      <option value="3">Show 3</option>
                      <option value="5">Show 5</option>
                    </select>
                  </div>
                </div>

                <p className="mb-3 mt-4 text-sm theme-muted">
                  Templates showing ({visibleTemplates.length}) of filtered ({filteredTemplates.length}) | Contact line supports plain text + icon hyperlink modes.
                </p>

                <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                  {visibleTemplates.map((t) => (
                    <article key={t.id} className={`template-showcase-card ${selectedTemplate === t.id ? 'template-showcase-card-selected' : ''}`}>
                      <div className="template-header-row">
                        <p className="text-sm font-bold">{t.name}</p>
                        <span className="recommended-pill">Recommended</span>
                      </div>
                      <p className="theme-muted mt-1 text-xs">{t.description}</p>
                      <p className="theme-accent mt-2 text-xs font-semibold">Template ATS Score: {t.score}/100</p>
                      <div className="template-preview-paper">
                        {templatePreviewMode === 'text' ? (
                          <pre className="max-h-56 overflow-auto whitespace-pre-wrap text-[11px] leading-relaxed theme-muted">
                            {t.sampleResume}
                          </pre>
                        ) : (
                          <div className="template-thumbnail">
                            <div className="thumb-paper">
                              {t.headshot === 'Headshot' ? <div className="thumb-photo-block" /> : null}
                              <div className="thumb-name-line" title={t.sampleResume.split('\n')[0] || 'Resume Name'} />
                              <div className="thumb-role-line" title={t.sampleResume.split('\n')[1] || 'Role'} />
                              <div className="thumb-contact-row">
                                <span className="thumb-dot" />
                                <span className="thumb-dot" />
                                <span className="thumb-dot" />
                                <span className="thumb-dot" />
                              </div>
                              <div className="thumb-section">
                                <div className="thumb-section-title" />
                                <div className="thumb-line" style={{ width: '92%' }} />
                                <div className="thumb-line" style={{ width: '78%' }} />
                              </div>
                              <div className="thumb-section">
                                <div className="thumb-section-title" />
                                <div className="thumb-line" style={{ width: '88%' }} />
                                <div className="thumb-line" style={{ width: '82%' }} />
                                <div className="thumb-line" style={{ width: '70%' }} />
                              </div>
                              <div className="thumb-section">
                                <div className="thumb-section-title" />
                                <div className="thumb-line" style={{ width: '86%' }} />
                                <div className="thumb-line" style={{ width: '62%' }} />
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedTemplate(t.id);
                          setBuilderStep('form');
                        }}
                        className="template-choose-btn"
                      >
                        Choose template
                      </button>
                    </article>
                  ))}
                </div>
              </>
            ) : (
              <>
                <p className="mb-4 text-sm font-semibold">
                  Selected Template: {selectedTemplateData.name} ({selectedTemplateData.score}/100)
                </p>

                <form onSubmit={handleBuild} className="grid gap-4 md:grid-cols-2">
                  <input
                    value={builderData.fullName}
                    onChange={(e) => updateTop('fullName', e.target.value)}
                    placeholder="Full Name (Required)"
                    required
                    className="theme-input rounded-xl px-3 py-2 text-sm"
                  />
                  <input
                    value={builderData.email}
                    onChange={(e) => updateTop('email', e.target.value)}
                    placeholder="Email (Required)"
                    required
                    className="theme-input rounded-xl px-3 py-2 text-sm"
                  />
                  <input
                    value={builderData.phone}
                    onChange={(e) => updateTop('phone', e.target.value)}
                    placeholder="Phone (Required)"
                    required
                    className="theme-input rounded-xl px-3 py-2 text-sm"
                  />
                  <input
                    value={builderData.github}
                    onChange={(e) => updateTop('github', e.target.value)}
                    placeholder="GitHub (Optional)"
                    className="theme-input rounded-xl px-3 py-2 text-sm"
                  />
                  <input
                    value={builderData.location}
                    onChange={(e) => updateTop('location', e.target.value)}
                    placeholder="Location (Optional)"
                    className="theme-input rounded-xl px-3 py-2 text-sm"
                  />
                  <input
                    value={builderData.linkedin}
                    onChange={(e) => updateTop('linkedin', e.target.value)}
                    placeholder="LinkedIn (Optional)"
                    className="theme-input rounded-xl px-3 py-2 text-sm"
                  />
                  <input
                    value={builderData.targetRole}
                    onChange={(e) => updateTop('targetRole', e.target.value)}
                    placeholder="Target Role (Optional)"
                    className="theme-input rounded-xl px-3 py-2 text-sm"
                  />
                  <div className="md:col-span-2 rounded-xl border border-[var(--border-color)] p-3">
                    <label className="flex items-center gap-2 text-sm font-semibold">
                      <input
                        type="checkbox"
                        checked={builderData.useContactIcons}
                        onChange={(e) => updateTop('useContactIcons', e.target.checked)}
                      />
                      Use icons + hyperlink format for Email, Phone, LinkedIn, GitHub
                    </label>
                    {builderData.useContactIcons ? (
                      <div className="mt-3 grid gap-2 md:grid-cols-2">
                        <input
                          value={builderData.contactIconLinks.email}
                          onChange={(e) =>
                            setBuilderData((c) => ({
                              ...c,
                              contactIconLinks: { ...c.contactIconLinks, email: e.target.value }
                            }))
                          }
                          placeholder="Email Icon Image URL (Optional)"
                          className="theme-input rounded-xl px-3 py-2 text-sm"
                        />
                        <input
                          value={builderData.contactIconLinks.phone}
                          onChange={(e) =>
                            setBuilderData((c) => ({
                              ...c,
                              contactIconLinks: { ...c.contactIconLinks, phone: e.target.value }
                            }))
                          }
                          placeholder="Phone Icon Image URL (Optional)"
                          className="theme-input rounded-xl px-3 py-2 text-sm"
                        />
                        <input
                          value={builderData.contactIconLinks.linkedin}
                          onChange={(e) =>
                            setBuilderData((c) => ({
                              ...c,
                              contactIconLinks: { ...c.contactIconLinks, linkedin: e.target.value }
                            }))
                          }
                          placeholder="LinkedIn Icon Image URL (Optional)"
                          className="theme-input rounded-xl px-3 py-2 text-sm"
                        />
                        <input
                          value={builderData.contactIconLinks.github}
                          onChange={(e) =>
                            setBuilderData((c) => ({
                              ...c,
                              contactIconLinks: { ...c.contactIconLinks, github: e.target.value }
                            }))
                          }
                          placeholder="GitHub Icon Image URL (Optional)"
                          className="theme-input rounded-xl px-3 py-2 text-sm"
                        />
                      </div>
                    ) : null}
                  </div>
                  <textarea
                    rows="3"
                    value={builderData.summary}
                    onChange={(e) => updateTop('summary', e.target.value)}
                    placeholder="Summary (Optional)"
                    className="theme-input rounded-xl p-3 text-sm md:col-span-2"
                  />
                  <textarea
                    rows="4"
                    value={builderData.experience}
                    onChange={(e) => updateTop('experience', e.target.value)}
                    placeholder="Experience (Optional)"
                    className="theme-input rounded-xl p-3 text-sm md:col-span-2"
                  />

                  <div className="md:col-span-2">
                    <div className="mb-2 flex items-center justify-between">
                      <p className="text-sm font-semibold">Projects (Optional)</p>
                      <button
                        type="button"
                        onClick={addProject}
                        className="theme-button-secondary rounded-xl px-3 py-1.5 text-xs font-semibold"
                      >
                        Add Project
                      </button>
                    </div>
                    {builderData.projects.map((p, i) => (
                      <div key={i} className="mb-2 grid gap-2 rounded-xl border border-[var(--border-color)] p-3 md:grid-cols-2">
                        <input
                          value={p.name}
                          onChange={(e) => updateProject(i, 'name', e.target.value)}
                          placeholder="Project Name"
                          className="theme-input rounded-xl px-3 py-2 text-sm"
                        />
                        <input
                          value={p.liveLink}
                          onChange={(e) => updateProject(i, 'liveLink', e.target.value)}
                          placeholder="Live Link"
                          className="theme-input rounded-xl px-3 py-2 text-sm"
                        />
                        <input
                          value={p.sourceCode}
                          onChange={(e) => updateProject(i, 'sourceCode', e.target.value)}
                          placeholder="Source Code"
                          className="theme-input rounded-xl px-3 py-2 text-sm md:col-span-2"
                        />
                        <textarea
                          rows="2"
                          value={p.description}
                          onChange={(e) => updateProject(i, 'description', e.target.value)}
                          placeholder="Project Description"
                          className="theme-input rounded-xl p-3 text-sm md:col-span-2"
                        />
                        {builderData.projects.length > 1 ? (
                          <button
                            type="button"
                            onClick={() => removeProject(i)}
                            className="theme-button-secondary rounded-lg px-2 py-1 text-xs font-semibold md:col-span-2"
                          >
                            Remove Project
                          </button>
                        ) : null}
                      </div>
                    ))}
                  </div>

                  <div className="md:col-span-2">
                    <div className="mb-2 flex items-center justify-between">
                      <p className="text-sm font-semibold">Education Section</p>
                      <button
                        type="button"
                        onClick={() => setBuilderData((c) => ({ ...c, education: [...c.education, emptyEducation()] }))}
                        className="theme-button-secondary rounded-xl px-3 py-1.5 text-xs font-semibold"
                      >
                        Add Education
                      </button>
                    </div>
                    {builderData.education.map((edu, i) => (
                      <div key={i} className="mb-2 rounded-xl border border-[var(--border-color)] p-3">
                        <div className="mb-2 flex items-center justify-between">
                          <p className="text-xs font-semibold">Education {i + 1}</p>
                          {builderData.education.length > 1 ? (
                            <button
                              type="button"
                              onClick={() =>
                                setBuilderData((c) => ({
                                  ...c,
                                  education: c.education.filter((_, idx) => idx !== i)
                                }))
                              }
                              className="theme-button-secondary rounded-lg px-2 py-1 text-xs font-semibold"
                            >
                              Remove
                            </button>
                          ) : null}
                        </div>
                        <input
                          value={edu.level}
                          list={`education-level-options-${i}`}
                          onChange={(e) =>
                            setBuilderData((c) => ({
                              ...c,
                              education: c.education.map((item, idx) => (idx === i ? { ...item, level: e.target.value } : item))
                            }))
                          }
                          placeholder="Education Level (10th / 12th / UG / PG or custom)"
                          className="theme-input mb-2 w-full rounded-xl px-3 py-2 text-sm"
                        />
                        <datalist id={`education-level-options-${i}`}>
                          <option value="10th" />
                          <option value="12th" />
                          <option value="UG" />
                          <option value="PG" />
                        </datalist>
                        <input
                          value={edu.board}
                          onChange={(e) =>
                            setBuilderData((c) => ({
                              ...c,
                              education: c.education.map((item, idx) => (idx === i ? { ...item, board: e.target.value } : item))
                            }))
                          }
                          placeholder="Board Name"
                          className="theme-input mb-2 w-full rounded-xl px-3 py-2 text-sm"
                        />
                        <input
                          value={edu.percentage}
                          onChange={(e) =>
                            setBuilderData((c) => ({
                              ...c,
                              education: c.education.map((item, idx) => (idx === i ? { ...item, percentage: e.target.value } : item))
                            }))
                          }
                          placeholder="Percentage"
                          className="theme-input mb-2 w-full rounded-xl px-3 py-2 text-sm"
                        />
                        <input
                          value={edu.year}
                          onChange={(e) =>
                            setBuilderData((c) => ({
                              ...c,
                              education: c.education.map((item, idx) => (idx === i ? { ...item, year: e.target.value } : item))
                            }))
                          }
                          placeholder="Year"
                          className="theme-input w-full rounded-xl px-3 py-2 text-sm"
                        />
                      </div>
                    ))}
                  </div>

                  <div className="md:col-span-2">
                    <p className="mb-2 text-sm font-semibold">Skills Section</p>
                    <div className="grid gap-3 md:grid-cols-2">
                      <input
                        value={builderData.skills.frontend}
                        onChange={(e) => updateSkill('frontend', e.target.value)}
                        placeholder="Frontend (Optional)"
                        className="theme-input rounded-xl px-3 py-2 text-sm"
                      />
                      <input
                        value={builderData.skills.backend}
                        onChange={(e) => updateSkill('backend', e.target.value)}
                        placeholder="Backend (Optional)"
                        className="theme-input rounded-xl px-3 py-2 text-sm"
                      />
                      <input
                        value={builderData.skills.database}
                        onChange={(e) => updateSkill('database', e.target.value)}
                        placeholder="Database (Optional)"
                        className="theme-input rounded-xl px-3 py-2 text-sm"
                      />
                      <input
                        value={builderData.skills.codeEditor}
                        onChange={(e) => updateSkill('codeEditor', e.target.value)}
                        placeholder="Code Editor (Optional)"
                        className="theme-input rounded-xl px-3 py-2 text-sm"
                      />
                      <input
                        value={builderData.skills.aiTools}
                        onChange={(e) => updateSkill('aiTools', e.target.value)}
                        placeholder="AI Tools (Optional)"
                        className="theme-input rounded-xl px-3 py-2 text-sm md:col-span-2"
                      />
                    </div>
                  </div>

                  <textarea
                    rows="3"
                    value={builderJobDescription}
                    onChange={(e) => setBuilderJobDescription(e.target.value)}
                    placeholder="Job Description (Optional)"
                    className="theme-input rounded-xl p-3 text-sm md:col-span-2"
                  />

                  {builderError ? (
                    <p className="theme-error rounded-xl px-4 py-3 text-sm font-medium md:col-span-2">{builderError}</p>
                  ) : null}

                  <div className="md:col-span-2 flex flex-wrap gap-3">
                    <button type="submit" className="theme-button-primary rounded-xl px-5 py-2.5 text-sm font-bold text-white">
                      Build Resume
                    </button>
                    <button
                      type="button"
                      onClick={improveBuilder}
                      disabled={builderLoading}
                      className="theme-button-secondary rounded-xl px-5 py-2.5 text-sm font-bold disabled:opacity-60"
                    >
                      {builderLoading ? 'Improving...' : 'Improve With ATS AI'}
                    </button>
                    <span className="theme-score-badge rounded-xl px-4 py-2 text-sm font-bold">
                      Estimated ATS Score: {builderScore || selectedTemplateData.score}/100
                    </span>
                  </div>
                </form>

                <textarea
                  value={builderDraft}
                  onChange={(e) => setBuilderDraft(e.target.value)}
                  rows="18"
                  className="theme-input mt-4 w-full rounded-xl p-3 font-mono text-sm"
                  placeholder="Generated resume draft."
                />
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <input
                    value={pdfFileName}
                    onChange={(e) => setPdfFileName(e.target.value)}
                    placeholder="PDF file name"
                    className="theme-input rounded-xl px-3 py-2 text-sm"
                  />
                  <button
                    type="button"
                    onClick={downloadBuilderPdf}
                    className="theme-button-primary rounded-xl px-4 py-2 text-sm font-bold text-white"
                  >
                    Download PDF
                  </button>
                </div>
              </>
            )}
          </section>
        ) : null}
      </div>
    </main>
  );
}

export default UploadResume;
