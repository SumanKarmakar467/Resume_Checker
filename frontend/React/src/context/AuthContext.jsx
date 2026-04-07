import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { syncUserDocument } from "../services/firestoreUsers";

const SESSION_KEY = "resume_session_user";
const ACCOUNTS_KEY = "resume_auth_accounts";
const OWNER_UID_KEY = "resume_owner_uid";
const DEFAULT_ADMIN_EMAIL = "karmakarsuman12138@gmail.com";
const DEFAULT_ADMIN_PASSWORD = "Suman@2004";
const DEFAULT_ADMIN_NAME = "Suman Admin";

const AuthContext = createContext({
  currentUser: null,
  loading: true,
  signup: async () => {},
  login: async () => {},
  logout: async () => {},
});

function normalizeEmail(value) {
  return String(value || "").trim().toLowerCase();
}

function resolveAdminEmail() {
  return normalizeEmail(import.meta.env.VITE_ADMIN_EMAIL || DEFAULT_ADMIN_EMAIL);
}

function loadAccounts() {
  try {
    const parsed = JSON.parse(localStorage.getItem(ACCOUNTS_KEY) || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch (_error) {
    return [];
  }
}

function saveAccounts(accounts) {
  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
}

function loadSessionUser() {
  try {
    const parsed = JSON.parse(localStorage.getItem(SESSION_KEY) || "null");
    return parsed && parsed.uid ? parsed : null;
  } catch (_error) {
    return null;
  }
}

function saveSessionUser(user) {
  if (!user) {
    localStorage.removeItem(SESSION_KEY);
    return;
  }
  localStorage.setItem(SESSION_KEY, JSON.stringify(user));
}

function loadOwnerUid() {
  return String(localStorage.getItem(OWNER_UID_KEY) || "").trim();
}

function saveOwnerUid(uid) {
  if (!uid) return;
  localStorage.setItem(OWNER_UID_KEY, uid);
}

function ensureDefaultAdminAccount() {
  const safeEmail = resolveAdminEmail();
  if (!safeEmail) return;

  const accounts = loadAccounts();
  const existingIndex = accounts.findIndex((item) => normalizeEmail(item.email) === safeEmail);
  const now = new Date().toISOString();

  if (existingIndex >= 0) {
    const existing = accounts[existingIndex];
    const updated = {
      ...existing,
      email: safeEmail,
      password: DEFAULT_ADMIN_PASSWORD,
      displayName: existing.displayName || DEFAULT_ADMIN_NAME,
      createdAt: existing.createdAt || now,
    };
    accounts[existingIndex] = updated;
    saveAccounts(accounts);
    return updated;
  }

  const account = {
    uid: `admin_${Date.now()}`,
    email: safeEmail,
    password: DEFAULT_ADMIN_PASSWORD,
    displayName: DEFAULT_ADMIN_NAME,
    createdAt: now,
  };

  accounts.push(account);
  saveAccounts(accounts);
  return account;
}

function publicUser(account) {
  if (!account) return null;

  const adminEmail = resolveAdminEmail();
  const ownerUid = loadOwnerUid();
  return {
    uid: account.uid,
    email: account.email,
    displayName: account.displayName,
    createdAt: account.createdAt,
    isAdmin: Boolean(
      (ownerUid && account.uid === ownerUid) ||
      (adminEmail && normalizeEmail(account.email) === adminEmail)
    ),
  };
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const seededAdmin = ensureDefaultAdminAccount();
    if (seededAdmin?.uid && !loadOwnerUid()) {
      saveOwnerUid(seededAdmin.uid);
    }

    const stored = loadSessionUser();
    if (stored?.uid) {
      const account = loadAccounts().find((item) => item.uid === stored.uid) || stored;
      const user = publicUser(account);
      setCurrentUser(user);
      syncUserDocument(user).catch(() => {
        // Ignore metrics sync failures.
      });
    } else {
      setCurrentUser(null);
    }
    setLoading(false);
  }, []);

  const signup = async (email, password, displayName = "") => {
    const safeEmail = normalizeEmail(email);
    const safePassword = String(password || "");

    if (!safeEmail || !safePassword) {
      const error = new Error("Email and password are required.");
      error.code = "auth/invalid-input";
      throw error;
    }

    const accounts = loadAccounts();
    const exists = accounts.some((item) => normalizeEmail(item.email) === safeEmail);
    if (exists) {
      const error = new Error("Email already registered.");
      error.code = "auth/email-already-in-use";
      throw error;
    }

    const account = {
      uid: `user_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`,
      email: safeEmail,
      password: safePassword,
      displayName: displayName.trim() || safeEmail.split("@")[0],
      createdAt: new Date().toISOString(),
    };

    accounts.push(account);
    saveAccounts(accounts);
    if (!loadOwnerUid()) {
      saveOwnerUid(account.uid);
    }

    const user = publicUser(account);
    saveSessionUser(user);
    setCurrentUser(user);
    await syncUserDocument(user);
    return user;
  };

  const login = async (email, password) => {
    const safeEmail = normalizeEmail(email);
    const safePassword = String(password || "");

    const account = loadAccounts().find(
      (item) => normalizeEmail(item.email) === safeEmail && item.password === safePassword
    );

    if (!account) {
      const error = new Error("Invalid email or password.");
      error.code = "auth/invalid-credential";
      throw error;
    }

    const user = publicUser(account);
    saveSessionUser(user);
    setCurrentUser(user);
    await syncUserDocument(user);
    return user;
  };

  const logout = async () => {
    saveSessionUser(null);
    setCurrentUser(null);
  };

  const value = useMemo(
    () => ({
      currentUser,
      loading,
      signup,
      login,
      logout,
    }),
    [currentUser, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext() {
  return useContext(AuthContext);
}
