/**
 * The "Additional projects" grid below the featured case studies.
 *
 * Feeds: `components/home/Projects.astro`.
 *
 * ── ORDER ────────────────────────────────────────────────────────────────
 * Array order is display order, and it is deliberate rather than
 * chronological: RAG platform, Packwright, Elevate Systems, then the employer
 * projects. The two open/linkable projects sit near the top because they are
 * the ones a reader can go and look at.
 *
 * ── SOURCE ───────────────────────────────────────────────────────────────
 * Four entries come from `Boluwaji_Joshua_Adedigba_resume.pdf` (revision
 * dated 01/2026) — RAG platform, TM UNIFI, IoT Truck, Digital Transformation
 * — one project per employer, because the grid is the breadth argument and
 * spreading it across roles says more than four entries from one job would.
 *
 * Three are additions, and none is on the resume:
 *
 * - "Packwright" was read off `~/projects/packwright`: the two front-ends and
 *   the ~150ms manifest reload from README.md, the AWS SDK v2 services from
 *   go.mod, and "1,140 tests" from the `func Test` count across its 174
 *   `_test.go` files. Re-read those rather than adjusting the numbers by feel.
 * - "Elevate Systems" was read off `~/projects/elevate-systems`:
 *   `output: 'export'` in next.config.ts, the S3/OAC/CloudFront/CloudFront-
 *   Function stack in cloud-formation/website.yaml, and the API-Gateway-to-
 *   Lambda-to-SES contact path in lambdas/contact-form/.
 * - "Sales Intelligence & Workforce Automation" was a featured case study
 *   until `nestjs-keycloak-auth` took the second featured slot. It moved here
 *   rather than being dropped, condensed from its problem/approach/result
 *   form into three highlights that keep the 30% and 40% figures.
 *
 * The count is no longer load-bearing: `Projects.astro` spans a lone trailing
 * card across the row, so an odd number of entries closes the grid cleanly
 * instead of leaving a hole. Below 900px everything stacks to one column.
 *
 * `highlights` renders as a bulleted list inside the card. Three bullets per
 * card keeps the cards the same height; more than four and the grid rows
 * stop aligning.
 *
 * `links` is optional and only set on work that is publicly reachable —
 * employer projects have nothing to link to.
 */

import type { Project } from '../types/portfolio';

/**
 * Re-exported so `index.astro` pulls the whole #projects section from one
 * module. The entries themselves live in `case-studies.ts`.
 */
export { caseStudies } from './case-studies';

/** Kicker above each featured case-study card. */
export const caseStudyKicker = 'Selected case study';

/** Subheading introducing the project grid below the case studies. */
export const projectsSubheading = 'Additional projects';

export const projects = [
  {
    title: 'Retrieval-Augmented Generation Platform',
    company: 'Freelance — Remote, Japan',
    summary:
      'A generative-AI solution pairing OpenAI with a Weaviate vector database behind NestJS services on AWS, with queue-backed asynchronous processing.',
    highlights: [
      'Integrated OpenAI and the Weaviate vector database behind NestJS services',
      'Ran on AWS ECS, S3, SES, and RDS with RabbitMQ for asynchronous processing',
      'Architected as a scalable full-stack solution rather than a single service',
    ],
    tech: ['NestJS', 'OpenAI', 'Weaviate', 'RabbitMQ', 'AWS ECS', 'AWS RDS'],
  },
  {
    title: 'Packwright',
    companyLabel: 'Open source',
    company: 'Apache-2.0',
    summary:
      'A Go tool that scaffolds and runs AWS infrastructure templates, shipping a terminal UI and a desktop GUI from one binary that read the same manifests on disk.',
    highlights: [
      'One binary, two front-ends — a Bubble Tea TUI by default, a Wails and Svelte window behind --gui',
      'YAML command manifests hot-reload from disk in about 150ms, with slash-conflict resolution across packs',
      'Drives CloudFormation, CloudWatch, CodePipeline, and ACM through AWS SDK v2, under 1,140 Go tests',
    ],
    tech: ['Go', 'Bubble Tea', 'Wails', 'Svelte', 'AWS SDK v2', 'CloudFormation'],
    links: [{ label: 'GitHub', href: 'https://github.com/bannaarr01/packwright', icon: 'github' }],
  },
  {
    title: 'Elevate Systems',
    company: 'Freelance — US client',
    summary:
      'Marketing and services site for a US IT-infrastructure contractor, statically exported from Next.js and served from a private S3 bucket behind CloudFront.',
    highlights: [
      'Next.js App Router exported to static HTML, so there is no server to run or patch',
      'S3 with origin access control, CloudFront, and a CloudFront Function for URL rewrites, all declared in CloudFormation',
      'Contact form posts to an HTTP API Gateway and Lambda that sends through SES, with honeypot and length validation',
    ],
    tech: ['Next.js', 'React', 'TypeScript', 'Tailwind', 'CloudFormation', 'AWS Lambda'],
    links: [
      { label: 'Live site', href: 'https://elevatesystemsservices.com/', icon: 'external-link' },
    ],
  },
  {
    title: 'TM UNIFI Sales Support Ticket Management',
    company: 'Telekom Research & Development',
    summary:
      'REST API layer for a national ticket-management system, including third-party integrations and on-demand export of large datasets.',
    highlights: [
      'Implemented and optimized RESTful APIs for internal and third-party integrations',
      'Consolidated authentication behind a shared private single sign-on library',
      'Built secure, efficient large-dataset download with on-demand capabilities',
    ],
    tech: ['NestJS', 'Node.js', 'MySQL', 'MongoDB', 'Kubernetes', 'SSO'],
  },
  {
    title: 'IoT Truck Weight Monitoring',
    company: 'Karisma System Sdn Bhd',
    summary:
      'Event-driven backend ingesting real-time sensor data from IoT-enabled trucks, with React dashboards for fleet managers.',
    highlights: [
      'Processed real-time sensor data via AWS IoT Core, EventBridge, Lambda, and SNS',
      'Handled high-volume streams with Redis-backed queues for async processing',
      'Built React dashboards for fleet managers to monitor truck load weights',
    ],
    tech: ['Node.js', 'Express.js', 'MongoDB', 'Redis', 'AWS IoT Core', 'React'],
  },
  {
    title: 'Digital Transformation Platform',
    company: 'DDL Associates Sdn Bhd',
    summary:
      'Web application that moved a firm\u2019s daily paper-based tasks onto an online platform, built on PHP with a Next.js front end.',
    highlights: [
      'Transitioned daily tasks to an online platform, improving firm efficiency',
      'Delivered measurable productivity gains and cost savings',
      'Used a contemporary stack for scalability and seamless feature expansion',
    ],
    tech: ['PHP', 'Next.js', 'JavaScript'],
  },
  {
    title: 'Sales Intelligence & Workforce Automation',
    company: 'Telekom Research & Development',
    summary:
      'Nationwide backend platform built on Go and Node.js microservices in Kubernetes, with consolidated single sign-on and gated CI/CD.',
    highlights: [
      'Built Golang Gin and Node.js microservices communicating inside a Kubernetes cluster',
      'Consolidated authentication behind a shared private SSO library, cutting login overhead 30%',
      'Gated Kubernetes CI/CD with SonarQube static analysis, raising delivery velocity 40%',
    ],
    tech: ['Go', 'Golang Gin', 'NestJS', 'Kubernetes', 'MySQL', 'MongoDB'],
  },
] satisfies Project[];
