// Purpose: Display one AI suggestion with copy action for improved line.
import { useState } from 'react';

function SuggestionCard({ suggestion }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const text = suggestion?.improved_line || suggestion?.improvedLine || '';
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch (_) {
      setCopied(false);
    }
  };

  const weakLine = suggestion?.weak_line || suggestion?.weakLine || '';
  const improvedLine = suggestion?.improved_line || suggestion?.improvedLine || '';
  const reason = suggestion?.reason || '';

  return (
    <article className="rounded-2xl border border-[var(--border-color)] bg-[var(--surface-soft)] p-4">
      <div className="space-y-2">
        <div className="rounded-xl border border-rose-200 bg-rose-50/80 p-3 dark:border-rose-900/60 dark:bg-rose-950/30">
          <p className="text-xs font-bold uppercase tracking-wide text-rose-700 dark:text-rose-200">Current</p>
          <p className="mt-1 text-sm">{weakLine || 'No weak line provided.'}</p>
        </div>

        <div className="rounded-xl border border-emerald-200 bg-emerald-50/80 p-3 dark:border-emerald-900/60 dark:bg-emerald-950/30">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-bold uppercase tracking-wide text-emerald-700 dark:text-emerald-200">Suggested</p>
            <button
              type="button"
              onClick={handleCopy}
              className="theme-button-secondary rounded-lg px-2 py-1 text-xs font-semibold"
            >
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
          <p className="mt-1 text-sm">{improvedLine || 'No improved line provided.'}</p>
        </div>
      </div>
      <p className="theme-muted mt-3 text-sm">{reason || 'No reason provided.'}</p>
    </article>
  );
}

export default SuggestionCard;
