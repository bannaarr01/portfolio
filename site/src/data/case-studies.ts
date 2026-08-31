/**
 * The two featured "Selected case study" cards at the top of #projects.
 *
 * Feeds: `components/home/CaseStudies.astro`.
 *
 * ── SOURCE ───────────────────────────────────────────────────────────────
 * The migration study is drawn from `Boluwaji_Joshua_Adedigba_resume.pdf`
 * (revision dated 01/2026); its `result` must stay a figure the resume
 * actually states — 65% and 75% — and must not be rounded up.
 *
 * `nestjs-keycloak-auth` is not on the resume. Every claim in it was read off
 * the repository at `~/projects/nestjs-keycloak-auth`: the feature list and
 * the `keycloak-connect` independence from README.md, "194 tests" from the
 * `it(` blocks across its 25 spec files, "nine releases" from CHANGELOG.md,
 * and the guard/service counts from `src/`. The production adopters are the
 * author's own account and are stated as a count, not named. If the package
 * moves on, re-read those files rather than adjusting the numbers by feel.
 *
 * These render larger than the entries in `projects.ts` and are the only
 * cards that get the featured edge-light treatment (PLAN.md §4.6). Two
 * entries is the designed count: one is lonely in a 2-column grid, three
 * overflows onto a second row and stops reading as "selected". The Telekom
 * study that used to sit here moved down to `projects.ts` to make room.
 *
 * `problem` / `approach` / `result` render as a labelled three-row block, so
 * keep each to one or two sentences. `architecture` is a single caption line
 * under them.
 */

import type { CaseStudy } from '../types/portfolio';

export const caseStudies = [
  {
    title: 'Legacy PHP to NestJS Microservices',
    company: 'Freelance — Remote, Japan',
    summary:
      'Migrated a legacy PHP monolith to NestJS microservices on AWS, cutting infrastructure cost while tightening access control.',
    problem:
      'A legacy PHP codebase was expensive to run on cloud infrastructure, slow to respond under load, and secured with access rules too coarse to express per-resource permissions.',
    approach:
      'Migrated the codebase to NestJS microservices, enforced authentication through Casdoor with resource-based access policies, restructured database queries, added caching, and automated delivery with AWS CodePipeline, CodeBuild, and CodeDeploy.',
    result:
      'Reduced cloud infrastructure costs by 65% and accelerated API response times by 75%, with enhanced security across the platform.',
    architecture:
      'NestJS microservices on AWS with Casdoor-enforced resource-based access and a fully automated CodePipeline delivery path.',
    tech: ['NestJS', 'TypeScript', 'AWS CodePipeline', 'Casdoor', 'AWS RDS'],
  },
  {
    title: 'nestjs-keycloak-auth',
    companyLabel: 'Open source',
    company: 'npm · MIT licensed',
    summary:
      'A bearer-only Keycloak authentication and authorization module for NestJS, published to npm and running in production at three companies in Malaysia.',
    problem:
      'NestJS services fronting Keycloak had to reach for `keycloak-connect`, a browser-session library carrying middleware and grant stores an API server never uses, and one with no first-class answer for multi-tenant realms or offline token validation.',
    approach:
      'Built a bearer-only module with no runtime dependency on `keycloak-connect`: endpoints resolved through OIDC discovery, both online introspection and offline JWKS signature verification, an RS/ES/PS algorithm allowlist, per-realm notBefore revocation for multi-tenant safety, UMA resource and scope guards alongside role guards, and OIDC back-channel logout.',
    result:
      'Adopted in production by three companies in Malaysia, across nine releases held by 194 tests, with Codecov and an OpenSSF Scorecard reported on every build.',
    architecture:
      'Three NestJS guards over nine services, shipped as typed ESM with a KeycloakAuthError hierarchy, Fastify support, and peer ranges spanning NestJS 10 and 11.',
    tech: ['NestJS', 'TypeScript', 'Keycloak', 'OIDC', 'UMA', 'Jest'],
    links: [
      {
        label: 'npm',
        href: 'https://www.npmjs.com/package/nestjs-keycloak-auth',
        icon: 'external-link',
      },
      {
        label: 'GitHub',
        href: 'https://github.com/bannaarr01/nestjs-keycloak-auth',
        icon: 'github',
      },
    ],
  },
] satisfies CaseStudy[];
