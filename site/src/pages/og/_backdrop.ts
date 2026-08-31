/**
 * The decorative layer of every OG card, rasterised once per discipline.
 * Group 06. Underscore-prefixed so Astro does not route it.
 *
 * `astro-og-canvas` draws text well but its card layout is fixed — logo, title,
 * description, one padding value, one edge border, a vertical-only gradient.
 * The §4.8 recipe needs a 118° gradient, three concentric arcs struck from a
 * focal point at 68% / 106%, a 52px grid, and a category glyph, none of which
 * that API can express. So the geometry is authored as SVG, rasterised with
 * `sharp`, and handed back as a `bgImage` path; the library does the text.
 *
 * Deliberately no text in here — `sharp` renders SVG through librsvg, which
 * shapes text with whatever fonts the machine happens to have. That is fine for
 * geometry and unacceptable for a headline, so every glyph below is a path.
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import sharp from 'sharp';

// Inlined by Vite; see the note in `_recipe.ts` about `import.meta.url`.
import logoSvg from '../../../public/logo.svg?raw';

import type { CategorySlug } from '../../types/content';
import { OG_HEIGHT, OG_WIDTH } from '../../components/seo/meta';
import {
  ACCENT_FROM,
  ACCENT_TO,
  ARC_COLORS,
  CATEGORY_GLYPH,
  CATEGORY_HUE,
  GRADIENT_STOPS,
  GRID_COLOR,
  INK,
  PAGE_BG,
  glyphPath,
  hueRotate,
} from './_recipe';

/**
 * Alongside `astro-og-canvas`'s own cache, which defaults to
 * `./node_modules/.astro-og-canvas`. Under node_modules it needs no gitignore
 * entry and is cleared by a fresh `npm ci` like any other build artefact.
 */
const CACHE_DIR = join(process.cwd(), 'node_modules', '.astro-og-backdrops');

/** Split an 8-digit token into a colour and an opacity librsvg will accept. */
function rgba(hex: string): { color: string; opacity: number } {
  return hex.length === 9
    ? { color: `#${hex.slice(1, 7)}`, opacity: parseInt(hex.slice(7), 16) / 255 }
    : { color: hex, opacity: 1 };
}

function backdropSvg(category: CategorySlug | null): string {
  const hue = category ? CATEGORY_HUE[category] : 0;

  const stops = GRADIENT_STOPS.map(
    (s) => `<stop offset="${s.offset}" stop-color="${hueRotate(s.color, hue)}"/>`
  ).join('');

  // §4.8 — three concentric arcs struck from a focal point at 68% / 106%.
  const fx = OG_WIDTH * 0.68;
  const fy = OG_HEIGHT * 1.06;
  const arcs = ARC_COLORS.map((c, i) => {
    const { color, opacity } = rgba(c);
    const r = (OG_WIDTH * [0.42, 0.62, 0.86][i]!).toFixed(1);
    return `<circle cx="${fx}" cy="${fy}" r="${r}" fill="none" stroke="${color}" stroke-opacity="${(opacity * 1.4).toFixed(3)}" stroke-width="3"/>`;
  }).join('');

  const grid = rgba(GRID_COLOR);
  const ink = rgba(INK);

  // Bled off the right edge on purpose: a watermark that runs out of card reads
  // as intent, one that stops short of the headline reads as a collision.
  const glyph = category
    ? `<g transform="translate(946 196) scale(10.6)" fill="none" stroke="${ink.color}" stroke-opacity="0.34" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round">${glyphPath(CATEGORY_GLYPH[category])}</g>`
    : '';

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${OG_WIDTH}" height="${OG_HEIGHT}" viewBox="0 0 ${OG_WIDTH} ${OG_HEIGHT}">
  <defs>
    <!-- 118deg in CSS points right and slightly down; these endpoints reproduce
         that across a 1200x630 box. -->
    <linearGradient id="cover" x1="0" y1="0" x2="1" y2="0.53">${stops}</linearGradient>
    <linearGradient id="scrim" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="${PAGE_BG}" stop-opacity="1"/>
      <stop offset="0.4" stop-color="${PAGE_BG}" stop-opacity="0.985"/>
      <stop offset="0.56" stop-color="${PAGE_BG}" stop-opacity="0.9"/>
      <stop offset="0.74" stop-color="${PAGE_BG}" stop-opacity="0.5"/>
      <stop offset="0.93" stop-color="${PAGE_BG}" stop-opacity="0"/>
    </linearGradient>
    <linearGradient id="bar" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="${hueRotate(ACCENT_FROM, hue)}"/>
      <stop offset="1" stop-color="${hueRotate(ACCENT_TO, hue)}"/>
    </linearGradient>
    <pattern id="grid" width="52" height="52" patternUnits="userSpaceOnUse">
      <path d="M52 .5H.5V52" fill="none" stroke="${grid.color}" stroke-opacity="${(grid.opacity * 1.8).toFixed(3)}" stroke-width="1"/>
    </pattern>
  </defs>
  <rect width="${OG_WIDTH}" height="${OG_HEIGHT}" fill="${PAGE_BG}"/>
  <rect width="${OG_WIDTH}" height="${OG_HEIGHT}" fill="url(#cover)"/>
  ${arcs}
  <rect width="${OG_WIDTH}" height="${OG_HEIGHT}" fill="url(#grid)"/>
  ${glyph}
  <rect width="${OG_WIDTH}" height="${OG_HEIGHT}" fill="url(#scrim)"/>
  <rect y="${OG_HEIGHT - 9}" width="${OG_WIDTH}" height="9" fill="url(#bar)"/>
</svg>`;
}

const inFlight = new Map<string, Promise<string>>();

async function cached(key: string, render: () => Promise<Buffer>): Promise<string> {
  const path = join(CACHE_DIR, `${key}.png`);
  let job = inFlight.get(key);
  if (!job) {
    job = (async () => {
      if (!existsSync(path)) {
        await mkdir(CACHE_DIR, { recursive: true });
        await writeFile(path, await render());
      }
      return path;
    })();
    inFlight.set(key, job);
  }
  return job;
}

/** Path to the backdrop PNG for a discipline, generating it on first use. */
export function backdropFor(category: CategorySlug | null): Promise<string> {
  return cached(category ?? 'default', () =>
    sharp(Buffer.from(backdropSvg(category)))
      .png({ compressionLevel: 9 })
      .toBuffer()
  );
}

/**
 * The brand mark as a transparent PNG. `public/logo.svg` is the canonical file
 * (group 07); CanvasKit decodes PNG/JPEG/WebP but not SVG, so it is converted
 * here rather than a second copy of the mark being kept in this directory.
 */
export function logoPng(height = 52): Promise<string> {
  return cached(`logo-${height}`, () =>
    sharp(Buffer.from(logoSvg), { density: 600 }).resize({ height }).png().toBuffer()
  );
}
