import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import useTheme from '../hooks/useTheme';

const mediaMentions = ['Forbes', 'USA Today', 'CNBC', 'BBC', 'Inc.', 'Yahoo News'];

const prepCards = [
  {
    title: 'Optimize for the Right Keywords',
    text: 'Detect missing role keywords and highlight where to place them naturally in your resume.'
  },
  {
    title: 'Get Data-Driven Suggestions',
    text: 'Receive practical suggestions for summary, skills, and experience based on ATS criteria.'
  },
  {
    title: 'Fix ATS Blocking Formatting',
    text: 'Identify layout and section issues that can reduce parser readability before recruiters see you.'
  }
];

const checksColumns = [
  {
    heading: 'Content',
    points: ['Role customization', 'Spelling and grammar', 'Strong action verbs']
  },
  {
    heading: 'Key Sections',
    points: ['Contact information', 'Professional summary', 'Measurable results']
  },
  {
    heading: 'Structure',
    points: ['ATS-friendly formatting', 'Optimal resume length', 'Complete section coverage']
  }
];

const flowSteps = [
  {
    title: 'Upload Your Resume',
    text: 'Import resume from desktop or mobile in PDF, DOCX, or TXT.'
  },
  {
    title: 'Review ATS Report',
    text: 'See score, matched keywords, missing signals, and section quality.'
  },
  {
    title: 'Improve with Builder',
    text: 'Auto-generate a better draft and refine points with guided suggestions.'
  },
  {
    title: 'Download and Apply',
    text: 'Export polished PDF and apply with higher ATS confidence.'
  }
];

function Landing() {
  const { isDark, toggleTheme } = useTheme();
  const [visibleSections, setVisibleSections] = useState({});
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY || 0);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const elements = Array.from(document.querySelectorAll('.scroll-reveal'));
    if (!elements.length) return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const id = entry.target.getAttribute('data-reveal-id') || '';
          setVisibleSections((current) => ({ ...current, [id]: true }));
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.17 }
    );

    elements.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, []);

  const parallax = useMemo(() => Math.min(scrollY * 0.07, 42), [scrollY]);

  return (
    <main className="theme-page landing-page min-h-screen">
      <div className="landing-bg-layer" aria-hidden="true">
        <span className="landing-bg-orb orb-a" style={{ transform: `translateY(${parallax}px)` }} />
        <span className="landing-bg-orb orb-b" style={{ transform: `translateY(${parallax * -0.4}px)` }} />
        <span className="landing-bg-orb orb-c" style={{ transform: `translateY(${parallax * 0.75}px)` }} />
      </div>

      <div className="mx-auto max-w-6xl px-4 pb-16 pt-6 md:px-8 md:pt-8">
        <header className="landing-nav">
          <div className="landing-brand">
            <span className="brand-icon" />
            <p>ResumeChecker</p>
          </div>

          <nav className="landing-links">
            <a href="#scanner">Scanner</a>
            <a href="#checks">Checks</a>
            <a href="#workflow">Workflow</a>
            <Link to="/login" className="landing-nav-cta">Login</Link>
            <Link to="/register" className="landing-nav-cta alt">Sign Up</Link>
            <button type="button" onClick={toggleTheme} className="theme-toggle">
              {isDark ? 'Light Theme' : 'Dark Theme'}
            </button>
          </nav>
        </header>

        <section className="landing-hero-grid">
          <article className="landing-hero-left">
            <p className="landing-kicker">Free ATS Resume Checker</p>
            <h1 className="landing-headline">Scan and score your resume with actionable fixes in seconds.</h1>
            <p className="landing-subhead">
              Upload your resume, get an ATS score, and improve with guided suggestions so recruiters actually see your application.
            </p>

            <div className="landing-cta-row">
              <Link to="/login" className="theme-button-primary landing-cta-button">Check Your Score</Link>
              <Link to="/register" className="theme-button-secondary landing-cta-button">Create Free Account</Link>
            </div>

            <div className="landing-proof-row">
              <span>30+ scan criteria</span>
              <span>Instant ATS score</span>
              <span>Desktop + Mobile</span>
            </div>
          </article>

          <aside className="landing-hero-right">
            <div className="landing-scan-card card-float-slow">
              <p className="stat-label">Scanning your file...</p>
              <div className="scan-dropzone">
                <p>Upload or drag resume</p>
                <small>PDF, DOCX, TXT (max 5MB)</small>
              </div>

              <ul className="scan-checklist">
                <li>Organizing contact details</li>
                <li>Checking keyword relevance</li>
                <li>Reviewing structure & formatting</li>
                <li>Scoring overall ATS readiness</li>
              </ul>

              <button type="button" className="theme-button-primary w-full">Check Your Score</button>
            </div>
          </aside>
        </section>

        <section className="landing-trust-strip">
          <p>As seen in</p>
          <div>
            {mediaMentions.map((brand) => (
              <span key={brand}>{brand}</span>
            ))}
          </div>
        </section>

        <section
          id="scanner"
          data-reveal-id="scanner"
          className={`landing-section scroll-reveal ${visibleSections.scanner ? 'is-visible' : ''}`}
        >
          <div className="section-header">
            <p className="section-kicker">Is Your Resume Ready for ATS?</p>
            <h2>Improve your score before applying to jobs.</h2>
            <p>
              Applicant tracking systems scan for section quality, formatting, and role keywords. This checker helps you fix issues quickly.
            </p>
          </div>

          <div className="feature-grid">
            {prepCards.map((card) => (
              <article key={card.title} className="feature-card">
                <h3>{card.title}</h3>
                <p>{card.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section
          id="checks"
          data-reveal-id="checks"
          className={`landing-section scroll-reveal ${visibleSections.checks ? 'is-visible' : ''}`}
        >
          <div className="section-header">
            <p className="section-kicker">What Scanner Checks</p>
            <h2>Clear report across content, sections, and structure.</h2>
          </div>

          <div className="checks-grid">
            {checksColumns.map((column) => (
              <article key={column.heading} className="checks-column">
                <h3>{column.heading}</h3>
                <ul>
                  {column.points.map((point) => (
                    <li key={point}>{point}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </section>

        <section
          id="workflow"
          data-reveal-id="workflow"
          className={`landing-section scroll-reveal ${visibleSections.workflow ? 'is-visible' : ''}`}
        >
          <div className="section-header">
            <p className="section-kicker">How It Works</p>
            <h2>Simple 4-step flow from upload to apply.</h2>
          </div>

          <div className="process-grid">
            {flowSteps.map((step, index) => (
              <article key={step.title} className="process-card">
                <span>{`0${index + 1}`}</span>
                <h4>{step.title}</h4>
                <p>{step.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section
          data-reveal-id="final"
          className={`landing-section scroll-reveal ${visibleSections.final ? 'is-visible' : ''}`}
        >
          <div className="auth-lock-banner">
            <div>
              <p className="section-kicker">Get Started</p>
              <h2>Log in or sign up to use the ATS checker and resume generator.</h2>
              <p>The tool is protected and available after authentication.</p>
            </div>

            <div className="landing-cta-row">
              <Link to="/login" className="theme-button-primary landing-cta-button">Login</Link>
              <Link to="/register" className="theme-button-secondary landing-cta-button">Sign Up</Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

export default Landing;
