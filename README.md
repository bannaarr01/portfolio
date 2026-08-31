# Portfolio & Engineering Journal

A static portfolio site with a long-form technical blog, built with Astro and deployed to AWS on S3 + CloudFront, provisioned entirely with Terraform.

## Status

Pre-build. The tracked tree holds documentation and tooling; the Astro app and the Terraform stack don't exist yet. Implementation is driven by the group plans in [`../grouped/plans/`](../grouped/plans/), which carve the work into nine parallelizable workstreams.

DNS and TLS are the exception — the wildcard certificate for `*.naijora.com` is already issued. See [`domain.md`](./domain.md).

## Why it's built this way

The interesting decision here is what the project *doesn't* use.

The site is entirely static: markdown posts, typed data modules, no per-request logic, no user accounts. So there is no server, no database, no container, and no VPC. Content ships as pre-rendered HTML to a private S3 bucket behind CloudFront, and the whole thing sits inside CloudFront's permanent free tier.

Deploying a static blog on serverless SSR would have been more fashionable and considerably more expensive, for no functional gain. Rejecting that is the point:

| Rejected | Why |
|---|---|
| Lambda / SSR | Nothing varies per request |
| Containers, ECS | No runtime to host |
| VPC + NAT Gateway | Nothing to place in a private network, and a NAT Gateway alone would cost more than this entire stack |
| RDS or any database | Markdown in git already gives content storage, history, and review |
| A CMS | Adds a runtime dependency and a bill for a single-author site |

Each is revisitable, but each would need a written reason.

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
├─ docs/                  runbook, ADRs
├─ scripts/               parallel-build worktree tooling
├─ AGENTS.md              contributor source of truth
├─ CLAUDE.md              Claude Code wiring
└─ domain.md              DNS and TLS runbook
```

## Quick start

Once `site/` exists:

```bash
cd site
npm ci                 # not npm install — the lockfile is owned by one workstream
npm run dev            # http://localhost:4321
npm run build          # static build to dist/
npx astro check        # typecheck, must be zero errors
npx lhci autorun       # Lighthouse budgets
```

Infrastructure applies from `infra/envs/`, staging first:

```bash
cd infra/envs/staging
terraform init && terraform plan && terraform apply
```

## Writing

Posts are markdown under `site/src/content/blog/`. Frontmatter is schema-validated, so a malformed post fails the build rather than rendering broken:

- `series` and `part` must be set together, enforced by a schema refinement.
- `draft: true` excludes a post from the build, the sitemap, and the RSS feed.
- Reading time is computed at build time and should never be written by hand.

Categories and series are defined as data files, so adding one is a config change rather than a code change.

## Deploying

Site deploys happen automatically on merge to `main` when `site/**` changes. The workflow assumes a narrowly scoped deploy role through GitHub OIDC, so no AWS credentials are stored in the repo.

Assets are uploaded immutable with content-hashed filenames; HTML is uploaded with `max-age=0, must-revalidate`. That combination means CloudFront revalidates HTML via ETag and routine deploys need no cache invalidation at all, keeping the project inside the free invalidation tier.

A budget alert and a CloudFront 5xx alarm are defined in Terraform rather than clicked into the console.

## Documentation

| File | Contents |
|---|---|
| [`AGENTS.md`](./AGENTS.md) | Contributor source of truth: design system, content model, conventions, gotchas |
| [`CLAUDE.md`](./CLAUDE.md) | Claude Code wiring and build-agent dispatch |
| [`domain.md`](./domain.md) | DNS and TLS: what exists in AWS today, and the Terraform handover |
| [`../astro.md`](../astro.md) | Full architecture reference, AWS and Terraform detail |
| [`../grouped/plans/PLAN.md`](../grouped/plans/PLAN.md) | Build coordinator: contracts, ownership, waves |
