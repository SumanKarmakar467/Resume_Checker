import { useMemo, useState } from 'react';
import { jsPDF } from 'jspdf';

const THEMES = {
  ocean: {
    label: 'Ocean Blue',
    header: '#0f172a',
    accent: '#0284c7',
    soft: '#e0f2fe',
    text: '#0f172a'
  },
  emerald: {
    label: 'Emerald Fresh',
    header: '#052e2b',
    accent: '#10b981',
    soft: '#d1fae5',
    text: '#0b2f2a'
  },
  sunset: {
    label: 'Sunset Coral',
    header: '#3b1d1d',
    accent: '#f97316',
    soft: '#ffedd5',
    text: '#3b1d1d'
  }
};

const TEMPLATES = {
  modern: {
    label: 'Modern ATS',
    build: (analysis) => {
      const score = analysis?.overallScore || 0;
      const topKeywords = (analysis?.matchedKeywords || []).slice(0, 8).join(', ') || 'Communication, Problem Solving, Teamwork';
      return `FULL NAME
City, Country | phone@email.com | linkedin.com/in/username

PROFESSIONAL SUMMARY
Results-driven candidate with ATS score of ${score}/100 for this role. Strong focus on measurable impact, role alignment, and practical delivery.

CORE SKILLS
${topKeywords}

EXPERIENCE
Job Title - Company Name | Year - Year
- Delivered measurable outcomes using data-backed improvements.
- Improved process quality, collaboration, and execution speed.
- Tailored work to role priorities and business objectives.

PROJECTS
Project Name
- Built solution aligned with user and business goals.
- Applied tools/technologies relevant to the job description.

EDUCATION
Degree | Institution | Year
`;
    }
  },
  corporate: {
    label: 'Executive Clean',
    build: (analysis) => {
      const missing = (analysis?.missingKeywords || []).slice(0, 6).join(', ') || 'Leadership, Ownership';
      return `FULL NAME
Email | Phone | LinkedIn | Portfolio

PROFILE
Strategic and execution-focused professional with strong ATS readiness and practical experience delivering role-relevant outcomes.

HIGHLIGHTED QUALIFICATIONS
- Strong analytical and communication skills
- Experience with structured delivery and quality outcomes
- Works effectively across teams and timelines

RECOMMENDED KEYWORDS TO INCLUDE
${missing}

EXPERIENCE
Role | Organization | Year - Year
- Led/Contributed to high-impact initiatives with clear metrics.
- Improved efficiency, reliability, or user outcomes.

EDUCATION
Degree | College/University
`;
    }
  },
  compact: {
    label: 'Compact One-Page',
    build: (analysis) => {
      const suggestions = (analysis?.suggestions || []).slice(0, 5).map((item) => `- ${item}`).join('\n') || '- Add quantified impact bullets';
      return `FULL NAME | Email | Phone | LinkedIn

SUMMARY
Focused candidate with strong foundation and role-aligned skillset.

SKILLS
Technical Skills | Tools | Domain Knowledge

EXPERIENCE
Role, Company
- Key achievement with numbers
- Key achievement with business value

PROJECTS
- Project 1: Problem, approach, and impact
- Project 2: Problem, approach, and impact

ATS IMPROVEMENT CHECKLIST
${suggestions}
`;
    }
  }
};

function scoreTone(score) {
  if (score >= 80) return 'bg-emerald-500';
  if (score >= 60) return 'bg-amber-500';
  return 'bg-rose-500';
}

function sectionTone(score) {
  if (score >= 80) return 'border-emerald-200 bg-emerald-50 dark:border-emerald-900/40 dark:bg-emerald-950/25';
  if (score >= 60) return 'border-amber-200 bg-amber-50 dark:border-amber-900/40 dark:bg-amber-950/25';
  return 'border-rose-200 bg-rose-50 dark:border-rose-900/40 dark:bg-rose-950/25';
}

function renderLinePreview(line, index) {
  if (!line.trim()) return <div key={`sp-${index}`} className="h-3" />;
  if (line.toUpperCase() === line && line.length <= 52) {
    return (
      <h4 key={`${line}-${index}`} className="mt-3 text-sm font-extrabold tracking-wide text-slate-900">
        {line}
      </h4>
    );
  }
  if (line.startsWith('-')) {
    return (
      <li key={`${line}-${index}`} className="ml-4 list-disc text-sm text-slate-700">
        {line.slice(1).trim()}
      </li>
    );
  }
  return (
    <p key={`${line}-${index}`} className="text-sm leading-relaxed text-slate-700">
      {line}
    </p>
  );
}

function downloadAsPdf(content, themeName) {
  const doc = new jsPDF({
    unit: 'pt',
    format: 'a4'
  });

  const theme = THEMES[themeName] || THEMES.ocean;
  const margin = 42;
  const pageWidth = doc.internal.pageSize.getWidth();
  const lineHeight = 15;
  let cursorY = margin;

  doc.setFillColor(theme.accent);
  doc.rect(0, 0, pageWidth, 18, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(theme.header);
  doc.setFontSize(18);
  doc.text('ATS Friendly Resume', margin, 44);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(theme.text);
  doc.setFontSize(11);

  const lines = doc.splitTextToSize(content || 'No content available.', pageWidth - margin * 2);
  cursorY = 66;

  lines.forEach((line) => {
    if (cursorY > doc.internal.pageSize.getHeight() - margin) {
      doc.addPage();
      cursorY = margin;
    }
    doc.text(line, margin, cursorY);
    cursorY += lineHeight;
  });

  doc.save('ats-friendly-resume.pdf');
}

function Result({ analysis, resumeDraft, setResumeDraft, onGenerate, loading }) {
  const [activeTheme, setActiveTheme] = useState('ocean');
  const [activeTemplate, setActiveTemplate] = useState('modern');
  const [feedbackView, setFeedbackView] = useState('cards');

  const sections = analysis.sections || [];
  const issuesCount = sections.filter((section) => section.score < 70).length;
  const missingKeywords = analysis.missingKeywords || [];
  const matchedKeywords = analysis.matchedKeywords || [];
  const previewLines = (resumeDraft || '').split('\n').slice(0, 56);

  const currentTheme = THEMES[activeTheme];

  const insightCards = useMemo(() => {
    return [
      { title: 'Overall ATS Score', value: `${analysis.overallScore || 0}/100`, sub: issuesCount ? `${issuesCount} section(s) need work` : 'Strong ATS alignment' },
      { title: 'Matched Keywords', value: `${matchedKeywords.length}`, sub: 'Detected in resume text' },
      { title: 'Missing Keywords', value: `${missingKeywords.length}`, sub: 'Add these for better relevance' }
    ];
  }, [analysis.overallScore, issuesCount, matchedKeywords.length, missingKeywords.length]);

  const applyTemplate = (key) => {
    const template = TEMPLATES[key];
    if (!template) return;
    setActiveTemplate(key);
    setResumeDraft(template.build(analysis));
  };

  return (
    <section className="mt-8 space-y-6">
      <div className="rounded-3xl border border-slate-200 bg-white/90 p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900/80">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Feedback Dashboard</h3>
            <p className="text-sm text-slate-600 dark:text-slate-300">Refined ATS feedback with visual cards and section-wise status.</p>
          </div>
          <div className="flex rounded-xl border border-slate-200 bg-slate-50 p-1 dark:border-slate-700 dark:bg-slate-800/80">
            <button
              type="button"
              onClick={() => setFeedbackView('cards')}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${feedbackView === 'cards' ? 'bg-white text-slate-900 shadow dark:bg-slate-900 dark:text-slate-100' : 'text-slate-600 dark:text-slate-300'}`}
            >
              Card View
            </button>
            <button
              type="button"
              onClick={() => setFeedbackView('list')}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${feedbackView === 'list' ? 'bg-white text-slate-900 shadow dark:bg-slate-900 dark:text-slate-100' : 'text-slate-600 dark:text-slate-300'}`}
            >
              List View
            </button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {insightCards.map((card) => {
            if (card.title === 'Overall ATS Score') {
              const score = analysis.overallScore || 0;
              const scoreDeg = Math.round((Math.max(0, Math.min(100, score)) / 100) * 360);
              return (
                <article
                  key={card.title}
                  className="rounded-2xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-4 dark:border-slate-700 dark:from-slate-900 dark:to-slate-800/70"
                >
                  <p className="text-center text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{card.title}</p>
                  <div
                    className="mx-auto mt-3 grid h-28 w-28 place-items-center rounded-full"
                    style={{ background: `conic-gradient(#22c55e ${scoreDeg}deg, #e2e8f0 ${scoreDeg}deg)` }}
                  >
                    <div className="grid h-20 w-20 place-items-center rounded-full bg-white dark:bg-slate-900">
                      <p className="text-xl font-extrabold text-slate-900 dark:text-slate-100">{card.value}</p>
                    </div>
                  </div>
                  <p className="mt-3 text-center text-xs text-slate-600 dark:text-slate-300">{card.sub}</p>
                </article>
              );
            }

            return (
              <article
                key={card.title}
                className="rounded-2xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-4 dark:border-slate-700 dark:from-slate-900 dark:to-slate-800/70"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{card.title}</p>
                <p className="mt-2 text-2xl font-extrabold text-slate-900 dark:text-slate-100">{card.value}</p>
                <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">{card.sub}</p>
              </article>
            );
          })}
        </div>

        {feedbackView === 'cards' ? (
          <div className="mt-5 grid gap-3 lg:grid-cols-2">
            {sections.map((section) => (
              <article key={section.section} className={`rounded-2xl border p-4 ${sectionTone(section.score || 0)}`}>
                <div className="flex items-center justify-between gap-3">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">{section.section}</h4>
                  <div className="flex items-center gap-2">
                    <span className={`inline-block h-2.5 w-2.5 rounded-full ${scoreTone(section.score || 0)}`} />
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{section.score || 0}%</span>
                  </div>
                </div>
                {(section.issues || []).length > 0 ? (
                  <ul className="mt-2 space-y-1">
                    {section.issues.slice(0, 3).map((issue) => (
                      <li key={issue} className="text-xs text-slate-700 dark:text-slate-200">
                        - {issue}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-2 text-xs font-semibold text-emerald-700 dark:text-emerald-300">No major issues detected.</p>
                )}
              </article>
            ))}
          </div>
        ) : (
          <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-700">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-100 dark:bg-slate-800">
                <tr>
                  <th className="px-4 py-2 font-semibold">Section</th>
                  <th className="px-4 py-2 font-semibold">Score</th>
                  <th className="px-4 py-2 font-semibold">Top Feedback</th>
                </tr>
              </thead>
              <tbody>
                {sections.map((section) => (
                  <tr key={section.section} className="border-t border-slate-200 dark:border-slate-700">
                    <td className="px-4 py-2 font-semibold text-slate-800 dark:text-slate-100">{section.section}</td>
                    <td className="px-4 py-2 text-slate-700 dark:text-slate-200">{section.score || 0}%</td>
                    <td className="px-4 py-2 text-slate-700 dark:text-slate-200">{(section.issues || [section.status || 'Looks good'])[0]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900/80">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100">ATS Resume Templates & Themes</h3>
            <p className="text-sm text-slate-600 dark:text-slate-300">Choose a template, tune the content, and download a PDF.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={onGenerate}
              disabled={loading}
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60"
            >
              {loading ? 'Building...' : 'Regenerate Content'}
            </button>
            <button
              type="button"
              onClick={() => downloadAsPdf(resumeDraft || '', activeTheme)}
              disabled={!resumeDraft}
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:opacity-60"
            >
              Download PDF
            </button>
          </div>
        </div>

        <div className="mt-5 grid gap-5 xl:grid-cols-[1.1fr_1fr]">
          <div className="space-y-4">
            <div>
              <p className="mb-2 text-sm font-semibold text-slate-700 dark:text-slate-200">Resume Templates</p>
              <div className="flex flex-wrap gap-2">
                {Object.entries(TEMPLATES).map(([key, tpl]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => applyTemplate(key)}
                    className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                      activeTemplate === key
                        ? 'border-slate-900 bg-slate-900 text-white dark:border-slate-100 dark:bg-slate-100 dark:text-slate-900'
                        : 'border-slate-300 text-slate-700 hover:bg-slate-100 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800'
                    }`}
                  >
                    {tpl.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="mb-2 text-sm font-semibold text-slate-700 dark:text-slate-200">Color Themes</p>
              <div className="flex flex-wrap gap-2">
                {Object.entries(THEMES).map(([key, theme]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setActiveTheme(key)}
                    className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                      activeTheme === key ? 'border-slate-900 dark:border-slate-200' : 'border-slate-300 dark:border-slate-600'
                    }`}
                  >
                    <span className="inline-block h-3 w-3 rounded-full" style={{ backgroundColor: theme.accent }} />
                    {theme.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Editable Resume</p>
                <span className="text-xs text-slate-500">{(resumeDraft || '').split(/\s+/).filter(Boolean).length} words</span>
              </div>
              <textarea
                value={resumeDraft}
                onChange={(event) => setResumeDraft(event.target.value)}
                placeholder="Your generated ATS resume appears here..."
                rows="20"
                className="w-full rounded-xl border border-slate-300 bg-white p-3 font-mono text-sm text-slate-800 shadow-sm outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200 dark:border-slate-700 dark:bg-slate-950/35 dark:text-slate-100"
              />
            </div>

            <div>
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Missing Keywords</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {missingKeywords.slice(0, 16).map((keyword) => (
                  <button
                    key={keyword}
                    type="button"
                    onClick={() => setResumeDraft((current) => `${current}\n- ${keyword}`.trim())}
                    className="rounded-full border border-amber-300 bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800 transition hover:bg-amber-200 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200"
                  >
                    + {keyword}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 p-4 dark:border-slate-700">
            <p className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-200">Live Theme Preview</p>
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="px-4 py-3" style={{ backgroundColor: currentTheme.header }}>
                <p className="text-sm font-bold text-white">FULL NAME</p>
                <p className="text-xs text-white/85">Role | Email | Phone | LinkedIn</p>
              </div>
              <div className="p-4" style={{ backgroundColor: currentTheme.soft }}>
                <p className="mb-1 text-xs font-bold uppercase tracking-wide" style={{ color: currentTheme.accent }}>
                  PROFESSIONAL SUMMARY
                </p>
                <div className="max-h-[420px] overflow-auto rounded-lg bg-white p-3">
                  {previewLines.length ? previewLines.map((line, index) => renderLinePreview(line, index)) : <p className="text-sm text-slate-500">No draft yet.</p>}
                </div>
              </div>
            </div>

            <div className="mt-4">
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Matched Keywords</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {matchedKeywords.slice(0, 20).map((keyword) => (
                  <span key={keyword} className="rounded-full px-3 py-1 text-xs font-semibold" style={{ backgroundColor: currentTheme.soft, color: currentTheme.text }}>
                    {keyword}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Result;
