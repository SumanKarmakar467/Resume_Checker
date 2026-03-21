// Purpose: Manage auth token storage and helpers for React components.
import { useEffect, useState } from 'react';

const TOKEN_KEY = 'resume_checker_token';

export const getStoredToken = () => {
  if (typeof window === 'undefined') return '';
  return window.localStorage.getItem(TOKEN_KEY) || '';
};

export const storeToken = (token) => {
  if (typeof window === 'undefined') return;
  if (token) window.localStorage.setItem(TOKEN_KEY, token);
};

export const clearStoredToken = () => {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(TOKEN_KEY);
};

function useAuth() {
  const [token, setToken] = useState(getStoredToken());

  useEffect(() => {
    const handleStorage = () => setToken(getStoredToken());
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const login = (newToken) => {
    storeToken(newToken);
    setToken(newToken || '');
  };

  const logout = () => {
    clearStoredToken();
    setToken('');
  };

  return {
    token,
    isAuthenticated: Boolean(token),
    login,
    logout
  };
}

export default useAuth;
