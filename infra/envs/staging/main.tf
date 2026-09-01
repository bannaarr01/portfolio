##############################################################################
# envs/staging — staging.<domain>, same module as prod.
#
# This environment exists so the CloudFront Function, the 403->404 mapping and
# the headers policy get debugged here rather than on the live apex (§16 Phase
# 4). It is the same module with different tfvars; if it works here and breaks
# in prod, the difference is in a variable, not in the code.
#
# It adds essentially nothing to the bill: the hosted zone is shared with prod
# and both distributions sit inside the same CloudFront free tier.
##############################################################################

# The zone is owned by envs/shared. Looked up by name rather than wired
# through remote state, so staging has no read dependency on shared's state
# file and either can be applied without unlocking the other.
#
# The lookup is skipped when hosted_zone_id is set explicitly. That matters
# for planning on an account where shared has not been applied yet: a data
# source that resolves nothing is a plan-time error, not an empty result, so
# without the override this environment could not be planned in isolation.
data "aws_route53_zone" "primary" {
  count = var.hosted_zone_id == null ? 1 : 0

  name         = var.domain_name
  private_zone = false
}

locals {
  hosted_zone_id = (
    var.hosted_zone_id != null
    ? var.hosted_zone_id
    : data.aws_route53_zone.primary[0].zone_id
  )
}

module "site" {
  source = "../../modules/static-site"

  # Both providers are mandatory — the module declares configuration_aliases,
  # so omitting the second is a plan-time error rather than a certificate
  # created in the wrong region.
  providers = {
    aws           = aws
    aws.us_east_1 = aws.us_east_1
  }

  project     = var.project
  environment = "staging"

  primary_domain_name = "${var.subdomain}.${var.domain_name}"
  hosted_zone_id      = local.hosted_zone_id

  # One name only, so there is nothing to canonicalise.
  additional_domain_names = []
  canonical_host          = null

  # A staging copy of the site outranking prod for its own content is a real
  # and slow-to-undo problem.
  noindex = true

  price_class       = var.price_class
  csp_script_hashes = var.csp_script_hashes
  alert_emails      = var.alert_emails
}

module "ci_oidc" {
  source = "../../modules/ci-oidc"

  project      = var.project
  environment  = "staging"
  github_owner = var.github_owner
  github_repo  = var.github_repo

  github_owner_id = var.github_owner_id
  github_repo_id  = var.github_repo_id

  create_deploy_role    = true
  create_terraform_role = false # owned by envs/shared

  deploy_subject_claims = var.deploy_subject_claims
  site_bucket_arn       = module.site.bucket_arn
  distribution_arn      = module.site.distribution_arn
}
