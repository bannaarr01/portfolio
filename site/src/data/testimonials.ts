/**
 * The "What Colleagues Say" recommendation cards.
 *
 * Feeds: `components/home/Testimonials.astro`.
 *
 * ── EVERY FIELD HERE IS A PLACEHOLDER ────────────────────────────────────
 * A testimonial attributes words to a named person. Nothing in this file is
 * real, and none of it should ship. Replace each entry with a quote you
 * actually have permission to publish, or delete the entry.
 *
 * If you end up with no usable quotes, export an empty array rather than
 * inventing one. The section is expected to handle a zero-length list by
 * not rendering.
 *
 * ── SHAPE ────────────────────────────────────────────────────────────────
 * Two cards sit side by side at desktop width. `initials` drives the
 * `Avatar` circle and should be two characters. `relationship` is the small
 * line under the role, e.g. "Worked together on the platform team".
 *
 * Quote lengths differ on purpose: the cards are equal-height, so a short
 * quote next to a long one is the case that proves the layout holds.
 */

import type { Testimonial } from '../types/portfolio';

export const testimonials = [
  {
    quote:
      'TODO: replace with a real quote you have permission to publish. Roughly this length works well in the card: two or three clauses about how the person actually works, ending on something concrete.',
    name: 'TODO: Full Name',
    role: 'TODO: Their role · Company',
    relationship: 'TODO: how you worked together',
    initials: 'TD',
  },
  {
    quote:
      'TODO: a second real quote. Shorter is fine, and the contrast between the two card heights is deliberate.',
    name: 'TODO: Full Name',
    role: 'TODO: Their role · Company',
    relationship: 'TODO: how you worked together',
    initials: 'TD',
  },
] as const satisfies readonly Testimonial[];
