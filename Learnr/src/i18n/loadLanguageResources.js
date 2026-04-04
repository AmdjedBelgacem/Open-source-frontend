const loaders = {
  en: () => import('./resources/en.json'),
  es: () => import('./resources/es.json'),
  fr: () => import('./resources/fr.json'),
  de: () => import('./resources/de.json'),
  zh: () => import('./resources/zh.json'),
  tr: () => import('./resources/tr.json'),
  ar: () => import('./resources/ar.json'),
};

const cache = new Map();

export function hasLanguageLoader(code) {
  return Boolean(loaders[code]);
}

export async function loadLanguageResources(code) {
  const lang = hasLanguageLoader(code) ? code : 'en';

  if (cache.has(lang)) {
    return cache.get(lang);
  }

  const loader = loaders[lang];
  const module = await loader();
  const data = module?.default || {};
  cache.set(lang, data);
  return data;
}
