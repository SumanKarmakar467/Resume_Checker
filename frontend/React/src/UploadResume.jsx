import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { jsPDF } from 'jspdf';
import api from './api/axios';
import Result from './Result';
import {
  MAX_RESUME_FILE_SIZE_BYTES,
  MESSAGES,
  SUPPORTED_RESUME_EXTENSIONS
} from './constants/resumeCheckerConstants';
import useAuth from './hooks/useAuth';
import useTheme from './hooks/useTheme';

const initialBuilderForm = {
  fullName: '',
  email: '',
  phone: '',
  location: '',
  linkedin: '',
  github: '',
  targetRole: '',
  summary: '',
  about: '',
  experience: '',
  frontendSkills: '',
  backendSkills: '',
  databaseSkills: '',
  toolsSkills: '',
  projectsText: '',
  educationText: '',
  jobDescription: ''
};

function hasText(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function parseProjectsFromText(projectsText = '') {
  return projectsText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 5)
    .map((line) => {
      const [namePart, descriptionPart] = line.split(':');
      const full = descriptionPart ? descriptionPart.trim() : '';
      const links = (line.match(/https?:\/\/\S+/g) || []).slice(0, 2);

      return {
        name: (namePart || 'Project').trim(),
        description: full || line,
        liveLink: links.find((url) => !/github|gitlab/i.test(url)) || '',
        sourceCode: links.find((url) => /github|gitlab/i.test(url)) || ''
      };
    });
}

function parseEducationFromText(educationText = '') {
  return educationText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 4)
    .map((line) => ({
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
      percentage: (line.match(/\b\d{1,2}(?:\.\d{1,2})?%\b|\b\d\.\d{1,2}\s*CGPA\b/i) || [''])[0],
      year: (line.match(/(19|20)\d{2}/g) || []).join(' - ')
    }));
}

function buildProfilePayload(form) {
  return {
    fullName: form.fullName.trim(),
    email: form.email.trim(),
    phone: form.phone.trim(),
    location: form.location.trim(),
    linkedin: form.linkedin.trim(),
    github: form.github.trim(),
    targetRole: form.targetRole.trim(),
    summary: form.summary.trim(),
    about: form.about.trim(),
    experience: form.experience.trim(),
    skills: {
      frontend: form.frontendSkills.trim(),
      backend: form.backendSkills.trim(),
      database: form.databaseSkills.trim(),
      tools: form.toolsSkills.trim()
    },
    projects: parseProjectsFromText(form.projectsText),
    education: parseEducationFromText(form.educationText)
  };
}

function profileToForm(profile = {}) {
  return {
    ...initialBuilderForm,
    fullName: profile.fullName || '',
    email: profile.email || '',
    phone: profile.phone || '',
    location: profile.location || '',
    linkedin: profile.linkedin || '',
    github: profile.github || '',
    targetRole: profile.targetRole || '',
    summary: profile.summary || '',
    about: profile.about || '',
    experience: profile.experience || '',
    frontendSkills: profile.skills?.frontend || '',
    backendSkills: profile.skills?.backend || '',
    databaseSkills: profile.skills?.database || '',
    toolsSkills: profile.skills?.tools || '',
    projectsText: (profile.projects || [])
      .map((item) => {
        const links = [item.liveLink, item.sourceCode].filter(Boolean).join(' | ');
        return `${item.name || 'Project'}: ${item.description || ''}${links ? ` ${links}` : ''}`.trim();
      })
      .join('\n'),
    educationText: (profile.education || [])
      .map((item) => [item.board || item.level, item.percentage, item.year].filter(Boolean).join(' | '))
      .join('\n')
  };
}

function buildResumeTextFromForm(form) {
  const profile = buildProfilePayload(form);
  const projectLines = (profile.projects || [])
    .map((item) => `${item.name}: ${item.description}`.trim())
    .join('\n');
  const educationLines = (profile.education || [])
    .map((item) => [item.board || item.level, item.percentage, item.year].filter(Boolean).join(' | '))
    .join('\n');

  const sections = [
    profile.fullName,
    [profile.email, profile.phone, profile.location, profile.linkedin, profile.github].filter(Boolean).join(' | '),
    'SUMMARY',
    profile.summary || profile.about,
    'SKILLS',
    [profile.skills.frontend, profile.skills.backend, profile.skills.database, profile.skills.tools].filter(Boolean).join(', '),
    'EXPERIENCE',
    profile.experience,
    'PROJECTS',
    projectLines,
    'EDUCATION',
    educationLines
  ].filter(Boolean);

  return sections.join('\n\n');
}

function safeFileName(value = '') {
  const clean = value.trim().replace(/[<>:"/\\|?*\x00-\x1F]/g, '_');
  return clean || 'generated_resume';
}

function downloadTextAsPdf(text, fileName) {
  const documentPdf = new jsPDF({ unit: 'pt', format: 'a4' });
  const marginX = 44;
  const marginY = 54;
  const maxWidth = documentPdf.internal.pageSize.getWidth() - marginX * 2;
  const pageHeight = documentPdf.internal.pageSize.getHeight();

  documentPdf.setFont('helvetica', 'normal');
  documentPdf.setFontSize(11);

  const lines = documentPdf.splitTextToSize(text || '', maxWidth);
  let y = marginY;

  lines.forEach((line) => {
    if (y > pageHeight - marginY) {
      documentPdf.addPage();
      y = marginY;
    }
    documentPdf.text(line, marginX, y);
    y += 16;
  });

  documentPdf.save(`${safeFileName(fileName)}.pdf`);
}

function getJobTitleFromDescription(description) {
  if (!description.trim()) return '';
  return description.trim().split(/\r?\n/)[0].trim().slice(0, 120);
}

function UploadResume() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();

  const [activeTab, setActiveTab] = useState('checker');

  const [resumeFile, setResumeFile] = useState(null);
  const [jobDescription, setJobDescription] = useState('');
  const [analyzeLoading, setAnalyzeLoading] = useState(false);
  const [analyzeError, setAnalyzeError] = useState('');
  const [analysis, setAnalysis] = useState(null);

  const [generatedDraft, setGeneratedDraft] = useState('');
  const [generatedAtsScore, setGeneratedAtsScore] = useState(0);
  const [generatedBestFitRole, setGeneratedBestFitRole] = useState('');
  const [generatedRoleSuggestion, setGeneratedRoleSuggestion] = useState('');
  const [draftLoading, setDraftLoading] = useState(false);

  const [builderForm, setBuilderForm] = useState(initialBuilderForm);
  const [builderError, setBuilderError] = useState('');
  const [builderInfo, setBuilderInfo] = useState('');
  const [builderGeneratedDraft, setBuilderGeneratedDraft] = useState('');
  const [builderGeneratedScore, setBuilderGeneratedScore] = useState(0);
  const [builderGeneratedRole, setBuilderGeneratedRole] = useState('');
  const [builderGeneratedSuggestion, setBuilderGeneratedSuggestion] = useState('');
  const [builderLoading, setBuilderLoading] = useState(false);

  const [downloadName, setDownloadName] = useState('resume_output');
  const [autofillFile, setAutofillFile] = useState(null);

  const handleAnalyze = async (event) => {
    event.preventDefault();
    setAnalyzeError('');
    setAnalysis(null);

    if (!resumeFile) {
      setAnalyzeError(MESSAGES.uploadRequired);
      return;
    }

    const lowerName = resumeFile.name.toLowerCase();
    const validType = SUPPORTED_RESUME_EXTENSIONS.some((extension) => lowerName.endsWith(extension));
    if (!validType) {
      setAnalyzeError(MESSAGES.uploadInvalidType);
      return;
    }
    if (resumeFile.size > MAX_RESUME_FILE_SIZE_BYTES) {
      setAnalyzeError(MESSAGES.uploadSizeExceeded);
      return;
    }

    setAnalyzeLoading(true);
    try {
      const payload = new FormData();
      payload.append('file', resumeFile);
      payload.append('jobDescription', jobDescription.trim());
      payload.append('jobTitle', getJobTitleFromDescription(jobDescription));

      const response = await api.post('/api/resume/analyze', payload, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      const incoming = response?.data || null;
      setAnalysis(incoming);

      if (incoming?.extractedText) {
        await handleGenerateDraft(incoming.extractedText, jobDescription);
      }
    } catch (error) {
      setAnalyzeError(error?.response?.data?.error || MESSAGES.analyzeFailed);
    } finally {
      setAnalyzeLoading(false);
    }
  };

  const handleGenerateDraft = async (resumeText, jdText, profile = null) => {
    setDraftLoading(true);
    try {
      const response = await api.post('/api/resume/generate-ats', {
        resumeText,
        jobDescription: jdText,
        profile
      });

      const data = response?.data || {};
      setGeneratedDraft(data.generatedResume || '');
      setGeneratedAtsScore(data.generatedAtsScore || 0);
      setGeneratedBestFitRole(data.bestFitRole || '');
      setGeneratedRoleSuggestion(data.roleSuggestion || '');
    } catch (error) {
      setAnalyzeError(error?.response?.data?.error || 'Unable to generate improved resume draft.');
    } finally {
      setDraftLoading(false);
    }
  };

  const handleAutofillFromPdf = async () => {
    setBuilderError('');
    setBuilderInfo('');

    if (!autofillFile) {
      setBuilderError('Please choose a PDF, DOCX, or TXT resume file first.');
      return;
    }

    const lowerName = autofillFile.name.toLowerCase();
    const validType = SUPPORTED_RESUME_EXTENSIONS.some((extension) => lowerName.endsWith(extension));
    if (!validType) {
      setBuilderError(MESSAGES.uploadInvalidType);
      return;
    }

    setBuilderLoading(true);
    try {
      const payload = new FormData();
      payload.append('file', autofillFile);
      payload.append('jobDescription', builderForm.jobDescription.trim());

      const response = await api.post('/api/resume/extract-profile', payload, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      const data = response?.data || {};
      const extractedForm = profileToForm(data.profile || {});
      setBuilderForm((current) => ({
        ...current,
        ...extractedForm,
        jobDescription: current.jobDescription
      }));

      setBuilderGeneratedDraft(data.generatedResume || '');
      setBuilderGeneratedScore(data.generatedAtsScore || 0);
      setBuilderGeneratedRole(data.bestFitRole || '');
      setBuilderGeneratedSuggestion(data.roleSuggestion || '');
      setBuilderInfo('Profile extracted from file. Resume draft generated automatically.');
    } catch (error) {
      setBuilderError(error?.response?.data?.error || 'Unable to extract details from this file.');
    } finally {
      setBuilderLoading(false);
    }
  };

  const handleBuilderGenerate = async () => {
    setBuilderError('');
    setBuilderInfo('');

    if (!hasText(builderForm.fullName) || !hasText(builderForm.email) || !hasText(builderForm.phone)) {
      setBuilderError('Name, email, and phone are required to generate a recruiter-ready resume.');
      return;
    }

    setBuilderLoading(true);
    try {
      const profilePayload = buildProfilePayload(builderForm);
      const response = await api.post('/api/resume/generate-ats', {
        resumeText: buildResumeTextFromForm(builderForm),
        jobDescription: builderForm.jobDescription,
        profile: profilePayload
      });

      const data = response?.data || {};
      setBuilderGeneratedDraft(data.generatedResume || '');
      setBuilderGeneratedScore(data.generatedAtsScore || 0);
      setBuilderGeneratedRole(data.bestFitRole || '');
      setBuilderGeneratedSuggestion(data.roleSuggestion || '');
      setBuilderInfo('Recruiter-focused resume generated successfully.');
    } catch (error) {
      setBuilderError(error?.response?.data?.error || 'Unable to generate resume right now.');
    } finally {
      setBuilderLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <main className="theme-page min-h-screen px-4 py-6 md:px-8">
      <div className="mx-auto max-w-6xl space-y-5">
        <header className="landing-topbar">
          <div className="landing-brand">
            <span className="brand-icon" />
            <p>ResumeChecker</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button type="button" className="nav-pill" onClick={() => setActiveTab('checker')}>
              ATS Checker
            </button>
            <button type="button" className="nav-pill" onClick={() => setActiveTab('builder')}>
              Resume Builder
            </button>
            <button type="button" className="nav-pill" onClick={() => navigate('/dashboard')}>
              Dashboard
            </button>
            <button type="button" className="nav-pill" onClick={handleLogout}>
              Logout
            </button>
            <button type="button" onClick={toggleTheme} className="theme-toggle">
              {isDark ? 'Light Theme' : 'Dark Theme'}
            </button>
          </div>
        </header>

        <section className="theme-card p-5 md:p-7">
          <h1 className="text-2xl font-extrabold">Smart ATS Resume Assistant</h1>
          <p className="theme-muted mt-2 text-sm">
            Theme enabled for light and dark mode. Email authentication available. You can either upload a resume to auto-extract details or fill the form manually.
          </p>
        </section>

        {activeTab === 'checker' ? (
          <section className="theme-card p-5 md:p-7">
            <h2 className="text-xl font-bold">1) ATS Check + Recommendation</h2>
            <p className="theme-muted mt-1 text-sm">Upload your current resume, view ATS score, and get best-fit role suggestions.</p>

            <form onSubmit={handleAnalyze} className="mt-4 space-y-3">
              <div className="file-input-shell">
                <label className="text-sm font-semibold">Resume file (PDF, DOCX, TXT)</label>
                <input
                  type="file"
                  accept=".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
                  onChange={(event) => setResumeFile(event.target.files?.[0] || null)}
                  className="mt-2 block w-full"
                />
                <p className="theme-muted mt-2 text-xs">Selected: {resumeFile ? resumeFile.name : 'No file selected'}</p>
              </div>

              <textarea
                value={jobDescription}
                onChange={(event) => setJobDescription(event.target.value)}
                placeholder="Paste the target job description for better keyword matching"
                rows="5"
                className="theme-input"
              />

              {analyzeError ? <p className="theme-error">{analyzeError}</p> : null}

              <button type="submit" disabled={analyzeLoading} className="theme-button-primary">
                {analyzeLoading ? 'Analyzing Resume...' : 'Analyze Resume'}
              </button>
            </form>

            {analysis ? (
              <div className="mt-5">
                <Result
                  analysis={analysis}
                  generatedDraft={generatedDraft}
                  setGeneratedDraft={setGeneratedDraft}
                  onGenerateDraft={() => handleGenerateDraft(analysis?.extractedText || '', jobDescription)}
                  generatingDraft={draftLoading}
                  generatedAtsScore={generatedAtsScore}
                  generatedBestFitRole={generatedBestFitRole}
                  generatedRoleSuggestion={generatedRoleSuggestion}
                  onDownloadDraft={() => downloadTextAsPdf(generatedDraft, downloadName || 'generated_resume')}
                  jobDescription={jobDescription}
                />
              </div>
            ) : null}
          </section>
        ) : (
          <section className="theme-card p-5 md:p-7">
            <h2 className="text-xl font-bold">2) Resume Generator + PDF Autofill</h2>
            <p className="theme-muted mt-1 text-sm">
              If you do not want to enter all fields one by one, upload your existing resume and auto-fill this form. The generated about section is based on detected skills and projects.
            </p>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div className="theme-card p-4">
                <h3 className="text-sm font-bold uppercase tracking-wide">Auto-fill from file</h3>
                <input
                  type="file"
                  accept=".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
                  onChange={(event) => setAutofillFile(event.target.files?.[0] || null)}
                  className="mt-2 block w-full"
                />
                <button
                  type="button"
                  onClick={handleAutofillFromPdf}
                  disabled={builderLoading}
                  className="theme-button-secondary mt-3"
                >
                  {builderLoading ? 'Extracting...' : 'Extract Data + Generate Resume'}
                </button>
                <p className="theme-muted mt-2 text-xs">Selected: {autofillFile ? autofillFile.name : 'No file selected'}</p>
              </div>

              <div className="theme-card p-4">
                <h3 className="text-sm font-bold uppercase tracking-wide">Download settings</h3>
                <input
                  value={downloadName}
                  onChange={(event) => setDownloadName(event.target.value)}
                  className="theme-input mt-2"
                  placeholder="Resume file name"
                />
                <button
                  type="button"
                  onClick={() => downloadTextAsPdf(builderGeneratedDraft, downloadName)}
                  className="theme-button-primary mt-3"
                >
                  Download Generated Resume PDF
                </button>
              </div>
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <input className="theme-input" placeholder="Full name" value={builderForm.fullName} onChange={(event) => setBuilderForm((p) => ({ ...p, fullName: event.target.value }))} />
              <input className="theme-input" placeholder="Email" value={builderForm.email} onChange={(event) => setBuilderForm((p) => ({ ...p, email: event.target.value }))} />
              <input className="theme-input" placeholder="Phone" value={builderForm.phone} onChange={(event) => setBuilderForm((p) => ({ ...p, phone: event.target.value }))} />
              <input className="theme-input" placeholder="Location" value={builderForm.location} onChange={(event) => setBuilderForm((p) => ({ ...p, location: event.target.value }))} />
              <input className="theme-input" placeholder="LinkedIn URL" value={builderForm.linkedin} onChange={(event) => setBuilderForm((p) => ({ ...p, linkedin: event.target.value }))} />
              <input className="theme-input" placeholder="GitHub URL" value={builderForm.github} onChange={(event) => setBuilderForm((p) => ({ ...p, github: event.target.value }))} />
              <input className="theme-input md:col-span-2" placeholder="Target role" value={builderForm.targetRole} onChange={(event) => setBuilderForm((p) => ({ ...p, targetRole: event.target.value }))} />
            </div>

            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <textarea className="theme-input" rows="4" placeholder="Professional summary" value={builderForm.summary} onChange={(event) => setBuilderForm((p) => ({ ...p, summary: event.target.value }))} />
              <textarea className="theme-input" rows="4" placeholder="About section" value={builderForm.about} onChange={(event) => setBuilderForm((p) => ({ ...p, about: event.target.value }))} />
            </div>

            <textarea className="theme-input mt-3" rows="5" placeholder="Experience bullets" value={builderForm.experience} onChange={(event) => setBuilderForm((p) => ({ ...p, experience: event.target.value }))} />

            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <input className="theme-input" placeholder="Frontend skills" value={builderForm.frontendSkills} onChange={(event) => setBuilderForm((p) => ({ ...p, frontendSkills: event.target.value }))} />
              <input className="theme-input" placeholder="Backend skills" value={builderForm.backendSkills} onChange={(event) => setBuilderForm((p) => ({ ...p, backendSkills: event.target.value }))} />
              <input className="theme-input" placeholder="Database skills" value={builderForm.databaseSkills} onChange={(event) => setBuilderForm((p) => ({ ...p, databaseSkills: event.target.value }))} />
              <input className="theme-input" placeholder="Tools skills" value={builderForm.toolsSkills} onChange={(event) => setBuilderForm((p) => ({ ...p, toolsSkills: event.target.value }))} />
            </div>

            <textarea className="theme-input mt-3" rows="4" placeholder="Projects (one per line, format: Project Name: Description [links])" value={builderForm.projectsText} onChange={(event) => setBuilderForm((p) => ({ ...p, projectsText: event.target.value }))} />
            <textarea className="theme-input mt-3" rows="3" placeholder="Education (one per line)" value={builderForm.educationText} onChange={(event) => setBuilderForm((p) => ({ ...p, educationText: event.target.value }))} />
            <textarea className="theme-input mt-3" rows="5" placeholder="Job description for keyword targeting" value={builderForm.jobDescription} onChange={(event) => setBuilderForm((p) => ({ ...p, jobDescription: event.target.value }))} />

            {builderError ? <p className="theme-error mt-3">{builderError}</p> : null}
            {builderInfo ? <p className="mt-3 rounded-xl border px-4 py-3 text-sm" style={{ borderColor: 'var(--success-border)', background: 'var(--success-bg)', color: 'var(--success-text)' }}>{builderInfo}</p> : null}

            <div className="mt-4 flex flex-wrap items-center gap-3">
              <button type="button" onClick={handleBuilderGenerate} disabled={builderLoading} className="theme-button-primary">
                {builderLoading ? 'Generating...' : 'Generate Recruiter-Ready Resume'}
              </button>
              <span className="theme-score-badge">Generated ATS Score: {builderGeneratedScore || 0}/100</span>
              <span className="rounded-xl border px-3 py-2 text-xs" style={{ borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}>
                Best fit: {builderGeneratedRole || 'General Software Developer'}
              </span>
            </div>

            {builderGeneratedSuggestion ? <p className="theme-muted mt-2 text-sm">{builderGeneratedSuggestion}</p> : null}

            <textarea
              className="theme-input mt-4"
              rows="20"
              value={builderGeneratedDraft}
              onChange={(event) => setBuilderGeneratedDraft(event.target.value)}
              placeholder="Generated resume will appear here"
              style={{ fontFamily: 'monospace', fontSize: 12, lineHeight: 1.7 }}
            />
          </section>
        )}
      </div>
    </main>
  );
}

export default UploadResume;
