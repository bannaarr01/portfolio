##############################################################################
# Bootstrap backend — commented out for the FIRST apply only.
#
# Sequence:
#   1. Leave this block commented. `terraform init && terraform apply`
#      runs on local state and creates the bucket below.
#   2. Uncomment it, substituting the `state_bucket` output for <bucket>.
#   3. `terraform init -migrate-state` — Terraform copies terraform.tfstate
#      into the bucket it just created, and nothing lives on a laptop.
#
# Losing the local state before step 3 is recoverable: both resources here are
# trivially importable (`terraform import`), which is what makes this safe.
##############################################################################

# terraform {
#   backend "s3" {
#     bucket       = "<bucket>" # bootstrap output: state_bucket
#     key          = "bootstrap/terraform.tfstate"
#     region       = "ap-southeast-1"
#     encrypt      = true
#     use_lockfile = true # native S3 conditional-write locking; no DynamoDB
#   }
# }
