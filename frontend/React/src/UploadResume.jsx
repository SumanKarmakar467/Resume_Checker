import { useEffect, useState } from 'react';
import axios from 'axios';
import Result from './Result';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/resume';

function UploadResume() {
  const [activeMode, setActiveMode] = useState('rating');
  const [file, setFile] = useState(null);
  const [resumeInputText, setResumeInputText] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [analysis, setAnalysis] = useState(null);
  const [resumeDraft, setResumeDraft] = useState('');
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
      formData.append('jobDescription', jobDescription);

      const analysisResponse = await axios.post(`${API_BASE_URL}/analyze`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      const analysisResult = analysisResponse.data;
      setAnalysis(analysisResult);

      if (analysisResult?.extractedText) {
        const draft = await fetchAtsDraft(analysisResult.extractedText, jobDescription);
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

  const handleBuilderSubmit = async (event) => {
    event.preventDefault();

    try {
      setLoading(true);
      setError('');
      setAnalysis(null);

      const sourceResume = resumeInputText.trim();
      const draft = await fetchAtsDraft(sourceResume, jobDescription);
      setResumeDraft(draft);
    } catch (requestError) {
      const status = requestError?.response?.status;
      const serverMessage = requestError?.response?.data?.error;
      const networkMessage = requestError?.message;
      setError(
        serverMessage ||
          (status
            ? `Request failed (${status}) while building resume content.`
            : `Unable to build ATS-friendly resume. ${networkMessage || ''}`)
      );
    } finally {
      setLoading(false);
    }
  };

  const handleModeChange = (mode) => {
    setActiveMode(mode);
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
      const draft = await fetchAtsDraft(analysis.extractedText, jobDescription);
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

  return (
    <main className="app-bg min-h-screen px-4 py-8 text-slate-900 transition-colors duration-300 dark:text-slate-100 md:px-6 md:py-12">
      <div className="mx-auto max-w-7xl">
        <header className="mb-6 flex flex-wrap items-center justify-between gap-4 reveal-up">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-emerald-600 dark:text-emerald-300">Resume Intelligence Studio</p>
            <h1 className="mt-1 text-3xl font-extrabold leading-tight md:text-4xl">ATS Resume Checker + Builder</h1>
            <p className="mt-2 text-slate-700 dark:text-slate-300">
              Upload your resume, see ATS feedback on the left, and build ATS-friendly resume content on the right.
            </p>
          </div>

          <button
            type="button"
            onClick={toggleTheme}
            className="rounded-full border border-slate-300 bg-white/80 px-4 py-2 text-sm font-semibold text-slate-800 shadow-sm transition hover:-translate-y-0.5 hover:shadow dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-100"
          >
            {isDark ? 'Light Mode' : 'Dark Mode'}
          </button>
        </header>

        <div className="glow-card soft-grid rounded-3xl border border-white/60 bg-white/75 p-5 backdrop-blur-sm transition dark:border-slate-800 dark:bg-slate-900/70 md:p-8 reveal-up">
          <div className="mb-5 flex rounded-xl border border-slate-200 bg-slate-100 p-1 dark:border-slate-700 dark:bg-slate-800">
            <button
              type="button"
              onClick={() => handleModeChange('rating')}
              className={`flex-1 rounded-lg px-4 py-2 text-sm font-bold transition ${
                activeMode === 'rating'
                  ? 'bg-white text-slate-900 shadow dark:bg-slate-900 dark:text-slate-100'
                  : 'text-slate-600 dark:text-slate-300'
              }`}
            >
              Resume ATS Rating
            </button>
            <button
              type="button"
              onClick={() => handleModeChange('builder')}
              className={`flex-1 rounded-lg px-4 py-2 text-sm font-bold transition ${
                activeMode === 'builder'
                  ? 'bg-white text-slate-900 shadow dark:bg-slate-900 dark:text-slate-100'
                  : 'text-slate-600 dark:text-slate-300'
              }`}
            >
              Resume Builder
            </button>
          </div>

          <form onSubmit={activeMode === 'rating' ? handleAnalyzeSubmit : handleBuilderSubmit} className="space-y-5">
            {activeMode === 'rating' ? (
              <div className="group relative overflow-hidden rounded-2xl border border-sky-200/80 bg-gradient-to-br from-sky-50 via-cyan-50 to-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-sky-900/60 dark:from-slate-900 dark:via-slate-900 dark:to-cyan-950/25">
                <div className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-sky-300/20 blur-2xl dark:bg-sky-500/15" />
                <div className="pointer-events-none absolute -bottom-12 -left-12 h-28 w-28 rounded-full bg-cyan-300/20 blur-2xl dark:bg-cyan-500/15" />

                <div className="relative">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <label className="block text-sm font-extrabold uppercase tracking-[0.16em] text-sky-900 dark:text-sky-100">Resume Upload</label>
                    <span className="rounded-full border border-sky-300/70 bg-white/80 px-2.5 py-1 text-[11px] font-semibold text-sky-700 dark:border-sky-700/60 dark:bg-slate-900/70 dark:text-sky-200">
                      PDF / DOCX
                    </span>
                  </div>

                  <input
                    type="file"
                    accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    onChange={(event) => setFile(event.target.files?.[0] || null)}
                    className="w-full cursor-pointer rounded-xl border border-sky-200 bg-white/90 p-3 text-sm text-slate-800 shadow-sm outline-none ring-0 transition file:mr-4 file:rounded-lg file:border-0 file:bg-sky-600 file:px-3 file:py-2 file:text-xs file:font-bold file:uppercase file:tracking-wide file:text-white hover:file:bg-sky-700 focus:border-sky-500 focus:ring-2 focus:ring-sky-300 dark:border-slate-700 dark:bg-slate-950/45 dark:text-slate-100 dark:file:bg-sky-500 dark:hover:file:bg-sky-400"
                  />

                  {file ? (
                    <p className="mt-3 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 dark:border-emerald-800/70 dark:bg-emerald-950/40 dark:text-emerald-200">
                      <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      Selected: {file.name}
                    </p>
                  ) : (
                    <p className="mt-3 text-xs font-medium text-slate-600 dark:text-slate-300">Drop your latest resume and we will analyze ATS readiness.</p>
                  )}
                </div>
              </div>
            ) : (
              <div>
                <label className="mb-2 block text-sm font-bold uppercase tracking-wide text-slate-700 dark:text-slate-200">Resume Content (Optional)</label>
                <textarea
                  rows="6"
                  value={resumeInputText}
                  onChange={(event) => setResumeInputText(event.target.value)}
                  placeholder="Paste your current resume text here for more personalized builder output..."
                  className="w-full rounded-xl border border-slate-300 bg-white/80 p-3 text-slate-900 shadow-sm outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-300 dark:border-slate-700 dark:bg-slate-950/35 dark:text-slate-100"
                />
              </div>
            )}

            <div>
              <label className="mb-2 block text-sm font-bold uppercase tracking-wide text-slate-700 dark:text-slate-200">Job Description (Optional)</label>
              <textarea
                rows="2"
                value={jobDescription}
                onChange={(event) => setJobDescription(event.target.value)}
                placeholder="Paste job description for better keyword matching (optional)..."
                className="w-full rounded-xl border border-slate-300 bg-white/80 p-3 text-slate-900 shadow-sm outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-300 dark:border-slate-700 dark:bg-slate-950/35 dark:text-slate-100"
              />
            </div>

            {error ? (
              <p className="rounded-xl border border-rose-300 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700 dark:border-rose-800/70 dark:bg-rose-950/40 dark:text-rose-200">
                {error}
              </p>
            ) : null}

            <div className="flex flex-wrap gap-3">
              <button
                type="submit"
                disabled={loading}
                className="rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 px-5 py-2.5 text-sm font-bold text-white shadow-md transition hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-60"
              >
                {loading ? 'Processing...' : activeMode === 'rating' ? 'Analyze Resume' : 'Build ATS Resume'}
              </button>
            </div>
          </form>

          {activeMode === 'rating' && analysis ? (
            <Result
              analysis={analysis}
              resumeDraft={resumeDraft}
              setResumeDraft={setResumeDraft}
              onGenerate={handleGenerateAtsResume}
              loading={loading}
            />
          ) : null}

          {activeMode === 'builder' && resumeDraft ? (
            <section className="mt-8 rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900/80">
              <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Generated ATS Resume Draft</h3>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                Builder mode created this draft based on your selected inputs.
              </p>
              <textarea
                value={resumeDraft}
                onChange={(event) => setResumeDraft(event.target.value)}
                rows="22"
                className="mt-4 w-full rounded-xl border border-slate-300 bg-white p-3 font-mono text-sm text-slate-800 shadow-sm outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200 dark:border-slate-700 dark:bg-slate-950/35 dark:text-slate-100"
              />
            </section>
          ) : null}
        </div>
      </div>
    </main>
  );
}

export default UploadResume;
