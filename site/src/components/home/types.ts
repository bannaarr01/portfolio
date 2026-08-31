/**
 * Homepage content shapes that PLAN.md §5.3 does not define.
 *
 * §5.3 covers the *repeating record* types (Job, CaseStudy, Project,
 * SkillGroup, Testimonial, Principle, Degree, Certification, Stat,
 * StackItem). It does not cover the singleton prose blocks — hero copy,
 * about paragraphs, section headings, philosophy intros, the reading card,
 * the pull quote, or the contact block.
 *
 * Those are declared here because `src/components/home/**` is the only path
 * group 03 owns. Group 07 must produce data matching these shapes, and
 * group 00 should promote them into `src/types/portfolio.ts` at integration
 * so `src/data/**` can import them from a neutral location.
 *
 * Nothing here widens or redefines a §5.3 type.
 */
import type { IconName } from '../../types/icons';

/** A call-to-action button rendered by the hero or contact section. */
export interface Cta {
  label: string;
  href: string;
  icon: IconName;
}

/**
 * A section's heading. `lead` renders in --text, `accent` renders in the
 * cyan→teal gradient. `index` is the mono rail number ("01", "02", …).
 */
export interface SectionCopy {
  index?: string;
  lead: string;
  accent: string;
}

export interface HeroContent {
  /** Text inside the availability pill, e.g. "Available for opportunities". */
  availability: string;
  /** Everything before the name, e.g. "Hi, I'm". */
  greeting: string;
  /** Rendered in the cyan→teal gradient. */
  name: string;
  /** Mono kicker under the H1, e.g. "Backend & Cloud Software Engineer". */
  role: string;
  /** Lead paragraph, held to ~62ch. */
  lead: string;
  location: string;
  primaryCta: Cta;
  secondaryCta: Cta;
  /** Accessible label for the scroll cue anchor. */
  scrollCueLabel: string;
  /** Anchor the scroll cue points at, e.g. "#about". */
  scrollCueHref: string;
}

export interface AboutContent {
  paragraphs: string[];
}

export interface PhilosophyCard {
  kicker: string;
  title: string;
  body: string;
}

export interface ReadingContent {
  kicker: string;
  title: string;
  body: string;
  books: string[];
}

export interface PullQuote {
  label: string;
  quote: string;
}

export interface PhilosophyContent {
  /** The two wide intro cards. */
  intro: PhilosophyCard[];
  reading: ReadingContent;
  pullQuote: PullQuote;
}

export interface TestimonialsIntro {
  lead: string;
  linkLabel: string;
  linkHref: string;
}

/** Heading + kicker for one of the two education cards. */
export interface EducationCardCopy {
  kicker: string;
  title: string;
  icon: IconName;
}

export interface SocialLink {
  label: string;
  href: string;
  icon: IconName;
}

export interface ContactContent {
  heading: SectionCopy;
  lead: string;
  primaryCta: Cta;
  secondaryCta: Cta;
  email: string;
  phone: string;
  socials: SocialLink[];
}

/** Every section heading on the homepage, keyed by section. */
export interface SectionHeadings {
  about: SectionCopy;
  experience: SectionCopy;
  projects: SectionCopy;
  skills: SectionCopy;
  testimonials: SectionCopy;
  philosophy: SectionCopy;
  education: SectionCopy;
}
