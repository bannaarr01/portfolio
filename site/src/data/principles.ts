/**
 * The "How I Think & Work" section.
 *
 * Feeds: `components/home/Philosophy.astro`, via `philosophy.ts`.
 *
 * Rewritten for a senior/lead framing: 01 and 02 are engineering positions,
 * 03 and 04 are about what the job becomes once other people depend on your
 * judgment. Each is a position that can be argued with, which is the test —
 * a principle nobody could disagree with is decoration.
 *
 * `num` is a display string, not an index. Keep the zero padding.
 */

import type { Principle } from '../types/portfolio';

export const principles = [
  {
    num: '01',
    title: 'Find the real problem first',
    body: 'The stated request and the actual need come apart more often than not. I would rather lose an afternoon to the question than a sprint to a good answer for the wrong one.',
  },
  {
    num: '02',
    title: 'Build for whoever inherits it',
    body: 'Systems outlive the people who write them. I optimize for the engineer who opens the file in two years with no context and an incident already open, which usually means fewer clever parts and better names.',
  },
  {
    num: '03',
    title: 'Review is where the standard gets set',
    body: 'Code review is the highest-leverage teaching I do, so I comment on reasoning rather than style, and I say why. A team that reviews well stops having the same argument twice.',
  },
  {
    num: '04',
    title: 'Own the outcome, not the ticket',
    body: "Shipping is the middle of the job. I stay with what I build through the deploy, the first incident, and the line it adds to next month's bill.",
  },
] satisfies Principle[];

// The two prose blocks that sit above these cards live in `philosophy.ts`,
// which is what the homepage imports. This module holds only the numbered
// cards, so there is one place to edit each.
