variable "domain_name" {
  description = "Apex domain for the hosted zone, e.g. example.dev. No trailing dot."
  type        = string

  validation {
    condition     = can(regex("^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$", var.domain_name))
    error_message = "domain_name must be a bare lowercase domain with no scheme, path, or trailing dot."
  }
}

variable "comment" {
  description = "Hosted zone comment."
  type        = string
  default     = "Managed by Terraform — portfolio + journal"
}
