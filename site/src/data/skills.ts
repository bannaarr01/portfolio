/**
 * The ten-card skills grid.
 *
 * Feeds: `components/home/Skills.astro` (the `#skills` section).
 *
 * ── ICONS ────────────────────────────────────────────────────────────────
 * `icon` must be a valid `IconName` from group 00's registry in
 * `components/ui/Icon.astro`. A typo is a typecheck failure, which is the
 * point — there is no silent fallback glyph.
 *
 * ── COUNT ────────────────────────────────────────────────────────────────
 * Ten groups is what the grid is tuned for. `items` is a free string array
 * rendered as tag pills; four to seven per card keeps the row heights close
 * enough that the grid does not look ragged.
 *
 * Everything here except "Spoken Languages" is stack-descriptive rather than
 * biographical, so it is safe to keep as-is and prune down to what you
 * actually work with.
 */

import type { SkillGroup } from '../types/portfolio';

export const skillGroups = [
  {
    title: 'Programming Languages',
    icon: 'code',
    items: ['Go', 'TypeScript', 'JavaScript', 'Python', 'PHP'],
  },
  {
    title: 'Cloud Platforms',
    icon: 'cloud',
    items: ['AWS', 'Azure'],
  },
  {
    title: 'Backend Engineering',
    icon: 'server',
    items: [
      'System Design',
      'REST APIs',
      'Microservices',
      'Event-Driven Systems',
      'Distributed Systems',
      'High-Concurrency Services',
    ],
  },
  {
    title: 'Infrastructure & Delivery',
    icon: 'cloud-cog',
    items: ['Terraform', 'Docker', 'Kubernetes', 'GitHub Actions', 'CI/CD'],
  },
  {
    title: 'Messaging',
    icon: 'layers',
    items: ['Kafka', 'RabbitMQ', 'Azure Event Hubs', 'AWS MSK'],
  },
  {
    title: 'Databases',
    icon: 'database',
    items: ['PostgreSQL', 'MySQL', 'MariaDB', 'MongoDB'],
  },
  {
    title: 'Observability',
    icon: 'activity',
    items: ['Prometheus', 'Grafana', 'CloudWatch', 'Azure Monitor', 'Datadog'],
  },
  {
    title: 'Security & Identity',
    icon: 'shield',
    items: ['IAM', 'OAuth2/OIDC', 'RBAC', 'Keycloak'],
  },
  {
    title: 'Spoken Languages',
    icon: 'languages',
    items: ['TODO: English', 'TODO: second language', 'TODO: third language'],
  },
  {
    title: 'Working Style',
    icon: 'sparkles',
    items: [
      'Work Ethic & Ownership',
      'Proactive Thinking',
      'Continuous Improvement',
      'Clear Written & Verbal Communication',
    ],
  },
] as const satisfies readonly SkillGroup[];
