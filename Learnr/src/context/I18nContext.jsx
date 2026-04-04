import { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import { hasLanguageLoader, loadLanguageResources } from '../i18n/loadLanguageResources';

export const UI_LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Espanol' },
  { code: 'fr', label: 'Francais' },
  { code: 'de', label: 'Deutsch' },
  { code: 'zh', label: 'Chinese' },
  { code: 'tr', label: 'Turkish' },
  { code: 'ar', label: 'Arabic' },
];

const STORAGE_KEY = 'learnr.uiLanguage';

export const I18nContext = createContext(null);

function getByPath(obj, path) {
  return String(path || '')
    .split('.')
    .reduce((acc, key) => (acc && Object.prototype.hasOwnProperty.call(acc, key) ? acc[key] : undefined), obj);
}

export function I18nProvider({ children }) {
  const [resources, setResources] = useState({});
  const [language, setLanguageState] = useState(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && UI_LANGUAGES.some((l) => l.code === stored)) return stored;
    const browser = (navigator.language || 'en').toLowerCase().split('-')[0];
    if (UI_LANGUAGES.some((l) => l.code === browser)) return browser;
    return 'en';
  });

  const setLanguage = useCallback((nextLanguage) => {
    if (hasLanguageLoader(nextLanguage)) {
      setLanguageState(nextLanguage);
      return;
    }
    setLanguageState('en');
  }, []);

  useEffect(() => {
    let cancelled = false;

    loadLanguageResources(language)
      .then((loaded) => {
        if (!cancelled) {
          setResources((prev) => ({ ...prev, [language]: loaded || {} }));
        }
      })
      .catch(() => {
        if (!cancelled) {
          setResources((prev) => ({ ...prev, [language]: {} }));
        }
      });

    return () => {
      cancelled = true;
    };
  }, [language]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, language);
    document.documentElement.setAttribute('lang', language);
  }, [language]);

  const value = useMemo(() => ({
    language,
    setLanguage,
    languages: UI_LANGUAGES,
    t: (key, fallback, vars) => {
      const localized = getByPath(resources[language] || {}, key);
      const base = typeof localized === 'string' ? localized : (typeof fallback === 'string' ? fallback : key);
      if (!vars || typeof base !== 'string') return base;
      return Object.entries(vars).reduce((acc, [name, val]) => acc.replaceAll(`{${name}}`, String(val)), base);
    },
  }), [language, resources, setLanguage]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}
