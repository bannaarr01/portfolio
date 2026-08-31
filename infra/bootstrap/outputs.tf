output "state_bucket" {
  description = "Terraform state bucket. Feed this to each environment as `-backend-config=bucket=...` and store it as the TF_STATE_BUCKET repository variable."
  value       = aws_s3_bucket.tfstate.id
}

output "state_bucket_region" {
  description = "Region of the state bucket, for the backend `region` argument."
  value       = var.region
}

output "github_oidc_provider_arn" {
  description = "ARN of the GitHub OIDC provider. modules/ci-oidc discovers this by data source, so it is exported for reference and debugging only."
  value       = aws_iam_openid_connect_provider.github.arn
}

output "account_id" {
  description = "AWS account id this stack is provisioned into."
  value       = data.aws_caller_identity.current.account_id
}
