import { render, type CollectionEntry } from 'astro:content';

/**
 * `minutesRead` is injected by group 00's remark plugin, so it is deliberately
 * absent from the Zod schema and therefore absent from `entry.data`.
 *
 * The glob loader stores remark-injected frontmatter on the rendered entry, so
 * the cheap path reads it straight off the store. `render()` is the documented
 * fallback for when it isn't there (e.g. an entry rendered by a different
 * loader). Group 00: this would be a good `src/lib` helper — see the report.
 */
export async function readingMinutes(post: CollectionEntry<'blog'>): Promise<number> {
  const frontmatter = post.rendered?.metadata?.frontmatter as
    | Record<string, unknown>
    | undefined;
  const cached = frontmatter?.minutesRead;
  if (typeof cached === 'number') return cached;

  const { remarkPluginFrontmatter } = await render(post);
  const injected = remarkPluginFrontmatter?.minutesRead;
  return typeof injected === 'number' ? injected : 1;
}
