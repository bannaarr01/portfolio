#!/usr/bin/env node
/**
 * Per-route weight against the PLAN.md §8 budgets.
 *
 * Lighthouse reports a performance score; it does not tell you which route
 * blew the JavaScript budget or by how much. This does, and it fails the build
 * when a route goes over, so the budget is enforced rather than aspirational.
 *
 * Astro inlines island JS into the HTML, so "page JS" is the sum of every
 * executable inline script plus any external `<script src>` the page pulls.
 * JSON-LD is data, not script, and is excluded — counting it would make the
 * SEO work look like a performance regression.
 *
 * Sizes are gzip at level 9, which is what CloudFront serves.
 *
 *   node scripts/budgets.mjs           # report
 *   node scripts/budgets.mjs --check   # exit 1 on any breach
 */

import { existsSync, readFileSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(fileURLToPath(new URL('.', import.meta.url)), '..');
const DIST = join(ROOT, 'site', 'dist');

/** PLAN.md §8. Homepage carries the animated background, hence its own line. */
const BUDGETS = { homepageJs: 9 * 1024, otherJs: 3 * 1024, css: 18 * 1024 };

const ROUTES = [
  ['/', 'index.html'],
  ['/blog/', 'blog/index.html'],
  ['/blog/read-heavy-service-design/', 'blog/read-heavy-service-design/index.html'],
  ['/blog/category/aws-cloud/', 'blog/category/aws-cloud/index.html'],
  [
    '/blog/series/aws-cloud-practitioner-study-notes/',
    'blog/series/aws-cloud-practitioner-study-notes/index.html',
  ],
  ['/404', '404.html'],
];

const INLINE_SCRIPT = /<script(?![^>]*\ssrc=)([^>]*)>([\s\S]*?)<\/script>/gi;
const EXTERNAL_SCRIPT = /<script[^>]*\ssrc="([^"]+)"/gi;
const STYLESHEET = /<link[^>]*rel="stylesheet"[^>]*href="([^"]+)"/gi;
const INLINE_STYLE = /<style[^>]*>([\s\S]*?)<\/style>/gi;

const gz = (buf) => gzipSync(buf, { level: 9 }).length;
const kb = (n) => (n / 1024).toFixed(2);

function isExecutable(attrs) {
  const type = /\stype\s*=\s*["']([^"']+)["']/i.exec(attrs)?.[1]?.toLowerCase();
  if (!type) return true;
  return ['module', 'text/javascript', 'application/javascript'].includes(type);
}

function localAsset(url) {
  if (/^https?:/i.test(url)) return null;
  const file = join(DIST, url.replace(/^\//, ''));
  return existsSync(file) ? readFileSync(file) : null;
}

const rows = [];
for (const [route, file] of ROUTES) {
  const path = join(DIST, file);
  if (!existsSync(path)) {
    rows.push({ route, missing: true });
    continue;
  }
  const html = readFileSync(path, 'utf8');

  let js = 0;
  for (const [, attrs, body] of html.matchAll(INLINE_SCRIPT)) {
    if (isExecutable(attrs) && body.trim()) js += gz(Buffer.from(body, 'utf8'));
  }
  for (const [, src] of html.matchAll(EXTERNAL_SCRIPT)) {
    const asset = localAsset(src);
    if (asset) js += gz(asset);
  }

  let css = 0;
  for (const [, href] of html.matchAll(STYLESHEET)) {
    const asset = localAsset(href);
    if (asset) css += gz(asset);
  }
  for (const [, body] of html.matchAll(INLINE_STYLE)) css += gz(Buffer.from(body, 'utf8'));

  const jsBudget = route === '/' ? BUDGETS.homepageJs : BUDGETS.otherJs;
  rows.push({
    route,
    js,
    css,
    html: gz(Buffer.from(html, 'utf8')),
    jsBudget,
    jsOver: js > jsBudget,
    cssOver: css > BUDGETS.css,
  });
}

console.log(
  `${'route'.padEnd(50)}${'JS gz'.padStart(10)}${'budget'.padStart(9)}${'CSS gz'.padStart(10)}${'HTML gz'.padStart(10)}`
);
console.log('-'.repeat(89));

let failed = false;
for (const r of rows) {
  if (r.missing) {
    console.log(`${r.route.padEnd(50)}${'MISSING'.padStart(10)}`);
    failed = true;
    continue;
  }
  const flag = r.jsOver || r.cssOver ? '  ✗' : '';
  if (r.jsOver || r.cssOver) failed = true;
  console.log(
    `${r.route.padEnd(50)}${(kb(r.js) + 'K').padStart(10)}${(kb(r.jsBudget) + 'K').padStart(9)}` +
      `${(kb(r.css) + 'K').padStart(10)}${(kb(r.html) + 'K').padStart(10)}${flag}`
  );
}

console.log(
  `\nBudgets (PLAN.md §8): homepage JS < ${kb(BUDGETS.homepageJs)}K gz, ` +
    `other routes < ${kb(BUDGETS.otherJs)}K gz, CSS < ${kb(BUDGETS.css)}K gz per route.`
);

if (process.argv.includes('--check')) {
  if (failed) {
    console.error('\n✗ At least one route is over budget.');
    process.exit(1);
  }
  console.log('✓ Every route is within budget.');
}
