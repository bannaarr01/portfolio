import type { CollectionEntry } from 'astro:content';

/**
 * The four disciplines the journal is organised around. Declared as a const
 * tuple so `content.config.ts` can build the Zod enum from the same values the
 * type is derived from — one list, no drift.
 */
export const CATEGORY_SLUGS = [
  'go',
  'aws-cloud',
  'system-design',
  'backend-engineering',
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
