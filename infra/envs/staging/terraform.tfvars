project = "portfolio"
region  = "ap-southeast-1"

# TODO(owner): must match envs/shared and envs/prod.
domain_name = "example.dev"
subdomain   = "staging"

github_owner = "bannaarr01"
github_repo  = "portfolio"

price_class = "PriceClass_100"

# TODO(owner): 5xx alarm has no subscriber until this is set.
alert_emails = []

# Filled by group 09 once the theme-init script text is final. Empty means
# script-src is 'self' only, so the inline theme script is blocked and staging
# shows a flash of the wrong theme — which is the intended failure mode: it is
# visible here rather than in prod.
csp_script_hashes = []

deploy_subject_claims = ["environment:staging"]
