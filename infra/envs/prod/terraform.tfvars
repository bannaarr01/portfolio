project = "portfolio"
region  = "ap-southeast-1"

# TODO(owner): must match envs/shared and envs/staging.
domain_name = "example.dev"
serve_www   = true

github_owner = "bannaarr01"
github_repo  = "portfolio"

price_class = "PriceClass_100"

# TODO(owner): 5xx alarm has no subscriber until this is set.
alert_emails = []

# TODO(group 09): the SHA-256 of the inline theme-init script in <head>.
# Compute it from the built HTML — see infra/README.md § CSP hash. Until it is
# set, script-src is 'self' only and the theme script is blocked.
csp_script_hashes = []

deploy_subject_claims = ["environment:prod"]
