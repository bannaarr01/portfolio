output "hosted_zone_id" {
  description = "Shared hosted zone id."
  value       = module.dns.zone_id
}

output "name_servers" {
  description = "Delegate these at the registrar. This is the only step in the whole build that cannot be done from Terraform."
  value       = module.dns.name_servers
}

output "terraform_role_arn" {
  description = "Store as the AWS_TERRAFORM_ROLE_ARN repository variable."
  value       = module.ci_oidc.terraform_role_arn
}

output "terraform_trusted_subjects" {
  description = "Exactly which GitHub OIDC subjects may assume the terraform role."
  value       = module.ci_oidc.terraform_trusted_subjects
}

output "budget_name" {
  description = "Monthly cost budget."
  value       = module.guardrails.budget_name
}
