import { useEffect, useState } from 'react';
import axios from 'axios';
import Result from './Result';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/resume';

const RESUME_TEMPLATES = [
  {
    id: 'clean-pro',
    name: 'Clean Professional',
    score: 92,
    description: 'Simple ATS-safe sections with keyword-rich bullets.',
    build: (data, keywordsText) => `FULL NAME
${data.fullName || 'Your Name'}
${data.email || 'yourmail@example.com'} | ${data.phone || '+1 000 000 0000'} | ${data.location || 'City'} | ${data.linkedin || 'linkedin.com/in/username'}

TARGET ROLE
${data.targetRole || 'Role Name'}

PROFESSIONAL SUMMARY
${data.summary || 'Write a concise summary with outcomes, tools, and role fit.'}

SKILLS
${(data.skills || '').trim() ? data.skills.split(',').map((item) => `- ${item.trim()}`).join('\n') : '- Add role-specific technical and domain skills'}

EXPERIENCE
${(data.experience || '').trim() ? data.experience.split('\n').filter(Boolean).map((item) => `- ${item.trim()}`).join('\n') : '- Add quantified achievements with metrics'}

PROJECTS
${(data.projects || '').trim() ? data.projects.split('\n').filter(Boolean).map((item) => `- ${item.trim()}`).join('\n') : '- Add one project with impact and stack'}

EDUCATION
- ${data.education || 'Degree | University | Year'}

ATS KEYWORDS TO INCLUDE
${keywordsText || 'No job description provided. Add it for better keyword targeting.'}
`
  },
  {
    id: 'impact-first',
    name: 'Impact First',
    score: 89,
    description: 'Achievement-first bullets for recruiters and ATS ranking.',
    build: (data, keywordsText) => `FULL NAME
${data.fullName || 'Your Name'}
${data.email || 'yourmail@example.com'} | ${data.phone || '+1 000 000 0000'} | ${data.linkedin || 'linkedin.com/in/username'}

SUMMARY
${data.summary || 'Focused candidate with a strong track record of execution and measurable outcomes.'}

CORE SKILLS
${(data.skills || '').trim() ? data.skills.split(',').map((item) => `- ${item.trim()}`).join('\n') : '- Add role-matching keywords and tools'}

KEY ACHIEVEMENTS
${(data.experience || '').trim() ? data.experience.split('\n').filter(Boolean).map((item) => `- ${item.trim()}`).join('\n') : '- Add achievement bullets with %, revenue, speed, or volume metrics'}

EDUCATION
- ${data.education || 'Degree | University | Year'}

TARGET ROLE
- ${data.targetRole || 'Role Name'}

KEYWORDS FROM JOB DESCRIPTION
${keywordsText || '- No job description added yet'}
`
  },
  {
    id: 'minimal-ats',
    name: 'Minimal ATS',
    score: 86,
    description: 'Compact one-page structure with standard ATS headings.',
    build: (data, keywordsText) => `FULL NAME
${data.fullName || 'Your Name'}
${data.email || 'yourmail@example.com'} | ${data.phone || '+1 000 000 0000'} | ${data.location || 'City'}

PROFESSIONAL SUMMARY
${data.summary || 'Short role-focused summary with domain and tooling expertise.'}

SKILLS
${(data.skills || '').trim() ? data.skills.split(',').map((item) => `- ${item.trim()}`).join('\n') : '- Add 10-15 role-specific skills'}

EXPERIENCE
${(data.experience || '').trim() ? data.experience.split('\n').filter(Boolean).map((item) => `- ${item.trim()}`).join('\n') : '- Add experience in bullet points with impact'}

EDUCATION
- ${data.education || 'Degree | University | Year'}

PROJECTS
${(data.projects || '').trim() ? data.projects.split('\n').filter(Boolean).map((item) => `- ${item.trim()}`).join('\n') : '- Add projects with tools and outcomes'}

ATS NOTES
- Use only simple headings and bullets
- Avoid graphics, icons, and tables
${keywordsText ? `- Add these keywords naturally: ${keywordsText}` : '- Add job description for keyword targeting'}
`
  }
];

const INITIAL_BUILDER_DATA = {
  fullName: '',
  email: '',
  phone: '',
  location: '',
  linkedin: '',
  targetRole: '',
  summary: '',
  skills: '',
  experience: '',
  projects: '',
  education: ''
};

function extractBuilderKeywords(jobDescription) {
  if (!jobDescription.trim()) return [];

  const stopWords = new Set(['with', 'from', 'this', 'that', 'have', 'has', 'will', 'role', 'work', 'team', 'your', 'and', 'the', 'for']);
  const tokens = jobDescription.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/);
  const keywords = [];
  const seen = new Set();

  for (const token of tokens) {
    if (token.length < 3 || stopWords.has(token) || seen.has(token)) continue;
    seen.add(token);
    keywords.push(token);
    if (keywords.length >= 12) break;
  }

  return keywords;
}

function calculateBuilderScore(draft, jobDescription) {
  const text = draft.toLowerCase();
  let score = 35;

  if (/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i.test(draft)) score += 10;
  if (/(summary|professional summary)/i.test(draft)) score += 10;
  if (/skills/i.test(draft)) score += 10;
  if (/experience/i.test(draft)) score += 10;
  if (/education/i.test(draft)) score += 10;
  if (/\d+%|\d+\+/.test(draft)) score += 5;

  const keywords = extractBuilderKeywords(jobDescription);
  if (keywords.length > 0) {
    const matched = keywords.filter((word) => text.includes(word)).length;
    score += Math.round((matched / keywords.length) * 10);
  }

  return Math.max(0, Math.min(100, score));
}

function UploadResume() {
  const [activeView, setActiveView] = useState('home');
  const [file, setFile] = useState(null);
  const [checkerJobDescription, setCheckerJobDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [analysis, setAnalysis] = useState(null);
  const [resumeDraft, setResumeDraft] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState(RESUME_TEMPLATES[0].id);
  const [builderData, setBuilderData] = useState(INITIAL_BUILDER_DATA);
  const [builderJobDescription, setBuilderJobDescription] = useState('');
  const [builderDraft, setBuilderDraft] = useState('');
  const [builderScore, setBuilderScore] = useState(0);
  const [builderLoading, setBuilderLoading] = useState(false);
  const [builderError, setBuilderError] = useState('');
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const storedTheme = localStorage.getItem('theme');
    const shouldUseDark = storedTheme ? storedTheme === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;
    setIsDark(shouldUseDark);
    document.documentElement.classList.toggle('dark', shouldUseDark);
  }, []);

  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.classList.toggle('dark', next);
    localStorage.setItem('theme', next ? 'dark' : 'light');
  };

  const fetchAtsDraft = async (resumeText, jd) => {
    const response = await axios.post(`${API_BASE_URL}/generate-ats`, {
      resumeText,
      jobDescription: jd
    });

    return response?.data?.generatedResume || '';
  };

  const handleAnalyzeSubmit = async (event) => {
    event.preventDefault();

    if (!file) {
      setError('Please upload your resume in PDF or DOCX format.');
      return;
    }

    const fileName = file.name.toLowerCase();
    if (!fileName.endsWith('.pdf') && !fileName.endsWith('.docx')) {
      setError('Only PDF or DOCX files are supported right now.');
      return;
    }

    setLoading(true);
    setError('');
    setAnalysis(null);
    setResumeDraft('');

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('jobDescription', checkerJobDescription);

      const analysisResponse = await axios.post(`${API_BASE_URL}/analyze`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      const analysisResult = analysisResponse.data;
      setAnalysis(analysisResult);

      if (analysisResult?.extractedText) {
        const draft = await fetchAtsDraft(analysisResult.extractedText, checkerJobDescription);
        setResumeDraft(draft);
      }
    } catch (requestError) {
      const status = requestError?.response?.status;
      const responseData = requestError?.response?.data;
      const serverMessage = typeof responseData === 'string' ? responseData : responseData?.error || responseData?.message;
      const networkMessage = requestError?.message;
      setError(
        serverMessage ||
          (status
            ? `Request failed (${status}). Check backend terminal for details.`
            : `Unable to analyze resume. ${networkMessage || 'Make sure backend is running on port 8080.'}`)
      );
    } finally {
      setLoading(false);
    }
  };

  const handleBuilderSubmit = (event) => {
    event.preventDefault();
    setBuilderError('');

    if (!builderData.fullName.trim() || !builderData.email.trim() || !builderData.targetRole.trim()) {
      setBuilderError('Name, Email, and Target Role are required to build the resume.');
      return;
    }

    const template = RESUME_TEMPLATES.find((item) => item.id === selectedTemplate) || RESUME_TEMPLATES[0];
    const keywordList = extractBuilderKeywords(builderJobDescription);
    const keywordsText = keywordList.length ? keywordList.join(', ') : '';
    const draft = template.build(builderData, keywordsText);
    const score = calculateBuilderScore(draft, builderJobDescription);

    setBuilderDraft(draft);
    setBuilderScore(score);
  };

  const handleGoHome = () => {
    setActiveView('home');
    setError('');
    setAnalysis(null);
    setResumeDraft('');
  };

  const handleGenerateAtsResume = async () => {
    if (!analysis?.extractedText) {
      setError('Analyze resume first before generating ATS-friendly version.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const draft = await fetchAtsDraft(analysis.extractedText, checkerJobDescription);
      setResumeDraft(draft);
    } catch (requestError) {
      const status = requestError?.response?.status;
      const serverMessage = requestError?.response?.data?.error;
      const networkMessage = requestError?.message;
      setError(
        serverMessage ||
          (status
            ? `Request failed (${status}) while generating ATS resume.`
            : `Unable to generate ATS-friendly resume. ${networkMessage || ''}`)
      );
    } finally {
      setLoading(false);
    }
  };

  const handleBuilderImprove = async () => {
    if (!builderDraft.trim()) {
      setBuilderError('Build your resume draft first.');
      return;
    }

    try {
      setBuilderLoading(true);
      setBuilderError('');
      const polishedDraft = await fetchAtsDraft(builderDraft, builderJobDescription);
      setBuilderDraft(polishedDraft);
      setBuilderScore(calculateBuilderScore(polishedDraft, builderJobDescription));
    } catch (requestError) {
      const status = requestError?.response?.status;
      const serverMessage = requestError?.response?.data?.error;
      const networkMessage = requestError?.message;
      setBuilderError(
        serverMessage ||
          (status
            ? `Request failed (${status}) while improving resume.`
            : `Unable to improve resume right now. ${networkMessage || ''}`)
      );
    } finally {
      setBuilderLoading(false);
    }
  };

  const updateBuilderField = (field, value) => {
    setBuilderData((current) => ({ ...current, [field]: value }));
  };

  const selectedTemplateData = RESUME_TEMPLATES.find((item) => item.id === selectedTemplate) || RESUME_TEMPLATES[0];

  return (
    <main className="theme-page min-h-screen px-4 py-8 transition-colors duration-300 md:px-6 md:py-12">
      <div className="mx-auto max-w-7xl">
        <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="theme-accent text-sm font-semibold uppercase tracking-[0.25em]">Resume Intelligence Studio</p>
            <h1 className="mt-1 text-3xl font-extrabold leading-tight md:text-4xl">ATS Resume Checker And Builder</h1>
            <p className="theme-muted mt-2 text-sm">
              Choose ATS checker or ATS-friendly resume builder from the options below.
            </p>
          </div>

          <button
            type="button"
            onClick={toggleTheme}
            className="theme-toggle rounded-full px-4 py-2 text-sm font-semibold"
          >
            {isDark ? 'Light Mode' : 'Dark Mode'}
          </button>
        </header>

        {activeView === 'home' ? (
          <section className="grid gap-5 md:grid-cols-2">
            <article className="theme-card p-6">
              <p className="theme-accent text-xs font-bold uppercase tracking-[0.18em]">Option 1</p>
              <h2 className="mt-2 text-2xl font-extrabold">ATS Checker</h2>
              <p className="theme-muted mt-2 text-sm">
                Upload resume, keep job description optional, and get ATS score, strong parts, weak parts, and exact improvement suggestions.
              </p>
              <button type="button" onClick={() => setActiveView('checker')} className="theme-button-primary mt-5 rounded-xl px-4 py-2 text-sm font-semibold text-white">
                Open ATS Checker
              </button>
            </article>

            <article className="theme-card p-6">
              <p className="theme-accent text-xs font-bold uppercase tracking-[0.18em]">Option 2</p>
              <h2 className="mt-2 text-2xl font-extrabold">ATS Friendly Resume Builder</h2>
              <p className="theme-muted mt-2 text-sm">
                Select ATS templates with visible scores, enter your details, and build a clean ATS-friendly resume.
              </p>
              <button type="button" onClick={() => setActiveView('builder')} className="theme-button-primary mt-5 rounded-xl px-4 py-2 text-sm font-semibold text-white">
                Open Resume Builder
              </button>
            </article>
          </section>
        ) : null}

        {activeView === 'checker' ? (
          <section className="theme-card p-5 md:p-8">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-2xl font-extrabold">ATS Checker</h2>
              <button type="button" onClick={handleGoHome} className="theme-button-secondary rounded-xl px-4 py-2 text-sm font-semibold">
                Back To Options
              </button>
            </div>

            <form onSubmit={handleAnalyzeSubmit} className="space-y-5">
              <div>
                <label className="mb-2 block text-sm font-bold uppercase tracking-wide">Upload Resume (PDF/DOCX)</label>
                <input
                  type="file"
                  accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  onChange={(event) => setFile(event.target.files?.[0] || null)}
                  className="theme-input w-full cursor-pointer rounded-xl p-3 text-sm file:mr-4 file:rounded-lg file:border-0 file:bg-[var(--accent)] file:px-3 file:py-2 file:text-xs file:font-bold file:text-white"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold uppercase tracking-wide">Job Description (Optional)</label>
                <textarea
                  rows="3"
                  value={checkerJobDescription}
                  onChange={(event) => setCheckerJobDescription(event.target.value)}
                  placeholder="Optional: paste job description for better keyword matching..."
                  className="theme-input w-full rounded-xl p-3 text-sm"
                />
              </div>

              {error ? <p className="theme-error rounded-xl px-4 py-3 text-sm font-medium">{error}</p> : null}

              <button type="submit" disabled={loading} className="theme-button-primary rounded-xl px-5 py-2.5 text-sm font-bold text-white disabled:opacity-60">
                {loading ? 'Analyzing...' : 'Check ATS Score'}
              </button>
            </form>

            {analysis ? (
              <Result
                analysis={analysis}
                resumeDraft={resumeDraft}
                setResumeDraft={setResumeDraft}
                onGenerate={handleGenerateAtsResume}
                loading={loading}
              />
            ) : null}
          </section>
        ) : null}

        {activeView === 'builder' ? (
          <section className="theme-card p-5 md:p-8">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-2xl font-extrabold">ATS Friendly Resume Builder</h2>
              <button type="button" onClick={handleGoHome} className="theme-button-secondary rounded-xl px-4 py-2 text-sm font-semibold">
                Back To Options
              </button>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {RESUME_TEMPLATES.map((template) => (
                <button
                  key={template.id}
                  type="button"
                  onClick={() => setSelectedTemplate(template.id)}
                  className={`text-left rounded-2xl border p-4 transition ${
                    selectedTemplate === template.id ? 'border-[var(--accent)] bg-[var(--surface-soft)]' : 'border-[var(--border-color)] bg-[var(--surface-soft)]'
                  }`}
                >
                  <p className="text-sm font-bold">{template.name}</p>
                  <p className="theme-muted mt-1 text-xs">{template.description}</p>
                  <p className="theme-accent mt-2 text-xs font-semibold">Template ATS Score: {template.score}/100</p>
                </button>
              ))}
            </div>

            <form onSubmit={handleBuilderSubmit} className="mt-6 grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-semibold">Full Name</label>
                <input value={builderData.fullName} onChange={(event) => updateBuilderField('fullName', event.target.value)} className="theme-input w-full rounded-xl px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold">Email</label>
                <input value={builderData.email} onChange={(event) => updateBuilderField('email', event.target.value)} className="theme-input w-full rounded-xl px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold">Phone</label>
                <input value={builderData.phone} onChange={(event) => updateBuilderField('phone', event.target.value)} className="theme-input w-full rounded-xl px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold">Location</label>
                <input value={builderData.location} onChange={(event) => updateBuilderField('location', event.target.value)} className="theme-input w-full rounded-xl px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold">LinkedIn</label>
                <input value={builderData.linkedin} onChange={(event) => updateBuilderField('linkedin', event.target.value)} className="theme-input w-full rounded-xl px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold">Target Role</label>
                <input value={builderData.targetRole} onChange={(event) => updateBuilderField('targetRole', event.target.value)} className="theme-input w-full rounded-xl px-3 py-2 text-sm" />
              </div>
              <div className="md:col-span-2">
                <label className="mb-1 block text-sm font-semibold">Professional Summary</label>
                <textarea rows="3" value={builderData.summary} onChange={(event) => updateBuilderField('summary', event.target.value)} className="theme-input w-full rounded-xl p-3 text-sm" />
              </div>
              <div className="md:col-span-2">
                <label className="mb-1 block text-sm font-semibold">Skills (comma separated)</label>
                <input value={builderData.skills} onChange={(event) => updateBuilderField('skills', event.target.value)} className="theme-input w-full rounded-xl px-3 py-2 text-sm" />
              </div>
              <div className="md:col-span-2">
                <label className="mb-1 block text-sm font-semibold">Experience Bullets (one per line)</label>
                <textarea rows="4" value={builderData.experience} onChange={(event) => updateBuilderField('experience', event.target.value)} className="theme-input w-full rounded-xl p-3 text-sm" />
              </div>
              <div className="md:col-span-2">
                <label className="mb-1 block text-sm font-semibold">Projects (optional, one per line)</label>
                <textarea rows="3" value={builderData.projects} onChange={(event) => updateBuilderField('projects', event.target.value)} className="theme-input w-full rounded-xl p-3 text-sm" />
              </div>
              <div className="md:col-span-2">
                <label className="mb-1 block text-sm font-semibold">Education</label>
                <input value={builderData.education} onChange={(event) => updateBuilderField('education', event.target.value)} className="theme-input w-full rounded-xl px-3 py-2 text-sm" />
              </div>
              <div className="md:col-span-2">
                <label className="mb-1 block text-sm font-semibold">Job Description (optional)</label>
                <textarea rows="3" value={builderJobDescription} onChange={(event) => setBuilderJobDescription(event.target.value)} className="theme-input w-full rounded-xl p-3 text-sm" />
              </div>

              {builderError ? <p className="theme-error md:col-span-2 rounded-xl px-4 py-3 text-sm font-medium">{builderError}</p> : null}

              <div className="md:col-span-2 flex flex-wrap gap-3">
                <button type="submit" className="theme-button-primary rounded-xl px-5 py-2.5 text-sm font-bold text-white">
                  Build Resume
                </button>
                <button type="button" onClick={handleBuilderImprove} disabled={builderLoading} className="theme-button-secondary rounded-xl px-5 py-2.5 text-sm font-bold disabled:opacity-60">
                  {builderLoading ? 'Improving...' : 'Improve With ATS AI'}
                </button>
                <span className="theme-score-badge rounded-xl px-4 py-2 text-sm font-bold">Estimated ATS Score: {builderScore || selectedTemplateData.score}/100</span>
              </div>
            </form>

            <div className="mt-6">
              <h3 className="text-lg font-bold">Generated Resume Draft</h3>
              <textarea
                value={builderDraft}
                onChange={(event) => setBuilderDraft(event.target.value)}
                rows="18"
                className="theme-input mt-3 w-full rounded-xl p-3 font-mono text-sm"
                placeholder="Your ATS-friendly resume draft will appear here."
              />
            </div>
          </section>
        ) : null}
      </div>
    </main>
  );
}

export default UploadResume;
