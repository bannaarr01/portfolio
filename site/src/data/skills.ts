/**
 * The ten-card skills grid.
 *
 * Feeds: `components/home/Skills.astro` (the `#skills` section).
 *
 * ── SOURCE ───────────────────────────────────────────────────────────────
 * Every entry is taken from the Skills section of
 * `Boluwaji_Joshua_Adedigba_resume.pdf` (revision dated 01/2026). Nothing is
 * added that the resume does not list — which is why three groups that used to
 * be here are gone:
 *
 *   - **Observability** (Prometheus, Grafana, CloudWatch, Datadog) — the
 *     resume names no observability tooling beyond SonarQube.
 *   - **Terraform** and **Kafka** — neither appears anywhere in the resume,
 *     despite Terraform being what deploys this very site. If they belong,
 *     add them to the resume first and then here.
 *   - **Spoken Languages** — removed while the resume listed English only,
 *     because a one-item card reads as an error rather than a fact. Restored
 *     at the owner's request once Yoruba was added: two entries is a list.
 *
 * ── ORDERING ─────────────────────────────────────────────────────────────
 * Backend-weighted on purpose. The frontend and mobile stack is real and
 * substantial (React, Next.js, Angular, Vue, Flutter) but sits ninth, because
 * the site leads with the backend/cloud pitch — see the `role` note in
 * `profile.ts`.
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
 */

import type { SkillGroup } from '../types/portfolio';

/**
 * Re-exported so `index.astro` pulls the whole #skills section from one
 * module. The marquee entries themselves live in `stack.ts`.
 */
export { stack } from './stack';

/** Left-hand label on the marquee strip's header row. */
export const stackTitle = 'Core technology stack';

/** Right-hand label on the same row. */
export const stackSubtitle = 'Backend · Cloud · Platform';

export const skillGroups = [
  {
    title: 'Programming Languages',
    icon: 'code',
    items: [
      'Go',
      'TypeScript',
      'JavaScript',
      'Python',
      'C++',
      'C',
      'PHP',
      'Java',
      'C#',
      'Dart',
    ],
  },
  {
    title: 'Backend Engineering',
    icon: 'layers',
    items: [
      'System Design',
      'RESTful APIs',
      'Microservices',
      'Event-Driven Systems',
      'Database Optimization',
      'Performance Enhancement',
    ],
  },
  {
    title: 'Backend Frameworks & Tools',
    icon: 'server',
    items: [
      'Node.js & NestJS',
      'Express.js',
      'Golang Gin',
      'FastAPI',
      'Spring Boot',
      'gRPC',
      '.NET',
    ],
  },
  {
    /* "AWS, Azure" alone left this card visibly empty next to its neighbours,
       so it lists the individual services the resume names across the Telekom,
       freelance, and Karisma roles. The two platform names stay first. */
    title: 'Cloud Platforms',
    icon: 'cloud',
    /**
     * Platforms only. The individual AWS services that used to pad this out —
     * ECS, Lambda, RDS, S3, IoT Core, EventBridge — are products of one of
     * these three, not peers of them, and they already appear where the work
     * that used them is described.
     */
    items: ['AWS', 'Azure', 'GCP'],
  },
  {
    title: 'Infrastructure & Delivery',
    icon: 'cloud-cog',
    items: [
      'Docker',
      'Kubernetes',
      'OpenShift',
      'AWS CodePipeline',
      'Azure DevOps',
      'SonarQube',
      'Nginx',
      'CI/CD',
    ],
  },
  {
    title: 'Messaging & Event Processing',
    icon: 'activity',
    items: [
      'RabbitMQ',
      'BullMQ',
      'Redis Pub/Sub',
      'AWS SQS',
      'Amazon SNS',
      'Azure Service Bus',
      'Apache ActiveMQ',
    ],
  },
  {
    title: 'Databases',
    icon: 'database',
    items: ['PostgreSQL', 'MySQL', 'MSSQL', 'MongoDB', 'Redis', 'VectorDB', 'Firestore'],
  },
  {
    title: 'Authentication & Security',
    icon: 'shield',
    items: [
      'Keycloak',
      'Casdoor',
      'OAuth 2.0',
      'OpenID Connect',
      'JWT',
      'Passport.js',
      'LDAP',
      'RBAC',
    ],
  },
  {
    title: 'Frontend & Mobile',
    icon: 'sparkles',
    items: [
      'React',
      'Next.js',
      'Vue.js',
      'Angular',
      'Flutter',
      'Redux Toolkit',
      'Tailwind CSS',
    ],
  },
  {
    title: 'Methodologies & Leadership',
    icon: 'briefcase',
    items: [
      'Agile / Scrum',
      'Test-Driven Development',
      'Technical Lead',
      'Team Mentoring',
      'Code Review',
      'Cross-functional Collaboration',
    ],
  },
  {
    title: 'Spoken Languages',
    icon: 'languages',
    items: ['English', 'Yoruba'],
  },
] satisfies SkillGroup[];
