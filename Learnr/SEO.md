# Frontend SEO (Learnr)

This file documents the SEO assets and scripts kept inside the `frontend/` project.

What lives here
- `public/sitemap.xml` and `public/robots.txt` — served at the site root when the frontend is deployed.
- `public/og-image.svg` and `public/logo.svg` — social preview images used by Open Graph / Twitter cards.
- `scripts/generate-sitemap.js` — small Node script to generate `public/sitemap.xml` from `seo/paths.json` or from `package.json` `homepage` / `BASE_URL` env.
- `seo/paths.json` — a configurable list of static paths to include in the sitemap. For dynamic content (decks/threads) the script can be extended to fetch entries from the backend.

How to generate the sitemap locally

```bash
cd frontend
npm run generate-sitemap
```

Notes
- Replace all `https://your-domain.com` placeholders with your production domain before submitting the sitemap to search engines.
- For dynamic content, extend `scripts/generate-sitemap.js` to fetch indexes (e.g. `/api/public-decks`) and append them to the `paths` array before writing the XML.
