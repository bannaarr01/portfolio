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
    title: 'Azure-to-AWS Platform Migration',
    company: 'Electrolux Home Appliance Sdn Bhd',
    summary:
      'Modernized enterprise backend infrastructure by participating in the migration of services from Microsoft Azure to AWS.',
    highlights: [
      'Moved enterprise backend services toward AWS cloud infrastructure',
      'Improved cloud scalability',
      'Simplified long-term infrastructure management',
    ],
    tech: ['AWS', 'Azure', 'Go', 'Terraform', 'Kubernetes'],
  },
  {
    title: 'Cloud-Native Go Microservices',
    company: 'Electrolux Home Appliance Sdn Bhd',
    summary:
      'Re-engineered existing backend microservices in Go as part of a broader enterprise platform modernization effort.',
    highlights: [
      'Improved backend performance and resource utilization',
      'Improved service maintainability',
      'Optimized services through monitoring and architectural improvements',
    ],
    tech: ['Go', 'Python', 'Java', 'Kafka', 'Kubernetes', 'Docker'],
  },
  {
    title: 'Smart Forestry Platform',
    company: 'Telekom Research & Development Sdn Bhd',
    summary:
      'A comprehensive monitoring platform for wildlife and environmental metrics using IoT and big data pipelines.',
    highlights: [
      'Built real-time dashboard APIs for animal population and environmental metrics',
      'Automated SFTP data retrieval and processing with Apache Airflow',
      'Designed DAGs from data extraction through centralized storage',
    ],
    tech: ['Node.js', 'Apache Airflow', 'SFTP', 'PostgreSQL', 'Grafana'],
  },
  {
    title: 'SWIMS 2.0 IoT Monitoring',
    company: 'Telekom Research & Development Sdn Bhd',
    summary:
      'High-performance water quality monitoring system with robust authentication and real-time analytics.',
    highlights: [
      'Implemented Keycloak authentication and Role-Based Access Control',
      'Developed APIs for real-time water quality visualization',
      'Supported historical water quality data analysis',
    ],
    tech: ['NestJS', 'Keycloak', 'IoT', 'Real-time Analytics', 'RBAC'],
  },
] satisfies Project[];
