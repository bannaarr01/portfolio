#!/usr/bin/env node
/**
 * Compute the CSP `script-src` hash set for the built site.
 *
 * ── WHY THIS IS NOT A ONE-LINER ──────────────────────────────────────────
 * The original plan assumed a single inline script — the blocking theme-init
 * snippet in <head> — and `infra/README.md` still shows a `match()` that takes
 * the first `<script>` it finds. That was true of the foundation scaffold and
 * is not true of the built site: Astro inlines every island's bundled JS
 * directly into the HTML, so a real page carries several inline scripts, and
 * different routes carry different ones.
 *
 * Pinning only the theme hash produces the worst possible failure: the theme
 * script runs, the page looks fine, and the header nav, the animated
 * background, the theme toggle and every scroll reveal are silently blocked.
 * So this walks every built HTML file and takes the union.
 *
 * ── MAINTENANCE ──────────────────────────────────────────────────────────
 * These hashes are content-derived. Any change to any client-side script
 * changes one, and a stale pin blocks it with no error the deploy can see.
 * `--check` exists to make that a CI failure instead of a production bug; it
 * runs in `.github/workflows/site-ci.yml` after the build.
 *
 * ── USAGE ────────────────────────────────────────────────────────────────
 *   node scripts/csp-hashes.mjs            # print the hashes and where they came from
 *   node scripts/csp-hashes.mjs --write    # update csp_script_hashes in every tfvars
 *   node scripts/csp-hashes.mjs --check    # exit 1 if the tfvars are stale
 */

import { createHash } from 'node:crypto';
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(fileURLToPath(new URL('.', import.meta.url)), '..');
const DIST = join(ROOT, 'site', 'dist');
/**
 * Every environment whose headers policy pins these hashes. One entry today;
 * it stays a list because a second environment would need the identical set,
 * and discovering that by hand-editing a second file is how they drift.
 */
const TFVARS = [join(ROOT, 'infra', 'envs', 'prod', 'terraform.tfvars')];

/** Inline `<script>` only — anything with a `src` is covered by `'self'`. */
const INLINE_SCRIPT = /<script(?![^>]*\ssrc=)([^>]*)>([\s\S]*?)<\/script>/gi;

/** `type="application/ld+json"` and friends are data, not executable script. */
function isExecutable(attrs) {
  const type = /\stype\s*=\s*["']([^"']+)["']/i.exec(attrs)?.[1]?.toLowerCase();
  if (!type) return true;
  return type === 'module' || type === 'text/javascript' || type === 'application/javascript';
}

function* htmlFiles(dir) {
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) yield* htmlFiles(path);
    else if (entry.endsWith('.html')) yield path;
  }
}

function collect() {
  /** @type {Map<string, {hash: string, bytes: number, routes: string[], head: string}>} */
  const found = new Map();

  for (const file of htmlFiles(DIST)) {
    const html = readFileSync(file, 'utf8');
    const route = '/' + relative(DIST, file).replace(/index\.html$/, '');

    for (const [, attrs, body] of html.matchAll(INLINE_SCRIPT)) {
      if (!isExecutable(attrs) || body.trim() === '') continue;

      // Hash the exact bytes between the tags. Trimming, re-indenting, or
      // decoding entities here would produce a hash the browser never computes.
      const hash = 'sha256-' + createHash('sha256').update(body, 'utf8').digest('base64');

      const existing = found.get(hash);
      if (existing) existing.routes.push(route);
      else
        found.set(hash, {
          hash,
          bytes: Buffer.byteLength(body, 'utf8'),
          routes: [route],
          head: body.replace(/\s+/g, ' ').trim().slice(0, 58),
        });
    }
  }

  // Sorted so the tfvars diff is stable across builds that reorder routes.
  return [...found.values()].sort((a, b) => a.hash.localeCompare(b.hash));
}

function renderHcl(hashes) {
  if (hashes.length === 0) return 'csp_script_hashes = []';
  const lines = hashes.map((h) => `  "${h.hash}",`).join('\n');
  return `csp_script_hashes = [\n${lines}\n]`;
}

function patchTfvars(file, hashes) {
  const before = readFileSync(file, 'utf8');
  // Matches both the empty `= []` form and a previously written multi-line list.
  const pattern = /csp_script_hashes\s*=\s*(\[\s*\]|\[[\s\S]*?\n\])/;
  if (!pattern.test(before)) {
    throw new Error(`no csp_script_hashes assignment found in ${relative(ROOT, file)}`);
  }
  const after = before.replace(pattern, renderHcl(hashes));
  const changed = after !== before;
  if (changed) writeFileSync(file, after);
  return changed;
}

// ---------------------------------------------------------------------------

const mode = process.argv[2] ?? '--print';
let hashes;
try {
  hashes = collect();
} catch (error) {
  console.error(
    `Could not read ${relative(ROOT, DIST)} — run \`npm run build\` in site/ first.\n${error.message}`
  );
  process.exit(2);
}

if (hashes.length === 0) {
  console.error('No inline scripts found in the build. That is almost certainly wrong.');
  process.exit(2);
}

if (mode === '--print') {
  console.log(`${hashes.length} distinct inline script(s) across the build:\n`);
  for (const h of hashes) {
    console.log(`  ${h.hash}`);
    console.log(`    ${h.bytes} bytes · ${h.routes.length} route(s)`);
    console.log(`    ${h.head}…\n`);
  }
  console.log(renderHcl(hashes));
} else if (mode === '--write') {
  for (const file of TFVARS) {
    const changed = patchTfvars(file, hashes);
    console.log(`${changed ? 'updated' : 'unchanged'}  ${relative(ROOT, file)}`);
  }
} else if (mode === '--check') {
  const expected = renderHcl(hashes);
  let stale = false;
  for (const file of TFVARS) {
    const contents = readFileSync(file, 'utf8');
    const actual = /csp_script_hashes\s*=\s*(\[\s*\]|\[[\s\S]*?\n\])/.exec(contents)?.[0];
    if (actual?.replace(/\s+/g, '') !== expected.replace(/\s+/g, '')) {
      stale = true;
      console.error(`✗ ${relative(ROOT, file)} does not match the built HTML.`);
    } else {
      console.log(`✓ ${relative(ROOT, file)}`);
    }
  }
  if (stale) {
    console.error(
      '\nThe pinned CSP hashes are stale. Every inline script whose hash is missing\n' +
        'will be blocked by the browser with no server-side error.\n' +
        'Fix: node scripts/csp-hashes.mjs --write, then commit the tfvars.\n\n' +
        `Expected:\n${expected}\n`
    );
    process.exit(1);
  }
} else {
  console.error(`Unknown mode "${mode}". Use --print, --write, or --check.`);
  process.exit(2);
}
