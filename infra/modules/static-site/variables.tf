# ---------------------------------------------------------------------------
# Identity
# ---------------------------------------------------------------------------

variable "project" {
  description = "Project slug, used in resource names."
  type        = string
}

variable "environment" {
  description = "Environment name — staging or prod. Part of every resource name."
  type        = string

  validation {
    condition     = contains(["staging", "prod"], var.environment)
    error_message = "environment must be staging or prod."
  }
}

# ---------------------------------------------------------------------------
# Domains
# ---------------------------------------------------------------------------

variable "primary_domain_name" {
  description = "Canonical name for this environment. Becomes the ACM certificate's common name and the first CloudFront alias. Apex for prod, staging.<domain> for staging."
  type        = string
}

variable "additional_domain_names" {
  description = "Extra names served by the same distribution and covered by the certificate as SANs. Typically [\"www.<domain>\"] for prod, empty for staging."
  type        = list(string)
  default     = []
}

variable "hosted_zone_id" {
  description = "Route 53 zone id from modules/dns. Shared by both environments."
  type        = string
}

variable "canonical_host" {
  description = "When set, every request arriving on any other alias is 301'd here by the viewer-request function. Set to the apex in prod so apex and www are not two indexable copies. Null disables the redirect."
  type        = string
  default     = null

  validation {
    condition = (
      var.canonical_host == null ||
      contains(concat([var.primary_domain_name], var.additional_domain_names), coalesce(var.canonical_host, ""))
    )
    error_message = "canonical_host must be one of primary_domain_name or additional_domain_names, otherwise every request redirects to a host this distribution does not serve."
  }
}

# ---------------------------------------------------------------------------
# Storage
# ---------------------------------------------------------------------------

variable "bucket_name" {
  description = "Override the origin bucket name. Null derives <project>-<environment>-site-<account-id>, which is globally unique without leaking anything."
  type        = string
  default     = null
}

variable "noncurrent_version_expiration_days" {
  description = "Retention for superseded object versions. Versioning is the rollback mechanism for a bad deploy; 30 days is far longer than anyone waits to notice."
  type        = number
  default     = 30
}

# ---------------------------------------------------------------------------
# Distribution
# ---------------------------------------------------------------------------

variable "price_class" {
  description = "CloudFront price class. PriceClass_100 (NA + EU) is the cheapest and the free tier covers this site's traffic at any class."
  type        = string
  default     = "PriceClass_100"

  validation {
    condition     = contains(["PriceClass_100", "PriceClass_200", "PriceClass_All"], var.price_class)
    error_message = "price_class must be PriceClass_100, PriceClass_200, or PriceClass_All."
  }
}

variable "default_root_object" {
  description = "Object served for the distribution root."
  type        = string
  default     = "index.html"
}

variable "error_document" {
  description = "Key served for both 403 and 404. See §11.2 — a private bucket answers AccessDenied for a missing key, so the 403 mapping is what actually surfaces this page."
  type        = string
  default     = "/404.html"
}

variable "access_log_bucket_domain_name" {
  description = "Bucket domain name for CloudFront standard access logs. Null (the default) leaves logging OFF per §15 — the storage and PUT charges buy data nobody reads. If turned on, note that legacy CloudFront logging writes via ACL, so the target bucket cannot use BucketOwnerEnforced, and it wants a 7-day expiry lifecycle rule."
  type        = string
  default     = null
}

variable "access_log_prefix" {
  description = "Key prefix for access logs, when enabled."
  type        = string
  default     = "cloudfront/"
}

# ---------------------------------------------------------------------------
# Response headers (§14)
# ---------------------------------------------------------------------------

variable "csp_script_hashes" {
  description = "SHA-256 hashes of inline scripts allowed by CSP script-src, each including its algorithm prefix, e.g. sha256-abc123... The blocking theme-init script in <head> must be inline to avoid a flash of the wrong theme, and hashing it is what keeps script-src free of 'unsafe-inline'. Group 09 computes this from the built HTML and fills it in."
  type        = list(string)
  default     = []

  validation {
    condition = alltrue([
      for h in var.csp_script_hashes : can(regex("^sha(256|384|512)-[A-Za-z0-9+/]+={0,2}$", h))
    ])
    error_message = "Each hash must be of the form sha256-<base64>. A bare base64 digest without the algorithm prefix is the usual mistake and silently blocks the script."
  }
}

variable "content_security_policy_override" {
  description = "Escape hatch: replaces the assembled CSP wholesale. Prefer csp_script_hashes."
  type        = string
  default     = null
}

variable "noindex" {
  description = "Emit X-Robots-Tag: noindex, nofollow. True on staging so a staging URL never outranks prod."
  type        = bool
  default     = false
}

variable "hsts_max_age_seconds" {
  description = "Strict-Transport-Security max-age. 63072000 (two years) is the value the preload list expects."
  type        = number
  default     = 63072000
}

# ---------------------------------------------------------------------------
# Guardrails (§15)
# ---------------------------------------------------------------------------

variable "alert_emails" {
  description = "Addresses subscribed to the alarm topic. Empty creates the alarm with no action — visible in the console, but nobody is told."
  type        = list(string)
  default     = []
}

variable "five_xx_error_rate_threshold" {
  description = "Percent of requests returning 5xx, over 5 minutes, that trips the alarm."
  type        = number
  default     = 1
}
