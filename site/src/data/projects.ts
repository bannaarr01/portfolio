/**
 * The "Additional projects" grid below the featured case studies.
 *
 * Feeds: `components/home/Projects.astro`.
 *
 * Four entries fills a 2×2 grid cleanly at desktop width and stacks to a
 * single column below 900px. An odd count leaves a gap in the bottom row.
 *
 * `highlights` renders as a bulleted list inside the card. Three bullets per
 * card keeps all four cards the same height; more than four and the grid
 * rows stop aligning.
 */

import type { Project } from '../types/portfolio';

/**
 * Re-exported so `index.astro` pulls the whole #projects section from one
 * module. The entries themselves live in `case-studies.ts`.
 */
export { caseStudies } from './case-studies';

/** Kicker above each featured case-study card. */
export const caseStudyKicker = 'Selected case study';

/** Subheading introducing the four-card grid below the case studies. */
export const projectsSubheading = 'Additional projects';

export const projects = [
  {
    title: 'TODO: Project one',
    company: 'TODO: Employer or client',
    summary: 'TODO: one sentence on what this project was and what you did on it.',
    highlights: [
      'TODO: the first thing worth knowing about it.',
      'TODO: the second.',
      'TODO: the third.',
    ],
    tech: ['AWS', 'Azure', 'Go', 'Terraform', 'Kubernetes'],
  },
  {
    title: 'TODO: Project two',
    company: 'TODO: Employer or client',
    summary: 'TODO: one sentence on scope and your contribution.',
    highlights: [
      'TODO: a performance or resource result.',
      'TODO: a maintainability or design result.',
      'TODO: an operational result.',
    ],
    tech: ['Go', 'Python', 'Java', 'Kafka', 'Kubernetes', 'Docker'],
  },
  {
    title: 'TODO: Project three',
    company: 'TODO: Employer or client',
    summary: 'TODO: one sentence on what the platform did.',
    highlights: [
      'TODO: the read or API surface you built.',
      'TODO: the pipeline or automation you designed.',
      'TODO: how data moved end to end.',
    ],
    tech: ['Node.js', 'Apache Airflow', 'SFTP', 'PostgreSQL', 'Grafana'],
  },
  {
    title: 'TODO: Project four',
    company: 'TODO: Employer or client',
    summary: 'TODO: one sentence on the system and its users.',
    highlights: [
      'TODO: the auth or access-control work.',
      'TODO: the real-time or analytics surface.',
      'TODO: the historical or reporting surface.',
    ],
    tech: ['NestJS', 'Keycloak', 'IoT', 'Real-time Analytics', 'RBAC'],
  },
] satisfies Project[];
