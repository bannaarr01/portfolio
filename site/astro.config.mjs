// @ts-check
import { defineConfig } from 'astro/config';
import { unified } from '@astrojs/markdown-remark';
import sitemap from '@astrojs/sitemap';

import { remarkReadingTime } from './plugins/remark-reading-time.mjs';

// Owned by group 00. Every integration the whole build needs is registered
// here up front so no Wave 2 group ever has to touch this file.
// https://astro.build/config
export default defineConfig({
  // Placeholder. Group 09 replaces this with the real domain at integration.
  // It must be absolute — sitemap, RSS, and absolute OG image URLs depend on it.
  site: 'https://example.com',

  output: 'static',

  // `format: 'directory'` and `trailingSlash: 'always'` must agree. Together
  // they produce /blog/index.html served at /blog/, which is what the
  // CloudFront viewer-request function in astro.md §11.1 rewrites for.
  // Changing either after launch invalidates every indexed URL.
  build: { format: 'directory' },
  trailingSlash: 'always',

  integrations: [sitemap()],

  markdown: {
    // Astro 7 defaults `markdown.processor` to Sätteri, which has its own
    // visitor-based plugin API and does not run remark plugins. PLAN.md §7
    // freezes the remark toolchain (reading-time, mdast-util-to-string,
    // unist-util-visit) and the brief specifies a remark plugin, so the
    // processor is pinned back to unified rather than the contract being
    // rewritten under seven agents mid-build. Declared explicitly here — the
    // top-level `remarkPlugins` shortcut is deprecated and will be removed.
    processor: unified({
      // Injects `minutesRead` into frontmatter at build time. Never authored,
      // never part of the Zod schema.
      remarkPlugins: [remarkReadingTime],
    }),

    shikiConfig: {
      themes: {
        light: 'github-light',
        dark: 'github-dark-default',
      },
      // Dark is the site default, so dark is the inline default here too.
      // The light variant rides along in `--shiki-light-*` custom properties
      // and is swapped in by the `:root[data-theme='light']` rule in
      // global.css — theme-aware code blocks with zero JavaScript.
      defaultColor: 'dark',
      wrap: true,
    },
  },

  vite: {
    // Left on so per-route CSS stays under the 18 KB gz budget (PLAN.md §8).
    build: { cssCodeSplit: true },
  },
});
