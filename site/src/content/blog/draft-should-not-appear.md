---
title: 'DRAFT — should not appear in build'
description: 'Test fixture. If you can read this on the live site, the draft filter in getPublishedPosts() is broken.'
category: backend-engineering
publishDate: 2026-08-28
draft: true
tags: ['fixture']
---

**This is a test fixture. Do not delete it.**

It is the only post in the `backend-engineering` category, which means two
things are verified at once:

1. `draft: true` keeps this out of `dist/`, the sitemap, and the RSS feed.
2. `/blog/category/backend-engineering/` has zero published posts, so it
   exercises the empty-state branch rather than a populated grid.

The string "should not appear" is deliberately distinctive so that

```bash
grep -ril "should not appear" dist/
```

returns nothing on a correct build. Any hit is a draft leak.
