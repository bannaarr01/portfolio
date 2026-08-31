output "bucket_name" {
  description = "Origin bucket name. The deploy workflow syncs dist/ here."
  value       = aws_s3_bucket.site.id
}

output "bucket_arn" {
  description = "Origin bucket ARN, scoped into the site-deploy role policy."
  value       = aws_s3_bucket.site.arn
}

output "distribution_id" {
  description = "Distribution id, needed for invalidation."
  value       = aws_cloudfront_distribution.site.id
}

output "distribution_arn" {
  description = "Distribution ARN. Used both by the bucket policy's SourceArn condition and to scope cloudfront:CreateInvalidation in the deploy role."
  value       = aws_cloudfront_distribution.site.arn
}

output "distribution_domain_name" {
  description = "The dxxxx.cloudfront.net name. Useful for testing before DNS resolves."
  value       = aws_cloudfront_distribution.site.domain_name
}

output "site_url" {
  description = "Canonical URL for this environment."
  value       = "https://${coalesce(var.canonical_host, var.primary_domain_name)}/"
}

output "domain_names" {
  description = "Every name served by this distribution."
  value       = local.all_domain_names
}

output "certificate_arn" {
  description = "Validated ACM certificate ARN (us-east-1)."
  value       = aws_acm_certificate_validation.site.certificate_arn
}

output "content_security_policy" {
  description = "The assembled CSP as sent. Empty csp_script_hashes means script-src is 'self' only, which blocks the inline theme-init script — assert on this value in a test rather than trusting it."
  value       = local.content_security_policy
}

output "alarm_topic_arn" {
  description = "SNS topic the 5xx alarm publishes to."
  value       = aws_sns_topic.alarms.arn
}

output "cloudfront_function_arn" {
  description = "ARN of the published viewer-request function."
  value       = aws_cloudfront_function.directory_index.arn
}
