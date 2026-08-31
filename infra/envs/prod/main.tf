##############################################################################
# envs/prod — apex + www.
#
# The same modules staging uses, with different tfvars. If something works on
# staging and fails here, the difference is a variable.
#
# §11.4 applies: a distribution change takes 5–15 minutes to deploy. If the
# domain is a `.dev` there is also no HTTP fallback (§11.3), so the site is
# unreachable between the DNS switch and the certificate being live — validate
# on staging first, and do not discover a headers-policy typo here.
##############################################################################

# Owned by envs/shared and looked up by name, so prod holds no read lock on
# shared's state. Skipped when hosted_zone_id is passed explicitly — a data
# source that resolves nothing is a plan-time error, so the override is what
# lets this environment be planned before shared has ever been applied.
data "aws_route53_zone" "primary" {
  count = var.hosted_zone_id == null ? 1 : 0

  name         = var.domain_name
  private_zone = false
}

locals {
  www_domain = "www.${var.domain_name}"

  hosted_zone_id = (
    var.hosted_zone_id != null
    ? var.hosted_zone_id
    : data.aws_route53_zone.primary[0].zone_id
  )
}

module "site" {
  source = "../../modules/static-site"

  providers = {
    aws           = aws
    aws.us_east_1 = aws.us_east_1
  }

  project     = var.project
  environment = "prod"

  primary_domain_name     = var.domain_name
  additional_domain_names = var.serve_www ? [local.www_domain] : []
  hosted_zone_id          = local.hosted_zone_id

  # Both names are aliases on one distribution, so without a canonical host
  # they would serve two indexable copies of every page. The viewer-request
  # function 301s www to the apex — at the edge, free, and before the cache.
  canonical_host = var.serve_www ? var.domain_name : null

  noindex           = false
  price_class       = var.price_class
  csp_script_hashes = var.csp_script_hashes
  alert_emails      = var.alert_emails
}

module "ci_oidc" {
  source = "../../modules/ci-oidc"

  project      = var.project
  environment  = "prod"
  github_owner = var.github_owner
  github_repo  = var.github_repo

  create_deploy_role    = true
  create_terraform_role = false # owned by envs/shared

  deploy_subject_claims = var.deploy_subject_claims
  site_bucket_arn       = module.site.bucket_arn
  distribution_arn      = module.site.distribution_arn
}
