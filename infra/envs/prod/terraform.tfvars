project = "portfolio"
region  = "ap-southeast-1"

# Must match envs/shared and envs/staging.
#
# RESOLVED — option (b): production serves `joshua.naijora.com`, which is what
# README.md, AGENTS.md, domain.md §"Site domain" and astro.config.mjs have all
# stated throughout. The environment now takes the same optional `subdomain`
# staging has, rather than the docs being rewritten around the apex.
#
# `serve_www` stays false, and `variables.tf` now enforces that rather than
# leaving it to a comment: `www.joshua.naijora.com` is two labels deep, the
# issued `*.naijora.com` wildcard matches exactly one, and ACM SANs are
# immutable — so covering it would mean a new certificate, not an edit
# (domain.md, AGENTS.md gotcha 8).
domain_name = "naijora.com"
subdomain   = "joshua"
serve_www   = false

github_owner = "bannaarr01"
github_repo  = "portfolio"

price_class = "PriceClass_100"

# Subscribers to the budget alert and the CloudFront 5xx alarm. Taken from
# src/data/profile.ts, which is the owner address the site itself publishes.
# AWS emails a confirmation link on first apply; the subscription stays
# `PendingConfirmation` and delivers nothing until it is clicked.
alert_emails = ["joshboluwaji6@gmail.com"]

# SHA-256 of every inline script Astro emits, the theme-init snippet in <head>
# among them. Generated — do not hand-edit:
#
#   cd site && npm run build && cd .. && node scripts/csp-hashes.mjs --write
#
# `--check` runs in CI after every build and fails the PR when this list drifts
# from the built HTML. A stale pin blocks the script in the browser with
# nothing failing server-side.
csp_script_hashes = [
  "sha256-4b9oPjnUUFRdUeURwjjgOhE4RGFwav0SBb/1r09o1sQ=",
  "sha256-4Q3t86Dj7+regSv2Z6VYmWgD72jwbPj0OGsA+wIDCg0=",
  "sha256-7ST4PMH3SR2NzfTY4F5QiKna6vk8A1VxXX2/TL2/WZ8=",
  "sha256-D0LuMSQpGipcjhwPR3saVlPQ6guxc4nxIrnBJpcRWLc=",
  "sha256-egG+mnX9wgbLFXB7l7/Wc9YR+IT61wR2SbapZ9pgkwY=",
  "sha256-Lrtr52O2Ae71clf8Hd/4yaV35HQYwgHvoL01pAwk14Y=",
  "sha256-zA0JuV0MXfOPHoPioJqzttJHu3WTE+CHpqtYWIyOHZY=",
  "sha256-ZNaHmJ9768xvoLielXhyLSF21BEBr1B8/aulYAmYnWQ=",
]

deploy_subject_claims = ["environment:prod"]
