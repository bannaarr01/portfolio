##############################################################################
# envs/shared — the account-level singletons.
#
# Three things live here because each one is shared by every environment and
# has a lifecycle that must survive any single site being destroyed:
#
#   dns         the hosted zone. Both prod and staging resolve through it,
#               which is the entire reason staging costs nothing.
#   guardrails  the monthly budget. Account-scoped; two would double-count.
#               (Group 08 additions live here, not in envs/prod, so that
#               `terraform destroy` on a site cannot remove the cost ceiling.)
#   ci-oidc     the terraform role only. It manages both environments, so
#               there must be exactly one.
#
# Apply order: shared -> staging -> prod. The first apply is manual — the role
# CI uses to run applies is created here, so it cannot create itself.
##############################################################################

data "aws_caller_identity" "current" {}

locals {
  # Mirrors the naming in infra/bootstrap. Derived rather than passed in as a
  # tfvar so the account id stays out of version control.
  state_bucket_arn = "arn:aws:s3:::${var.project}-tfstate-${data.aws_caller_identity.current.account_id}"
}

module "dns" {
  source = "../../modules/dns"

  domain_name = var.domain_name
}

module "guardrails" {
  source = "../../modules/guardrails"

  project           = var.project
  monthly_limit_usd = var.monthly_budget_usd
  alert_emails      = var.alert_emails
}

module "ci_oidc" {
  source = "../../modules/ci-oidc"

  project      = var.project
  environment  = "shared"
  github_owner = var.github_owner
  github_repo  = var.github_repo

  # The deploy roles are per-environment and are created by envs/staging and
  # envs/prod, each scoped to its own bucket and distribution.
  create_deploy_role    = false
  create_terraform_role = true

  terraform_subject_claims = var.terraform_subject_claims
  state_bucket_arn         = local.state_bucket_arn
}
