##############################################################################
# Response headers policy (§14).
#
# Managed by Terraform and attached to the cache behaviour rather than written
# as per-object metadata at deploy time. Two reasons: the policy is versioned
# with the infrastructure, and it cannot drift per-file when someone syncs one
# object by hand.
##############################################################################

locals {
  # Quoted hash sources for script-src. Empty until group 09 computes the
  # theme-init hash; until then script-src is 'self' only, which blocks the
  # inline theme script and produces a light flash — expected on staging,
  # which is exactly where it should be caught.
  csp_script_src = trimspace(join(" ", concat(
    ["'self'"],
    [for hash in var.csp_script_hashes : "'${hash}'"]
  )))

  # style-src keeps 'unsafe-inline' because Astro emits scoped inline styles
  # per component. Hashing those is possible but they change on every build,
  # which would couple the CSP to the content. Inline style is a far weaker
  # vector than inline script, so this is a deliberate stopping point.
  csp_directives = [
    "default-src 'self'",
    "img-src 'self' data:",
    "style-src 'self' 'unsafe-inline'",
    "script-src ${local.csp_script_src}",
    "font-src 'self'",
    "connect-src 'self'",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "object-src 'none'",
  ]

  content_security_policy = coalesce(
    var.content_security_policy_override,
    join("; ", local.csp_directives)
  )

  permissions_policy = join(", ", [
    "camera=()",
    "microphone=()",
    "geolocation=()",
    "interest-cohort=()",
  ])
}

resource "aws_cloudfront_response_headers_policy" "site" {
  name    = "${local.name_prefix}-security-headers"
  comment = "Security headers for ${var.primary_domain_name}"

  security_headers_config {
    strict_transport_security {
      access_control_max_age_sec = var.hsts_max_age_seconds
      include_subdomains         = true
      preload                    = true
      override                   = true
    }

    content_type_options {
      override = true
    }

    frame_options {
      frame_option = "DENY"
      override     = true
    }

    referrer_policy {
      referrer_policy = "strict-origin-when-cross-origin"
      override        = true
    }

    content_security_policy {
      content_security_policy = local.content_security_policy
      override                = true
    }

    # X-XSS-Protection is deliberately absent. It is deprecated, ignored by
    # every current browser, and its legacy filter mode introduced its own
    # vulnerabilities. CSP frame-ancestors and object-src cover the ground.
  }

  # Permissions-Policy has no first-class field in security_headers_config, so
  # it goes here. X-Robots-Tag joins it on staging.
  custom_headers_config {
    items {
      header   = "Permissions-Policy"
      value    = local.permissions_policy
      override = true
    }

    dynamic "items" {
      for_each = var.noindex ? [1] : []

      content {
        header   = "X-Robots-Tag"
        value    = "noindex, nofollow"
        override = true
      }
    }
  }
}
