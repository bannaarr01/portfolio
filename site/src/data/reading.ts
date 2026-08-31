/**
 * The "Continuous learning" block: a reading list and a closing position.
 *
 * Feeds: `components/home/Reading.astro`.
 *
 * ── TYPING ───────────────────────────────────────────────────────────────
 * PLAN.md §5.3 defines no type for any of this, so the exports carry inferred
 * types. `reading` is a flat `readonly string[]` of book titles by design:
 * the section renders titles only, with no author, cover, or link.
 *
 * Four to six titles fills the block. The list is presentational, so a long
 * title wrapping to two lines is expected and fine.
 */

/** Book titles, rendered as a list. Swap these for what you are actually reading. */
export const reading = [
  'Kafka in Action',
  '100 Go Mistakes and How to Avoid Them',
  'Pro Go: The Complete Guide to Programming Reliable and Efficient Software Using Golang',
  'Zero To Production In Rust',
] satisfies string[];

/** The paragraph above the list. */
export const readingIntro =
  'TODO: two or three sentences on what you study outside the day job and why. The mockup framed it as sharpening engineering judgement, with system design as the main thread and emerging technology as the secondary one.';

/** The pull-quote that closes the section. */
export const workingPrinciple =
  'AI can accelerate execution, but engineering judgement remains the constraint. I use it to explore faster, verify rigorously, and keep ownership of every decision.';

export type Reading = typeof reading;
