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

import type { TestimonialsIntro } from '../components/home/types';
import type { Testimonial } from '../types/portfolio';

/** The intro row above the quote cards, with its outbound link. */
export const testimonialsIntro = {
  lead: 'Selected recommendations from people who worked with me directly at Telekom R&D.',
  linkLabel: 'View LinkedIn profile',
  linkHref: '',
} satisfies TestimonialsIntro;

/**
 * ── DELIBERATELY EMPTY ───────────────────────────────────────────────────
 * Every other module on this page was filled from the mockup during
 * integration. This one was not, and the omission is the point.
 *
 * A testimonial puts words in a named person's mouth on a public page. The
 * mockup's two quotes are attributed to real individuals, and nothing in this
 * repository establishes that they were given for publication — one of them is
 * even attributed to the site owner, which is a mockup artefact rather than a
 * recommendation. Shipping either would be a claim about someone else that
 * cannot be verified from here.
 *
 * `Testimonials.astro` renders nothing for an empty array, so the section
 * simply does not appear until there is something real to put in it. Paste in
 * quotes you have permission to publish, with `initials` as two characters,
 * and the section returns.
 */
export const testimonials = [] satisfies Testimonial[];
