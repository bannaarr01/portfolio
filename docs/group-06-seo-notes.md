# Group 06 — SEO, 404 & feeds

Handoff notes. Built on `develop` at `4b3e63c`, after groups 00–05 landed.

## Files

```
site/src/components/seo/Seo.astro            replaces group 00's stub
site/src/components/seo/StructuredData.astro new — needs wiring, see below
site/src/components/seo/meta.ts              site-level SEO constants
site/src/pages/404.astro
site/src/pages/rss.xml.ts
site/src/pages/og/[...slug].ts               /og/<slug>.png + /og/default.png
site/src/pages/og/_backdrop.ts               the §4.8 geometry, as SVG → PNG
site/src/pages/og/_recipe.ts                 §4.8 constants, read from tokens.css
```

## `Seo` — same signature as the stub

`title, description, canonical, ogImage?, noindex?, type?` — unchanged, so
BaseLayout needed no edit. Three behaviours worth knowing:

- **It no longer emits charset, viewport, or favicons.** BaseLayout already
  emits all three, and charset has to sit in the first 1024 bytes of the
  document, which only BaseLayout can guarantee. The stub's versions would have
  produced two of each on every page.
- **It throws if `astro.config.mjs` has no `site`.** A build whose every
  `og:image` is relative renders no preview anywhere; better to fail loudly.
- `og:title` / `twitter:title` use the bare title — `og:site_name` already
  carries the owner, so the `— Boluwaji Joshua Adedigba` suffix would repeat it
  inside the preview card. `<title>` still gets the suffix, with a guard so the
  journal index (which already appends `SITE_OWNER`) doesn't get it twice.

## OG images — `astro-og-canvas`, with a `sharp` backdrop

The brief allowed a `satori` fallback and I initially took it. **That was wrong
for this repo**: `.claude/hooks/block-npm-install.sh` and AGENTS.md are explicit
that group 00 owns `package.json` and a new dependency is an ownership gap to
report, not something to install. `astro-og-canvas` is already in the manifest,
so it is what the cards use.

Its card layout is fixed, though — logo, title, description, one padding value,
one edge border, a vertical-only gradient. The §4.8 recipe needs a 118°
gradient, three concentric arcs from a focal point at 68% / 106%, a 52px grid,
and a category glyph, none of which that API can express. So the work is split:

- **`_backdrop.ts`** authors the geometry as SVG and rasterises it with `sharp`
  (already a dependency), cached per discipline under
  `node_modules/.astro-og-backdrops/`, and hands back a `bgImage` path.
- **`astro-og-canvas`** draws the text. CanvasKit reads the
  `@fontsource-variable/geist` `.woff2` directly and resolves `weight: 'Bold'`
  from the variable face, so the cards use the same files the site ships.

Two details that look odd and are deliberate:

- `border: { side: 'inline-end', width: 300 }` is **not a visible border**. The
  library adds `border.width` to that side's margin and paints the `bgImage`
  over the stroke afterwards, so it is the only way to reserve the right third
  of the card for the gradient and watermark. Without it the headline runs
  underneath them.
- `_recipe.ts` **reads `--cover-*` out of `styles/tokens.css`** rather than
  restating the palette. Group 04's `CoverArt.astro` and these PNGs are separate
  systems (astro.md §5.2) that must not drift; change a token and both move.
  Hue rotation uses the sRGB matrix from the Filter Effects spec — the same
  maths as CSS `filter: hue-rotate()` — so they land on the same colours rather
  than merely similar ones.

## The 404 auto-redirect: removed

The mockup returned home after twelve seconds. Gone, with nothing equivalent —
it fails WCAG 2.2.2 (Pause, Stop, Hide), and moving a screen-reader user or a
slow reader off the page is hostile regardless of the guideline.

The slot it occupied now holds a status readout — a `404` pill, the path that
actually failed, and `no matching route`:

```
( 404 )  /blog/a-post-that-was-never-deployed/   no matching route
```

A static 404 is served for every unmatched path, so only the client knows which
one was requested; ~150 B of bundled JS reads `location.pathname`. Without JS
the markup already reads as a complete sentence. It diagnoses instead of
nagging. Helpful paths are About / Experience / Skills / **Journal** / Contact —
a mistyped article URL is one of the likelier ways to land here.

The page builds its own document shell rather than using BaseLayout, which is
what keeps it chromeless without adding a "hide everything" flag to group 01's
layout, and holds it at **440 B gz of JS**.

---

## Needed from other groups

### Groups 03, 04, 05 — wire `StructuredData` (it is currently inert)

Group 06 owns `components/seo/**`, but the pages that must *render* JSON-LD
belong to you, and you all landed before this slice. The component is built and
verified but **nothing imports it yet**. One line each, into the existing
`head` slot:

```astro
<!-- pages/index.astro (03) -->
<StructuredData slot="head" person />

<!-- pages/blog/[...slug].astro (05) -->
<StructuredData
  slot="head"
  article={{
    title: post.data.title,
    description: post.data.description,
    url: `/blog/${post.id}/`,
    image: ogImageUrl(post.id),
    publishDate: post.data.publishDate,
    updatedDate: post.data.updatedDate,
    section: categoryTitle,
    tags: post.data.tags,
  }}
  breadcrumbs={[
    { name: 'Home', url: '/' },
    { name: 'Journal', url: '/blog/' },
    { name: categoryTitle, url: categoryHref },
    { name: post.data.title, url: `/blog/${post.id}/` },
  ]}
/>

<!-- category + series pages (04) -->
<StructuredData slot="head" breadcrumbs={[…]} />
```

Verified by temporarily wiring the article page, building, and asserting the
output against Google's Article and BreadcrumbList requirements; the edit was
reverted because the file isn't mine.

### Group 01 — two small changes

1. **Forward `type` from BaseLayout to `Seo`.** It is in the §6 signature but
   BaseLayout doesn't pass it, so articles currently emit `og:type="website"`.
2. **Update `theme-color` on toggle.** `Seo` server-renders the dark value
   (dark is the default); without this, mobile browser chrome stays navy in
   light mode:
   ```ts
   import { THEME_COLOR } from '../seo/meta';
   document
     .querySelector('meta[name="theme-color"]')
     ?.setAttribute('content', light ? THEME_COLOR.light : THEME_COLOR.dark);
   ```

### Group 07 — `site/public/robots.txt`

```
# Everything here is public and static, and nothing is disallowed on purpose.
#
# /og/*.png in particular must stay crawlable: LinkedInBot and several other
# preview fetchers honour robots.txt, and disallowing the directory silently
# breaks link previews — the one failure this site can least afford.
#
# Drafts never reach the build at all (the filter lives in getPublishedPosts),
# so there is nothing here to hide.

User-agent: *
Allow: /

Sitemap: https://example.com/sitemap-index.xml
```

Group 09 swaps the placeholder domain along with `site` in `astro.config.mjs`.

`og-default.png` in your asset list is **not needed** — `/og/default.png` is
generated at build time from the same recipe as every other card, and two
competing defaults would drift.

### Group 00 / 09 — a CSP conflict, found on `/404`

Astro 7 inlines small module scripts straight into the HTML. On `/404` that is
516 bytes across three inline `<script>` blocks — the theme init, ThemeToggle,
and the path readout. Under astro.md §14's
`script-src 'self' 'sha256-<theme-init>'` **the browser will block all but the
theme init**, on every page with an island.

One line in `astro.config.mjs` (group 00's file) fixes it by emitting them to
`/_astro/*.js`, which `'self'` already allows:

```js
vite: { build: { cssCodeSplit: true, assetsInlineLimit: 0 } },
```

Otherwise group 09 must hash every inline script, not just the theme init.

**Not needed after all:** the sitemap already excludes `/404` and `/og/` on its
own, so no `filter` is required in the `sitemap()` options.

---

## Verified

`npm run build` clean · `astro check` 0 errors/0 warnings/0 hints ·
`npm run no-hex` passes · `npm run format:check` passes.

Sitemap has no `/404`, no `/og/`, no drafts. `rss.xml` valid per `xmllint`, all
URLs absolute, full `content:encoded` with Shiki highlighting, drafts absent.
Four OG cards at exactly 1200×630, none for drafts. Every route: unique title,
unique description, absolute canonical, absolute `og:image` resolving to a real
file, no duplicated head tags. **404 JS 440 B gz** (budget 1 KB), CSS 5.0 KB gz
(budget 18 KB). Both themes screenshotted; light uses the darkened cyan/teal.
Reduced motion emulated — `document.getAnimations()` empty, content at final
state. No horizontal overflow at 375 / 900 / 1000 / 1440. Keyboard order:
toggle → brand → CTAs → helpful paths.

**Two things could not be verified here:**

- **`develop` does not currently build.** `src/pages/index.astro` imports
  `../data/*`, which group 07 has not landed. Everything above was verified with
  the homepage held aside; it is restored and untouched in this branch. This is
  pre-existing on `develop`, not caused by this slice.
- **Rich Results Test needs a public URL.** The JSON-LD was asserted
  structurally instead. Run the live test at first deploy.
