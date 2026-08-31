# Portfolio & Engineering Journal

A static portfolio site with a long-form technical blog, built with Astro and deployed to AWS on S3 + CloudFront, provisioned entirely with Terraform.

## Status

**Built and integrated, not yet deployed.** All nine workstreams from [`../grouped/plans/`](../grouped/plans/) have landed on `develop` and been reconciled: the Astro app builds clean, `astro check` reports zero errors, and every route renders.

| | |
|---|---|
| Build | `npm ci && npm run build` clean, 15 pages |
| Typecheck | `astro check` — 0 errors, 0 warnings, 0 hints |
| Homepage JS | 2.60 KB gz against a 9 KB budget |
| Other routes | 0.43 – 1.29 KB gz against 3 KB |
| CSS per route | 4.83 – 10.81 KB gz against 18 KB |
| Drafts | absent from `dist/`, sitemap and RSS |
| Lighthouse | 100 / 100 / 100 / 100 on `/`, `/blog/` and the longest article |
| CSP | 7 inline-script hashes pinned, zero console violations |

**Not done:** nothing has been applied to AWS. `terraform apply` has never run, so there is no bucket, distribution, or DNS record yet. Two things need a decision before a first apply — see [Deploying](#deploying).

DNS and TLS are the exception — the wildcard certificate for `*.naijora.com` is already issued.

## Why it's built this way

The interesting decision here is what the project *doesn't* use.

The site is entirely static: markdown posts, typed data modules, no per-request logic, no user accounts. So there is no server, no database, no container, and no VPC. Content ships as pre-rendered HTML to a private S3 bucket behind CloudFront, and the whole thing sits inside CloudFront's permanent free tier.

### It costs about $0.55 a month

That is the whole architecture argument, and it is a specific number rather than a gesture:

| Item | Monthly |
|---|---|
| Route 53 hosted zone | $0.50 |
| Route 53 queries (~100k) | ~$0.04 |
| S3 storage (~100 MB across both environments) | ~$0.005 |
| S3 requests | < $0.01 |
| CloudFront — within the permanent 1 TB / 10M request free tier | $0.00 |
| CloudFront Functions — within 2M free invocations | $0.00 |
| ACM certificate | $0.00 |
| Terraform state bucket | ~$0.001 |
| **Total** | **~$0.55/month** |

Domain registration is roughly $12–15/year on top. **The domain costs more than the infrastructure it points at** — about twice as much, annualised.

One line dominates: the Route 53 hosted zone, at $0.50, is 90% of the bill. Everything that actually serves the site is free, because a static site at portfolio traffic never leaves CloudFront's free tier. Treat these as order-of-magnitude figures and confirm against the AWS pricing calculator before committing; published prices and free-tier terms change.

### What was rejected, and what it would have cost

Deploying a static blog on serverless SSR would have been more fashionable and considerably more expensive, for no functional gain. Rejecting that is the point:

| Rejected | Why | Roughly what it would add |
|---|---|---|
| **Lambda / SSR** | Nothing varies per request. Every page is identical for every visitor, so rendering per request buys nothing and adds a cold-start path in front of content that could have been a file. | Free tier covers the invocations, but it adds an API Gateway or Function URL, a log group with retention to manage, and a runtime to keep patched. The real cost is operational, not the bill. |
| **Containers (ECS/Fargate)** | There is no runtime to host. A container would exist purely to hand back bytes that S3 already hands back. | A single 0.25 vCPU / 0.5 GB Fargate task running continuously is roughly **$9/month**, plus an ALB at about **$16/month** — ~45× the entire current bill, to serve the same static files. |
| **VPC + NAT Gateway** | Nothing needs a private network. There is no database to isolate and no compute to place in a subnet. | A single NAT Gateway is about **$32/month** in hourly charges before a byte of data processing — on its own, roughly **58× the whole stack**. |
| **RDS or any database** | Markdown in git already provides content storage, history, review, and rollback. A database would add a schema migration story to a site with no writes. | The smallest always-on `db.t4g.micro` is roughly **$12/month**, plus storage and backups. |
| **A CMS** | Adds a runtime dependency, an auth surface, and a bill for a single-author site whose author is comfortable in an editor. | Hosted tiers start around **$15–25/month**; self-hosting reintroduces the container and database above. |

The pattern is consistent: every rejected option costs at least an order of magnitude more than the entire current stack, and none of them changes what a visitor receives. Each is revisitable — but each would need a written reason, and the reason would have to be worth more than the multiple.

The tradeoffs this **does** accept, stated plainly: no per-request logic means no search-as-you-type, no comments, and no preview URLs without a build. Content changes require a CI run rather than a save button. For a single-author portfolio those are cheap; for a multi-author publication with a non-technical editor they would not be, and that is the point at which this architecture should be revisited.

## Stack

| Layer | Choice |
|---|---|
| Framework | Astro, static output, no adapter |
| Styling | Plain CSS with custom properties, no framework |
| Typography | Geist Sans + Geist Mono, self-hosted |
| Content | Astro content collections, Zod-validated frontmatter |
| Hosting | S3 (private) + CloudFront + ACM + Route 53 |
| IaC | Terraform, S3 backend with native state locking |
| CI/CD | GitHub Actions with OIDC, no long-lived AWS keys |

## Architecture

```
Route 53 ─► CloudFront ─► S3 (private, OAC)
              │
              ├─ viewer-request Function (directory-index rewrite)
              └─ response headers policy (HSTS, CSP)

ACM certificate (us-east-1) attached to the distribution
```

Production is `joshua.naijora.com`. Staging lives on a sibling subdomain in the same hosted zone, covered by the same wildcard certificate — it adds no meaningful cost, and it exists so the CloudFront Function and certificate flow get debugged somewhere other than production.

## Repo layout

```
portfolio/
├─ site/                  Astro application
├─ infra/                 Terraform: bootstrap, modules, envs
├─ .github/workflows/     build, deploy, plan
├─ docs/                  build handoff notes
├─ scripts/               worktree tooling + CSP hash and budget checks
├─ AGENTS.md              contributor source of truth
└─ CLAUDE.md              Claude Code wiring
```

## Quick start

```bash
cd site
npm ci                 # not npm install — the lockfile is checked in and authoritative
npm run dev            # http://localhost:4321
npm run build          # static build to dist/
npx astro check        # typecheck, must be zero errors
```

From the repo root, against a build:

```bash
node scripts/budgets.mjs             # per-route JS/CSS weight vs PLAN.md §8
node scripts/csp-hashes.mjs          # inline-script hashes for the CSP
node scripts/preview-with-headers.mjs   # serve dist/ with the real CloudFront headers
```

`preview-with-headers` is the one worth knowing about. `astro preview` sends no security headers, so it cannot tell you whether the Content-Security-Policy about to be attached by CloudFront blocks anything. This serves `dist/` with the actual policy — hashes read straight out of the staging tfvars — and reproduces the directory-index rewrite and the 403→404 mapping. A CSP failure is invisible server-side: the object is delivered with a 200 and the browser quietly refuses to run part of it.

## Writing

Posts are markdown under `site/src/content/blog/`. Frontmatter is schema-validated, so a malformed post fails the build rather than rendering broken.

| Field | Type | Required | Notes |
|---|---|---|---|
| `title` | string | yes | |
| `description` | string, ≤170 chars | yes | Doubles as the meta description and the card dek |
| `category` | `go` \| `aws-cloud` \| `system-design` \| `backend-engineering` | yes | |
| `series` | string | — | Must match a slug in `src/content/series/` |
| `part` | integer ≥ 1 | — | |
| `publishDate` | date | yes | |
| `updatedDate` | date | — | |
| `draft` | boolean | defaults `false` | |
| `tags` | string[] | — | Defaults to `[]` |
| `heroGlyph` | `IconName` | — | Overrides the category glyph on the cover |

Three rules the schema enforces so you don't have to remember them:

- **`series` and `part` must be set together.** One without the other fails the build — a post in a series with no part number cannot be ordered, and a part number with no series belongs to nothing.
- **`draft: true` removes a post everywhere** — the build, the sitemap, and the RSS feed. The filter lives in exactly one function, `getPublishedPosts()`; nothing else may query the blog collection directly, and CI greps for that.
- **Never write `minutesRead`.** A remark plugin computes it at build time. A hand-authored reading time goes stale the moment the post is edited.

### Adding a category

1. Add `site/src/content/categories/<slug>.yaml` with `slug`, `title`, `description`, `order`.
2. Add the slug to the `CategorySlug` union in `site/src/types/content.ts` and to `CATEGORY_SLUGS` in `site/src/content.config.ts`.

Step 2 is what makes a typo in a post's `category` a build failure instead of a missing page. The category page, the tab, the discipline-grid row, and the cover-art hue all follow from the data file — no component changes.

### Adding a series

Add `site/src/content/series/<slug>.yaml` with `slug`, `title`, `description`, `category`. Posts join it by setting `series` to that slug plus a `part` number. The series page orders by `part` ascending, never by date, because parts are often backfilled out of order.

## Deploying

Site deploys happen automatically on merge to `main` when `site/**` changes. The workflow assumes a narrowly scoped deploy role through GitHub OIDC, so no AWS credentials are stored in the repo.

Assets are uploaded immutable with content-hashed filenames; HTML is uploaded with `max-age=0, must-revalidate`. That combination means CloudFront revalidates HTML via ETag and routine deploys need no cache invalidation at all, keeping the project inside the free invalidation tier.

A budget alert and a CloudFront 5xx alarm are defined in Terraform rather than clicked into the console.

### Before the first apply

Nothing has been applied yet, but the configuration is complete — both decisions that used to be open are now settled in `infra/envs/prod/terraform.tfvars`:

1. **What production serves.** `joshua.naijora.com`, matching every other document in the repo. `envs/prod` takes the same optional `subdomain` variable staging has, so the two environments differ by a tfvars value rather than by shape. `serve_www` is `false` and `variables.tf` now rejects any attempt to set it alongside a subdomain: `www.joshua.naijora.com` is two labels deep, the issued `*.naijora.com` wildcard matches exactly one, and ACM SANs are immutable — covering it would mean a new certificate, not an edit.
2. **`alert_emails`** is set to the owner address from `src/data/profile.ts` in both environments. AWS sends a confirmation email on first apply; until that link is clicked the subscription sits in `PendingConfirmation` and delivers nothing, so check for it after applying.

Then, staging first:

```bash
cd infra/envs/staging
terraform init && terraform plan && terraform apply
```

Verify on staging before promoting: directory URLs resolve (the CloudFront viewer-request function), an unknown path renders the 404 with a 404 status (the 403→404 mapping), the security headers are present, and both themes work over real TLS with no CSP violation in the console. `scripts/preview-with-headers.mjs` reproduces all four locally, which is the cheaper place to find a mistake.

### The CSP hashes are content-derived

`script-src` pins a **list** of seven hashes, not one. Astro inlines each island's bundled JavaScript into the HTML rather than emitting a file, and different routes carry different scripts. Any change to any client-side script invalidates a hash, and a stale pin blocks that script in the browser with nothing failing server-side.

```bash
cd site && npm run build && cd ..
node scripts/csp-hashes.mjs --write   # rewrite the tfvars
```

`--check` runs in CI after every build and fails the PR when the pinned list drifts.

## Documentation

| File | Contents |
|---|---|
| [`AGENTS.md`](./AGENTS.md) | Contributor source of truth: design system, content model, conventions, gotchas |
| [`CLAUDE.md`](./CLAUDE.md) | Claude Code wiring and build-agent dispatch |
| [`infra/README.md`](./infra/README.md) | Terraform layout, the CSP hash procedure, deploy ordering |
| [`docs/group-06-seo-notes.md`](./docs/group-06-seo-notes.md) | SEO/404/feeds handoff notes from the build |
| [`../astro.md`](../astro.md) | Full architecture reference, AWS and Terraform detail |
| [`../grouped/plans/PLAN.md`](../grouped/plans/PLAN.md) | Build coordinator: contracts, ownership, waves |
