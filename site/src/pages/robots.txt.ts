/**
 * /robots.txt — crawler directives. Group 06 owns the content.
 *
 * This is a route rather than a file in `public/` for one reason: the
 * `Sitemap:` directive has to be an absolute URL, and the only correct origin
 * is whatever `site` resolves to for the build in hand. A static file cannot
 * know that, so it has to hardcode a host — and a hardcoded host silently
 * rots the moment the domain changes or a staging build ships. Deriving it
 * from `context.site` makes that class of drift impossible.
 *
 * `trailingSlash: 'always'` does not apply to endpoints carrying a file
 * extension, so this emits `dist/robots.txt` and is served at `/robots.txt`.
 * Same mechanism as `rss.xml.ts`.
 */
import type { APIContext } from 'astro';

export async function GET(context: APIContext) {
  const site = context.site;
  if (!site) {
    throw new Error('robots.txt.ts: `site` is not set in astro.config.mjs.');
  }

  const sitemapUrl = new URL('/sitemap-index.xml', site).href;

  const body = `# Generated at build time from \`site\` in astro.config.mjs.
# Edit src/pages/robots.txt.ts, not dist/robots.txt.

User-agent: *
Allow: /

# Nothing under /og/ is useful to a crawler on its own; the images exist to be
# fetched by link unfurlers, which reach them from page metadata.
Disallow: /og/

Sitemap: ${sitemapUrl}
`;

  return new Response(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
