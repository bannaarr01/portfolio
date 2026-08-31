/**
 * /rss.xml — the journal feed. Group 06.
 *
 * Sourced from `getPublishedPosts()`, which is the only place the draft filter
 * lives. Never call `getCollection('blog')` here: a feed is cached and
 * rebroadcast by aggregators, so a draft that leaks into it is very hard to
 * take back.
 */
import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { getCollection, render } from 'astro:content';

import { getPublishedPosts } from '../lib';
import { FEED_DESCRIPTION, FEED_PATH, FEED_TITLE } from '../components/seo/meta';

/** Feed readers strip the origin, so every in-body link and image must be absolute. */
function absolutise(html: string, site: URL): string {
  return html
    .replace(/(\s(?:href|src))="\/(?!\/)/g, `$1="${site.href}`)
    .replace(
      /(\ssrcset)="([^"]+)"/g,
      (_m, attr: string, value: string) =>
        `${attr}="${value.replace(/(^|,\s*)\/(?!\/)/g, `$1${site.href}`)}"`
    );
}

export async function GET(context: APIContext) {
  const site = context.site;
  if (!site) {
    throw new Error('rss.xml.ts: `site` is not set in astro.config.mjs.');
  }

  const posts = await getPublishedPosts();

  // Category display names come from the taxonomy collection rather than a
  // second hardcoded map — one source of truth with the journal's tabs.
  const categories = await getCollection('categories');
  const categoryTitle = new Map(categories.map((c) => [c.data.slug, c.data.title]));

  // Full-text `content:encoded` is worth the build cost: it renders each post
  // exactly as the site does, Shiki highlighting included, so a reader gets the
  // article rather than a teaser. One container is reused across all posts.
  const container = await AstroContainer.create();

  const items = await Promise.all(
    posts.map(async (post) => {
      const { Content } = await render(post);
      const html = await container.renderToString(Content);

      return {
        title: post.data.title,
        description: post.data.description,
        link: new URL(`/blog/${post.id}/`, site).href,
        pubDate: post.data.publishDate,
        categories: [
          categoryTitle.get(post.data.category) ?? post.data.category,
          ...post.data.tags,
        ],
        content: absolutise(html, site),
      };
    })
  );

  return rss({
    title: FEED_TITLE,
    description: FEED_DESCRIPTION,
    site,
    items,
    xmlns: { atom: 'http://www.w3.org/2005/Atom' },
    customData: [
      '<language>en-gb</language>',
      `<atom:link href="${new URL(FEED_PATH, site).href}" rel="self" type="application/rss+xml"/>`,
      `<lastBuildDate>${(posts[0]?.data.publishDate ?? new Date()).toUTCString()}</lastBuildDate>`,
    ].join(''),
  });
}
