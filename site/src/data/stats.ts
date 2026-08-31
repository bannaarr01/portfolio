/**
 * The four-up figure row under the About section.
 *
 * Feeds: `components/home/Stats.astro`.
 *
 * ── SOURCE ───────────────────────────────────────────────────────────────
 * Derived from `Boluwaji_Joshua_Adedigba_resume.pdf` (revision 01/2026).
 *
 * "6+" years comes from the employment dates (07/2020 to present), not from
 * the resume's own summary line, which says "over 5 years" — that line was
 * written in 01/2026 and is now eight months stale. The dates are the harder
 * fact and they agree with the level `hud.ts` derives from `CAREER_START`.
 * If you refresh the resume, refresh its summary too so the two agree.
 *
 * Exactly four entries. The grid is a 4-column layout that collapses to 2×2
 * below 900px, so a fifth entry will leave a hole.
 */

import type { Stat } from '../types/portfolio';

export const stats = [
  { label: 'Years Experience', value: '6+' },
  { label: 'Companies', value: '4' },
  { label: 'Featured Projects', value: '6' },
  { label: 'Technologies', value: '50+' },
] satisfies Stat[];
