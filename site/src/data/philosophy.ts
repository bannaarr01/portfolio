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
      kicker: 'Who I am',
      title: 'Curious by nature, accountable by choice.',
      body: 'I’m motivated by visible professional growth and by becoming the engineer a team can trust with unfamiliar, complex problems. I don’t stop at completing an assigned task: I work to understand why it matters, contribute ideas, and identify better ways forward. I learn quickly, take ownership, and keep going until I understand not only how something works, but how to make it useful, reliable, and better.',
    },
    {
      kicker: "What I'm building toward",
      title: 'Engineering that creates value at scale.',
      body: 'I want to work on technology that produces meaningful value and impact. I’m especially drawn to ambitious, large-scale organizations where strong engineering decisions can improve systems used by many people.',
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
