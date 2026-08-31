##############################################################################
# CloudFront distribution + viewer-request function.
#
# §11.4 applies to everything in this file: a create or update takes 5–15
# minutes, and a distribution must be disabled before it can be destroyed.
# Read the docs, apply once. Do not iterate on these settings by trial.
##############################################################################

resource "aws_cloudfront_function" "directory_index" {
  name    = "${local.name_prefix}-directory-index"
  runtime = "cloudfront-js-2.0"
  comment = "Directory-index rewrite for S3 REST origin; optional host canonicalisation"
  publish = true

  code = templatefile("${path.module}/functions/directory-index.js", {
    # Empty string rather than null: the JS compares against '' to decide
    # whether the redirect is enabled.
    canonical_host = coalesce(var.canonical_host, "")
  })
}

# Managed policy lookups rather than hardcoded UUIDs. CachingOptimized
# forwards no cookies or query strings and honours the origin's Cache-Control,
# which is what makes the two-regime strategy in §13.1 work: the immutable
# header on hashed assets and the must-revalidate header on HTML are both set
# at upload time and simply respected here.
data "aws_cloudfront_cache_policy" "caching_optimized" {
  name = "Managed-CachingOptimized"
}

# trivy:ignore:AWS-0011
# trivy:ignore:AWS-0010
resource "aws_cloudfront_distribution" "site" {
  # Config-scan exceptions, justified in place. (checkov reads these from
  # inside the block; trivy reads its own from the two lines above it.)
  #
  # checkov:skip=CKV_AWS_68:No WAF. The origin is a private bucket of static files — no forms, no query parameters that reach anything, no server-side code. AWS WAF is $5/mo plus per-request charges, roughly ten times the entire infrastructure bill, to filter attacks against surface that does not exist.
  # checkov:skip=CKV2_AWS_47:Same reason — the Log4j managed rule group presumes a Java application behind the CDN. There is no application.
  # checkov:skip=CKV_AWS_310:No origin failover. One S3 origin at eleven nines of durability; a second origin group would add cost and a second thing to keep in sync for no availability gain.
  # checkov:skip=CKV_AWS_374:No geo restriction. This is a public portfolio; being readable from anywhere is the requirement, not an oversight.

  enabled             = true
  is_ipv6_enabled     = true
  comment             = "${local.name_prefix} — ${var.primary_domain_name}"
  aliases             = local.all_domain_names
  default_root_object = var.default_root_object
  price_class         = var.price_class

  origin {
    domain_name              = aws_s3_bucket.site.bucket_regional_domain_name
    origin_id                = local.origin_id
    origin_access_control_id = aws_cloudfront_origin_access_control.site.id

    # No s3_origin_config / no custom_origin_config. OAC replaces the former,
    # and the latter would mean talking to the public website endpoint.
  }

  default_cache_behavior {
    target_origin_id       = local.origin_id
    viewer_protocol_policy = "redirect-to-https"
    compress               = true

    # A static site has nothing to POST to. Narrowing the method set removes
    # the possibility of a proxied write reaching the bucket.
    allowed_methods = ["GET", "HEAD"]
    cached_methods  = ["GET", "HEAD"]

    cache_policy_id            = data.aws_cloudfront_cache_policy.caching_optimized.id
    response_headers_policy_id = aws_cloudfront_response_headers_policy.site.id

    function_association {
      event_type   = "viewer-request"
      function_arn = aws_cloudfront_function.directory_index.arn
    }
  }

  # §11.2 — both codes, not just 404.
  #
  # The bucket is private, so S3 answers a missing key with AccessDenied
  # rather than NoSuchKey, and CloudFront surfaces that as 403. The 403 row is
  # therefore the one that actually makes the custom 404 page appear; the 404
  # row only fires for the narrower cases. Both map to a 404 status so a
  # missing page is not reported to crawlers as forbidden.
  custom_error_response {
    error_code            = 403
    response_code         = 404
    response_page_path    = var.error_document
    error_caching_min_ttl = 10
  }

  custom_error_response {
    error_code            = 404
    response_code         = 404
    response_page_path    = var.error_document
    error_caching_min_ttl = 10
  }

  viewer_certificate {
    acm_certificate_arn      = aws_acm_certificate_validation.site.certificate_arn
    ssl_support_method       = "sni-only"
    minimum_protocol_version = "TLSv1.2_2021"
  }

  restrictions {
    geo_restriction {
      # A portfolio is meant to be readable from anywhere.
      restriction_type = "none"
    }
  }

  dynamic "logging_config" {
    for_each = var.access_log_bucket_domain_name == null ? [] : [1]

    content {
      bucket          = var.access_log_bucket_domain_name
      prefix          = var.access_log_prefix
      include_cookies = false
    }
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-cdn"
  })
}
