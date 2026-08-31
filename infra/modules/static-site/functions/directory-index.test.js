// Tests for directory-index.js.
//
// The CloudFront Function is the one piece of imperative logic in the whole
// stack, and it sits on the viewer-request path of every single request — a
// mistake here takes the site down rather than degrading it. It is also the
// most expensive thing to debug in place: a change means a distribution
// deploy (5–15 min) before you can even see the result (§11.4).
//
// So it is tested locally instead. Run with plain node, no dependencies:
//
//   node infra/modules/static-site/functions/directory-index.test.js
//
// The test renders the Terraform template itself, so what it exercises is the
// same source that gets published.

'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const SOURCE = path.join(__dirname, 'directory-index.js');

// Minimal stand-in for templatefile(): substitute ${var} then unescape $${.
function render(vars) {
  let code = fs.readFileSync(SOURCE, 'utf8');

  for (const [key, value] of Object.entries(vars)) {
    code = code.split('${' + key + '}').join(value);
  }

  code = code.split('$${').join('${');

  if (/\$\{[a-z_]+\}/.test(code)) {
    throw new Error('unrendered Terraform placeholder left in template');
  }

  const context = {};
  vm.createContext(context);
  vm.runInContext(code, context);

  if (typeof context.handler !== 'function') {
    throw new Error('directory-index.js must export a global `handler`');
  }

  return context.handler;
}

// Shape of the viewer-request event CloudFront actually delivers.
function event(uri, host, querystring) {
  return {
    request: {
      uri: uri,
      headers: host ? { host: { value: host } } : {},
      querystring: querystring || {},
    },
  };
}

let passed = 0;
const failures = [];

function check(label, actual, expected) {
  if (JSON.stringify(actual) === JSON.stringify(expected)) {
    passed++;
    return;
  }
  failures.push(
    label +
      '\n    got:  ' +
      JSON.stringify(actual) +
      '\n    want: ' +
      JSON.stringify(expected)
  );
}

// ---------------------------------------------------------------------------
// Directory-index rewrite (§11.1) — canonicalisation disabled
// ---------------------------------------------------------------------------

const rewrite = render({ canonical_host: '' });

check('root', rewrite(event('/')).uri, '/index.html');
check('trailing slash', rewrite(event('/blog/')).uri, '/blog/index.html');
check('extensionless', rewrite(event('/blog')).uri, '/blog/index.html');
check(
  'nested extensionless',
  rewrite(event('/blog/category/go')).uri,
  '/blog/category/go/index.html'
);
check(
  'nested trailing slash',
  rewrite(event('/blog/series/observability/')).uri,
  '/blog/series/observability/index.html'
);

// Anything with a real extension is already a literal S3 key.
check(
  'hashed css passes through',
  rewrite(event('/_astro/app.Bx1p2Q.css')).uri,
  '/_astro/app.Bx1p2Q.css'
);
check('og image passes through', rewrite(event('/og/my-post.png')).uri, '/og/my-post.png');
check('rss passes through', rewrite(event('/rss.xml')).uri, '/rss.xml');
check('sitemap passes through', rewrite(event('/sitemap-index.xml')).uri, '/sitemap-index.xml');
check('font passes through', rewrite(event('/fonts/geist.woff2')).uri, '/fonts/geist.woff2');
check('error page passes through', rewrite(event('/404.html')).uri, '/404.html');

// The reason the check inspects only the final segment: this URI has a dot but
// no extension, and testing the whole string would pass it through to a key
// that does not exist — a 403 dressed up as a 404.
check('dot inside a path segment', rewrite(event('/v1.2/about')).uri, '/v1.2/about/index.html');
check('dotted directory with slash', rewrite(event('/v1.2/')).uri, '/v1.2/index.html');

// A request without a Host header must not throw; a thrown function returns
// 503 for every request on the distribution.
check('missing host header', rewrite(event('/blog', null)).uri, '/blog/index.html');

// ---------------------------------------------------------------------------
// Host canonicalisation — apex vs www
// ---------------------------------------------------------------------------

const canonical = render({ canonical_host: 'example.dev' });

check('canonical host is served, not redirected', canonical(event('/blog/', 'example.dev')).uri, '/blog/index.html');

const redirected = canonical(event('/blog/', 'www.example.dev'));
check('non-canonical host gets 301', redirected.statusCode, 301);
check('301 targets the canonical host', redirected.headers.location.value, 'https://example.dev/blog/');
check('301 returns a response, not a rewritten request', redirected.uri, undefined);

// A dropped query string would silently break every inbound campaign or
// referral link that happens to hit the www name.
check(
  'query string survives the redirect',
  canonical(event('/blog/', 'www.example.dev', { ref: { value: 'newsletter' }, utm: { value: '' } })).headers.location
    .value,
  'https://example.dev/blog/?ref=newsletter&utm'
);
check(
  'multi-value query survives the redirect',
  canonical(
    event('/x', 'www.example.dev', { tag: { value: 'a', multiValue: [{ value: 'a' }, { value: 'b' }] } })
  ).headers.location.value,
  'https://example.dev/x?tag=a&tag=b'
);

// ---------------------------------------------------------------------------

if (failures.length > 0) {
  console.error(`${failures.length} failed, ${passed} passed\n`);
  for (const failure of failures) {
    console.error('  ✗ ' + failure);
  }
  process.exit(1);
}

console.log(`directory-index.js: ${passed} assertions passed`);
