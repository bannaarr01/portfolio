import { getCollection } from 'astro:content';
import { ICONS } from '../ui/icon-registry';
import type { CategorySlug } from '../../types/content';
import type { IconName } from '../../types/icons';

/**
 * Presentation metadata for the four disciplines — owned by group 04.
 *
 * `glyph` and `rotate` are cover-art decisions (PLAN.md §4.8), not content, so
 * they live here rather than in group 07's YAML. `title` is only a fallback:
 * every consumer resolves the real title from the `categories` collection so a
 * rename in content never leaves stale type on the artwork.
 *
 * Typed as a total Record — adding a fifth CategorySlug is a compile error, not
 * a silently unstyled cover.
 */
export const CATEGORY_ART: Record<
  CategorySlug,
  { title: string; glyph: IconName; rotate: string }
> = {
  go: { title: 'Go', glyph: 'code', rotate: '0deg' },
  'aws-cloud': { title: 'AWS & Cloud', glyph: 'cloud-cog', rotate: '-14deg' },
  'system-design': { title: 'System Design', glyph: 'layers', rotate: '18deg' },
  'backend-engineering': {
    title: 'Backend Engineering',
    glyph: 'server',
    rotate: '32deg',
  },
};

/** All four categories, ordered by their `order` field. */
export async function getOrderedCategories() {
  const cats = await getCollection('categories');
  return [...cats].sort((a, b) => a.data.order - b.data.order);
}

/** Display title for a slug, resolved from content with a design-side fallback. */
export async function categoryTitle(slug: CategorySlug): Promise<string> {
  const cats = await getCollection('categories');
  return cats.find((c) => c.data.slug === slug)?.data.title ?? CATEGORY_ART[slug].title;
}

/** The `series` entry matching a post's `series` slug, if any. */
export async function findSeries(slug: string | undefined) {
  if (!slug) return undefined;
  const all = await getCollection('series');
  return all.find((s) => s.data.slug === slug);
}

/**
 * `heroGlyph` is a free-form string in the schema (PLAN.md §5.2), so it has to
 * be narrowed before it can reach a component typed on `IconName`. An unknown
 * name falls back to the category glyph rather than rendering an empty SVG.
 */
export function asIconName(value: string | undefined): IconName | undefined {
  if (value && value in ICONS) return value as IconName;
  return undefined;
}

/** One entry in a RowGrid (series shelf / discipline grid). */
export interface Row {
  href: string;
  title: string;
  description: string;
  meta: string;
}

/** Zero-padded rail numeral: 1 -> "01". */
export function railNumber(n: number): string {
  return String(n).padStart(2, '0');
}
