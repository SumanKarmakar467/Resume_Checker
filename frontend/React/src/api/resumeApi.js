// Purpose: Resume API client for the single MERN backend (:5000 by default).
const configuredBase = String(import.meta.env.VITE_API_URL || "http://localhost:5000").replace(/\/$/, "");
const API_BASE = `${configuredBase}/api/resume`;
const REQUEST_TIMEOUT_MS = Number(import.meta.env.VITE_API_TIMEOUT_MS || 20000);

function isRetriableStatus(status) {
  return [404, 405, 500, 502, 503].includes(status);
}

function isNetworkError(error) {
  return (
    error instanceof TypeError ||
    /failed to fetch|networkerror|err_connection_refused|network request failed/i.test(String(error?.message || ""))
  );
}

function isTimeoutError(error) {
  return error?.name === "AbortError";
}

async function parseJson(response) {
  try {
    return await response.json();
  } catch (_error) {
    return {};
  }
}

function buildApiUrl(path, query) {
  const base = `${API_BASE}${path}`;
  if (!query || typeof query !== "object") return base;

  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value === null || value === undefined || value === "") return;
    params.set(key, String(value));
  });

  const queryString = params.toString();
  return queryString ? `${base}?${queryString}` : base;
}

export async function requestResumeApi(path, options = {}) {
  const { query, ...fetchOptions } = options;
  let lastError = null;
  const maxAttempts = 2;

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    let timeoutId = null;
    const controller = new AbortController();
    try {
      timeoutId = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
      const response = await fetch(buildApiUrl(path, query), {
        ...fetchOptions,
        signal: fetchOptions.signal || controller.signal,
      });

      if (response.ok) {
        window.clearTimeout(timeoutId);
        return parseJson(response);
      }

      const payload = await parseJson(response);
      const message = payload.error || `Server error: ${response.status}`;

      if (attempt < maxAttempts - 1 && isRetriableStatus(response.status)) {
        continue;
      }

      throw new Error(message);
    } catch (error) {
      lastError = error;
      if (timeoutId !== null) {
        window.clearTimeout(timeoutId);
      }
      if (attempt < maxAttempts - 1 && isNetworkError(error)) {
        continue;
      }
    }
  }

  if (lastError && isTimeoutError(lastError)) {
    throw new Error("Request timed out. Please try again.");
  }

  if (lastError && isNetworkError(lastError)) {
    throw new Error("Could not connect to backend. Start backend on port 5000.");
  }

  throw lastError || new Error("Request failed.");
}

export function requestHistory(options = {}) {
  const { limit = 25, includeText = false } = options;
  return requestResumeApi("/history", {
    query: {
      limit,
      includeText: includeText ? "1" : "0",
    },
  });
}
