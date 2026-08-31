terraform {
  required_version = ">= 1.10.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 6.0"
    }
  }
}

# Default provider — the bucket, the distribution, the roles.
provider "aws" {
  region = var.region

  default_tags {
    tags = {
      Project     = var.project
      Environment = "staging"
      ManagedBy   = "terraform"
      Repo        = "${var.github_owner}/${var.github_repo}"
    }
  }
}

# ACM certificates attached to CloudFront must be in us-east-1, and CloudFront
# publishes its CloudWatch metrics only there. Two resources need Virginia; the
# rest of the stack does not, so it gets an alias rather than moving.
provider "aws" {
  alias  = "us_east_1"
  region = "us-east-1"

  default_tags {
    tags = {
      Project     = var.project
      Environment = "staging"
      ManagedBy   = "terraform"
      Repo        = "${var.github_owner}/${var.github_repo}"
    }
  }
}
