/**
 * Formatting helpers. Locale is pinned to en-GB so the build output is
 * identical on a CI runner and on a laptop — an unpinned `toLocaleDateString`
 * silently follows the machine's locale and produces a diff nobody authored.
 */

const LONG = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

const SHORT = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
});

/** `long` → "22 August 2026" · `short` → "22 Aug 2026" (the card format). */
export function formatDate(d: Date, style: 'long' | 'short' = 'long'): string {
  return (style === 'short' ? SHORT : LONG).format(d);
}

/**
 * Site-root-relative path to a post's generated OG image. Root-relative rather
 * than absolute because `Astro.site` is not reachable from a plain module —
 * `Seo` resolves it with `new URL(ogImageUrl(slug), Astro.site)`.
 *
 * The endpoint that serves these lives at `src/pages/og/` (group 06).
 */
export function ogImageUrl(slug: string): string {
  return `/og/${slug}.png`;
}
