output "site_url" {
  description = "Canonical production URL."
  value       = module.site.site_url
}

output "domain_names" {
  description = "Every name the distribution serves and the certificate covers."
  value       = module.site.domain_names
}

output "bucket_name" {
  description = "Origin bucket. Set as the prod deploy target."
  value       = module.site.bucket_name
}

output "distribution_id" {
  description = "Distribution id, for invalidation."
  value       = module.site.distribution_id
}

output "distribution_domain_name" {
  description = "dxxxx.cloudfront.net name — useful for testing before DNS propagates."
  value       = module.site.distribution_domain_name
}

output "certificate_arn" {
  description = "Validated certificate. Confirm it covers both apex and www before cutover."
  value       = module.site.certificate_arn
}

output "deploy_role_arn" {
  description = "Store as the prod environment's AWS_DEPLOY_ROLE_ARN variable."
  value       = module.ci_oidc.site_deploy_role_arn
}

output "deploy_trusted_subjects" {
  description = "Exactly which GitHub OIDC subjects may assume the prod deploy role. Check this line on every infra change."
  value       = module.ci_oidc.site_deploy_trusted_subjects
}

output "content_security_policy" {
  description = "The CSP as actually sent. Assert against the built HTML's theme-init hash."
  value       = module.site.content_security_policy
}

output "alarm_topic_arn" {
  description = "SNS topic for the 5xx alarm."
  value       = module.site.alarm_topic_arn
}
