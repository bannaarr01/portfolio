terraform {
  # 1.10 is the floor: `use_lockfile` (native S3 state locking) landed there and
  # is what lets the whole project skip a DynamoDB lock table entirely.
  required_version = ">= 1.10.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 6.0"
    }
  }
}

provider "aws" {
  region = var.region

  default_tags {
    tags = {
      Project     = var.project
      Environment = "shared"
      ManagedBy   = "terraform"
      Repo        = "${var.github_owner}/${var.github_repo}"
    }
  }
}
