import { useEffect } from 'react';

function upsertMetaByName(name, content) {
  if (!content) return;
  let el = document.head.querySelector(`meta[name="${name}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute('name', name);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function upsertMetaByProperty(prop, content) {
  if (!content) return;
  let el = document.head.querySelector(`meta[property="${prop}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute('property', prop);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

export default function Meta({ title, description, keywords, image, url }) {
  useEffect(() => {
    if (title) document.title = title;

    upsertMetaByName('description', description || '');
    upsertMetaByName('keywords', Array.isArray(keywords) ? keywords.join(', ') : (keywords || ''));

    upsertMetaByProperty('og:title', title || document.title);
    upsertMetaByProperty('og:description', description || '');
    upsertMetaByProperty('og:image', image || '');
    upsertMetaByProperty('og:url', url || window.location.href);

    upsertMetaByName('twitter:title', title || document.title);
    upsertMetaByName('twitter:description', description || '');
    upsertMetaByName('twitter:image', image || '');

    if (url) {
      let link = document.head.querySelector('link[rel="canonical"]');
      if (!link) {
        link = document.createElement('link');
        link.setAttribute('rel', 'canonical');
        document.head.appendChild(link);
      }
      link.setAttribute('href', url);
    }
  }, [title, description, keywords, image, url]);

  return null;
}
