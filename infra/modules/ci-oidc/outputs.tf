output "site_deploy_role_arn" {
  description = "Set as the AWS_DEPLOY_ROLE_ARN variable used by site-deploy.yml. Null when create_deploy_role is false."
  value       = var.create_deploy_role ? aws_iam_role.site_deploy[0].arn : null
}

output "site_deploy_role_name" {
  description = "Name of the site-deploy role."
  value       = var.create_deploy_role ? aws_iam_role.site_deploy[0].name : null
}

output "site_deploy_trusted_subjects" {
  description = "Exact `sub` claims that may assume the deploy role. Read this in the plan output — it is the line worth checking on every infra change."
  value       = var.create_deploy_role ? local.deploy_subjects : []
}

output "terraform_role_arn" {
  description = "Set as the AWS_TERRAFORM_ROLE_ARN repository variable used by infra.yml. Null when create_terraform_role is false."
  value       = var.create_terraform_role ? aws_iam_role.terraform[0].arn : null
}

output "terraform_role_name" {
  description = "Name of the terraform role."
  value       = var.create_terraform_role ? aws_iam_role.terraform[0].name : null
}

output "terraform_trusted_subjects" {
  description = "Exact `sub` claims that may assume the terraform role."
  value       = var.create_terraform_role ? local.terraform_subjects : []
}

output "oidc_provider_arn" {
  description = "OIDC provider both roles federate against."
  value       = local.oidc_provider_arn
}
