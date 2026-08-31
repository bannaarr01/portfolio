/**
 * Work history timeline.
 *
 * Feeds: `components/home/Experience.astro` (the `#experience` section).
 *
 * ── EDITING ──────────────────────────────────────────────────────────────
 * The *shape* here is deliberate and worth keeping while you swap copy in:
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
    role: 'Backend & Cloud Software Engineer',
    company: 'Electrolux Home Appliance Sdn Bhd',
    location: 'Selangor, Malaysia',
    start: '05/2026',
    end: 'Present',
    blocks: [
      {
        heading: 'Cloud Platform Modernization',
        bullets: [
          'Participated in migrating enterprise backend services from Microsoft Azure to AWS, improving cloud scalability and simplifying long-term infrastructure management',
          'Re-engineered existing backend microservices in Go to improve performance, maintainability, and resource utilization',
          'Implemented Infrastructure as Code with Terraform for repeatable cloud provisioning and consistent environments',
          'Developed event-driven integrations with Kafka and Azure Event Hubs for reliable asynchronous communication',
          'Implemented automatic Azure IoT Hub SKU scaling based on real-time capacity utilization, reducing infrastructure cost while preventing service throttling',
          'Optimized backend services and cloud resources through performance tuning, monitoring, and architectural improvements',
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
    role: 'Backend Software Engineer',
    company: 'Telekom Research & Development Sdn Bhd',
    location: 'Selangor, Malaysia',
    start: '05/2023',
    end: '05/2026',
    blocks: [
      {
        heading: 'HR Systems (ERA/JESSICA)',
        bullets: [
          'Spearheaded backend enhancement and refactoring of a legacy HR system, improving scalability, maintainability, and performance by 3× to support more than 3,000 concurrent users',
          'Proposed and led the company’s first Go-based microservice REST API, secured supervisor approval, and delivered the initial service to validate Go for production use',
          'Developed secure REST APIs with Multi-Factor Authentication and Google reCAPTCHA integration',
          'Implemented RabbitMQ-based asynchronous employee data synchronization and task scheduling',
          'Integrated the LinkedIn API into the learning module for employee training and development insights',
          'Instrumented services and metrics dashboards with Prometheus and Grafana',
        ],
      },
      {
        heading: 'Smart Forestry Platform',
        bullets: [
          'Built data-driven dashboard APIs serving real-time animal population and environmental metrics',
          'Designed Apache Airflow pipelines for automated SFTP data retrieval and processing',
          'Created DAGs for end-to-end orchestration from extraction to centralized storage',
        ],
      },
      {
        heading: 'IoT Water Monitoring (SWIMS2.0)',
        bullets: [
          'Implemented Keycloak authentication with Role-Based Access Control for secure user management',
          'Developed high-performance REST APIs for real-time and historical water quality visualization and analysis',
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
    role: 'Software Developer',
    company: 'Xeersoft Sdn Bhd',
    location: 'Kuala Lumpur, Malaysia',
    start: '05/2022',
    end: '04/2023',
    blocks: [
      {
        heading: 'ERP Platform',
        bullets: [
          'Contributed to accounting-platform upgrades and feature improvements using modern web technologies',
          'Developed and maintained PHP Slim 4 REST APIs for web and mobile application integrations',
          'Implemented performance optimizations that improved ERP system efficiency and user satisfaction',
        ],
      },
    ],
    tech: ['PHP', 'Slim 4', 'MySQL', 'JavaScript', 'jQuery', 'Bootstrap', 'HTML', 'CSS'],
  },
] satisfies Job[];
