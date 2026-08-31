/**
 * Identity and contact details — the single source of truth for who the site
 * is about.
 *
 * Nothing renders this module directly. It feeds the shaped modules that the
 * homepage imports: `hero.ts`, `about.ts`, `contact.ts`, and `site.ts`. Edit
 * a name, email, or paragraph here and it propagates to every section.
 *
 * ── EDITING ──────────────────────────────────────────────────────────────
 * Anything marked `TODO:` is a placeholder. `grep -rn "TODO:" src/data` lists
 * everything still waiting on real content.
 *
 * ── TYPING ───────────────────────────────────────────────────────────────
 * PLAN.md §5.3 defines no `Profile`, so the shape is declared here. Arrays are
 * plain (not `readonly`) so they stay assignable to the mutable props group
 * 03's components declare. Group 00 should promote `Profile` into
 * `src/types/portfolio.ts` at integration.
 */

import type { IconName } from '../types/icons';

export interface ProfileSocial {
  label: string;
  href: string;
  icon: IconName;
}

export interface Profile {
  name: string;
  /** Mono kicker under the hero H1. */
  role: string;
  /** Short descriptor, used in the footer note and OG subtitle. */
  tagline: string;
  /** Text inside the hero availability pill. */
  availability: string;
  /** Hero lead paragraph, held to ~62ch. Keep it near 40 words. */
  lead: string;
  /** About section body — one entry per paragraph. */
  about: string[];
  location: string;
  email: string;
  phone: string;
  /** Served from `public/resume.pdf`. Replace the PDF, not this path. */
  resumeUrl: string;
  socials: ProfileSocial[];
}

export const profile = {
  name: 'Boluwaji Joshua Adedigba',
  role: 'Backend & Cloud Software Engineer',
  tagline: 'Backend and cloud systems built for scale.',
  availability: 'Available for opportunities',

  lead: 'TODO: one sentence on what you build and what you optimise for. For reference, the mockup used: "I design scalable Go microservices and cloud-native platforms across AWS and Azure, with a focus on event-driven systems, infrastructure automation, reliability, and cost optimization."',

  about: [
    'TODO: opening paragraph. Who you are and how long you have been doing this.',
    'TODO: second paragraph. The technical ground you cover.',
    'TODO: third paragraph. One or two concrete recent results, with numbers.',
  ],

  location: 'TODO: City, Country',
  email: 'joshboluwaji6@gmail.com',
  phone: '+601128557317',
  resumeUrl: '/resume.pdf',

  socials: [
    { label: 'GitHub', href: 'TODO: https://github.com/<you>', icon: 'github' },
    { label: 'LinkedIn', href: 'TODO: https://linkedin.com/in/<you>', icon: 'linkedin' },
    { label: 'Email', href: 'mailto:joshboluwaji6@gmail.com', icon: 'mail' },
  ],
} satisfies Profile;
