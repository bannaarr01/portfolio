##############################################################################
# Bootstrap backend — comment this block out for the FIRST apply only.
#
# Sequence:
#   1. With this block commented, `terraform init && terraform apply` runs on
#      local state and creates the state bucket.
#   2. Uncomment it and re-init, passing the bucket in at the command line:
#      `terraform init -migrate-state -backend-config="bucket=$TF_STATE_BUCKET"`
#      Terraform copies terraform.tfstate into the bucket it just created, and
#      nothing lives on a laptop.
#
# Losing the local state before step 2 is recoverable: both resources here are
# trivially importable (`terraform import`), which is what makes this safe.
##############################################################################

terraform {
  backend "s3" {
    # bucket is supplied at init time so the account id never lands in git:
    #   terraform init -backend-config="bucket=$TF_STATE_BUCKET"
    key          = "bootstrap/terraform.tfstate"
    region       = "ap-southeast-1"
    encrypt      = true
    use_lockfile = true # native S3 conditional-write locking; no DynamoDB
  }
}
