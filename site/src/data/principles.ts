/**
 * The "How I Think & Work" section.
 *
 * Feeds: `components/home/Principles.astro`.
 *
 * Two exports:
 *   `principles` — the four numbered cards (typed, PLAN.md §5.3)
 *   `philosophy` — the two lead-in blocks above them (no type in §5.3, so it
 *                  ships an inferred type; see the note on that export)
 *
 * The four principles below are general engineering positions rather than
 * biography, so they are usable as written. Read them and keep the ones you
 * would defend in an interview; rewrite the rest in your own words.
 *
 * `num` is a display string, not an index. Keep the zero padding.
 */

import type { Principle } from '../types/portfolio';

export const principles = [
  {
    num: '01',
    title: 'Solve the real problem',
    body: 'Good engineering begins with understanding the actual need. Technology creates value only when it solves a meaningful problem for users or the business.',
  },
  {
    num: '02',
    title: 'Design for change and scale',
    body: 'I value clean, maintainable systems that remain reliable as traffic and data grow, while staying easy to configure, extend, operate, and adapt.',
  },
  {
    num: '03',
    title: 'Optimize the whole system',
    body: 'Quality means looking beyond code correctness to performance, reliability, operational simplicity, developer experience, and infrastructure cost.',
  },
  {
    num: '04',
    title: 'Think beyond the task',
    body: 'I do not treat requirements as a checklist. I seek the intent behind the work, surface risks, challenge assumptions constructively, and propose ideas that can improve the product, architecture, or delivery.',
  },
] as const satisfies readonly Principle[];

/**
 * The two prose blocks above the numbered cards. These are autobiographical,
 * so both bodies are placeholders.
 *
 * PLAN.md §5.3 defines no type for this, so it exports an inferred one. If
 * group 00 adds a `Philosophy` interface later, switch to `satisfies`.
 */
export const philosophy = [
  {
    kicker: 'Who I am',
    headline: 'TODO: a short declarative line, e.g. "Curious by nature, accountable by choice."',
    body: 'TODO: two or three sentences on what motivates you and how you approach unfamiliar problems. Write it as you would say it out loud.',
  },
  {
    kicker: "What I'm building toward",
    headline: 'TODO: a short line on the work you want next.',
    body: 'TODO: two or three sentences on the kind of problem, scale, or organisation you are aiming at.',
  },
] as const;

export type Philosophy = typeof philosophy;
