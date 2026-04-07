// Purpose: Resume and admin API clients for the backend (:5000 by default).
const configuredBase = String(import.meta.env.VITE_API_URL || "http://localhost:5000").replace(/\/$/, "");
const RESUME_API_BASE = `${configuredBase}/api/resume`;
const ADMIN_API_BASE = `${configuredBase}/api/admin`;
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

function buildApiUrl(base, path, query) {
  const normalizedPath = String(path || "").startsWith("/") ? String(path || "") : `/${String(path || "")}`;
  const url = `${base}${normalizedPath}`;
  if (!query || typeof query !== "object") return url;

  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value === null || value === undefined || value === "") return;
    params.set(key, String(value));
  });

  const queryString = params.toString();
  return queryString ? `${url}?${queryString}` : url;
}

async function requestApi(base, path, options = {}) {
  const { query, ...fetchOptions } = options;
  let lastError = null;
  const maxAttempts = 2;

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    let timeoutId = null;
    const controller = new AbortController();
    try {
      timeoutId = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
      const response = await fetch(buildApiUrl(base, path, query), {
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

export function requestResumeApi(path, options = {}) {
  return requestApi(RESUME_API_BASE, path, options);
}

export function requestAdminApi(path, options = {}) {
  return requestApi(ADMIN_API_BASE, path, options);
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

export function requestParseBuilderResume(formData) {
  return requestResumeApi("/parse-builder", {
    method: "POST",
    body: formData,
  });
}

export function requestGenerateStructuredResume(payload) {
  return requestResumeApi("/generate-ats", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export function markBuildDownload(buildId, userEmail = "") {
  return requestResumeApi(`/builds/${buildId}/download`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userEmail }),
  });
}

export function fetchAdminUsers() {
  return requestAdminApi("/users");
}

export function fetchAdminAnalyses() {
  return requestAdminApi("/analyses");
}

export function fetchAdminBuilds() {
  return requestAdminApi("/builds");
}
