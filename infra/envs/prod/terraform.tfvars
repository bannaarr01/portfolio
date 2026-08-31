project = "portfolio"
region  = "ap-southeast-1"

# Must match envs/shared and envs/staging.
#
# ⚠ UNRESOLVED — this does not yet describe the documented production host.
#
# README.md and AGENTS.md both state production is `joshua.naijora.com`, but
# this module has no `subdomain` variable the way staging does: it derives its
# aliases as `domain_name` plus optionally `www.<domain_name>`. As written it
# would serve the apex `naijora.com` and `www.naijora.com`.
#
# `serve_www` is therefore false rather than true: the issued wildcard covers
# `*.naijora.com` and the apex, but NOT a second-level name, so if a subdomain
# is adopted below then `www.joshua.naijora.com` would need a new certificate
# rather than an edit (AGENTS.md gotcha 8).
#
# Pick one before the first prod apply:
#   a) serve the apex — keep this as-is and correct the docs, or
#   b) serve joshua.naijora.com — give this module the same optional
#      `subdomain` variable staging already has.
#
# Left unapplied deliberately; group 09 does not guess a production hostname.
domain_name = "naijora.com"
serve_www   = false

github_owner = "bannaarr01"
github_repo  = "portfolio"

price_class = "PriceClass_100"

# TODO(owner): 5xx alarm has no subscriber until this is set.
alert_emails = []

# TODO(group 09): the SHA-256 of the inline theme-init script in <head>.
# Compute it from the built HTML — see infra/README.md § CSP hash. Until it is
# set, script-src is 'self' only and the theme script is blocked.
csp_script_hashes = [
  "sha256-4b9oPjnUUFRdUeURwjjgOhE4RGFwav0SBb/1r09o1sQ=",
  "sha256-7ST4PMH3SR2NzfTY4F5QiKna6vk8A1VxXX2/TL2/WZ8=",
  "sha256-D0LuMSQpGipcjhwPR3saVlPQ6guxc4nxIrnBJpcRWLc=",
  "sha256-IvGIzIu8xArW/Th+1gKQaK+PpS1NemQ/53EaVP5gmU0=",
  "sha256-joyFwfzrzSxamAIxaZLQaxfHzIsBx7iMMkI++PS47Z8=",
  "sha256-Lrtr52O2Ae71clf8Hd/4yaV35HQYwgHvoL01pAwk14Y=",
  "sha256-ZNaHmJ9768xvoLielXhyLSF21BEBr1B8/aulYAmYnWQ=",
]

deploy_subject_claims = ["environment:prod"]
