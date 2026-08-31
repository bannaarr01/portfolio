/**
 * Identity and contact details.
 *
 * Feeds: the header brand, the hero (`components/home/Hero.astro`), the About
 * section, the Contact section, and both footers. Also the default author on
 * article bylines and in the RSS channel.
 *
 * ── EDITING ──────────────────────────────────────────────────────────────
 * Anything marked `TODO:` is a placeholder. Grep the whole of `src/data/` for
 * `TODO:` to find every field still waiting on real content.
 *
 * ── TYPING ───────────────────────────────────────────────────────────────
 * PLAN.md §5.3 does not define a `Profile` interface, so this module exports
 * its own inferred type rather than `satisfies`-ing one from `src/types/`.
 * If group 00 later adds `Profile` to `types/portfolio.ts`, switch the
 * `as const` below to `as const satisfies Profile` and delete the local type.
 */

export const profile = {
  name: 'Boluwaji Joshua Adedigba',

  /** Sits directly under the name in the hero. */
  role: 'Backend & Cloud Software Engineer',

  /** Short descriptor. Used in the footer note and as the OG image subtitle. */
  tagline: 'Backend and cloud systems built for scale.',

  /** The availability pill above the hero heading. Set to null to hide it. */
  availability: 'Available for opportunities',

  /** The one-paragraph hero summary. Keep it to roughly 40 words. */
  lead: 'TODO: one sentence on what you build and what you optimise for. The mockup used: "I design scalable Go microservices and cloud-native platforms across AWS and Azure, with a focus on event-driven systems, infrastructure automation, reliability, and cost optimization."',

  /**
   * The About section body. One string per paragraph; the section renders as
   * many paragraphs as this array has entries.
   */
  about: [
    'TODO: opening paragraph. Who you are and how long you have been doing this.',
    'TODO: second paragraph. The technical ground you cover.',
    'TODO: third paragraph. One or two concrete recent results, with numbers.',
  ],

  location: 'TODO: City, Country',
  email: 'joshboluwaji6@gmail.com',
  phone: '+601128557317',

  /** Served from `public/resume.pdf`. Replace the placeholder PDF, not this path. */
  resumeUrl: '/resume.pdf',

  /**
   * Rendered as the contact icon row and in the footer.
   * `icon` must be a valid `IconName` from group 00's registry.
   */
  socials: [
    { label: 'GitHub', href: 'TODO: https://github.com/<you>', icon: 'github' },
    { label: 'LinkedIn', href: 'TODO: https://linkedin.com/in/<you>', icon: 'linkedin' },
    { label: 'Email', href: 'mailto:joshboluwaji6@gmail.com', icon: 'mail' },
    { label: 'WhatsApp', href: 'https://wa.me/601128557317', icon: 'message-circle' },
  ],
} as const;

export type Profile = typeof profile;
