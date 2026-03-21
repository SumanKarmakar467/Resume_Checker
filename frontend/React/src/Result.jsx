import { useState } from 'react';
import ScoreMeter from './components/ScoreMeter';
import KeywordPills from './components/KeywordPills';
import BreakdownCard from './components/BreakdownCard';

function shortlistMessage(score) {
  if (score >= 80) return 'Good enough for shortlist in many ATS filters. Tailor it per job before applying.';
  if (score >= 65) return 'Borderline shortlist range. Improve weak sections below before applying.';
  return 'Low shortlist chance right now. Fix weak sections and missing keywords first.';
}

function Result({ analysis, resumeDraft, setResumeDraft, onGenerate, loading }) {
  const [canvaStyle, setCanvaStyle] = useState('classic');
  const sections = analysis?.sections || [];
  const strongSections = sections.filter((section) => (section.score || 0) >= 80);
  const weakSections = sections.filter((section) => (section.score || 0) < 70);
  const missingKeywords = analysis?.missingKeywords || [];
  const matchedKeywords = analysis?.matchedKeywords || [];
  const atsScore = analysis?.atsScore ?? analysis?.overallScore ?? 0;

  return (
    <section className="mt-8 space-y-5">
      <div className="theme-card p-5 md:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-extrabold">ATS Score Report</h2>
            <p className="theme-muted mt-1 text-sm">{shortlistMessage(atsScore)}</p>
          </div>
          <ScoreMeter score={atsScore} />
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <article className="rounded-2xl border border-emerald-300/60 bg-emerald-50/75 p-4 dark:border-emerald-700/60 dark:bg-emerald-900/20">
            <h3 className="text-sm font-bold uppercase tracking-wide text-emerald-700 dark:text-emerald-200">Strong Parts</h3>
            <ul className="mt-2 space-y-1 text-sm">
              {strongSections.length ? strongSections.map((section) => <li key={section.section}>- {section.section}</li>) : <li>- No strong section yet.</li>}
            </ul>
          </article>

          <article className="rounded-2xl border border-rose-300/60 bg-rose-50/75 p-4 dark:border-rose-700/60 dark:bg-rose-900/20">
            <h3 className="text-sm font-bold uppercase tracking-wide text-rose-700 dark:text-rose-200">Weak Parts</h3>
            <ul className="mt-2 space-y-1 text-sm">
              {weakSections.length ? weakSections.map((section) => <li key={section.section}>- {section.section}</li>) : <li>- No weak sections detected.</li>}
            </ul>
          </article>
        </div>

        <article className="mt-4 rounded-2xl border border-[var(--border-color)] bg-[var(--surface-soft)] p-4">
          <h3 className="text-sm font-bold uppercase tracking-wide">What To Change For Better ATS Score</h3>
          <ul className="mt-2 space-y-1 text-sm">
            {(analysis?.suggestions || []).slice(0, 8).map((suggestion) => (
              <li key={suggestion}>- {suggestion}</li>
            ))}
          </ul>
        </article>

        <BreakdownCard sections={sections} />

        <KeywordPills matchedKeywords={matchedKeywords} missingKeywords={missingKeywords} />
      </div>

      <div className="theme-card p-5 md:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-xl font-extrabold">ATS-Friendly Resume Draft</h3>
            <p className="theme-muted text-sm">Use this as your updated version after applying the suggestions above.</p>
          </div>
          <button
            type="button"
            onClick={onGenerate}
            disabled={loading}
            className="theme-button-primary rounded-xl px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            {loading ? 'Generating...' : 'Generate ATS Draft'}
          </button>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <button type="button" onClick={() => setCanvaStyle('classic')} className={`canva-chip ${canvaStyle === 'classic' ? 'canva-chip-active' : ''}`}>Classic</button>
          <button type="button" onClick={() => setCanvaStyle('modern')} className={`canva-chip ${canvaStyle === 'modern' ? 'canva-chip-active' : ''}`}>Modern</button>
          <button type="button" onClick={() => setCanvaStyle('executive')} className={`canva-chip ${canvaStyle === 'executive' ? 'canva-chip-active' : ''}`}>Executive</button>
        </div>

        <div className={`canva-draft-preview canva-${canvaStyle}`}>
          <div className="canva-preview-header" />
          <pre className="canva-preview-text">{resumeDraft || 'Your ATS draft preview will appear here after generating.'}</pre>
        </div>

        <textarea
          value={resumeDraft}
          onChange={(event) => setResumeDraft(event.target.value)}
          rows="20"
          placeholder="Generated ATS-friendly draft appears here."
          className="theme-input mt-4 w-full rounded-xl p-3 font-mono text-sm"
        />
      </div>
    </section>
  );
}

export default Result;
