import type { CollectionEntry } from 'astro:content';

/**
 * The disciplines the journal is organised around. Declared as a const tuple
 * so `content.config.ts` can build the Zod enum from the same values the type
 * is derived from — one list, no drift.
 *
 * Adding a slug here is only the first of four edits: the category also needs
 * a YAML entry in `content/categories/`, a `CATEGORY_ART` entry in
 * `components/journal/taxonomy.ts`, and a hue and glyph in `pages/og/_recipe.ts`.
 * The last three are total `Record`s keyed on this type, so forgetting one is
 * a type error rather than an unstyled cover.
 */
export const CATEGORY_SLUGS = [
  'go',
  'aws-cloud',
  'system-design',
  'backend-engineering',
  'cpp',
  'ai-engineering',
] as const;

export type CategorySlug = (typeof CATEGORY_SLUGS)[number];

export interface Category {
  slug: CategorySlug;
  title: string;
  description: string;
  order: number;
}

export interface Series {
  slug: string;
  title: string;
  description: string;
  category: CategorySlug;
}

/**
 * A published blog entry. Every `src/lib` query returns these; no page or
 * component should be handling a raw `getCollection('blog')` result.
 */
export type Post = CollectionEntry<'blog'>;
