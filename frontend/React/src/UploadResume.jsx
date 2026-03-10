import { useEffect, useState } from 'react';
import axios from 'axios';
import Result from './Result';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/resume';

function UploadResume() {
  const [file, setFile] = useState(null);
  const [jobDescription, setJobDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [analysis, setAnalysis] = useState(null);
  const [generatedResume, setGeneratedResume] = useState('');
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

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!file) {
      setError('Please upload your resume in PDF format.');
      return;
    }

    if (!file.name.toLowerCase().endsWith('.pdf')) {
      setError('Only PDF files are supported right now.');
      return;
    }

    if (!jobDescription.trim()) {
      setError('Please paste the job description for ATS matching.');
      return;
    }

    setLoading(true);
    setError('');
    setAnalysis(null);
    setGeneratedResume('');

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('jobDescription', jobDescription);

      const response = await axios.post(`${API_BASE_URL}/analyze`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      setAnalysis(response.data);
    } catch (requestError) {
      const status = requestError?.response?.status;
      const responseData = requestError?.response?.data;
      const serverMessage =
        (typeof responseData === 'string' ? responseData : responseData?.error || responseData?.message);
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

  const handleGenerateAtsResume = async () => {
    if (!analysis?.extractedText) {
      setError('Analyze resume first before generating ATS-friendly version.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const response = await axios.post(`${API_BASE_URL}/generate-ats`, {
        resumeText: analysis.extractedText,
        jobDescription
      });

      setGeneratedResume(response.data.generatedResume || '');
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
      <div className="mx-auto max-w-5xl">
        <header className="mb-6 flex flex-wrap items-center justify-between gap-4 reveal-up">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-emerald-600 dark:text-emerald-300">Resume Intelligence Studio</p>
            <h1 className="mt-1 text-3xl font-extrabold leading-tight md:text-4xl">ATS Resume Checker</h1>
            <p className="mt-2 text-slate-700 dark:text-slate-300">
              Upload PDF resume, detect weak ATS sections, and generate an ATS-friendly version.
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
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="upload-zone rounded-2xl border border-dashed border-sky-400/70 p-5 transition hover:scale-[1.005] dark:border-sky-400/45">
              <label className="mb-2 block text-sm font-bold uppercase tracking-wide text-sky-800 dark:text-sky-200">
                Upload Resume (PDF)
              </label>
              <input
                type="file"
                accept=".pdf,application/pdf"
                onChange={(event) => setFile(event.target.files?.[0] || null)}
                className="w-full cursor-pointer rounded-lg border border-slate-200 bg-white/80 p-2.5 text-sm shadow-sm outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-300 dark:border-slate-700 dark:bg-slate-950/40 dark:text-slate-100"
              />
              {file ? (
                <p className="mt-2 text-sm font-medium text-emerald-700 dark:text-emerald-300">Selected: {file.name}</p>
              ) : null}
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold uppercase tracking-wide text-slate-700 dark:text-slate-200">Job Description</label>
              <textarea
                rows="8"
                value={jobDescription}
                onChange={(event) => setJobDescription(event.target.value)}
                placeholder="Paste complete job description here..."
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
                {loading ? 'Processing...' : 'Check ATS Score'}
              </button>

              <button
                type="button"
                disabled={loading || !analysis}
                onClick={handleGenerateAtsResume}
                className="rounded-xl bg-gradient-to-r from-emerald-600 to-lime-500 px-5 py-2.5 text-sm font-bold text-white shadow-md transition hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-60"
              >
                Generate ATS-Friendly Resume
              </button>
            </div>
          </form>

          {analysis ? <Result analysis={analysis} generatedResume={generatedResume} /> : null}
        </div>
      </div>
    </main>
  );
}

export default UploadResume;
