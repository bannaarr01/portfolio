/**
 * "How I Think & Work": two intro cards, the four numbered principles, the
 * reading card, and the closing pull quote.
 *
 * Feeds: `components/home/Philosophy.astro`.
 *
 * Composes rather than duplicates: the numbered cards come from
 * `principles.ts` and the book list and closing quote from `reading.ts`. Only
 * the two intro cards are authored here, because nothing else uses them.
 */

import type { PhilosophyContent } from '../components/home/types';
import { reading, readingIntro, workingPrinciple } from './reading';

export { principles } from './principles';

export const philosophy = {
  intro: [
    {
      /**
       * "Six years in" is the one hand-written copy of a figure the rest of
       * the site derives: `hud.ts` computes it from CAREER_START (2020-07-01)
       * and `stats.ts` prints "6+" from the same employment dates. Prose
       * cannot interpolate cleanly, so this is the place that goes stale.
       * When the derived figure ticks over, change it here too.
       */
      kicker: 'Where I sit now',
      title: 'The work that arrives without a shape.',
      body: "Six years in, most of what reaches me hasn't been scoped by anyone yet: a service that got slow for reasons nobody can name, or a migration everyone agrees is necessary and nobody wants to start. I take it apart, decide what we're actually solving, and stay with it past the point the ticket closes. A good half of what I know I learned twice, once building it and again defending it in review to someone who deserved a better answer than habit.",
    },
    {
      kicker: 'How I lead',
      title: 'Fewer decisions routed through me.',
      body: "I've trained juniors who now push back on my designs, and that is the outcome I was after. Leading is mostly writing things down, handing over the parts I'd have enjoyed keeping, and reviewing with reasons instead of verdicts, so the standard holds once I'm not the one enforcing it. What I want next is the same job on larger systems, where getting the architecture wrong costs enough to be interesting.",
    },
  ],

  reading: {
    kicker: 'Continuous learning',
    title: 'Learning beyond the current stack',
    body: readingIntro,
    books: reading,
  },

  pullQuote: {
    label: 'Working principle',
    quote: workingPrinciple,
  },
} satisfies PhilosophyContent;
