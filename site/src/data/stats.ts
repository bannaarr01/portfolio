/**
 * The figures in the About readout.
 *
 * Feeds: `components/home/About.astro`.
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
 * "9+" projects is the floor set by what this site actually shows: two
 * featured case studies in `case-studies.ts` plus seven entries in
 * `projects.ts`. Deliberately not computed from those arrays — the figure
 * counts the work, and the arrays only count what has been written up.
 *
 * Values are split on the first non-numeric character when rendered, so the
 * qualifier can be set in its own type. Keep them in `<digits><qualifier>`
 * order or the figure and its "+" will render as one run.
 *
 * Four entries. The readout is a vertical panel whose rows divide its height,
 * so a fifth is safe here in a way it was not under the old 2×2 grid.
 */

import type { Stat } from '../types/portfolio';

export const stats = [
  { label: 'Years Experience', value: '6+' },
  { label: 'Companies', value: '4+' },
  { label: 'Featured Projects', value: '9+' },
  { label: 'Technologies', value: '50+' },
] satisfies Stat[];
