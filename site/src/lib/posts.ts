import { getCollection } from 'astro:content';

import type { CategorySlug, Post } from '../types/content';
import { CATEGORY_SLUGS } from '../types/content';

/**
 * Query helpers for the blog collection.
 *
 * ┌─────────────────────────────────────────────────────────────────────────┐
 * │ THE DRAFT FILTER LIVES HERE AND NOWHERE ELSE.                           │
 * │                                                                         │
 * │ `getPublishedPosts()` is the only function in the codebase permitted to │
 * │ call `getCollection('blog')`. Every other helper composes on top of it. │
 * │ No page or component may query the collection directly — a second entry │
 * │ point is how drafts reach production.                                   │
 * └─────────────────────────────────────────────────────────────────────────┘
 */

/** Newest first. Drafts removed. */
export async function getPublishedPosts(): Promise<Post[]> {
  const posts = await getCollection('blog', ({ data }) => data.draft !== true);
  return posts.sort((a, b) => b.data.publishDate.valueOf() - a.data.publishDate.valueOf());
}

export async function getPostsByCategory(slug: CategorySlug): Promise<Post[]> {
  const posts = await getPublishedPosts();
  return posts.filter((post) => post.data.category === slug);
}

/**
 * Reading order for a series — by `part` ascending, deliberately not by date.
 * Part 3 may well be published before part 2 is revised.
 */
export async function getSeriesParts(slug: string): Promise<Post[]> {
  const posts = await getPublishedPosts();
  return posts
    .filter((post) => post.data.series === slug)
    .sort((a, b) => (a.data.part ?? 0) - (b.data.part ?? 0));
}

/**
 * Same category, excluding the post itself, newest first. Falls back to the
 * most recent posts from anywhere so a lone post in a category still gets a
 * populated "related" row rather than an empty grid.
 */
export async function getRelatedPosts(post: Post, n = 3): Promise<Post[]> {
  const posts = await getPublishedPosts();
  const others = posts.filter((candidate) => candidate.id !== post.id);

  const sameCategory = others.filter(
    (candidate) => candidate.data.category === post.data.category
  );
  if (sameCategory.length >= n) return sameCategory.slice(0, n);

  const seen = new Set(sameCategory.map((candidate) => candidate.id));
  const filler = others.filter((candidate) => !seen.has(candidate.id));
  return [...sameCategory, ...filler].slice(0, n);
}

/** Previous and next part of the post's series. Empty when it has no series. */
export async function getAdjacentInSeries(
  post: Post
): Promise<{ prev?: Post; next?: Post }> {
  const { series } = post.data;
  if (!series) return {};

  const parts = await getSeriesParts(series);
  const index = parts.findIndex((candidate) => candidate.id === post.id);
  if (index === -1) return {};

  return { prev: parts[index - 1], next: parts[index + 1] };
}

/**
 * Article count per category, derived at build time rather than stored. A
 * category showing "0 articles" is a computed fact, not a field someone forgot
 * to update — so every slug is present even at zero.
 */
export async function getCategoryCounts(): Promise<Record<CategorySlug, number>> {
  const counts = Object.fromEntries(CATEGORY_SLUGS.map((slug) => [slug, 0])) as Record<
    CategorySlug,
    number
  >;

  for (const post of await getPublishedPosts()) {
    counts[post.data.category] += 1;
  }
  return counts;
}
