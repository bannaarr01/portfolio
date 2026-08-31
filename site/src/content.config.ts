import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
// `import { z } from 'astro:content'` is deprecated and goes away in Astro 8.
import { z } from 'astro/zod';

import { isIconName } from './components/ui/icon-paths';
import type { IconName } from './components/ui/icon-paths';
import { CATEGORY_SLUGS } from './types/content';

/**
 * `heroGlyph` overrides the category's default cover-art glyph. Validated
 * against the icon registry so a typo fails the build with a useful message
 * instead of rendering an empty square, and so `CoverArt`'s `glyph?: IconName`
 * prop receives it without a cast.
 */
const iconName = z.custom<IconName>(isIconName, {
  message: 'Unknown icon — must be a key of the registry in components/ui/icon-paths.ts',
});

const blog = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/blog' }),
  schema: z
    .object({
      title: z.string(),
      /** Doubles as the meta description and the card dek, hence the ceiling. */
      description: z.string().max(170),
      category: z.enum(CATEGORY_SLUGS),
      /** Must match a slug in the `series` collection. */
      series: z.string().optional(),
      part: z.number().int().min(1).optional(),
      publishDate: z.coerce.date(),
      updatedDate: z.coerce.date().optional(),
      /** Excluded from every query — see getPublishedPosts(). */
      draft: z.boolean().default(false),
      tags: z.array(z.string()).default([]),
      heroGlyph: iconName.optional(),
    })
    // The entire reason for using a schema: a half-declared series would
    // render a broken "Part ? of ?" card rather than failing the build.
    .refine((data) => (data.series === undefined) === (data.part === undefined), {
      message:
        '`series` and `part` must be set together: a post in a series needs its part number, and a part number needs a series slug.',
      path: ['part'],
    }),
});

const categories = defineCollection({
  loader: glob({ pattern: '**/*.{yaml,yml,json}', base: './src/content/categories' }),
  schema: z.object({
    slug: z.enum(CATEGORY_SLUGS),
    title: z.string(),
    description: z.string(),
    /** Display order in the tab bar and discipline grid. */
    order: z.number().int(),
  }),
});

const series = defineCollection({
  loader: glob({ pattern: '**/*.{yaml,yml,json}', base: './src/content/series' }),
  schema: z.object({
    slug: z.string(),
    title: z.string(),
    description: z.string(),
    category: z.enum(CATEGORY_SLUGS),
  }),
});

export const collections = { blog, categories, series };
