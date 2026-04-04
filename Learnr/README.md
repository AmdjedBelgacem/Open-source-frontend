# Learnr — Frontend

**Repository:** https://github.com/open-source-frontend/Learnr

This folder contains the Learnr web client built with React and Vite.

Quickstart

1. Install dependencies

```bash
cd frontend
npm install
```

2. Run locally

```bash
npm run dev
```

Build and preview

```bash
npm run build
npm run preview
```

Testing

- Unit tests: `npm run test:unit`
- E2E tests (Playwright): `npm run test:e2e`

SEO & sitemap

- The frontend serves `public/robots.txt` and `public/sitemap.xml` at the site root when deployed.
- Generate or regenerate the sitemap locally with:

```bash
npm run generate-sitemap
```

Note: if you also run the backend dynamic sitemap generator (for public decks), `frontend/scripts/generate-sitemap.js` will merge `public/sitemap_decks.xml` into the generated `sitemap.xml`.

Where to look

- Frontend entry: `frontend/src/main.jsx`
- Routes and pages: `frontend/src/App.jsx` and `frontend/src/app/pages/`
- SEO assets: `frontend/public/` (logo, og-image.svg, sitemap.xml, robots.txt)

Environment

- Provide any environment variables (e.g. `BASE_URL`) as needed for builds or sitemap generation. See `frontend/package.json` for scripts.

License

This project is licensed under the MIT License — see the repository `LICENSE` at the project root.
