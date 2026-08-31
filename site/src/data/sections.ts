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
 *
 * ── CURRENT NUMBERING ────────────────────────────────────────────────────
 * Testimonials renders nothing while `data/testimonials.ts` is empty, so the
 * sections after it are numbered as if it were not there — otherwise the page
 * counts 04, 06, 07 and looks like a section failed to load. The heading entry
 * below keeps its copy so restoring the section is a one-line change.
 *
 * If you add quotes back: give testimonials `05` and shift philosophy,
 * education, and `contact.ts` up to `06`, `07`, `08`.
 */

import type { SectionHeadings } from '../components/home/types';

export const headings = {
  about: { index: '01', lead: 'About', accent: 'Me' },
  experience: { index: '02', lead: 'Work', accent: 'Experience' },
  projects: { index: '03', lead: 'Featured', accent: 'Projects' },
  skills: { index: '04', lead: 'Skills &', accent: 'Technologies' },
  // Not rendered — see the note above and `data/testimonials.ts`.
  testimonials: { index: '05', lead: 'What Colleagues', accent: 'Say' },
  philosophy: { index: '05', lead: 'How I Think &', accent: 'Work' },
  education: { index: '06', lead: 'Education &', accent: 'Credentials' },
} satisfies SectionHeadings;
