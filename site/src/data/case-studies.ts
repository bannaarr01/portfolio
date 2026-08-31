/**
 * The two featured "Selected case study" cards at the top of #projects.
 *
 * Feeds: `components/home/CaseStudies.astro`.
 *
 * These render larger than the entries in `projects.ts` and are the only
 * cards that get the featured edge-light treatment (PLAN.md §4.6). Two
 * entries is the designed count: one is lonely in a 2-column grid, three
 * overflows onto a second row and stops reading as "selected".
 *
 * `problem` / `approach` / `result` render as a labelled three-row block, so
 * keep each to one or two sentences. `architecture` is a single caption line
 * under them.
 */

import type { CaseStudy } from '../types/portfolio';

export const caseStudies = [
  {
    title: 'TODO: Case study title',
    company: 'TODO: Employer or client',
    summary:
      'TODO: one sentence on what this system did and what you changed about it.',
    problem:
      'TODO: the constraint or tradeoff that made this hard. Say what was actually at stake, not that "the system needed improvement".',
    approach:
      'TODO: what you built and the decision that mattered most. Name the technologies only where the choice was load-bearing.',
    result:
      'TODO: the outcome, with a number. Cost, latency, throughput, incident count, or headcount freed.',
    architecture:
      'TODO: one line describing the resulting shape, e.g. "Event-driven services behind an API gateway, with capacity driven by utilisation metrics."',
    tech: ['TODO: Service', 'Terraform', 'Kafka', 'TODO: Broker', 'TODO: Monitoring'],
  },
  {
    title: 'TODO: Second case study title',
    company: 'TODO: Employer or client',
    summary:
      'TODO: one sentence on the system and your role in changing it.',
    problem:
      'TODO: what was failing, degrading, or costing too much, and who felt it.',
    approach:
      'TODO: the work you did, in the order it mattered.',
    result:
      'TODO: the measurable outcome. If you have a before-and-after pair, use both numbers.',
    architecture:
      'TODO: one line describing the resulting shape.',
    tech: ['NestJS', 'TypeScript', 'PostgreSQL', 'RabbitMQ', 'Prometheus'],
  },
] as const satisfies readonly CaseStudy[];
