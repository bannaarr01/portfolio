/**
 * Work history timeline.
 *
 * Feeds: `components/home/Experience.astro` (the `#experience` section).
 *
 * ── SOURCE ───────────────────────────────────────────────────────────────
 * Every role, date, location, and bullet here comes from
 * `Boluwaji_Joshua_Adedigba_resume.pdf` (revision dated 01/2026). This
 * replaced a placeholder timeline that claimed an Electrolux role and a
 * Xeersoft role, neither of which appears in the resume.
 *
 * Career start is therefore 07/2020 (DDL Associates), not 2022 — which is the
 * figure `hud.ts` derives its level and XP from. Changing a date here without
 * checking `CAREER_START` there will put the two out of step.
 *
 * ── EDITING ──────────────────────────────────────────────────────────────
 * The *shape* is deliberate and worth keeping while you swap copy in:
 *
 *   - four roles, newest first (the timeline renders in array order)
 *   - the first two roles carry multiple `blocks`, which is the case that
 *     proves multi-project roles render as nested groups rather than one flat
 *     list. Both genuinely have several distinct projects, so this is real
 *     structure and not a fixture.
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
    role: 'Researcher, Digital Backend & Cloud',
    company: 'Telekom Research & Development',
    location: 'Cyberjaya, Malaysia',
    start: '09/2022',
    end: 'Present',
    blocks: [
      {
        heading: 'Sales Intelligence & Workforce Automation',
        bullets: [
          'Architected and developed backend microservices for nationwide Sales Intelligence and Workforce Automation systems using Node.js (NestJS and Express) and the Golang Gin framework, ensuring seamless pod communication within a Kubernetes cluster',
          'Optimized database schemas and queries in MySQL and MongoDB, improving performance and scalability',
          'Collaborated with frontend teams to integrate user interfaces with server-side logic across multiple project modules',
        ],
      },
      {
        heading: 'Operational Safety & TM UNIFI Sales Support',
        bullets: [
          'Implemented and optimized RESTful APIs for internal and third-party integrations in a national operational safety system and the TM UNIFI Sales Support Ticket Management software',
          'Configured and integrated Single Sign-On solutions and developed a dedicated private library to streamline authentication, reducing login overhead by 30% and improving overall workflow efficiency',
          'Researched and implemented secure, efficient large-dataset download solutions with on-demand capabilities',
        ],
      },
      {
        heading: 'Delivery Engineering & Research',
        bullets: [
          'Engineered CI/CD pipelines for Kubernetes deployments, increasing development velocity by 40%',
          'Performed code reviews to enhance code quality and performance, using SonarQube for static analysis in the deployment pipeline',
          'Conducted research on exploratory projects including a generative-AI retrieval-augmented generation application, gRPC implementation, and other innovative technical solutions',
          'Actively participated in Agile development processes, including sprint planning, daily stand-ups, and reviews',
        ],
      },
    ],
    tech: [
      'Go',
      'Golang Gin',
      'Node.js',
      'NestJS',
      'Express.js',
      'TypeScript',
      'Kubernetes',
      'Docker',
      'MySQL',
      'MongoDB',
      'gRPC',
      'SonarQube',
      'CI/CD',
      'SSO',
    ],
  },
  {
    role: 'Full Stack Engineer & Solution Architect',
    company: 'Freelance',
    location: 'Remote — Japan',
    start: '01/2022',
    end: '09/2022',
    blocks: [
      {
        heading: 'Cloud Architecture & Platform Migration',
        bullets: [
          'Architected and developed a scalable retrieval-augmented generation AI solution integrating OpenAI, the Weaviate vector database, NestJS, and AWS services (ECS, S3, SES, RDS) with RabbitMQ for asynchronous processing',
          'Spearheaded migration of a legacy PHP codebase to NestJS microservices architecture, reducing cloud infrastructure costs by 65% while implementing enhanced security using Casdoor and resource-based access policies',
          'Accelerated API response times by 75% through comprehensive optimization of RESTful endpoints, database query restructuring, and implementation of efficient caching strategies',
          'Established robust CI/CD pipelines using AWS CodePipeline, CodeBuild, and CodeDeploy, automating deployment processes and ensuring consistent delivery workflows',
        ],
      },
      {
        heading: 'Product Delivery & Technical Leadership',
        bullets: [
          'Delivered complete end-to-end solutions including backend services, front-end dashboards, and deployment pipelines, improving client MVP delivery time by 40%',
          'Mentored and conducted comprehensive code reviews for the technical team, establishing best practices and improving overall code quality standards',
          'Built a Flutter and PHP-based SaaS application including subscription management, user analytics, and cloud-based configuration dashboards',
          'Developed a LINE chatbot integration for an e-commerce platform using PHP and LINE Messaging API webhooks, enabling real-time user interaction and order processing automation',
          'Developed and maintained a pitch evaluation and eye-contact scoring tool for recorded video presentations using Python and AWS Rekognition for gesture analysis, face landmark detection, and attention metrics',
        ],
      },
    ],
    tech: [
      'NestJS',
      'TypeScript',
      'PHP',
      'Python',
      'Flutter',
      'AWS ECS',
      'AWS RDS',
      'AWS S3',
      'AWS Rekognition',
      'AWS CodePipeline',
      'RabbitMQ',
      'OpenAI',
      'Weaviate',
      'Casdoor',
    ],
  },
  {
    role: 'Backend Systems Engineer (Contract)',
    company: 'Karisma System Sdn Bhd',
    location: 'Kuala Lumpur, Malaysia',
    start: '01/2021',
    end: '01/2022',
    blocks: [
      {
        heading: 'IoT Truck Weight Monitoring',
        bullets: [
          'Developed and maintained scalable backend microservices for an IoT-enabled truck weight monitoring system using Node.js (Express) and MongoDB, integrating real-time sensor data processing with AWS IoT Core, EventBridge, Lambda functions, and SNS for cloud-based analytics and event-driven notifications',
          'Implemented event-driven architecture using Redis-based queues for asynchronous data processing, improving system throughput by handling high-volume sensor data streams efficiently',
          'Designed user-friendly dashboards using React for fleet managers to monitor truck load weights',
        ],
      },
    ],
    tech: [
      'Node.js',
      'Express.js',
      'MongoDB',
      'Redis',
      'AWS IoT Core',
      'AWS EventBridge',
      'AWS Lambda',
      'Amazon SNS',
      'React',
    ],
  },
  {
    role: 'Backend Developer (Contract)',
    company: 'DDL Associates Sdn Bhd',
    location: 'Petaling Jaya, Malaysia',
    start: '07/2020',
    end: '12/2020',
    blocks: [
      {
        heading: 'Digital Transformation Platform',
        bullets: [
          'Developed a comprehensive digital transformation web application using PHP and Next.js, enhancing the firm’s efficiency, productivity, and cost savings by transitioning daily tasks to an online platform',
          'Leveraged a contemporary tech stack for scalability and seamless feature expansion',
        ],
      },
    ],
    tech: ['PHP', 'Next.js', 'JavaScript'],
  },
] satisfies Job[];
