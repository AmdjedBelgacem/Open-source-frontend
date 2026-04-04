import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

const ThemeContext = createContext();

const THEME_KEY = 'learnr:theme';
const DARK = 'dark';
const LIGHT = 'light';

/**
 * Detects initial theme: localStorage override > system preference > default to dark
 */
function getInitialTheme() {
  // Check localStorage for user override
  const stored = localStorage.getItem(THEME_KEY);
  if (stored === LIGHT || stored === DARK) {
    return stored;
  }

  // Check system preference
  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
    return LIGHT;
  }

  // Default to dark
  return DARK;
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(getInitialTheme);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  // Listen for system theme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: light)');
    const handleChange = (e) => {
      const stored = localStorage.getItem(THEME_KEY);
      // Only auto-update if user hasn't manually overridden
      if (stored === null) {
        const newTheme = e.matches ? LIGHT : DARK;
        setTheme(newTheme);
        applyTheme(newTheme);
      }
    };

    // Modern browsers
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      const newTheme = prev === DARK ? LIGHT : DARK;
      applyTheme(newTheme);
      localStorage.setItem(THEME_KEY, newTheme);
      return newTheme;
    });
  }, []);

  const clearThemeOverride = useCallback(() => {
    localStorage.removeItem(THEME_KEY);
    const newTheme = getInitialTheme();
    setTheme(newTheme);
    applyTheme(newTheme);
  }, []);

  const value = useMemo(() => ({ theme, toggleTheme, clearThemeOverride }), [theme, toggleTheme, clearThemeOverride]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

/**
 * Hook to access theme context
 */
export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

/**
 * Apply theme by setting data-theme attribute on document root
 */
function applyTheme(themeName) {
  const html = document.documentElement;
  if (themeName === LIGHT) {
    html.setAttribute('data-theme', LIGHT);
  } else {
    html.removeAttribute('data-theme');
  }
}
