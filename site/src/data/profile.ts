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

  lead: 'I design scalable Go microservices and cloud-native platforms across AWS and Azure, with a focus on event-driven systems, infrastructure automation, reliability, and cost optimization.',

  about: [
    'I’m a backend and cloud software engineer with more than four years of experience modernizing enterprise systems across cloud platforms, HR technology, environmental monitoring, IoT, and ERP.',
    'My work spans Azure-to-AWS migration, Go microservice re-engineering, Terraform automation, Kafka-based integration, API architecture, observability, and Kubernetes deployments.',
    'Recent work includes automating Azure IoT Hub capacity to control cost and prevent throttling. Earlier, I increased HR-platform throughput 3× to support more than 3,000 concurrent users and led a first Go microservice initiative.',
  ],

  location: 'Malaysia',
  email: 'joshboluwaji6@gmail.com',
  phone: '+601128557317',
  resumeUrl: '/resume.pdf',

  /**
   * The mockup left every social `href` as `#`, so the profile URLs are the one
   * thing here that is genuinely not known. An empty `href` is rendered as a
   * disabled control rather than a dead link — see `Contact.astro`. Fill these
   * in and the buttons activate with no other change.
   */
  socials: [
    { label: 'GitHub', href: '', icon: 'github' },
    { label: 'LinkedIn', href: '', icon: 'linkedin' },
    { label: 'Email', href: 'mailto:joshboluwaji6@gmail.com', icon: 'mail' },
  ],
} satisfies Profile;
