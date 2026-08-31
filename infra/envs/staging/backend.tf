terraform {
  backend "s3" {
    # bucket is supplied at init time:
    #   terraform init -backend-config="bucket=$TF_STATE_BUCKET"
    key          = "envs/staging/terraform.tfstate"
    region       = "ap-southeast-1"
    encrypt      = true
    use_lockfile = true # native S3 locking; no DynamoDB table
  }
}
