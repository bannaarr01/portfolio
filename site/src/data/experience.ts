/**
 * Work history timeline.
 *
 * Feeds: `components/home/Experience.astro` (the `#experience` section).
 *
 * ── EDITING ──────────────────────────────────────────────────────────────
 * Every `TODO:` is a placeholder. The *shape* here is deliberate and worth
 * keeping while you swap the copy in:
 *
 *   - three roles, newest first (the timeline renders in array order)
 *   - the middle role carries three `blocks`, which is the case that proves
 *     multi-project roles render correctly. Do not flatten it to one block
 *     until you have a real role that needs only one.
 *   - `end: 'Present'` is the sentinel for a current role. Anything else is
 *     printed verbatim, so keep the `MM/YYYY` format consistent.
 *
 * `tech` entries are free strings, not `IconName` values — they render as
 * text pills. Keep each role's list under about 18 entries or the tag row
 * grows taller than the timeline node beside it.
 */

import type { Job } from '../types/portfolio';

export const jobs = [
  {
    role: 'TODO: Backend & Cloud Software Engineer',
    company: 'TODO: Current employer',
    location: 'TODO: City, Country',
    start: 'TODO: 05/2026',
    end: 'Present',
    blocks: [
      {
        heading: 'TODO: Programme or system name',
        bullets: [
          'TODO: what you owned here and what changed because of it. One line, verifiable in an interview.',
          'TODO: a second responsibility. Attach a number if you have one.',
          'TODO: infrastructure or tooling work, and why it was needed.',
          'TODO: something you built that outlived the ticket that asked for it.',
          'TODO: a cost, latency, or reliability result.',
          'TODO: the thing you would actually want to be asked about.',
        ],
      },
    ],
    tech: [
      'Go',
      'Python',
      'Java',
      'AWS',
      'Azure',
      'Terraform',
      'MongoDB',
      'Kafka',
      'Kubernetes',
      'Docker',
    ],
  },
  {
    // Three blocks. This is the fixture that proves a role with several
    // distinct projects renders as nested groups rather than one flat list.
    role: 'TODO: Backend Software Engineer',
    company: 'TODO: Previous employer',
    location: 'TODO: City, Country',
    start: 'TODO: 05/2023',
    end: 'TODO: 05/2026',
    blocks: [
      {
        heading: 'TODO: Primary system',
        bullets: [
          'TODO: the headline result from this role, with the number that makes it credible.',
          'TODO: something you proposed rather than were assigned.',
          'TODO: an API, auth, or security responsibility.',
          'TODO: asynchronous or scheduled work you designed.',
          'TODO: an integration you owned end to end.',
          'TODO: observability or tooling you introduced.',
        ],
      },
      {
        heading: 'TODO: Second project',
        bullets: [
          'TODO: what this system did and which part was yours.',
          'TODO: the pipeline, job, or service you built for it.',
          'TODO: how the data got from source to storage.',
        ],
      },
      {
        heading: 'TODO: Third project',
        bullets: [
          'TODO: the authentication or access-control work.',
          'TODO: the read path you built and what it had to sustain.',
        ],
      },
    ],
    tech: [
      'NestJS',
      'TypeScript',
      'Node.js',
      'Go',
      'PostgreSQL',
      'MySQL',
      'RabbitMQ',
      'Apache Airflow',
      'Kubernetes',
      'Docker',
      'Keycloak',
      'OAuth',
      'Prometheus',
      'Grafana',
      'Jest',
    ],
  },
  {
    role: 'TODO: Software Developer',
    company: 'TODO: First employer',
    location: 'TODO: City, Country',
    start: 'TODO: 05/2022',
    end: 'TODO: 04/2023',
    blocks: [
      {
        heading: 'TODO: Platform or product name',
        bullets: [
          'TODO: what you contributed to and in which part of the stack.',
          'TODO: the APIs or features you built and maintained.',
          'TODO: a performance or quality improvement you can point at.',
        ],
      },
    ],
    tech: ['PHP', 'MySQL', 'JavaScript', 'jQuery', 'Bootstrap', 'HTML', 'CSS'],
  },
] as const satisfies readonly Job[];
