import getReadingTime from 'reading-time';

import type { Post } from '../types/content';

/**
 * Reading time for a post that has not been rendered.
 *
 * The remark plugin (`plugins/remark-reading-time.mjs`) injects `minutesRead`
 * into frontmatter, but that value only surfaces through
 * `render(entry).remarkPluginFrontmatter` — it is not on `entry.data`, because
 * `entry.data` is the Zod output and the schema deliberately excludes it.
 *
 * Cards and listings need the number without paying to render the post, so
 * they compute it from the raw body here instead.
 *
 * ⚠️ The rounding must stay identical to the remark plugin, or an article
 * header and its own card will disagree. Change both together.
 */
export function getMinutesRead(post: Post): number {
  if (!post.body) return 1;
  return Math.max(1, Math.ceil(getReadingTime(post.body).minutes));
}
