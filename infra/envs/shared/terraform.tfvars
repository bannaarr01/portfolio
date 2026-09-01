project = "portfolio"
region  = "ap-southeast-1"

# The registered apex. Everything else — certificate names, aliases, the
# staging subdomain — is derived from it. A wildcard cert for *.naijora.com
# is already issued; see README.md and AGENTS.md.
domain_name = "naijora.com"

github_owner = "bannaarr01"
github_repo  = "portfolio"

# Numeric ids for the immutable OIDC subject claim.
#   gh api repos/bannaarr01/portfolio --jq '{repo_id: .id, owner_id: .owner.id}'
github_owner_id = 86472333
github_repo_id  = 1351433953

# TODO(owner): budget and 5xx alerts go nowhere until this is set. An email
# subscription also has to be confirmed from the inbox after the first apply.
# Subscriber for the account-wide budget alert this environment owns. Same
# address as staging and prod. AWS emails a confirmation link on first apply
# and delivers nothing until it is clicked.
alert_emails = ["joshboluwaji6@gmail.com"]

monthly_budget_usd = 5
