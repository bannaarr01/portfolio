/**
 * The cover-art recipe (PLAN.md §4.8), expressed for raster output. Group 06.
 * Underscore-prefixed so Astro treats it as a module rather than a route.
 *
 * Group 04's `CoverArt.astro` solves the on-page problem in CSS with zero image
 * bytes; this solves the crawler problem with a PNG, because Slack, X, and
 * LinkedIn will not render CSS. They are deliberately separate systems
 * (astro.md §5.2) that must not drift, so rather than restating the palette
 * here the gradient stops are **read out of `styles/tokens.css` at build time**.
 * Change `--cover-*` and both systems move together.
 */
// Inlined by Vite at build time. Reading the file at runtime would not survive
// bundling — `import.meta.url` then points into dist/, not src/.
import tokensCss from '../../styles/tokens.css?raw';

import { ICON_PATHS } from '../../components/ui/icon-paths';
import type { CategorySlug } from '../../types/content';
import type { IconName } from '../../types/icons';

/**
 * Pull a custom property out of the token layer. The first match wins, which is
 * the `:root` (dark) block — an OG card is a fixed image with no theme to
 * follow, and the cover gradient is identical in both blocks anyway.
 */
function token(name: string): string {
  const match = tokensCss.match(new RegExp(`--${name}:\\s*(#[0-9a-fA-F]{3,8})`));
  if (!match) {
    throw new Error(
      `_recipe.ts: --${name} is missing from styles/tokens.css. The OG cards read the cover palette from the token layer; add the token or update this list.`
    );
  }
  return match[1]!.toUpperCase();
}

/** §4.8 — the five gradient stops, straight from the token layer. */
export const GRADIENT_STOPS = [
  { offset: 0, color: token('cover-1') },
  { offset: 0.26, color: token('cover-2') },
  { offset: 0.58, color: token('cover-3') },
  { offset: 0.82, color: token('cover-4') },
  { offset: 1, color: token('cover-5') },
] as const;

export const ARC_COLORS = [
  token('cover-arc-1'),
  token('cover-arc-2'),
  token('cover-arc-3'),
];
export const GRID_COLOR = token('cover-grid');
export const INK = token('cover-ink');
export const PAGE_BG = token('bg');
export const ACCENT_FROM = token('accent-strong');
export const ACCENT_TO = token('accent-2');

/**
 * §4.8 — per-category hue rotation, so the disciplines read differently.
 *
 * These must stay in step with `rotate` in `components/journal/taxonomy.ts`:
 * that value drives the CSS cover art and this one drives the PNG, and a card
 * that does not match its own preview image is worse than either alone.
 */
export const CATEGORY_HUE: Record<CategorySlug, number> = {
  go: 0,
  'aws-cloud': -14,
  'system-design': 18,
  'backend-engineering': 32,
  cpp: -30,
  'ai-engineering': 54,
};

/**
 * The watermark glyph per discipline, taken from group 00's registry rather
 * than redrawn — the card should use the same line art as the rest of the site.
 */
export const CATEGORY_GLYPH: Record<CategorySlug, IconName> = {
  go: 'go',
  'aws-cloud': 'cloud',
  'system-design': 'layers',
  'backend-engineering': 'server',
  cpp: 'activity',
  'ai-engineering': 'sparkles',
};

export const glyphPath = (icon: IconName): string => ICON_PATHS[icon];

/**
 * The sRGB hue-rotate matrix from the Filter Effects spec — the same maths CSS
 * `filter: hue-rotate()` runs. Using it rather than a naive HSL spin is what
 * makes these PNGs land on the same colours as group 04's CSS cover art
 * instead of merely similar ones.
 */
export function hueRotate(hex: string, deg: number): string {
  const value = hex.slice(1);
  // Tolerate the 8-digit tokens (#RRGGBBAA); alpha rides along untouched.
  const alpha = value.length === 8 ? value.slice(6) : '';
  if (deg === 0) return `#${value.toUpperCase()}`;

  const n = parseInt(value.slice(0, 6), 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255];

  const rad = (deg * Math.PI) / 180;
  const c = Math.cos(rad);
  const s = Math.sin(rad);

  const m = [
    [
      0.213 + c * 0.787 - s * 0.213,
      0.715 - c * 0.715 - s * 0.715,
      0.072 - c * 0.072 + s * 0.928,
    ],
    [
      0.213 - c * 0.213 + s * 0.143,
      0.715 + c * 0.285 + s * 0.14,
      0.072 - c * 0.072 - s * 0.283,
    ],
    [
      0.213 - c * 0.213 - s * 0.787,
      0.715 - c * 0.715 + s * 0.715,
      0.072 + c * 0.928 + s * 0.072,
    ],
  ] as const;

  const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
  const out = m.map((row) => clamp(row[0]! * r + row[1]! * g + row[2]! * b));

  return `#${out.map((v) => v.toString(16).padStart(2, '0')).join('')}${alpha}`.toUpperCase();
}
