import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import useTheme from '../hooks/useTheme';

const featureItems = [
  {
    title: 'ATS Intelligence',
    text: 'Get a clear ATS score, section-wise diagnostics, and missing keyword signals before you apply.'
  },
  {
    title: 'Auto Resume Extraction',
    text: 'Upload PDF, DOCX, or TXT and auto-fill your profile with projects, skills, education, and contact details.'
  },
  {
    title: 'Recruiter-Ready Generation',
    text: 'Generate a cleaner, more impactful resume draft with role-fit suggestions and instant PDF download.'
  }
];

const processItems = [
  'Upload resume + job description',
  'Review ATS score and improvement hints',
  'Generate polished resume and export'
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
      { threshold: 0.2 }
    );

    elements.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, []);

  const floatOffset = useMemo(() => Math.min(scrollY * 0.08, 48), [scrollY]);

  return (
    <main className="theme-page landing-page min-h-screen">
      <div className="landing-bg-layer" aria-hidden="true">
        <span className="landing-bg-orb orb-a" style={{ transform: `translateY(${floatOffset}px)` }} />
        <span className="landing-bg-orb orb-b" style={{ transform: `translateY(${floatOffset * -0.45}px)` }} />
        <span className="landing-bg-orb orb-c" style={{ transform: `translateY(${floatOffset * 0.7}px)` }} />
      </div>

      <div className="mx-auto max-w-6xl px-4 pb-14 pt-6 md:px-8 md:pt-8">
        <header className="landing-nav">
          <div className="landing-brand">
            <span className="brand-icon" />
            <p>ResumeChecker</p>
          </div>

          <nav className="landing-links">
            <a href="#features">Features</a>
            <a href="#workflow">Workflow</a>
            <a href="#access">Access</a>
            <button type="button" onClick={toggleTheme} className="theme-toggle">
              {isDark ? 'Light Theme' : 'Dark Theme'}
            </button>
          </nav>
        </header>

        <section className="landing-hero-grid">
          <article className="landing-hero-left">
            <p className="landing-kicker">AI Resume Platform</p>
            <h1 className="landing-headline">
              Build a resume that passes ATS and still feels strong to recruiters.
            </h1>
            <p className="landing-subhead">
              Start with authentication, then use ATS analytics, auto-extraction, and guided generation in one workflow.
            </p>

            <div className="landing-cta-row">
              <Link to="/login" className="theme-button-primary landing-cta-button">Log In</Link>
              <Link to="/register" className="theme-button-secondary landing-cta-button">Sign Up</Link>
            </div>

            <div className="landing-mini-proof">
              <span>Animated UI</span>
              <span>Scroll Effects</span>
              <span>Auth Protected</span>
            </div>
          </article>

          <aside className="landing-hero-right">
            <div className="landing-glass-card card-float-slow">
              <p className="stat-label">Sample ATS Score</p>
              <p className="stat-value">89 / 100</p>
              <div className="stat-bars">
                <span style={{ width: '89%' }} />
              </div>
              <p className="stat-note">Role fit: Frontend Developer</p>
            </div>

            <div className="landing-glass-card card-float-fast">
              <p className="stat-label">Missing Keywords</p>
              <div className="keyword-row">
                <span>typescript</span>
                <span>accessibility</span>
                <span>testing</span>
              </div>
              <p className="stat-note">Auto suggestions generate improvements.</p>
            </div>
          </aside>
        </section>

        <section
          id="features"
          data-reveal-id="features"
          className={`landing-section scroll-reveal ${visibleSections.features ? 'is-visible' : ''}`}
        >
          <div className="section-header">
            <p className="section-kicker">Core Features</p>
            <h2>Fully animated frontpage with practical resume workflows.</h2>
          </div>

          <div className="feature-grid">
            {featureItems.map((feature) => (
              <article key={feature.title} className="feature-card">
                <h3>{feature.title}</h3>
                <p>{feature.text}</p>
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
            <p className="section-kicker">Workflow</p>
            <h2>Scroll-driven experience from login to final resume download.</h2>
          </div>

          <div className="process-grid">
            {processItems.map((item, index) => (
              <article key={item} className="process-card">
                <span>{`0${index + 1}`}</span>
                <p>{item}</p>
              </article>
            ))}
          </div>
        </section>

        <section
          id="access"
          data-reveal-id="access"
          className={`landing-section scroll-reveal ${visibleSections.access ? 'is-visible' : ''}`}
        >
          <div className="auth-lock-banner">
            <div>
              <p className="section-kicker">Access Control</p>
              <h2>Log in or sign up first. Then use the full website tools.</h2>
              <p>Authentication is required before accessing ATS checker and resume generator.</p>
            </div>

            <div className="landing-cta-row">
              <Link to="/login" className="theme-button-primary landing-cta-button">Go to Login</Link>
              <Link to="/register" className="theme-button-secondary landing-cta-button">Create Account</Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

export default Landing;
