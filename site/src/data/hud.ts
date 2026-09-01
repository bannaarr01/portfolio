/**
 * The hero's stat HUD — the "player card" readout under the lead paragraph.
 *
 * Feeds: `components/home/Hero.astro`, via `hero.ts`.
 *
 * ── ONLY PART OF THIS IS RENDERED ────────────────────────────────────────
 * The stat panel that used to sit under the lead was removed at the owner's
 * request, so `stats` and `achievements` are currently unrendered. `level`,
 * `xp` and `xpLabel` are still live: they drive the availability pill at the
 * top of the hero, which is why this module stays.
 *
 * The unrendered halves are kept rather than deleted because they are content,
 * not scaffolding, and getting them back is a matter of rendering them
 * somewhere. Delete them if the panel is not coming back.
 *
 * ── WHY THIS EXISTS ──────────────────────────────────────────────────────
 * The hero was correct but inert: a name, a role, a paragraph. This module
 * turns the same claims into a readout — level, XP, six proficiency meters,
 * four unlocked achievements — so the fold has something to *read* rather
 * than just something to skim.
 *
 * ── SOURCE ───────────────────────────────────────────────────────────────
 * Meters and achievements come from `Boluwaji_Joshua_Adedigba_resume.pdf`
 * (revision dated 01/2026); `CAREER_START` comes from its earliest employment
 * date. Nothing here names a technology or a figure the resume does not.
 *
 * ── HONESTY ──────────────────────────────────────────────────────────────
 * Two different kinds of number live here, and the distinction matters:
 *
 *   - `level` / `xp` are DERIVED from `careerStart` at build time. They go
 *     stale on their own, never by omission. Don't hardcode them.
 *   - `stats[].value` are SELF-ASSESSED, 0–100. Nothing computes them and
 *     nothing can verify them, which is exactly why the panel labels itself
 *     "self-assessed" in the UI. Tune them; don't inflate them.
 *
 * `achievements` are the one set that must stay strictly factual — every
 * entry restates something already claimed in `experience.ts` or
 * `case-studies.ts`, and `detail` is the long-form version that shows on
 * hover. If you edit an achievement, edit the source of truth too.
 *
 * ── EDITING ──────────────────────────────────────────────────────────────
 * Counts are load-bearing:
 *   - `stats` — six entries. The grid is 3 columns → 2 columns → 1, so a
 *     seventh leaves a hole on wide screens and a fifth leaves two.
 *   - `achievements` — four entries. They sit on one wrapped row; more than
 *     four pushes the hero past the fold on a 900px-tall window.
 */

import type { HeroHud } from '../components/home/types';

/**
 * First day of the first engineering role — DDL Associates, 07/2020 per
 * `experience.ts` and the resume. The single input to `level` and `xp` below.
 *
 * This was 2022-05-01 while `experience.ts` held placeholder roles; the resume
 * pushes the career start back almost two years, which is why the player card
 * now reads LVL 06 rather than LVL 04. Keep it in step with the last entry in
 * `experience.ts`.
 */
const CAREER_START = '2020-07-01';

/**
 * Years shipped, to one decimal.
 *
 * Build-time, not authored, so it cannot drift: the site is static and gets
 * rebuilt on every deploy, so this is fresh as of the last publish. 365.25
 * absorbs leap years, which matters only in that it stops the figure from
 * jittering by a tenth around a February boundary.
 */
const years = Number(
  (
    (Date.now() - new Date(CAREER_START).getTime()) /
    (1000 * 60 * 60 * 24 * 365.25)
  ).toFixed(1)
);

export const hud = {
  /** Whole years shipped. Renders zero-padded ("LVL 04") in the player card. */
  level: Math.floor(years),

  /**
   * Progress through the current year, 0–100, as the XP bar's fill.
   * `years % 1` is the fractional part — 4.3 years → 30% of the way to LVL 05.
   */
  xp: Math.round((years % 1) * 100),

  /** Printed beside the XP bar, e.g. "4.3 YRS SHIPPED". */
  xpLabel: `${years.toFixed(1)} yrs shipped`,

  /**
   * Meter rows. `icon` must exist in group 00's registry
   * (`components/ui/icon-paths.ts`) — a typo is a typecheck failure.
   *
   * Resume-only. The previous set listed Terraform and Kafka, neither of which
   * appears anywhere in the resume — see the note in `skills.ts`. Ordered by
   * value descending, which is also roughly the order they would be argued for
   * in an interview: the Node/TypeScript work is the deepest and most current,
   * Go is the Gin microservice work at Telekom R&D, then the cloud and
   * orchestration layer the last three roles all ran on.
   */
  stats: [
    { label: 'Node.js / TS', icon: 'typescript', value: 95 },
    { label: 'Go', icon: 'go', value: 90 },
    { label: 'AWS', icon: 'aws', value: 88 },
    { label: 'Kubernetes', icon: 'kubernetes', value: 85 },
    { label: 'MongoDB', icon: 'database', value: 82 },
    { label: 'Azure', icon: 'azure', value: 75 },
  ],

  /**
   * Unlocked achievements. `label` is the chip (kept under ~16 characters so
   * four fit on one row); `detail` is the tooltip and the screen-reader text,
   * and is the version that has to survive scrutiny.
   *
   * All four are figures the resume states outright. Every one of them is a
   * percentage on purpose — on a stat HUD the number *is* the claim, and a
   * chip that reads "SSO integration" says nothing a visitor can weigh.
   */
  achievements: [
    {
      icon: 'activity',
      label: '75% faster APIs',
      detail:
        'Accelerated API response times by 75% through optimization of RESTful endpoints, database query restructuring, and efficient caching strategies while freelancing out of Japan.',
    },
    {
      icon: 'cloud-cog',
      label: '65% cost cut',
      detail:
        'Spearheaded migration of a legacy PHP codebase to NestJS microservices architecture, reducing cloud infrastructure costs by 65% while adding Casdoor resource-based access policies.',
    },
    {
      icon: 'award',
      label: '40% velocity',
      detail:
        'Engineered CI/CD pipelines for Kubernetes deployments at Telekom R&D, increasing development velocity by 40%.',
    },
    {
      icon: 'shield',
      label: '30% less login',
      detail:
        'Configured and integrated Single Sign-On with a dedicated private library at Telekom R&D, reducing login overhead by 30% and improving overall workflow efficiency.',
    },
  ],
} satisfies HeroHud;
