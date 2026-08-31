#!/usr/bin/env node
/**
 * Serve `site/dist` the way CloudFront will serve it.
 *
 * `astro preview` sends no security headers, so it cannot answer the question
 * that actually matters before a deploy: does the Content-Security-Policy that
 * Terraform is about to attach block anything on the real pages? A CSP failure
 * is invisible server-side — the object is delivered with a 200 and the
 * browser quietly refuses to run part of it — so it has to be verified in a
 * browser, against the real header.
 *
 * This reproduces two things from the CloudFront distribution:
 *
 *   1. The response headers policy in `infra/modules/static-site/headers.tf`,
 *      with `csp_script_hashes` read out of the staging tfvars so the hashes
 *      under test are the ones that will actually be deployed.
 *   2. The viewer-request function's directory rewrite: a URI ending in `/`
 *      gets `index.html` appended, and an unknown path returns the 404
 *      document with a 404 status (CloudFront maps S3's 403 to it).
 *
 *   node scripts/preview-with-headers.mjs [port]
 */

import { createReadStream, existsSync, readFileSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(fileURLToPath(new URL('.', import.meta.url)), '..');
const DIST = join(ROOT, 'site', 'dist');
const PORT = Number(process.argv[2] ?? 4321);

if (!existsSync(DIST)) {
  console.error(`No build at ${DIST}. Run \`npm run build\` in site/ first.`);
  process.exit(2);
}

/** Pull the pinned hashes straight from the tfvars — no second source of truth. */
function pinnedHashes() {
  const tfvars = readFileSync(join(ROOT, 'infra', 'envs', 'staging', 'terraform.tfvars'), 'utf8');
  const block = /csp_script_hashes\s*=\s*\[([\s\S]*?)\]/.exec(tfvars)?.[1] ?? '';
  return [...block.matchAll(/"(sha(?:256|384|512)-[^"]+)"/g)].map((m) => m[1]);
}

const hashes = pinnedHashes();

// Mirrors local.csp_directives in infra/modules/static-site/headers.tf.
const CSP = [
  "default-src 'self'",
  "img-src 'self' data:",
  "style-src 'self' 'unsafe-inline'",
  `script-src ${["'self'", ...hashes.map((h) => `'${h}'`)].join(' ')}`,
  "font-src 'self'",
  "connect-src 'self'",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "object-src 'none'",
].join('; ');

const SECURITY_HEADERS = {
  'content-security-policy': CSP,
  'strict-transport-security': 'max-age=63072000; includeSubDomains; preload',
  'x-content-type-options': 'nosniff',
  'x-frame-options': 'DENY',
  'referrer-policy': 'strict-origin-when-cross-origin',
  'permissions-policy': 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
};

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.pdf': 'application/pdf',
};

function resolveFile(pathname) {
  // Contain the path inside dist before touching the filesystem.
  const safe = normalize(decodeURIComponent(pathname)).replace(/^(\.\.[/\\])+/, '');
  let target = join(DIST, safe);
  if (!target.startsWith(DIST)) return null;

  // The CloudFront function's rewrite: "/" -> "/index.html".
  if (safe.endsWith('/')) target = join(target, 'index.html');
  if (existsSync(target) && statSync(target).isDirectory()) target = join(target, 'index.html');

  return existsSync(target) && statSync(target).isFile() ? target : null;
}

createServer((req, res) => {
  const { pathname } = new URL(req.url ?? '/', `http://localhost:${PORT}`);
  const file = resolveFile(pathname);

  if (!file) {
    // 403 from S3 becomes a 404 document with a 404 status.
    const notFound = join(DIST, '404.html');
    res.writeHead(404, { ...SECURITY_HEADERS, 'content-type': TYPES['.html'] });
    if (existsSync(notFound)) createReadStream(notFound).pipe(res);
    else res.end('Not found');
    return;
  }

  const type = TYPES[extname(file)] ?? 'application/octet-stream';
  const immutable = /\/(_astro|og|fonts)\//.test(pathname);

  res.writeHead(200, {
    ...SECURITY_HEADERS,
    'content-type': type,
    'cache-control': immutable ? 'max-age=31536000, immutable' : 'max-age=0, must-revalidate',
  });
  createReadStream(file).pipe(res);
}).listen(PORT, () => {
  console.log(`dist/ on http://localhost:${PORT} with the CloudFront header set`);
  console.log(`script-src pins ${hashes.length} hash(es) from envs/staging/terraform.tfvars`);
});
