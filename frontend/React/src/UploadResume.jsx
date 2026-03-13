import { useEffect, useState } from 'react';
import axios from 'axios';
import Result from './Result';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/resume';

const emptyProject = () => ({ name: '', description: '', liveLink: '', sourceCode: '' });
const initialBuilderData = {
  fullName: '',
  email: '',
  phone: '',
  location: '',
  linkedin: '',
  targetRole: '',
  summary: '',
  experience: '',
  projects: [emptyProject()],
  education: {
    tenth: { board: '', percentage: '', year: '' },
    twelfth: { board: '', percentage: '', year: '' },
    graduation: { board: '', percentage: '', year: '' }
  },
  skills: { frontend: '', backend: '', database: '', codeEditor: '', aiTools: '' }
};

const templates = [
  { id: 'clean-pro', name: 'Clean Professional', score: 92, description: 'ATS-safe and clean.', preview: 'Rahul Sen sample profile' },
  { id: 'impact-first', name: 'Impact First', score: 89, description: 'Achievement-heavy format.', preview: 'Priya Das sample profile' },
  { id: 'minimal-ats', name: 'Minimal ATS', score: 86, description: 'Compact ATS structure.', preview: 'Anik Pal sample profile' }
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
  const contact = [data.email, data.phone, data.location, data.linkedin].filter((x) => hasText(x)).join(' | ') || 'yourmail@example.com | +1 000 000 0000';
  const skills = Object.entries({
    Frontend: data.skills.frontend,
    Backend: data.skills.backend,
    Database: data.skills.database,
    'Code Editor': data.skills.codeEditor,
    'AI Tools': data.skills.aiTools
  })
    .filter(([, v]) => hasText(v))
    .map(([k, v]) => `- ${k}: ${v}`)
    .join('\n') || '- Skills are optional';

  const projects = data.projects
    .filter((p) => [p.name, p.description, p.liveLink, p.sourceCode].some(hasText))
    .map((p) => `- ${p.name || 'N/A'}\n  Description: ${p.description || 'N/A'}\n  Live Link: ${p.liveLink || 'N/A'}\n  Source Code: ${p.sourceCode || 'N/A'}`)
    .join('\n') || '- Projects are optional';

  const education = [
    ['10th', data.education.tenth],
    ['12th', data.education.twelfth],
    ['Graduation', data.education.graduation]
  ]
    .filter(([, e]) => [e.board, e.percentage, e.year].some(hasText))
    .map(([k, e]) => `- ${k}: ${e.board || 'Board'} | ${e.percentage || 'Percentage'} | ${e.year || 'Year'}`)
    .join('\n') || '- Education is optional';

  const exp = hasText(data.experience) ? data.experience.split('\n').filter(Boolean).map((l) => `- ${l}`).join('\n') : '- Experience is optional';
  const keys = jdKeywords || 'No JD keywords provided';

  return `${templateName}
${data.fullName || 'Your Name'}
${contact}

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
  const [builderScore, setBuilderScore] = useState(0);
  const [builderLoading, setBuilderLoading] = useState(false);
  const [builderError, setBuilderError] = useState('');
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('theme');
    const dark = stored ? stored === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;
    setIsDark(dark);
    document.documentElement.classList.toggle('dark', dark);
  }, []);

  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.classList.toggle('dark', next);
    localStorage.setItem('theme', next ? 'dark' : 'light');
  };

  const fetchAtsDraft = async (resumeText, jobDescription) => (await axios.post(`${API_BASE_URL}/generate-ats`, { resumeText, jobDescription }))?.data?.generatedResume || '';

  const handleAnalyze = async (event) => {
    event.preventDefault();
    if (!file) return setError('Please upload your resume in PDF or DOCX format.');
    const fileName = file.name.toLowerCase();
    if (!fileName.endsWith('.pdf') && !fileName.endsWith('.docx')) return setError('Only PDF or DOCX files are supported right now.');
    setLoading(true); setError(''); setAnalysis(null); setResumeDraft('');
    try {
      const form = new FormData();
      form.append('file', file);
      form.append('jobDescription', checkerJobDescription);
      const res = await axios.post(`${API_BASE_URL}/analyze`, form, { headers: { 'Content-Type': 'multipart/form-data' } });
      setAnalysis(res.data);
      if (res.data?.extractedText) setResumeDraft(await fetchAtsDraft(res.data.extractedText, checkerJobDescription));
    } catch (e) {
      setError(e?.response?.data?.error || e?.response?.data?.message || e?.message || 'Unable to analyze resume.');
    } finally { setLoading(false); }
  };

  const handleBuild = (e) => {
    e.preventDefault();
    setBuilderError('');
    const t = templates.find((x) => x.id === selectedTemplate) || templates[0];
    const keys = keywordsFromJd(builderJobDescription).join(', ');
    const draft = buildDraft(builderData, keys, t.name);
    setBuilderDraft(draft);
    setBuilderScore(scoreDraft(draft, builderJobDescription));
  };

  const updateTop = (k, v) => setBuilderData((c) => ({ ...c, [k]: v }));
  const updateProject = (i, k, v) => setBuilderData((c) => ({ ...c, projects: c.projects.map((p, idx) => (idx === i ? { ...p, [k]: v } : p)) }));
  const updateEducation = (lvl, k, v) => setBuilderData((c) => ({ ...c, education: { ...c.education, [lvl]: { ...c.education[lvl], [k]: v } } }));
  const updateSkill = (k, v) => setBuilderData((c) => ({ ...c, skills: { ...c.skills, [k]: v } }));
  const addProject = () => setBuilderData((c) => ({ ...c, projects: [...c.projects, emptyProject()] }));
  const removeProject = (i) => setBuilderData((c) => ({ ...c, projects: c.projects.length === 1 ? c.projects : c.projects.filter((_, idx) => idx !== i) }));

  const improveBuilder = async () => {
    if (!builderDraft.trim()) return setBuilderError('Build your resume draft first.');
    try {
      setBuilderLoading(true);
      const polished = await fetchAtsDraft(builderDraft, builderJobDescription);
      setBuilderDraft(polished);
      setBuilderScore(scoreDraft(polished, builderJobDescription));
    } catch (e) {
      setBuilderError(e?.response?.data?.error || e?.message || 'Unable to improve resume right now.');
    } finally { setBuilderLoading(false); }
  };

  const selectedTemplateData = templates.find((x) => x.id === selectedTemplate) || templates[0];
  const goHome = () => { setActiveView('home'); setBuilderStep('templates'); setError(''); setAnalysis(null); setResumeDraft(''); };
  const openBuilder = () => { setActiveView('builder'); setBuilderStep('templates'); setBuilderError(''); };

  return <main className="theme-page min-h-screen px-4 py-8 transition-colors duration-300 md:px-6 md:py-12"><div className="mx-auto max-w-7xl"><header className="mb-6 flex flex-wrap items-center justify-between gap-4"><div><p className="theme-accent text-sm font-semibold uppercase tracking-[0.25em]">Resume Intelligence Studio</p><h1 className="mt-1 text-3xl font-extrabold leading-tight md:text-4xl">ATS Resume Checker And Builder</h1></div><button type="button" onClick={toggleTheme} className="theme-toggle rounded-full px-4 py-2 text-sm font-semibold">{isDark ? 'Light Mode' : 'Dark Mode'}</button></header>
    {activeView === 'home' ? <section className="grid gap-5 md:grid-cols-2"><article className="theme-card p-6"><h2 className="text-2xl font-extrabold">ATS Checker</h2><button type="button" onClick={() => setActiveView('checker')} className="theme-button-primary mt-5 rounded-xl px-4 py-2 text-sm font-semibold text-white">Open ATS Checker</button></article><article className="theme-card p-6"><h2 className="text-2xl font-extrabold">ATS Friendly Resume Builder</h2><button type="button" onClick={openBuilder} className="theme-button-primary mt-5 rounded-xl px-4 py-2 text-sm font-semibold text-white">Open Resume Builder</button></article></section> : null}
    {activeView === 'checker' ? <section className="theme-card p-5 md:p-8"><div className="mb-5 flex items-center justify-between"><h2 className="text-2xl font-extrabold">ATS Checker</h2><button type="button" onClick={goHome} className="theme-button-secondary rounded-xl px-4 py-2 text-sm font-semibold">Back To Options</button></div><form onSubmit={handleAnalyze} className="space-y-5"><input type="file" accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document" onChange={(e) => setFile(e.target.files?.[0] || null)} className="theme-input w-full cursor-pointer rounded-xl p-3 text-sm" /><textarea rows="3" value={checkerJobDescription} onChange={(e) => setCheckerJobDescription(e.target.value)} placeholder="Job Description (Optional)" className="theme-input w-full rounded-xl p-3 text-sm" />{error ? <p className="theme-error rounded-xl px-4 py-3 text-sm font-medium">{error}</p> : null}<button type="submit" disabled={loading} className="theme-button-primary rounded-xl px-5 py-2.5 text-sm font-bold text-white disabled:opacity-60">{loading ? 'Analyzing...' : 'Check ATS Score'}</button></form>{analysis ? <Result analysis={analysis} resumeDraft={resumeDraft} setResumeDraft={setResumeDraft} onGenerate={async () => setResumeDraft(await fetchAtsDraft(analysis.extractedText, checkerJobDescription))} loading={loading} /> : null}</section> : null}
    {activeView === 'builder' ? <section className="theme-card p-5 md:p-8"><div className="mb-5 flex items-center justify-between"><h2 className="text-2xl font-extrabold">ATS Friendly Resume Builder</h2><button type="button" onClick={builderStep === 'templates' ? goHome : () => setBuilderStep('templates')} className="theme-button-secondary rounded-xl px-4 py-2 text-sm font-semibold">{builderStep === 'templates' ? 'Back To Options' : 'Back To Templates'}</button></div>
      {builderStep === 'templates' ? <div className="grid gap-4 md:grid-cols-3">{templates.map((t) => <button key={t.id} type="button" onClick={() => { setSelectedTemplate(t.id); setBuilderStep('form'); }} className={`text-left rounded-2xl border p-4 ${selectedTemplate === t.id ? 'border-[var(--accent)] bg-[var(--surface-soft)]' : 'border-[var(--border-color)] bg-[var(--surface-soft)]'}`}><p className="text-sm font-bold">{t.name}</p><p className="theme-muted mt-1 text-xs">{t.description}</p><p className="theme-muted mt-2 text-xs">Random sample: {t.preview}</p><p className="theme-accent mt-2 text-xs font-semibold">Template ATS Score: {t.score}/100</p></button>)}</div> : <><p className="mb-4 text-sm font-semibold">Selected Template: {selectedTemplateData.name} ({selectedTemplateData.score}/100)</p><form onSubmit={handleBuild} className="grid gap-4 md:grid-cols-2"><input value={builderData.fullName} onChange={(e) => updateTop('fullName', e.target.value)} placeholder="Full Name (Optional)" className="theme-input rounded-xl px-3 py-2 text-sm" /><input value={builderData.email} onChange={(e) => updateTop('email', e.target.value)} placeholder="Email (Optional)" className="theme-input rounded-xl px-3 py-2 text-sm" /><input value={builderData.phone} onChange={(e) => updateTop('phone', e.target.value)} placeholder="Phone (Optional)" className="theme-input rounded-xl px-3 py-2 text-sm" /><input value={builderData.location} onChange={(e) => updateTop('location', e.target.value)} placeholder="Location (Optional)" className="theme-input rounded-xl px-3 py-2 text-sm" /><input value={builderData.linkedin} onChange={(e) => updateTop('linkedin', e.target.value)} placeholder="LinkedIn (Optional)" className="theme-input rounded-xl px-3 py-2 text-sm" /><input value={builderData.targetRole} onChange={(e) => updateTop('targetRole', e.target.value)} placeholder="Target Role (Optional)" className="theme-input rounded-xl px-3 py-2 text-sm" /><textarea rows="3" value={builderData.summary} onChange={(e) => updateTop('summary', e.target.value)} placeholder="Summary (Optional)" className="theme-input rounded-xl p-3 text-sm md:col-span-2" /><textarea rows="4" value={builderData.experience} onChange={(e) => updateTop('experience', e.target.value)} placeholder="Experience (Optional)" className="theme-input rounded-xl p-3 text-sm md:col-span-2" />
      <div className="md:col-span-2"><div className="mb-2 flex items-center justify-between"><p className="text-sm font-semibold">Projects (Optional)</p><button type="button" onClick={addProject} className="theme-button-secondary rounded-xl px-3 py-1.5 text-xs font-semibold">Add Project</button></div>{builderData.projects.map((p, i) => <div key={i} className="mb-2 grid gap-2 rounded-xl border border-[var(--border-color)] p-3 md:grid-cols-2"><input value={p.name} onChange={(e) => updateProject(i, 'name', e.target.value)} placeholder="Project Name" className="theme-input rounded-xl px-3 py-2 text-sm" /><input value={p.liveLink} onChange={(e) => updateProject(i, 'liveLink', e.target.value)} placeholder="Live Link" className="theme-input rounded-xl px-3 py-2 text-sm" /><input value={p.sourceCode} onChange={(e) => updateProject(i, 'sourceCode', e.target.value)} placeholder="Source Code" className="theme-input rounded-xl px-3 py-2 text-sm md:col-span-2" /><textarea rows="2" value={p.description} onChange={(e) => updateProject(i, 'description', e.target.value)} placeholder="Project Description" className="theme-input rounded-xl p-3 text-sm md:col-span-2" />{builderData.projects.length > 1 ? <button type="button" onClick={() => removeProject(i)} className="theme-button-secondary rounded-lg px-2 py-1 text-xs font-semibold md:col-span-2">Remove Project</button> : null}</div>)}</div>
      <div className="md:col-span-2 grid gap-3 md:grid-cols-3">{[['tenth', '10th'], ['twelfth', '12th'], ['graduation', 'Graduation']].map(([lvl, label]) => <div key={lvl} className="rounded-xl border border-[var(--border-color)] p-3"><p className="mb-2 text-xs font-semibold">{label}</p><input value={builderData.education[lvl].board} onChange={(e) => updateEducation(lvl, 'board', e.target.value)} placeholder="Board Name" className="theme-input mb-2 w-full rounded-xl px-3 py-2 text-sm" /><input value={builderData.education[lvl].percentage} onChange={(e) => updateEducation(lvl, 'percentage', e.target.value)} placeholder="Percentage" className="theme-input mb-2 w-full rounded-xl px-3 py-2 text-sm" /><input value={builderData.education[lvl].year} onChange={(e) => updateEducation(lvl, 'year', e.target.value)} placeholder="Year" className="theme-input w-full rounded-xl px-3 py-2 text-sm" /></div>)}</div>
      <div className="md:col-span-2 grid gap-3 md:grid-cols-2"><input value={builderData.skills.frontend} onChange={(e) => updateSkill('frontend', e.target.value)} placeholder="Frontend (Optional)" className="theme-input rounded-xl px-3 py-2 text-sm" /><input value={builderData.skills.backend} onChange={(e) => updateSkill('backend', e.target.value)} placeholder="Backend (Optional)" className="theme-input rounded-xl px-3 py-2 text-sm" /><input value={builderData.skills.database} onChange={(e) => updateSkill('database', e.target.value)} placeholder="Database (Optional)" className="theme-input rounded-xl px-3 py-2 text-sm" /><input value={builderData.skills.codeEditor} onChange={(e) => updateSkill('codeEditor', e.target.value)} placeholder="Code Editor (Optional)" className="theme-input rounded-xl px-3 py-2 text-sm" /><input value={builderData.skills.aiTools} onChange={(e) => updateSkill('aiTools', e.target.value)} placeholder="AI Tools (Optional)" className="theme-input rounded-xl px-3 py-2 text-sm md:col-span-2" /></div>
      <textarea rows="3" value={builderJobDescription} onChange={(e) => setBuilderJobDescription(e.target.value)} placeholder="Job Description (Optional)" className="theme-input rounded-xl p-3 text-sm md:col-span-2" />{builderError ? <p className="theme-error rounded-xl px-4 py-3 text-sm font-medium md:col-span-2">{builderError}</p> : null}<div className="md:col-span-2 flex flex-wrap gap-3"><button type="submit" className="theme-button-primary rounded-xl px-5 py-2.5 text-sm font-bold text-white">Build Resume</button><button type="button" onClick={improveBuilder} disabled={builderLoading} className="theme-button-secondary rounded-xl px-5 py-2.5 text-sm font-bold disabled:opacity-60">{builderLoading ? 'Improving...' : 'Improve With ATS AI'}</button><span className="theme-score-badge rounded-xl px-4 py-2 text-sm font-bold">Estimated ATS Score: {builderScore || selectedTemplateData.score}/100</span></div></form><textarea value={builderDraft} onChange={(e) => setBuilderDraft(e.target.value)} rows="18" className="theme-input mt-4 w-full rounded-xl p-3 font-mono text-sm" placeholder="Generated resume draft." /></>}</section> : null}
  </div></main>;
}

export default UploadResume;
