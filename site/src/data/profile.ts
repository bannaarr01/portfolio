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
  /**
   * Where a resume PDF is expected to live: `public/resume.pdf`. Drop the file
   * in and it is served at this path — replace the PDF, not this string.
   *
   * Nothing links it at the moment. The hero's "Request My Resume" button
   * scrolls to the contact section instead, so the resume is asked for rather
   * than downloaded anonymously, and `public/resume.pdf` is not currently in
   * the tree. Kept as the one place any future link should read the path from.
   */
  resumeUrl: string;
  socials: ProfileSocial[];
}

export const profile = {
  name: 'Boluwaji Joshua Adedigba',

  /**
   * The resume is headed "Senior Software Engineer" and its summary frames the
   * work as full-stack. This takes the seniority from the resume and keeps the
   * backend/cloud specialism the site is built around (AGENTS.md § the two
   * constraints), which is the deliberate resolution of that conflict rather
   * than an oversight. The frontend stack is real and is present in
   * `skills.ts`; it is simply not what the site leads with.
   */
  role: 'Senior Backend & Cloud Software Engineer',
  tagline: 'Backend and cloud systems built for scale.',
  availability: 'Available for opportunities',

  lead: 'I build backend microservices and cloud-native platforms in Go and Node.js, with more than six years across REST API architecture, database optimization, event-driven processing, and Kubernetes delivery pipelines.',

  about: [
    'I’m a senior backend and cloud software engineer with more than six years of hands-on experience designing, delivering, and maintaining production systems across telecoms research, IoT, and enterprise web platforms.',
    'My work spans Go and Node.js microservices on Kubernetes, REST API architecture for internal and third-party integrations, single sign-on, message-driven processing, and CI/CD delivery. I have also architected retrieval-augmented generation services and led migrations off legacy PHP.',
    'Current work at Telekom R&D covers nationwide sales intelligence and workforce automation systems, where SSO consolidation cut login overhead 30% and Kubernetes CI/CD raised development velocity 40%. Earlier, freelancing out of Japan, I cut cloud infrastructure cost 65% by migrating a legacy PHP codebase to NestJS microservices and accelerated API responses 75%.',
  ],

  location: 'Kuala Lumpur, Malaysia',
  email: 'joshboluwaji6@gmail.com',
  phone: '+60 1128 557 317',
  resumeUrl: '/resume.pdf',

  /**
   * Taken from the hyperlinks embedded in the resume PDF; these were empty
   * placeholders before. The GitHub link drops the resume's
   * `?tab=repositories` query — it is a UI state of the profile page, not part
   * of the identity.
   *
   * An empty `href` is rendered as a disabled control rather than a dead link
   * — see `Contact.astro`.
   */
  socials: [
    { label: 'GitHub', href: 'https://github.com/bannaarr01', icon: 'github' },
    {
      label: 'LinkedIn',
      href: 'https://www.linkedin.com/in/b-joshua-adedigba-a96231211/',
      icon: 'linkedin',
    },
    { label: 'Email', href: 'mailto:joshboluwaji6@gmail.com', icon: 'mail' },
  ],
} satisfies Profile;
