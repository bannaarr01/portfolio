# AGENTS.md

> **Single source of truth** for this repo — how it's built, the conventions that hold it together, and the traps that will cost you an evening. Every contributor reads this, human or AI.
>
> What the project *is* and why it's built this way is in **[`README.md`](./README.md)**. Claude Code's own wiring lives in **[`CLAUDE.md`](./CLAUDE.md)**. Don't duplicate project facts into either.

---

## 🎯 The two constraints that shape everything

- **The repo is the portfolio argument.** The owner is a backend/cloud engineer whose pitch includes cost optimisation and operational simplicity. The architecture has to demonstrate that, not contradict it. Running a static blog on serverless SSR would undercut the claim.
- **It is built by parallel agents.** The work is carved into nine groups with disjoint file ownership so multiple agents can run concurrently. That constraint shapes the whole repo layout.

## 🚦 Current state — read this first

**There is no `site/` and no `infra/` on `master`.** The tracked tree holds documentation, `.claude/` wiring, and `scripts/`. Group 00 creates the Astro scaffold; group 08 creates the Terraform stack.

Ten worktrees exist under `.claude/worktrees/` (gitignored) on `feature/<slug>` branches, one per grouped-plan slice. Some hold partial slice work. All still branch from the same base commit — nothing has merged.

The site domain is `joshua.naijora.com`. What already exists in AWS for DNS and TLS, and how it hands over to Terraform, is in [`domain.md`](./domain.md).

Do not assume any other file exists, and do not invent paths.

## 🏗️ Architecture

The deployed topology is drawn in [`README.md`](./README.md#architecture). The rules behind it:

**Static output only.** No SSR, no adapter, no Lambda, no containers, and **no VPC** — nothing here needs a private network. Content lives as markdown in git; there is no database and no CMS.

**Two top-level concerns, deliberately separated** — `site/` and `infra/` — so npm and Terraform never compete for root config, and so CI can path-filter. A blog post edit must never trigger `terraform plan`.

**Regions.** Origin and state buckets in `ap-southeast-1`; the ACM certificate **must** be in `us-east-1`, which is why the Terraform modules take two provider aliases.

## 🧩 The parallel build model

Nine groups across three waves. The full briefs live in **`../grouped/plans/`** — `PLAN.md` is the coordinator and must be read before any group brief.

| Wave | Groups | Notes |
|---|---|---|
| 1 | `00-foundation`, `08-infra` | Foundation blocks everything; infra is fully independent |
| 2 | `01-layout-chrome` … `07-content-data` | Seven agents, concurrent |
| 3 | `09-integration` | Runs alone, owns the whole tree |

Three rules make concurrency safe. Breaking any of them corrupts a parallel run:

1. **Disjoint file ownership.** Every group owns an exclusive set of paths (`PLAN.md` §3). An agent that needs something outside its paths *reports it* rather than creating it.
2. **Group 00 owns all shared config.** It installs every dependency and registers every Astro integration up front, so seven agents never collide on `package.json` or `astro.config.mjs`. No other group runs `npm install` — a hook enforces this.
3. **Contracts are frozen before Wave 2.** Tokens, types, component props, and library signatures are fixed in `PLAN.md` §4–§6. Group 00 ships typed stubs for every cross-group component, so an agent can typecheck against an interface whose implementation is still in flight elsewhere.

> `../grouped/plans/` sits outside this repo. Moving it to `docs/plans/` would version the briefs alongside the code they describe.

## 🎨 Design system

These values are **decided and locked**. They are project facts, not preferences — don't renegotiate them mid-build.

**Dark is the default theme.** Author dark on `:root` and treat light as the override. A stored preference wins; otherwise dark. `prefers-color-scheme: light` is deliberately *not* auto-honoured.

**Palette** — deep navy base, cyan/teal accent. Full token tables in `PLAN.md` §4.1–4.3. Dark mode clears WCAG AA comfortably across the board (body text 17:1, accent 7.9:1).

> ⚠️ **The one colour rule that matters:** `#06B6D4` scores **2.43:1 on white** and fails AA badly. In light mode the accent remaps to `#0E7490` (5.36:1). The bright cyan is permitted in light mode *only* for large decorative fills — gradients, cover art — never for text, icons, or borders.

**Typography** — a single family, **Geist Sans** plus **Geist Mono**, self-hosted via `@fontsource-variable`. No serif anywhere, and no Google Fonts CDN (that keeps `font-src 'self'` in the CSP and removes two origins from the critical path).

Dropping the serif has a consequence worth understanding: it was the only thing separating the journal from the portfolio. That separation now has to come from **layout** — a masthead at a scale nothing on the portfolio uses, a gradient accent word, a denser grid, cover art as the signature, and its own footer.

**Motion** — the house style is a hover lift with a cyan glow, gradient CTAs, glass surfaces with backdrop saturation, and scroll reveals that fire once. Specifics in `PLAN.md` §4.6.

> ⚠️ `prefers-reduced-motion: reduce` is **mandatory in every animated component**. Under it the aurora freezes, icons stop, the marquee stops, and reveals render in final state immediately. Check the preference *before* starting work — don't start a rAF loop and then cancel it.

## 📚 Content model

Three collections, validated by Zod at build time: `blog` (markdown posts, schema in `PLAN.md` §5.2), `categories` (Go, AWS & Cloud, System Design, Backend Engineering), and `series` (ordered reading paths).

Two invariants the schema enforces or the code depends on:

- **`series` and `part` must be set together.** A `.refine()` fails the build otherwise. This is the entire reason for using a schema rather than loose frontmatter.
- **The draft filter exists in exactly one place** — `getPublishedPosts()` in `src/lib`. Never call `getCollection('blog')` directly from a page or component, or drafts leak into production. A hook flags this on write.

`minutesRead` is injected by a remark plugin at build time. It is never authored and never part of the schema.

Portfolio content — experience, projects, skills, education — has no markdown body, so it lives as typed TypeScript modules under `src/data/` with `satisfies` so a missing field is a compile error. The owner replaces this content wholesale, so favour flat, obvious, well-commented structures over clever ones.

## ⚙️ Commands

Build and deploy commands are in [`README.md`](./README.md#quick-start). What's specific to working *inside* this repo is the audit set — these catch the mistakes the project is prone to:

```bash
# stray hex outside the token file
grep -rEn '#[0-9a-fA-F]{3,8}' site/src --include=*.astro --include=*.css | grep -v tokens.css

# anyone bypassing the draft filter
grep -rn "getCollection('blog')" site/src --include=*.astro | grep -v src/lib

# expensive AWS resources that must never appear
grep -rn "aws_vpc\|nat_gateway\|aws_lb\|aws_db_instance" infra/
```

Use `npm ci`, never `npm install` — group 00 owns the lockfile. There is one Terraform environment, `infra/envs/prod`; plans run on PRs, applies wait on the `infra-prod` approval gate.

## 🤝 Working in this repo

### Git safety

- ❌ **Never `git commit` or `git push` automatically.** Commits are the developer's call.
- ❌ **Never `--force`, `reset --hard`, or anything destructive** unless explicitly asked.
- ✅ Fine without asking: `status`, `diff`, `log`, `show`, `branch`, `checkout -b`, `switch`, `stash`.
- 📋 Run `git diff` before the developer commits so they can review.

### Workflow

Restate the requirement, produce a plan covering files touched and risks, and wait for approval before any non-trivial change. Execute one task at a time; for five or more, keep a visible checklist. Verify after each with `npm run build` and `npx astro check`, then state plainly what you could *not* verify — visual regressions, real-device rendering, and anything behind a deployed URL need a human or a browser tool.

If you're executing a group brief, its **Acceptance criteria** section is the definition of done. Work it literally.

When finishing a group, report: files created, contracts published, measured sizes against budget, and — most importantly — **anything you needed but could not own**. An unreported ownership gap is what breaks the next parallel run.

## 🧭 Conventions

**Styling**
- Tokens only. **Never hardcode a hex value** outside `tokens.css`. A missing token is a request to group 00, not a local constant.
- Scoped `<style>` blocks by default. Something belongs in `global.css` only if two unrelated groups need it — and then group 00 owns it.

**JavaScript**
- Zero client JS unless the component is a declared island. Currently only: the theme toggle, the animated background, the scroll-reveal wrapper, and an optional TOC scroll-spy.
- Homepage budget is **9 KB gz** (raised from 5 KB specifically to fund the animated background). Other routes: 3 KB.

**Accessibility** — not negotiable
- One `<h1>` per page, no skipped heading levels.
- Visible focus on every interactive element; never remove the ring.
- Decorative SVG gets `aria-hidden`; meaningful icons get a label.
- Landmarks plus a skip-link to `#main`.
- Target AA. The dark palette already clears it — don't introduce new colours.

**Performance** — LCP < 1.8s, CLS < 0.05, Lighthouse Perf ≥ 95, and 100 on A11y / Best Practices / SEO.

**Infrastructure** — no VPC, NAT Gateway, ALB, RDS, or EC2. Nothing here needs a private network, and a NAT Gateway alone would cost more than the rest of the stack combined. If you find yourself writing `aws_vpc`, stop and ask why. Guardrails set on day one: an AWS Budget alert, a CloudWatch alarm on CloudFront 5xx above 1%, and a scheduled monthly `terraform plan` to catch console drift.

## ⚠️ Gotchas

The first two are the most common way this exact architecture fails.

**1. S3 + OAC does not serve index documents.** The S3 *website* endpoint resolves `/blog/` to `/blog/index.html`. The *REST* endpoint — which OAC requires — does not. Without a CloudFront Function on `viewer-request` rewriting the URI, every directory URL returns 403. Use a CloudFront Function, not Lambda@Edge.

**2. Missing objects return 403, not 404.** Because the bucket is private, S3 answers `AccessDenied` for a key that doesn't exist. **Both** 403 and 404 must map to `/404.html` with a 404 status, or the custom 404 page never appears.

**3. CloudFront applies are slow.** Five to fifteen minutes to deploy or update, and a distribution must be disabled before it can be destroyed. Read the docs and apply once rather than iterating by trial and error.

**4. Empty Route 53 hosted zones still bill.** Deleting records isn't enough — delete the zone.

**5. Zero-pad the TOC.** Naive `'0' + index` renders `010` past the ninth heading. Use `padStart(2, '0')`.

**6. Timeline card headers need a grid, not flex-wrap.** With flex, a long company name pushes the date and location onto their own row instead of holding them top-right. Use `grid-template-columns: minmax(0,1fr) auto`.

**7. HTML cache headers remove the need for invalidations.** Serving HTML as `max-age=0, must-revalidate` means CloudFront revalidates via ETag, so routine deploys need no invalidation at all — which keeps you inside the free tier of 1,000 paths per month. If blanket `/*` invalidations become routine, the cache headers are wrong.

**8. ACM SANs are immutable.** The wildcard covers `*.naijora.com` and the apex, but not a second-level name like `a.b.naijora.com`. Covering a name the wildcard doesn't match means a new certificate, not an edit.

---

## 🗂️ The documents you must know

1. **`../grouped/plans/PLAN.md`** — contracts, ownership matrix, wave structure. Read before any group brief.
2. **`../grouped/plans/00-foundation.md`** — the contract layer everything else depends on.
3. **`../astro.md`** — architecture reference. Authoritative for AWS, Terraform, CI/CD, caching, and headers (§8–§15).
4. **`./domain.md`** — what exists in AWS today for DNS and TLS, and how it hands over to Terraform.
5. **`./CLAUDE.md`** — Claude Code wiring and how to dispatch the build waves.
6. **`../mockup-*.html`** — rendered reference for every page template. Take **structure** from these; take **colour and type** from `PLAN.md` §4. Where they conflict, `PLAN.md` wins — the mockups predate the navy/cyan direction.
