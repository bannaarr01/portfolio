variable "project" {
  description = "Project slug, used in role names and to scope IAM resource ARNs."
  type        = string
}

variable "environment" {
  description = "Environment name — staging or prod."
  type        = string
}

variable "github_owner" {
  description = "GitHub user or org. Half of the `sub` claim, so getting it wrong makes the role unassumable rather than over-permissive."
  type        = string
}

variable "github_repo" {
  description = "GitHub repository name. The other half of the `sub` claim."
  type        = string
}

variable "oidc_provider_arn" {
  description = "ARN of the GitHub OIDC provider created by infra/bootstrap. Null looks it up by URL, which is the normal path — an account can only hold one provider per URL, so it is unambiguous."
  type        = string
  default     = null
}

# ---------------------------------------------------------------------------
# Trust subjects — §12.3, the most consequential lines in the whole stack
# ---------------------------------------------------------------------------
#
# These are the claim *suffixes*. The module always prepends
# `repo:<owner>/<repo>:`, so the repository itself can never be widened by a
# caller mistake; the only thing a caller controls is which ref or environment
# inside that repo is trusted. Both validations reject `*` outright.

variable "deploy_subject_claims" {
  description = "Claim suffixes allowed to assume the site-deploy role, e.g. [\"ref:refs/heads/main\"] or [\"environment:prod\"]."
  type        = list(string)
  default     = ["ref:refs/heads/main"]

  validation {
    condition     = length(var.deploy_subject_claims) > 0
    error_message = "At least one subject claim is required; an empty list produces a role nothing can assume."
  }

  validation {
    condition     = alltrue([for claim in var.deploy_subject_claims : !can(regex("[*?]", claim))])
    error_message = "Wildcards are forbidden in a subject claim. `repo:owner/*` lets every repository in the org assume this role — see astro.md §12.3."
  }
}

variable "terraform_subject_claims" {
  description = "Claim suffixes allowed to assume the terraform role. Use GitHub Environments (`environment:<name>`) rather than a branch ref, so the apply inherits the environment's required-reviewer gate."
  type        = list(string)
  default     = ["environment:infra-plan", "environment:infra-prod"]

  validation {
    condition     = length(var.terraform_subject_claims) > 0
    error_message = "At least one subject claim is required."
  }

  validation {
    condition     = alltrue([for claim in var.terraform_subject_claims : !can(regex("[*?]", claim))])
    error_message = "Wildcards are forbidden in a subject claim — see astro.md §12.3."
  }
}

# ---------------------------------------------------------------------------
# What the deploy role is allowed to touch
# ---------------------------------------------------------------------------

variable "site_bucket_arn" {
  description = "ARN of the origin bucket for this environment. The deploy role's S3 permissions are scoped to exactly this bucket. Required when create_deploy_role is true."
  type        = string
  default     = null
}

variable "distribution_arn" {
  description = "ARN of this environment's distribution. The only ARN on which the deploy role may create an invalidation. Required when create_deploy_role is true."
  type        = string
  default     = null
}

variable "state_bucket_arn" {
  description = "ARN of the Terraform state bucket, so the terraform role can read and write state and the native lock object. Required when create_terraform_role is true."
  type        = string
  default     = null
}

variable "max_session_duration" {
  description = "Maximum assumed-session length in seconds. One hour is comfortably longer than any job here, including a 15-minute CloudFront deploy."
  type        = number
  default     = 3600
}

# ---------------------------------------------------------------------------
# Which role this call creates
# ---------------------------------------------------------------------------
#
# The two roles have different scopes, so they are created from different
# places. The deploy role is per-environment — it names one bucket and one
# distribution — so staging and prod each get their own. The terraform role is
# account-wide in effect and manages both environments, so it is created once
# from envs/shared. Creating it per-environment would produce two roles racing
# for the same state.

variable "create_deploy_role" {
  description = "Create the per-environment site-deploy role."
  type        = bool
  default     = true

  validation {
    condition     = !var.create_deploy_role || (var.site_bucket_arn != null && var.distribution_arn != null)
    error_message = "create_deploy_role requires both site_bucket_arn and distribution_arn; an unscoped deploy role is the thing this module exists to prevent."
  }
}

variable "create_terraform_role" {
  description = "Create the account-level terraform role. True in envs/shared only."
  type        = bool
  default     = false

  validation {
    condition     = !var.create_terraform_role || var.state_bucket_arn != null
    error_message = "create_terraform_role requires state_bucket_arn, or the role cannot read its own state."
  }
}
