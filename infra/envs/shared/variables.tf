variable "project" {
  description = "Project slug."
  type        = string
  default     = "portfolio"
}

variable "region" {
  description = "Default region. Matches the state and origin buckets."
  type        = string
  default     = "ap-southeast-1"
}

variable "domain_name" {
  description = "Apex domain. The hosted zone created here is authoritative for it and is shared by every environment."
  type        = string
}

variable "github_owner" {
  description = "GitHub user or org."
  type        = string
}

variable "github_repo" {
  description = "GitHub repository name."
  type        = string
}

# Numeric GitHub ids, for the immutable `sub` claim. See the note in
# modules/ci-oidc/variables.tf.
variable "github_owner_id" {
  description = "Numeric GitHub account id of the owner."
  type        = number
  default     = null
}

variable "github_repo_id" {
  description = "Numeric GitHub repository id."
  type        = number
  default     = null
}

variable "alert_emails" {
  description = "Addresses that receive budget alerts."
  type        = list(string)
  default     = []
}

variable "monthly_budget_usd" {
  description = "Monthly cost ceiling."
  type        = number
  default     = 5
}

variable "terraform_subject_claims" {
  description = "GitHub OIDC subject suffixes allowed to assume the terraform role. GitHub Environments rather than branch refs, so the apply inherits the environment's required-reviewer gate."
  type        = list(string)
  default     = ["environment:infra-plan", "environment:infra-prod"]
}
