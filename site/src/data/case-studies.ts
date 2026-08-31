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
    title: 'IoT Cloud Cost Optimization',
    company: 'Electrolux Home Appliance Sdn Bhd',
    summary:
      'Automated Azure IoT Hub capacity management and cloud provisioning to improve reliability and cost efficiency.',
    problem:
      'Fixed IoT Hub capacity created a tradeoff between paying for unused headroom and risking service throttling during utilization spikes.',
    approach:
      'Implemented utilization-driven SKU scaling, supported by Terraform-managed infrastructure, monitoring, and event-driven cloud integrations.',
    result:
      'Reduced cloud infrastructure cost while preserving capacity and preventing service throttling.',
    architecture:
      'Utilization-driven IoT capacity automation supported by Infrastructure as Code and event-driven integration.',
    tech: ['Azure IoT Hub', 'Terraform', 'Kafka', 'Azure Event Hubs', 'Azure Monitor'],
  },
  {
    title: 'HR Systems Modernization (ERA/JESSICA)',
    company: 'Telekom Research & Development Sdn Bhd',
    summary:
      'Enhanced and refactored a legacy HR backend to improve scalability, maintainability, security, and production observability.',
    problem:
      'A legacy HR backend needed greater throughput, maintainability, security, and production visibility to support a growing internal user base.',
    approach:
      'Refactored backend services, introduced asynchronous RabbitMQ workflows, strengthened authentication, and added Prometheus and Grafana observability.',
    result:
      'Increased throughput 3×, scaling the platform from 1,000 to more than 3,000 concurrent users.',
    architecture:
      'Event-driven microservices with a centralized API gateway and RabbitMQ for inter-service communication.',
    tech: ['NestJS', 'TypeScript', 'PostgreSQL', 'RabbitMQ', 'Prometheus'],
  },
] satisfies CaseStudy[];
