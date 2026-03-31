const USERS_KEY = "resume_users_metrics";

function loadUsersMap() {
  try {
    const parsed = JSON.parse(localStorage.getItem(USERS_KEY) || "{}");
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch (_error) {
    return {};
  }
}

function saveUsersMap(value) {
  localStorage.setItem(USERS_KEY, JSON.stringify(value));
}

function nowIso() {
  return new Date().toISOString();
}

export async function syncUserDocument(user) {
  if (!user?.uid) return;

  const users = loadUsersMap();
  const existing = users[user.uid] || {};

  users[user.uid] = {
    uid: user.uid,
    email: user.email || existing.email || "",
    displayName: user.displayName || existing.displayName || "User",
    createdAt: existing.createdAt || user.createdAt || nowIso(),
    lastActive: nowIso(),
    resumesChecked: Number.isFinite(existing.resumesChecked) ? existing.resumesChecked : 0,
    resumesGenerated: Number.isFinite(existing.resumesGenerated) ? existing.resumesGenerated : 0,
  };

  saveUsersMap(users);
}

export async function incrementUserCounter(uid, fieldName) {
  if (!uid || !["resumesChecked", "resumesGenerated"].includes(fieldName)) return;

  const users = loadUsersMap();
  const existing = users[uid] || {
    uid,
    email: "",
    displayName: "User",
    createdAt: nowIso(),
    resumesChecked: 0,
    resumesGenerated: 0,
  };

  existing[fieldName] = Number(existing[fieldName] || 0) + 1;
  existing.lastActive = nowIso();
  users[uid] = existing;

  saveUsersMap(users);
}

export async function fetchAllUsers() {
  const users = loadUsersMap();
  return Object.values(users);
}
