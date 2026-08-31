import { toString } from 'mdast-util-to-string';
import getReadingTime from 'reading-time';

/**
 * Injects `minutesRead` (a number) into `data.astro.frontmatter` for every
 * markdown file processed by Astro.
 *
 * The value is derived from the rendered body text, so it is never authored by
 * hand and never appears in the Zod schema — a schema field would let it drift
 * from the actual post.
 *
 * Rounded up to a whole minute with a floor of 1, because "0 min read" is
 * always wrong and a fractional minute is noise.
 *
 * ⚠️ `src/lib/reading-time.ts` repeats this rounding for card contexts, which
 * cannot afford to render a post just to count its words. Change both together.
 *
 * @type {import('unified').Plugin<[], import('mdast').Root>}
 */
export function remarkReadingTime() {
  return (tree, file) => {
    const { minutes } = getReadingTime(toString(tree));
    const { frontmatter } = /** @type {{ frontmatter: Record<string, unknown> }} */ (
      file.data.astro
    );
    frontmatter.minutesRead = Math.max(1, Math.ceil(minutes));
  };
}
