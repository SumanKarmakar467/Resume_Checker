// Purpose: Resume API client for the single MERN backend (:5000 by default).
const configuredBase = String(import.meta.env.VITE_API_URL || "http://localhost:5000").replace(/\/$/, "");
const API_BASE = `${configuredBase}/api/resume`;

function isRetriableStatus(status) {
  return [404, 405, 500, 502, 503].includes(status);
}

function isNetworkError(error) {
  return error instanceof TypeError || /failed to fetch|networkerror|err_connection_refused/i.test(String(error?.message || ""));
}

async function parseJson(response) {
  try {
    return await response.json();
  } catch (_error) {
    return {};
  }
}

export async function requestResumeApi(path, options = {}) {
  let lastError = null;
  const maxAttempts = 2;

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    try {
      const response = await fetch(`${API_BASE}${path}`, options);
      if (response.ok) {
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
      if (attempt < maxAttempts - 1 && isNetworkError(error)) {
        continue;
      }
    }
  }

  if (lastError && isNetworkError(lastError)) {
    throw new Error("Could not connect to backend. Start backend on port 5000.");
  }

  throw lastError || new Error("Request failed.");
}
