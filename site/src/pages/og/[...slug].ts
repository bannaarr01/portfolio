/**
 * /og/<slug>.png — one 1200×630 card per published post, plus /og/default.png
 * for every non-article route. Group 06.
 *
 * Built with `astro-og-canvas` (PLAN.md §7's primary path) over a `sharp`
 * backdrop that carries the §4.8 geometry — see `_backdrop.ts` for why the work
 * is split that way.
 *
 * Sourced from `getPublishedPosts()`, so a draft never gets a card and a leaked
 * draft URL therefore has nothing to preview.
 */
import { OGImageRoute } from 'astro-og-canvas';
import { getCollection } from 'astro:content';

import { getPublishedPosts, formatDate } from '../../lib';
import { SITE_OWNER } from '../../components/layout/nav';
import type { CategorySlug } from '../../types/content';
import { backdropFor, logoPng } from './_backdrop';

interface Card {
  title: string;
  meta: string;
  category: CategorySlug | null;
}

const posts = await getPublishedPosts();
const categories = await getCollection('categories');
const categoryTitle = new Map(categories.map((c) => [c.data.slug, c.data.title]));

const pages: Record<string, Card> = {
  // The site-wide fallback every non-article route points at.
  default: {
    title: SITE_OWNER,
    meta: 'Backend & cloud engineering · Go · AWS · Distributed systems',
    category: null,
  },
};

for (const post of posts) {
  pages[post.id] = {
    title: post.data.title,
    // `minutesRead` only exists after render(), which is far too much work for
    // a caption. Discipline, series position, and date are already in `data`.
    meta: [
      categoryTitle.get(post.data.category) ?? post.data.category,
      post.data.part ? `Part ${post.data.part}` : null,
      formatDate(post.data.updatedDate ?? post.data.publishDate),
    ]
      .filter(Boolean)
      .join('  ·  '),
    category: post.data.category,
  };
}

/** Past this a title stops being a headline and starts being a paragraph. */
const TITLE_LIMIT = 90;

/** Truncate on a word boundary — a headline cut mid-word reads as a bug. */
function truncate(value: string, limit = TITLE_LIMIT): string {
  if (value.length <= limit) return value;
  const cut = value.slice(0, limit - 1);
  const space = cut.lastIndexOf(' ');
  return `${(space > limit * 0.6 ? cut.slice(0, space) : cut).trimEnd()}…`;
}

/** Long headlines step down rather than overflowing or wrapping to six lines. */
function titleSize(length: number): number {
  if (length <= 34) return 74;
  if (length <= 56) return 64;
  if (length <= 74) return 57;
  return 51;
}

export const { getStaticPaths, GET } = await OGImageRoute<Card>({
  pages,

  getSlug: (path) => `${path}.png`,

  getImageOptions: async (_path, page) => {
    const title = truncate(page.title);

    return {
      title,
      description: page.meta,
      bgImage: { path: await backdropFor(page.category), fit: 'fill' },
      logo: { path: await logoPng(52), size: [52] },
      padding: 64,

      // Not a visible border — `astro-og-canvas` adds `border.width` to the
      // margin on that side, and the backdrop is painted over the stroke
      // afterwards. It is the only way to reserve the right third of the card
      // for the gradient and the category watermark so the headline never
      // runs underneath them.
      border: { side: 'inline-end', width: 300 },

      font: {
        title: {
          size: titleSize(title.length),
          weight: 'Bold',
          lineHeight: 1.1,
          families: ['Geist'],
        },
        description: {
          size: 25,
          weight: 'Normal',
          lineHeight: 1.5,
          families: ['Geist Mono', 'Geist'],
        },
      },

      // CanvasKit reads woff2 directly, so these are the same faces the site
      // ships rather than a second copy in a different format.
      fonts: [
        './node_modules/@fontsource-variable/geist/files/geist-latin-wght-normal.woff2',
        './node_modules/@fontsource-variable/geist-mono/files/geist-mono-latin-wght-normal.woff2',
      ],
    };
  },
});
