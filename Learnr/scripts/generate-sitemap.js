#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const pkgPath = path.join(rootDir, 'package.json');
let homepage = process.env.BASE_URL;

try {
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  homepage = homepage || pkg.homepage || 'https://your-domain.com';
} catch (err) {
  homepage = homepage || 'https://your-domain.com';
}

const seoPathsFile = path.join(rootDir, 'seo', 'paths.json');
let paths = ['/', '/pricing', '/login', '/signup', '/app/generate', '/app/decks', '/app/public-decks', '/app/studyhub'];
if (fs.existsSync(seoPathsFile)) {
  try {
    const data = JSON.parse(fs.readFileSync(seoPathsFile, 'utf8'));
    paths = data.paths || paths;
  } catch (err) {
    console.warn('Could not parse seo/paths.json, using defaults');
  }
}

const lastmod = new Date().toISOString().slice(0, 10);

const urlItems = paths.map((p) => {
  const loc = homepage.replace(/\/$/, '') + (p.startsWith('/') ? p : '/' + p);
  return `  <url>\n    <loc>${loc}</loc>\n    <changefreq>weekly</changefreq>\n    <priority>0.7</priority>\n    <lastmod>${lastmod}</lastmod>\n  </url>`;
}).join('\n');

const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urlItems}\n</urlset>\n`;

const outDir = path.join(rootDir, 'public');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
const outPath = path.join(outDir, 'sitemap.xml');
// If backend created a dynamic decks sitemap, merge its <url> entries to the static sitemap
const dynamicSitemapPath = path.join(outDir, 'sitemap_decks.xml');
let finalXml = xml;
if (fs.existsSync(dynamicSitemapPath)) {
  try {
    const dyn = fs.readFileSync(dynamicSitemapPath, 'utf8');
    // extract <url>...</url> blocks
    const urlBlocks = dyn.match(/<url>[\s\S]*?<\/url>/g) || [];

    // build a set of existing locs to avoid duplicates
    const existingLocs = new Set((urlItems.match(/<loc>(.*?)<\/loc>/g) || []).map(s => s.replace(/<loc>|<\/loc>/g, '').trim()));

    const dynFiltered = urlBlocks.filter((blk) => {
      const m = blk.match(/<loc>(.*?)<\/loc>/);
      if (!m) return false;
      const loc = m[1].trim();
      if (existingLocs.has(loc)) return false;
      existingLocs.add(loc);
      return true;
    }).join('\n');

    if (dynFiltered) {
      // insert dynamic urls before closing urlset
      finalXml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urlItems}\n${dynFiltered}\n</urlset>\n`;
    }
  } catch (err) {
    console.warn('Failed to merge dynamic sitemap:', err.message || err);
  }
}

fs.writeFileSync(outPath, finalXml, 'utf8');
console.log('Wrote sitemap:', outPath);
