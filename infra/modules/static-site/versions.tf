terraform {
  required_version = ">= 1.10.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 6.0"

      # Forces the caller to pass an explicitly us-east-1 provider. ACM certs
      # attached to CloudFront must live there, and CloudFront's CloudWatch
      # metrics are only published there — but the bucket belongs in
      # ap-southeast-1. Hardcoding us-east-1 on the whole stack would move the
      # origin to Virginia to satisfy a certificate.
      configuration_aliases = [aws.us_east_1]
    }
  }
}
