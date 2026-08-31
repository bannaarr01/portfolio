import type { IconName } from './icons';

/**
 * Shapes for the portfolio content in `src/data/` (owned by group 07).
 *
 * These have no markdown body, so they are typed TypeScript modules rather
 * than content collections. Author the data with `satisfies Job[]` and a
 * missing field becomes a compile error.
 */

export interface Stat {
  label: string;
  value: string;
}

export interface JobBlock {
  heading: string;
  bullets: string[];
}

export interface Job {
  role: string;
  company: string;
  location: string;
  start: string;
  /** 'Present' is allowed. */
  end: string;
  blocks: JobBlock[];
  tech: string[];
}

export interface CaseStudy {
  title: string;
  company: string;
  summary: string;
  problem: string;
  approach: string;
  result: string;
  architecture: string;
  tech: string[];
}

export interface Project {
  title: string;
  company: string;
  summary: string;
  highlights: string[];
  tech: string[];
}

export interface SkillGroup {
  title: string;
  icon: IconName;
  items: string[];
}

export interface Testimonial {
  quote: string;
  name: string;
  role: string;
  relationship: string;
  initials: string;
}

export interface Principle {
  num: string;
  title: string;
  body: string;
}

export interface Degree {
  period: string;
  location: string;
  qualification: string;
  institution: string;
  notes: string[];
}

export interface Certification {
  title: string;
  issuer: string;
  url: string;
}

export interface StackItem {
  name: string;
  icon: IconName;
}
