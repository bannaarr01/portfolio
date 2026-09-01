# infra

Terraform for the portfolio and journal: S3 + CloudFront + ACM + Route 53,
deployed from GitHub Actions over OIDC. No long-lived AWS credentials exist
anywhere in this repository.

Steady state is about **$0.55/month**, of which $0.50 is the Route 53 hosted
zone. The domain registration costs more than the infrastructure.

`../../astro.md` §8–§15 is the specification. This file is the operational
half: how to stand it up, what breaks, and how to get out of trouble.

---

## Layout

```
infra/
├─ bootstrap/            state bucket + GitHub OIDC provider. Run once, by hand.
├─ modules/
│  ├─ dns/               hosted zone only
│  ├─ static-site/       bucket, OAC, cert, distribution, function, records, alarm
│  ├─ ci-oidc/           the two GitHub Actions roles
│  └─ guardrails/        monthly cost budget
└─ envs/
   ├─ shared/            hosted zone, budget, terraform role  (account-level)
   └─ prod/              joshua.<domain>
```

Environments hold provider config, backend config, module calls and tfvars.
No resources are declared directly in `envs/` — the two data sources there
(caller identity, hosted zone lookup) read state, they do not create it.

### Why `dns` is its own module

A hosted zone holds more than web records: MX, SPF, DKIM, domain-verification
TXT. If the zone lived inside `static-site`, a `terraform destroy` on prod
would take email with it, and re-creating the zone hands you four new
nameservers to re-delegate at the registrar. It also carries
`prevent_destroy`.

### Why `envs/shared` exists

`astro.md` §9.4 describes two environments. A third directory holds the three
things that are account-scoped rather than environment-scoped, and whose
lifecycle must outlive any single site:

| Thing | Why it cannot live in prod |
|---|---|
| Hosted zone | Holds the apex MX and TXT records; `destroy` on prod must not remove it |
| Cost budget | Account-wide; two copies double-count the same spend |
| `terraform` role | Manages every environment; two would race for one state file |

The per-environment `site-deploy` role does live in `envs/prod`, because it
names exactly one bucket and one distribution. A second environment would get
its own.

---

## Standing it up

Order matters: `bootstrap` → `shared` → `prod`. The first pass is
manual, because the role CI uses to apply is itself created by `shared` and
cannot create itself.

### 0. Fill in the domain

`domain_name` is the one value nothing can infer, and it appears in both
tfvars files. Every other name — certificate SANs, aliases, the `subdomain`
prefix — is derived from it.

```bash
grep -rn 'example.dev' infra/envs/*/terraform.tfvars
```

While you are there, set `alert_emails`. The budget and the 5xx alarm are
created either way, but with no subscriber they notify nobody.

### 1. Bootstrap

Runs on local state, because the S3 backend cannot store the configuration
that creates it.

```bash
cd infra/bootstrap
terraform init
terraform apply
```

Creates the state bucket (versioned, SSE-S3, public access blocked, noncurrent
versions expiring after 90 days) and the GitHub OIDC identity provider.

Record the bucket name; the migration and every step below need it.

```bash
export TF_STATE_BUCKET=$(terraform output -raw state_bucket)
```

Then move its own state into the bucket it just made:

```bash
# uncomment the backend block in backend.tf
terraform init -migrate-state -backend-config="bucket=$TF_STATE_BUCKET"
```

Losing the local state before this step is recoverable — both resources are
trivially importable, which is what makes the sequence safe.

### 2. Shared

```bash
cd ../envs/shared
terraform init -backend-config="bucket=$TF_STATE_BUCKET"
terraform apply
terraform output name_servers
```

**Delegate those four nameservers at the registrar.** This is the only step in
the whole build that cannot be done from Terraform. Nothing below works until
delegation has propagated — check with
`dig +short NS <domain>` before continuing.

### 3. Production

There is deliberately no staging environment. It was removed once prod was
standing: a second distribution and certificate for a single-author static
site bought a rehearsal step and little else, and the checks below are cheap
enough to run against prod directly. `scripts/preview-with-headers.mjs`
reproduces the header policy and the directory rewrite locally, which is where
a mistake is cheapest to find.

If a rehearsal environment is ever wanted back, `envs/prod` is the template:
copy it, set `subdomain`, and set `noindex = true` so a staging copy cannot
outrank prod for its own content.

```bash
cd ../prod
terraform init -backend-config="bucket=$TF_STATE_BUCKET"
terraform apply
```

Then confirm the certificate covers both names and www canonicalises:

```bash
curl -sI https://www.<domain>/blog/   # 301 -> https://<domain>/blog/
```

### 5. Hand CI the wheel

Set these as GitHub **repository variables** (Settings → Secrets and variables
→ Actions → Variables). They are not secrets — an ARN is useless without a
token whose `sub` claim matches.

| Variable | Value |
|---|---|
| `TF_STATE_BUCKET` | `terraform output -raw state_bucket` from bootstrap |
| `AWS_REGION` | `ap-southeast-1` |
| `AWS_TERRAFORM_ROLE_ARN` | `terraform_role_arn` from `envs/shared` |

And these as **environment** variables, per environment:

| Environment | Variables |
|---|---|
| `prod` | `AWS_DEPLOY_ROLE_ARN`, `SITE_BUCKET`, `CLOUDFRONT_DISTRIBUTION_ID`, `AWS_REGION` |
| `infra-plan` | none |
| `infra-prod` | none |

Then configure the environments themselves:

- **`prod`** and **`infra-prod`** — restrict deployment branches to `main`.
  Add required reviewers to `infra-prod`; that approval gate is the only thing
  between a merged PR and a live infrastructure change.
- **`infra-plan`** — no reviewers, so plans run automatically on PRs.

The environment name is not cosmetic. A job that declares
`environment: prod` gets an OIDC token whose `sub` is
`repo:<owner>/<repo>:environment:prod`, and that exact string is what the
role's trust policy allows.

---

## The two roles

Separated so that a compromised build script cannot rewrite infrastructure.
The deploy workflow runs most often, on the least review, so it gets the
smallest possible grant.

**`<project>-<env>-site-deploy`**

- `s3:ListBucket`, `s3:GetBucketLocation` on one bucket
- `s3:PutObject`, `s3:DeleteObject`, `s3:AbortMultipartUpload` on its contents
- `cloudfront:CreateInvalidation`, `cloudfront:GetInvalidation` on one
  distribution

Deliberately **no `s3:GetObject`**. Syncing local → S3 compares against the
`ListObjectsV2` response and never reads an object body, so a leaked deploy
token cannot read the bucket back out. It also cannot change a bucket policy,
a DNS record, a certificate, or a distribution setting.

**`<project>-terraform`**

Broader by necessity — a CloudFront ARN does not exist before the
distribution does, so it cannot be enumerated in advance. Narrowed three ways
instead: by service (S3, CloudFront, ACM, Route 53, IAM, CloudWatch, SNS,
Budgets), by name prefix on S3 and IAM (`<project>-*`, so it cannot mint an
administrator role), and by an explicit `Deny` on EC2, RDS, ECS, EKS, ELB,
ElastiCache, EMR, Redshift, SageMaker, Lambda and DynamoDB. An explicit Deny
cannot be overridden by any Allow, so even a mistaken policy edit cannot start
a NAT Gateway.

### The trust condition that matters

Both roles condition on `aud` **and** `sub`, with `StringEquals` against an
explicit list:

```
token.actions.githubusercontent.com:aud = sts.amazonaws.com
token.actions.githubusercontent.com:sub = repo:<owner>/<repo>:environment:prod
```

A wildcard `sub` such as `repo:<owner>/*` would let any repository the owner
can create assume the role, so an attacker who can open one repo in the org
owns the account. This is the single most consequential line in the whole
configuration (§12.3), and the module makes it structurally hard to get wrong:
callers pass only the claim *suffix*, the module prepends
`repo:<owner>/<repo>:`, and variable validation rejects any suffix containing
`*` or `?`.

---

## The CSP script hash

`script-src` is `'self'` plus a SHA-256 hash — not `'unsafe-inline'`. The
blocking theme-init script in `<head>` has to be inline and synchronous or the
page paints in the wrong theme first, and hashing it is what keeps the rest of
`script-src` meaningful.

The hashes live in `csp_script_hashes`, a list. While it is empty every inline
script is blocked. `scripts/preview-with-headers.mjs` serves `dist/` with the
real policy attached, which is where that failure should be caught.

**It is a list, not a single hash.** This was written expecting one entry, the
theme-init snippet. The built site has seven: Astro inlines each island's
bundled JavaScript straight into the HTML rather than emitting a file for it,
and different routes carry different ones — the drifting background only on
`/`, the table-of-contents only on articles, the requested-path readout only on
`/404`. Pinning the theme hash alone is the worst available outcome: the theme
applies, the page looks correct, and the header navigation, theme toggle,
animated background, scroll reveals and article TOC are all silently blocked.

Generate them from the build rather than by hand:

```bash
cd site && npm run build && cd ..
node scripts/csp-hashes.mjs            # inspect: hash, size, which routes use it
node scripts/csp-hashes.mjs --write    # rewrite csp_script_hashes in both tfvars
```

The hashes are content-derived, so any change to any client-side script
invalidates one. `node scripts/csp-hashes.mjs --check` runs in `site-ci` after
the build and fails the PR when the pinned list no longer matches the built
HTML — a byte of difference otherwise produces a silent block that no
server-side check can see. The `content_security_policy` output also surfaces
the assembled header in `terraform plan`, so a mismatch is reviewable before
apply rather than in a browser console after it.

> If the inline-script set ever grows faster than this is worth maintaining,
> the durable alternative is Astro's own `security.csp`, which emits a
> per-page `<meta http-equiv>` with hashes it computes itself. The CloudFront
> policy would then stop setting `script-src` and keep the directives that
> cannot be expressed in a meta tag — `frame-ancestors` above all.

---

## Deploys

Three stages, in order, and the order is the point (§13.2).

1. **Hashed assets** (`_astro/*`, `og/*`, `fonts/*`), no `--delete`,
   `max-age=31536000, immutable`. First, so HTML never goes live referencing an
   asset that has not uploaded.
2. **Everything else**, no `--delete`, `max-age=0, must-revalidate`.
3. **Prune** orphans, a delete-only pass, last.

With HTML set to `must-revalidate`, CloudFront holds the object but revalidates
against S3 by ETag on each request. That is what keeps the site correct between
deploys, at the cost of a handful of conditional GETs.

**The deploy also invalidates `/*` every time**, which is belt and braces
rather than a substitute. The header only protects objects that carried it when
the edge first cached them, and one `aws s3 sync` without `--cache-control` is
enough to leave the edge serving a header-less copy under the cache policy's
24-hour default TTL. Every correct deploy afterwards then changes nothing a
visitor can see, which reads as a broken pipeline rather than a poisoned cache.

A wildcard counts as **one path** against the 1,000 free per month, so a daily
deploy spends about 30. That is a cheap price for never debugging this again.

`aws s3 sync` re-uploads every file on every deploy, because it treats a newer
local mtime as a change and a fresh checkout timestamps everything at clone
time. For a site this size that is a few hundred PUTs, and it guarantees the
cache headers are actually applied rather than inherited from an older upload.

---

## Gotchas that cost an evening

**Directory URLs 403 without the CloudFront Function.** OAC requires the S3
REST endpoint, which resolves keys literally and has no concept of an index
document. `/blog/` is not `blog/index.html` to it. The viewer-request function
rewrites both trailing-slash and extensionless URIs; without it every
directory URL on the site fails. Not Lambda@Edge — slower, dearer, and
deployable only from us-east-1. Tested by
`node modules/static-site/functions/directory-index.test.js`, which is worth
running before any change to it, because debugging it in place costs a
distribution deploy per attempt.

**Missing objects return 403, not 404.** A private bucket answers
`AccessDenied` for a key that does not exist, and CloudFront surfaces that as
403. Both codes map to `/404.html`; the 403 row is the one that actually makes
the custom page appear.

**ACM must be in us-east-1.** No exceptions. So must the CloudFront 5xx alarm —
CloudFront publishes metrics only there, and an alarm created elsewhere watches
a metric that never arrives and sits in `INSUFFICIENT_DATA` looking healthy.
Both use the `aws.us_east_1` alias; the bucket stays in ap-southeast-1.

**`allow_overwrite` on the validation records is not optional.** ACM often
issues the same validation CNAME for an apex and its `www` SAN, so two
`for_each` members resolve to one Route 53 record and the second create fails
mid-apply.

**Distributions are slow.** 5–15 minutes to create or update, and one must be
disabled before it can be destroyed. Read the docs and apply once rather than
iterating.

**A `.dev` domain has no HTTP fallback.** The TLD is HSTS-preloaded, so
browsers refuse plaintext entirely and the site is simply unreachable until
the certificate is valid and the distribution is deployed. Check `dig` and the
certificate status before switching a live domain.

**Encrypting the alarm topic breaks the alarm.** SNS SSE needs a KMS key, and
the free `alias/aws/sns` does not grant `cloudwatch.amazonaws.com` permission
to publish. The topic is deliberately unencrypted, with a justification in the
code — encrypting it with the obvious key would make every notification fail
silently.

**A hosted zone bills $0.50/month whether or not it holds records.** Deleting
the records is not enough; delete the zone. It is also why a second environment
is nearly free: it shares this one.

**Scanner suppressions go in different places.** checkov reads
`# checkov:skip=ID:reason` from *inside* the resource block; trivy reads
`#trivy:ignore:ID` from the line *above* it. Neither errors on the wrong
placement — you get a clean pass that checked nothing. The tell for checkov is
a run reporting `Skipped checks: 0`.

---

## Rollback

**Bad site deploy.** Object versioning is on. Either re-run the deploy from the
last good commit — the fastest route, and it exercises the normal path — or
restore prior versions with `aws s3api list-object-versions`. HTML is
`must-revalidate`, so a re-deploy takes effect on the next request without an
invalidation.

**Bad infrastructure apply.** Revert the commit and let `infra.yml` apply the
previous state. Distribution changes take 5–15 minutes each way, so a revert is
not instant. State is versioned in S3 if a state-level rollback is ever needed.

**Locked state.** `use_lockfile` writes a lock object next to the state file. A
killed job can leave one behind:
`aws s3 rm s3://$TF_STATE_BUCKET/envs/prod/terraform.tfstate.tflock` — but
confirm nothing is actually running first.

**Total loss of DNS.** Revert the nameservers at the registrar. Keep any
previous host running and untouched until a clean week has passed (§17).

---

## Local checks

Mirrors what `infra.yml` runs.

```bash
cd infra

terraform fmt -recursive -check
node modules/static-site/functions/directory-index.test.js

for e in envs/shared envs/prod; do
  terraform -chdir="$e" init -backend=false && terraform -chdir="$e" validate
done

TFLINT_CONFIG_FILE="$PWD/.tflint.hcl" tflint --init
TFLINT_CONFIG_FILE="$PWD/.tflint.hcl" tflint --recursive --format compact

checkov -d . --quiet --compact
trivy config --config trivy.yaml .

grep -rn "aws_vpc\|nat_gateway\|aws_lb\|aws_db_instance" --include='*.tf' . \
  || echo "clean: no expensive resources"

# Narrow on purpose: a bare `grep dynamodb` also matches the `dynamodb:*`
# entry in the terraform role's Deny statement, which is the guardrail
# against a lock table, not a violation of it.
grep -rnE 'aws_dynamodb_table|dynamodb_table[[:space:]]*=' --include='*.tf' . \
  || echo "clean: native state locking"
```

`TFLINT_CONFIG_FILE` matters: `--recursive` chdirs into each directory and then
looks for `.tflint.hcl` relative to it, so without an absolute path every
module below `infra/` runs with no AWS rules at all and passes for free.

### Provider lock files

`.terraform.lock.hcl` is committed for each root module, pinning
`hashicorp/aws` with checksums for `linux_amd64`, `linux_arm64`,
`darwin_arm64` and `darwin_amd64`.

All four platforms are there on purpose. A lock file generated by a plain
`terraform init` records only the platform it ran on, so a file created on an
Apple Silicon laptop makes `terraform init` fail on GitHub's linux runners with
*"provider ... does not have a package for linux_amd64 recorded in the lock
file"*. When bumping the provider, regenerate rather than letting `init` do it:

```bash
for d in bootstrap envs/shared envs/prod; do
  terraform -chdir="$d" providers lock \
    -platform=linux_amd64 -platform=linux_arm64 \
    -platform=darwin_arm64 -platform=darwin_amd64
done
```

---

## Cost

| Item | Monthly |
|---|---|
| Route 53 hosted zone (shared by both envs) | $0.50 |
| Route 53 queries (~100k, alias queries free) | ~$0.04 |
| S3 storage (~100 MB across both envs) | ~$0.005 |
| S3 requests | < $0.01 |
| CloudFront — within 1 TB / 10M req free tier | $0.00 |
| CloudFront Functions — within 2M free | $0.00 |
| ACM | $0.00 |
| CloudWatch alarms — within 10 free | $0.00 |
| State bucket | ~$0.001 |
| **Total** | **~$0.55** |

Order-of-magnitude figures; confirm against the AWS calculator before
committing, since published prices and free-tier terms change.

**What keeps it there:** no VPC, no NAT Gateway, no ALB, no RDS, no ECS, no
EC2 — those four are how static-site projects reach $60/month. No DynamoDB lock
table (native S3 locking since Terraform 1.10). No WAF ($5/month against a
$0.55 stack). No DNSSEC (~$1/month in KMS). No access logging. Each is a
written decision rather than an omission, and the `terraform` role denies the
expensive services outright so the constraint survives a careless edit.

Guardrails: a $5/month budget alerting at 80% actual and 100% forecast, a
CloudFront 5xx alarm at 1% over five minutes, and a monthly scheduled
`terraform plan` that raises a GitHub issue if the account has drifted from
this repository.

---

## Manual steps, all of them

Everything else is Terraform. These are not:

1. **Register the domain** and set `domain_name` in all three tfvars.
2. **Delegate the nameservers** at the registrar, from `envs/shared`'s
   `name_servers` output.
3. **Confirm the SNS email subscription** from the inbox. Terraform reports
   success while the subscription sits in `PendingConfirmation`.
4. **Enable billing alerts** in the account's root billing preferences — an
   account-root setting with no API.
5. **Set the GitHub variables and configure the four environments**, including
   required reviewers on `infra-prod`.
6. **Uncomment `bootstrap/backend.tf`** and run `init -migrate-state`, once.
