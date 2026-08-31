variable "project" {
  description = "Project slug."
  type        = string
  default     = "portfolio"
}

variable "region" {
  description = "Region for the origin bucket."
  type        = string
  default     = "ap-southeast-1"
}

variable "domain_name" {
  description = "Apex domain. Served alongside its www SAN."
  type        = string
}

variable "hosted_zone_id" {
  description = "Route 53 zone id. Null (the default) looks the zone up by domain_name, which is the normal path once envs/shared has been applied. Set it explicitly to plan this environment against an account where the zone does not exist yet."
  type        = string
  default     = null
}

variable "serve_www" {
  description = "Whether www.<domain> is an alias on the distribution and a SAN on the certificate. When true, canonical_host 301s it to the apex."
  type        = bool
  default     = true
}

variable "github_owner" {
  description = "GitHub user or org."
  type        = string
}

variable "github_repo" {
  description = "GitHub repository name."
  type        = string
}

variable "price_class" {
  description = "CloudFront price class. PriceClass_100 is NA + EU; widen only if the audience warrants it."
  type        = string
  default     = "PriceClass_100"
}

variable "csp_script_hashes" {
  description = "SHA-256 hashes for inline scripts allowed by CSP script-src. Group 09 supplies the theme-init hash."
  type        = list(string)
  default     = []
}

variable "alert_emails" {
  description = "Addresses subscribed to the 5xx alarm topic."
  type        = list(string)
  default     = []
}

variable "deploy_subject_claims" {
  description = "GitHub OIDC subject suffixes allowed to assume the prod deploy role."
  type        = list(string)
  default     = ["environment:prod"]
}
