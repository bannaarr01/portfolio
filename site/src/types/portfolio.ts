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

/**
 * An outbound link on a project card — a repository, a package, a live site.
 * Only work that is publicly reachable carries these; client and employer work
 * has nothing to link to, which is why the field is optional on both types.
 */
export interface ProjectLink {
  label: string;
  href: string;
  icon: IconName;
}

export interface CaseStudy {
  title: string;
  company: string;
  /**
   * Overrides the "Company" prefix on the card. Open-source work has no
   * employer, and labelling a package "Company · Open source" is just wrong.
   * Defaults to "Company" when omitted.
   */
  companyLabel?: string;
  summary: string;
  problem: string;
  approach: string;
  result: string;
  architecture: string;
  tech: string[];
  links?: ProjectLink[];
}

export interface Project {
  title: string;
  company: string;
  /** See `CaseStudy.companyLabel`. Defaults to "Company". */
  companyLabel?: string;
  summary: string;
  highlights: string[];
  tech: string[];
  links?: ProjectLink[];
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
  /**
   * Present only on a qualification still being read. The string is the chip
   * label itself, so the wording lives with the data rather than in the
   * component; its presence is what switches on the in-progress treatment in
   * `Education.astro`. Omit it — do not pass `''` — once the degree is
   * conferred, and the entry renders exactly like the completed ones.
   */
  status?: string;
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
