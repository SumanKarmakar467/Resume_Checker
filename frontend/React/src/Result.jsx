import { useMemo, useState } from 'react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import api from './api/axios';
import ScoreMeter from './components/ScoreMeter';
import KeywordPills from './components/KeywordPills';
import BreakdownCard from './components/BreakdownCard';
import SuggestionCard from './components/SuggestionCard';

function shortlistMessage(score) {
  if (score >= 80) return 'Strong ATS match. You can apply after minor tailoring for each role.';
  if (score >= 65) return 'Decent ATS baseline. Improve weak sections before applying broadly.';
  return 'Low ATS readiness right now. Fix weak sections and missing keywords first.';
}

function downloadSectionAsPdf(elementId, fileName) {
  const element = document.getElementById(elementId);
  if (!element) return Promise.resolve(false);

  return html2canvas(element, { scale: 2 }).then((canvas) => {
    const image = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = (canvas.height * pageWidth) / canvas.width;

    pdf.addImage(image, 'PNG', 0, 0, pageWidth, pageHeight);
    pdf.save(fileName);
    return true;
  });
}

function Result({
  analysis,
  generatedDraft,
  setGeneratedDraft,
  onGenerateDraft,
  generatingDraft,
  generatedAtsScore,
  generatedBestFitRole,
  generatedRoleSuggestion,
  onDownloadDraft,
  jobDescription = ''
}) {
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState('');
  const [aiSuggestions, setAiSuggestions] = useState([]);
  const [reportLoading, setReportLoading] = useState(false);

  const atsScore = analysis?.atsScore ?? analysis?.overallScore ?? 0;
  const bestFitRole = analysis?.bestFitRole || 'General Software Developer';
  const roleSuggestion = analysis?.roleSuggestion || '';
  const sections = analysis?.sections || [];
  const matchedKeywords = analysis?.matchedKeywords || [];
  const missingKeywords = analysis?.missingKeywords || [];
  const staticSuggestions = analysis?.suggestions || [];
  const resumeText = analysis?.extractedText || '';

  const visibleAiSuggestions = useMemo(() => aiSuggestions.slice(0, 5), [aiSuggestions]);

  const fetchAiSuggestions = async () => {
    if (!resumeText.trim()) {
      setAiError('Resume text is missing. Please run analysis again.');
      return;
    }

    setAiLoading(true);
    setAiError('');

    try {
      const response = await api.post('/api/resume/suggestions', { resumeText, jobDescription });
      const incoming = response?.data?.suggestions;
      if (!Array.isArray(incoming) || !incoming.length) {
        setAiError('Suggestions are unavailable right now.');
        setAiSuggestions([]);
        return;
      }
      setAiSuggestions(incoming);
    } catch (error) {
      setAiError(error?.response?.data?.error || 'Suggestions are unavailable right now.');
      setAiSuggestions([]);
    } finally {
      setAiLoading(false);
    }
  };

  const downloadReport = async () => {
    setReportLoading(true);
    try {
      await downloadSectionAsPdf('ats-report-section', `ATS_Report_${Date.now()}.pdf`);
    } finally {
      setReportLoading(false);
    }
  };

  return (
    <section className="space-y-4">
      <div className="theme-card p-5 md:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-extrabold">ATS Score Report</h2>
            <p className="theme-muted mt-1 text-sm">{shortlistMessage(atsScore)}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={fetchAiSuggestions} disabled={aiLoading} className="theme-button-secondary">
              {aiLoading ? 'Fetching Suggestions...' : 'Get Rewrite Suggestions'}
            </button>
            <button type="button" onClick={downloadReport} disabled={reportLoading} className="theme-button-primary">
              {reportLoading ? 'Preparing PDF...' : 'Download ATS Report'}
            </button>
          </div>
        </div>
      </div>

      <div id="ats-report-section" className="space-y-4">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="theme-card p-5 md:p-6">
            <ScoreMeter score={atsScore} />
          </div>
          <div className="theme-card p-5 md:p-6">
            <p className="text-xs font-bold uppercase tracking-wide theme-muted">Best Fit Role</p>
            <h3 className="mt-2 text-lg font-bold">{bestFitRole}</h3>
            <p className="theme-muted mt-2 text-sm">{roleSuggestion}</p>
          </div>
          <div className="theme-card p-5 md:p-6">
            <p className="text-xs font-bold uppercase tracking-wide theme-muted">Keyword Match</p>
            <h3 className="mt-2 text-lg font-bold">
              {matchedKeywords.length} matched / {matchedKeywords.length + missingKeywords.length || 0} checked
            </h3>
            <p className="theme-muted mt-2 text-sm">Add missing keywords naturally in summary and experience bullets.</p>
          </div>
        </div>

        {(staticSuggestions || []).length > 0 ? (
          <div className="theme-card p-5 md:p-6">
            <h3 className="text-sm font-bold uppercase tracking-wide">Improvement Suggestions</h3>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm" style={{ color: 'var(--text-secondary)' }}>
              {staticSuggestions.slice(0, 8).map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        ) : null}

        <div className="grid gap-4 md:grid-cols-2">
          <BreakdownCard sections={sections} />
          <KeywordPills matchedKeywords={matchedKeywords} missingKeywords={missingKeywords} />
        </div>
      </div>

      <div className="theme-card p-5 md:p-6">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <h3 className="text-lg font-bold">AI Rewrite Suggestions</h3>
            <p className="theme-muted text-sm">Targeted wording improvements for stronger recruiter impact.</p>
          </div>
        </div>

        {aiError ? <p className="theme-error mt-3">{aiError}</p> : null}

        {aiLoading ? (
          <p className="theme-muted mt-3 text-sm">Generating suggestions...</p>
        ) : null}

        {!aiLoading && !aiError && visibleAiSuggestions.length > 0 ? (
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {visibleAiSuggestions.map((suggestion, index) => (
              <SuggestionCard key={`${index}-${suggestion?.section || 'suggestion'}`} suggestion={suggestion} />
            ))}
          </div>
        ) : null}

        {!aiLoading && !aiError && visibleAiSuggestions.length === 0 ? (
          <p className="theme-muted mt-3 text-sm">Click "Get Rewrite Suggestions" to generate improvements.</p>
        ) : null}
      </div>

      <div className="theme-card p-5 md:p-6">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <h3 className="text-lg font-bold">Generated Recruiter-Ready Resume</h3>
            <p className="theme-muted text-sm">Generate, edit, and download the upgraded resume.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={onGenerateDraft} disabled={generatingDraft} className="theme-button-primary">
              {generatingDraft ? 'Generating...' : 'Generate Resume'}
            </button>
            <button type="button" onClick={onDownloadDraft} className="theme-button-secondary">
              Download Resume PDF
            </button>
          </div>
        </div>

        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <div className="theme-score-badge">Generated ATS Score: {generatedAtsScore || 0}/100</div>
          <div className="rounded-xl border px-4 py-3 text-sm" style={{ borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}>
            <strong>{generatedBestFitRole || bestFitRole}</strong>
            <p className="mt-1 text-xs theme-muted">{generatedRoleSuggestion || roleSuggestion}</p>
          </div>
        </div>

        <textarea
          value={generatedDraft}
          onChange={(event) => setGeneratedDraft(event.target.value)}
          rows="18"
          placeholder="Generated resume will appear here."
          className="theme-input mt-4"
          style={{ fontFamily: 'monospace', fontSize: 12, lineHeight: 1.7 }}
        />
      </div>
    </section>
  );
}

export default Result;
