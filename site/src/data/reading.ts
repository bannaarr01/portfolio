/**
 * The "Continuous learning" block: a reading list and a closing position.
 *
 * Feeds: `components/home/Reading.astro`.
 *
 * ── TYPING ───────────────────────────────────────────────────────────────
 * PLAN.md §5.3 defines no type for any of this, so the exports carry inferred
 * types. `reading` is `Book[]`: title plus an optional author, which renders
 * as a second, quieter line. It was titles only until the owner supplied
 * authors; the field stayed optional so a title can still stand alone.
 *
 * Four to six entries fills the block. The list is presentational, so a long
 * title wrapping to two lines is expected and fine.
 */

import type { Book } from '../components/home/types';

/**
 * The reading list. Order is deliberate, not alphabetical: the first two are
 * the ones worth being seen reading, and the Go and Rust titles behind them
 * are the current-stack work.
 *
 * ⚠ The authors on the last three were filled in from memory, not read off
 * the covers. Check them before this ships anywhere that matters. The first
 * two came from the owner directly.
 */
export const reading = [
  {
    title:
      'Designing Data-Intensive Applications: The Big Ideas Behind Reliable, Scalable, and Maintainable Systems',
    author: 'Martin Kleppmann',
  },
  {
    title: 'The Pragmatic Programmer: Your Journey to Mastery',
    author: 'David Thomas and Andrew Hunt',
  },
  { title: '100 Go Mistakes and How to Avoid Them', author: 'Teiva Harsanyi' },
  {
    title: 'Pro Go: The Complete Guide to Programming Reliable and Efficient Software Using Golang',
    author: 'Adam Freeman',
  },
  { title: 'Zero To Production In Rust', author: 'Luca Palmieri' },
] satisfies Book[];

/** The paragraph above the list. */
export const readingIntro =
  'Most of what I read is about keeping systems answerable as they grow: available under load, observable when they fail, cheap enough to keep running. The rest is curiosity. Rust, applied AI, blockchain, quantum computing, anything that might change what is worth building five years from now.';

/** The pull-quote that closes the section. */
export const workingPrinciple =
  "AI made execution cheap. Judgment is still the bottleneck, and it's still mine. I use the tools to explore faster and to check my own work harder, but I won't hand over a decision I'd have to defend.";

export type Reading = typeof reading;
