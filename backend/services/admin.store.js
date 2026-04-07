const users = new Map();
const analyses = [];
const builds = [];

function toId(prefix) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function nowIso() {
  return new Date().toISOString();
}

function normalizeEmail(value) {
  const email = String(value || '').trim().toLowerCase();
  return email || 'anonymous';
}

function upsertUser(email) {
  const key = normalizeEmail(email);
  const existing = users.get(key);
  if (existing) {
    const updated = { ...existing, lastActiveAt: nowIso() };
    users.set(key, updated);
    return updated;
  }

  const created = {
    id: toId('usr'),
    email: key,
    createdAt: nowIso(),
    lastActiveAt: nowIso(),
  };
  users.set(key, created);
  return created;
}

function addAnalysis(payload = {}) {
  const item = {
    id: toId('analysis'),
    userEmail: normalizeEmail(payload.userEmail),
    filename: String(payload.filename || ''),
    jobDescription: String(payload.jobDescription || ''),
    atsScore: Number.isFinite(Number(payload.atsScore)) ? Number(payload.atsScore) : 0,
    analyzedAt: payload.analyzedAt || nowIso(),
  };

  analyses.unshift(item);
  return item;
}

function addBuild(payload = {}) {
  const item = {
    id: toId('build'),
    userEmail: normalizeEmail(payload.userEmail),
    templateName: String(payload.templateName || ''),
    builtAt: payload.builtAt || nowIso(),
    downloadCount: Number.isFinite(Number(payload.downloadCount)) ? Number(payload.downloadCount) : 0,
  };

  builds.unshift(item);
  return item;
}

function incrementBuildDownload(buildId) {
  const index = builds.findIndex((item) => item.id === buildId);
  if (index < 0) return null;
  builds[index] = {
    ...builds[index],
    downloadCount: Number(builds[index].downloadCount || 0) + 1,
  };
  return builds[index];
}

function getUsers() {
  return Array.from(users.values()).sort(
    (a, b) => new Date(b.lastActiveAt).getTime() - new Date(a.lastActiveAt).getTime()
  );
}

function getAnalyses() {
  return [...analyses].sort((a, b) => new Date(b.analyzedAt).getTime() - new Date(a.analyzedAt).getTime());
}

function getBuilds() {
  return [...builds].sort((a, b) => new Date(b.builtAt).getTime() - new Date(a.builtAt).getTime());
}

module.exports = {
  normalizeEmail,
  upsertUser,
  addAnalysis,
  addBuild,
  incrementBuildDownload,
  getUsers,
  getAnalyses,
  getBuilds,
};
