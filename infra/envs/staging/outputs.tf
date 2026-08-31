output "site_url" {
  description = "Staging URL."
  value       = module.site.site_url
}

output "bucket_name" {
  description = "Origin bucket. Set as the staging deploy target."
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

output "deploy_role_arn" {
  description = "Store as the staging environment's AWS_DEPLOY_ROLE_ARN variable."
  value       = module.ci_oidc.site_deploy_role_arn
}

output "deploy_trusted_subjects" {
  description = "Exactly which GitHub OIDC subjects may assume the staging deploy role."
  value       = module.ci_oidc.site_deploy_trusted_subjects
}

output "content_security_policy" {
  description = "The CSP as actually sent, so a mismatch with the built HTML is visible in the plan."
  value       = module.site.content_security_policy
}
