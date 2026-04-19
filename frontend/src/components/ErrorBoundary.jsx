// Purpose: Provide a friendly fallback UI for runtime and unhandled API errors.
import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, message: '' };
    this.handleUnhandledRejection = this.handleUnhandledRejection.bind(this);
    this.handleWindowError = this.handleWindowError.bind(this);
  }

  static getDerivedStateFromError() {
    return { hasError: true, message: 'Something went wrong. Please refresh and try again.' };
  }

  componentDidMount() {
    window.addEventListener('unhandledrejection', this.handleUnhandledRejection);
    window.addEventListener('error', this.handleWindowError);
  }

  componentWillUnmount() {
    window.removeEventListener('unhandledrejection', this.handleUnhandledRejection);
    window.removeEventListener('error', this.handleWindowError);
  }

  componentDidCatch(error) {
    // Keep the UI response generic and do not expose stack traces to users.
    const message = this.extractFriendlyMessage(error);
    this.setState({ hasError: true, message });
  }

  handleUnhandledRejection(event) {
    const reason = event?.reason;
    const message = this.extractFriendlyMessage(reason);
    this.setState({ hasError: true, message });
  }

  handleWindowError(event) {
    const message = this.extractFriendlyMessage(event?.error || event?.message);
    this.setState({ hasError: true, message });
  }

  extractFriendlyMessage(source) {
    const apiMessage =
      source?.response?.data?.error ||
      source?.response?.data?.message ||
      source?.message ||
      (typeof source === 'string' ? source : '');

    if (apiMessage && apiMessage.trim()) {
      return `Request failed: ${apiMessage.trim()}`;
    }
    return 'Something went wrong. Please refresh and try again.';
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="theme-page min-h-screen px-4 py-10">
          <div className="mx-auto max-w-2xl">
            <section className="theme-card p-6">
              <h1 className="text-2xl font-extrabold">We hit an unexpected issue</h1>
              <p className="theme-muted mt-2 text-sm">{this.state.message}</p>
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="theme-button-primary mt-4 rounded-xl px-4 py-2 text-sm font-semibold text-white"
              >
                Reload
              </button>
            </section>
          </div>
        </main>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
