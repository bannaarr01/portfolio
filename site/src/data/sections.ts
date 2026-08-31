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
 * `index` is the mono rail number beside the heading. Renumber if you reorder
 * or drop a section — nothing derives these automatically.
 */

import type { SectionHeadings } from '../components/home/types';

export const headings = {
  about: { index: '01', lead: 'About', accent: 'Me' },
  experience: { index: '02', lead: 'Work', accent: 'Experience' },
  projects: { index: '03', lead: 'Featured', accent: 'Projects' },
  skills: { index: '04', lead: 'Skills &', accent: 'Technologies' },
  testimonials: { index: '05', lead: 'What Colleagues', accent: 'Say' },
  philosophy: { index: '06', lead: 'How I Think &', accent: 'Work' },
  education: { index: '07', lead: 'Education &', accent: 'Credentials' },
} satisfies SectionHeadings;
