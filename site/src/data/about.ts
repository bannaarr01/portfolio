/**
 * About section: prose column plus the 2×2 stat grid.
 *
 * Feeds: `components/home/About.astro`.
 *
 * The paragraphs come from `profile.about`; `stats` is re-exported from
 * `stats.ts` so `index.astro` can pull both from one import. Edit the copy in
 * `profile.ts` and the figures in `stats.ts`, not here.
 */

import type { AboutContent } from '../components/home/types';
import { profile } from './profile';

export { stats } from './stats';

export const about = {
  paragraphs: profile.about,
} satisfies AboutContent;
