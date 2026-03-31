import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { syncUserDocument } from "../services/firestoreUsers";

const SESSION_KEY = "resume_session_user";
const ACCOUNTS_KEY = "resume_auth_accounts";

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

function publicUser(account) {
  if (!account) return null;

  const adminEmail = normalizeEmail(import.meta.env.VITE_ADMIN_EMAIL);
  return {
    uid: account.uid,
    email: account.email,
    displayName: account.displayName,
    createdAt: account.createdAt,
    isAdmin: Boolean(adminEmail && normalizeEmail(account.email) === adminEmail),
  };
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = loadSessionUser();
    setCurrentUser(stored);
    if (stored) {
      syncUserDocument(stored).catch(() => {
        // Ignore metrics sync failures.
      });
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
