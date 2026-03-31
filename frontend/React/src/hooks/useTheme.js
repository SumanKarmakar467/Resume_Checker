import { useEffect, useState } from 'react';

const THEME_STORAGE_KEY = 'resume_checker_theme';

function getInitialDarkMode() {
  if (typeof window === 'undefined') return false;
  const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
  if (stored === 'dark') return true;
  if (stored === 'light') return false;
  return true;
}

function useTheme() {
  const [isDark, setIsDark] = useState(getInitialDarkMode);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
    window.localStorage.setItem(THEME_STORAGE_KEY, isDark ? 'dark' : 'light');
  }, [isDark]);

  const toggleTheme = () => setIsDark((prev) => !prev);

  return { isDark, toggleTheme };
}

export default useTheme;
