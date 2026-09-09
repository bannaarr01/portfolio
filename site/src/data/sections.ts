/**
 * Section headings for the homepage.
 *
 * Feeds: every `<Section>` on `pages/index.astro`, via `SectionHeading.astro`.
 *
 * Each heading splits into `lead` + `accent`: `lead` renders in --text and
 * `accent` renders in the cyan→teal gradient (PLAN.md §4.6 spends gradient
 * text on the accent word and the hero name only). Splitting on the last word
 * or two usually reads best.
 *
 * Headings carried a mono rail index (01, 02 …) until it was dropped from
 * `SectionHeading.astro`. Reordering or adding a section is now purely a
 * matter of `pages/index.astro` — there is no counter here to keep in step,
 * and no gap to paper over when a section renders nothing.
 *
 * Testimonials is the one that does: it renders nothing while
 * `data/testimonials.ts` is empty. Its entry below keeps its copy so restoring
 * the section is a one-line change.
 */

import type { SectionHeadings } from '../components/home/types';

export const headings = {
  about: { lead: 'About', accent: 'Me' },
  experience: { lead: 'Work', accent: 'Experience' },
  projects: { lead: 'Featured', accent: 'Projects' },
  skills: { lead: 'Skills &', accent: 'Technologies' },
  // Not rendered — see the note above and `data/testimonials.ts`.
  testimonials: { lead: 'What Colleagues', accent: 'Say' },
  philosophy: { lead: 'How I Think &', accent: 'Work' },
  education: { lead: 'Education &', accent: 'Credentials' },
} satisfies SectionHeadings;
