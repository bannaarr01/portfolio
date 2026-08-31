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
import { hud } from './hud';
import { profile } from './profile';

export const hero = {
  availability: profile.availability,
  greeting: "Hi, I'm",
  name: profile.name,
  role: profile.role,
  lead: profile.lead,
  location: profile.location,

  // The stat readout under the lead. Lives in its own module because the
  // level and XP figures are build-time derivations, not copy — see `hud.ts`.
  hud,

  // Both CTAs scroll rather than leave the page. "Request" is an ask, not a
  // download: sending someone to the contact section lets them say who they
  // are, which is the point of the wording. The PDF is still served at
  // `profile.resumeUrl` for anyone who wants it directly.
  primaryCta: { label: 'View My Work', href: '#projects', icon: 'arrow-right' },
  secondaryCta: { label: 'Request My Resume', href: '#contact', icon: 'mail' },

  scrollCueLabel: 'Scroll to about section',
  scrollCueHref: '#about',
} satisfies HeroContent;
