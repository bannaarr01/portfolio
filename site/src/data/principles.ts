/**
 * The "How I Think & Work" section.
 *
 * Feeds: `components/home/Philosophy.astro`, via `philosophy.ts`.
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
] satisfies Principle[];

// The two prose blocks that sit above these cards live in `philosophy.ts`,
// which is what the homepage imports. This module holds only the numbered
// cards, so there is one place to edit each.
