project = "portfolio"
region  = "ap-southeast-1"

# Must match envs/shared and envs/prod. Serves staging.naijora.com, which
# the existing *.naijora.com wildcard covers.
domain_name = "naijora.com"
subdomain   = "staging"

github_owner = "bannaarr01"
github_repo  = "portfolio"

# Numeric ids for the immutable OIDC subject claim.
#   gh api repos/bannaarr01/portfolio --jq '{repo_id: .id, owner_id: .owner.id}'
github_owner_id = 86472333
github_repo_id  = 1351433953

price_class = "PriceClass_100"

# Subscribers to the budget alert and the CloudFront 5xx alarm. Same address as
# prod: staging is where a broken headers policy or a bad rewrite should surface
# first, so it is the environment whose alarms most need to reach someone.
# AWS emails a confirmation link on first apply.
alert_emails = ["joshboluwaji6@gmail.com"]

# SHA-256 of every inline script Astro emits. Generated, byte-identical to
# prod's list because both environments serve the same build:
#
#   cd site && npm run build && cd .. && node scripts/csp-hashes.mjs --write
#
# Do not hand-edit. `--check` runs in CI and fails the PR on drift.
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

deploy_subject_claims = ["environment:staging"]
