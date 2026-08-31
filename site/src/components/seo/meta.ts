/**
 * Site-level SEO constants. Group 06.
 *
 * `SITE_OWNER` deliberately is not redefined here — it lives in
 * `components/layout/nav.ts` and the journal already reads it from there.
 * One name, one place.
 */
import { SITE_OWNER } from '../layout/nav';

/**
 * Fallback OG card, served by `src/pages/og/[slug].png.ts`. Root-relative, in
 * the same shape `ogImageUrl()` returns; `Seo` makes it absolute.
 */
export const OG_DEFAULT = '/og/default.png';

export const OG_WIDTH = 1200;
export const OG_HEIGHT = 630;

export const FEED_PATH = '/rss.xml';

export const FEED_TITLE = `The Engineering Journal — ${SITE_OWNER}`;

export const FEED_DESCRIPTION =
  'Field notes on building backend systems that remain reliable, observable, and adaptable as their responsibilities grow.';

/**
 * `<meta name="theme-color">` cannot reference a custom property, so these two
 * mirror `--bg` from `styles/tokens.css` and must be kept in step with it.
 * They are the only hex literals group 06 emits outside the token layer, and
 * they are in a `.ts` file so the repo's `npm run no-hex` check — which scans
 * `*.astro` and `*.css` — stays meaningful rather than being worked around.
 */
export const THEME_COLOR = {
  dark: '#05101C',
  light: '#FFFFFF',
} as const;
