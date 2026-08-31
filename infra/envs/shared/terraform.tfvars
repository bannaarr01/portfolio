project = "portfolio"
region  = "ap-southeast-1"

# TODO(owner): the one value the whole stack needs and nobody can infer.
# Set this to the registered apex domain before the first apply. Everything
# else — certificate names, aliases, staging subdomain — is derived from it.
domain_name = "example.dev"

github_owner = "bannaarr01"
github_repo  = "portfolio"

# TODO(owner): budget and 5xx alerts go nowhere until this is set. An email
# subscription also has to be confirmed from the inbox after the first apply.
alert_emails = []

monthly_budget_usd = 5
