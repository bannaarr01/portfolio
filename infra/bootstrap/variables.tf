variable "project" {
  description = "Project slug. Prefixes every resource name and lands in default_tags."
  type        = string
  default     = "portfolio"

  validation {
    condition     = can(regex("^[a-z0-9][a-z0-9-]{1,30}[a-z0-9]$", var.project))
    error_message = "project must be lowercase alphanumeric with hyphens (S3 bucket name safe)."
  }
}

variable "region" {
  description = "Region for the Terraform state bucket. Matches the origin bucket region."
  type        = string
  default     = "ap-southeast-1"
}

variable "github_owner" {
  description = "GitHub user or org that owns the repository."
  type        = string
}

variable "github_repo" {
  description = "GitHub repository name."
  type        = string
}

variable "noncurrent_version_expiration_days" {
  description = "How long superseded state versions are retained before expiry."
  type        = number
  default     = 90
}
