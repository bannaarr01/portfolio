/**
 * Hero copy.
 *
 * Feeds: `components/home/Hero.astro`.
 *
 * A shaped view over `profile.ts` — the name, role, lead, and location are not
 * duplicated here, so editing `profile.ts` updates the hero too. Only the
 * hero-specific strings (greeting, CTAs, scroll cue) live in this file.
 */

import type { HeroContent } from '../components/home/types';
import { profile } from './profile';

export const hero = {
  availability: profile.availability,
  greeting: "Hi, I'm",
  name: profile.name,
  role: profile.role,
  lead: profile.lead,
  location: profile.location,

  primaryCta: { label: 'View My Work', href: '#projects', icon: 'arrow-right' },
  secondaryCta: { label: 'Download Resume', href: profile.resumeUrl, icon: 'download' },

  scrollCueLabel: 'Scroll to about section',
  scrollCueHref: '#about',
} satisfies HeroContent;
