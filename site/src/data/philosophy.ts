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
  // Autobiographical, so both bodies are placeholders.
  intro: [
    {
      kicker: 'Who I am',
      title:
        'TODO: a short declarative line, e.g. "Curious by nature, accountable by choice."',
      body: 'TODO: two or three sentences on what motivates you and how you approach unfamiliar problems. Write it as you would say it out loud.',
    },
    {
      kicker: "What I'm building toward",
      title: 'TODO: a short line on the work you want next.',
      body: 'TODO: two or three sentences on the kind of problem, scale, or organisation you are aiming at.',
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
