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
  { label: 'Years Experience', value: '4+' },
  { label: 'Companies', value: '3' },
  { label: 'Featured Projects', value: '6' },
  { label: 'Technologies', value: '25+' },
] satisfies Stat[];
