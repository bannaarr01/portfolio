/**
 * Site-level metadata for the homepage document head.
 *
 * Feeds: `pages/index.astro` → `PortfolioLayout title/description`.
 *
 * Derived from `profile.ts` so the name and role are written once. Other
 * routes set their own title; this is the homepage's only.
 */

import { profile } from './profile';

export interface SiteMeta {
  title: string;
  description: string;
}

export const meta = {
  title: `${profile.name} | ${profile.role}`,
  description:
    'Backend and cloud engineering portfolio, plus an engineering journal on Go, AWS, system design, and running services in production.',
} satisfies SiteMeta;
