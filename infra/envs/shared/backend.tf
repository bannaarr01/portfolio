terraform {
  backend "s3" {
    # bucket is supplied at init time so the account id never lands in git:
    #   terraform init -backend-config="bucket=$TF_STATE_BUCKET"
    key     = "envs/shared/terraform.tfstate"
    region  = "ap-southeast-1"
    encrypt = true

    # Native S3 conditional-write locking, Terraform >= 1.10.
    # There is deliberately no DynamoDB table anywhere in this repo: it is an
    # extra resource, an extra bill line, and obsolete since 1.10. Tutorials
    # that still show `dynamodb_table` predate this.
    use_lockfile = true
  }
}
