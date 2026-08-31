/**
 * The four-up figure row under the About section.
 *
 * Feeds: `components/home/Stats.astro`.
 *
 * Exactly four entries. The grid is a 4-column layout that collapses to 2×2
 * below 900px, so a fifth entry will leave a hole.
 */

import type { Stat } from '../types/portfolio';

export const stats = [
  { label: 'Years Experience', value: 'TODO: 4+' },
  { label: 'Companies', value: 'TODO: 3' },
  { label: 'Featured Projects', value: 'TODO: 6' },
  { label: 'Technologies', value: 'TODO: 25+' },
] as const satisfies readonly Stat[];
