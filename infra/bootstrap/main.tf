##############################################################################
# Bootstrap — run once, by hand, with LOCAL state.
#
# Solves the chicken-and-egg problem: the S3 backend cannot store the state of
# the configuration that creates it. So this directory starts with no backend
# block, creates the bucket, and then migrates its own state into it
# (see infra/README.md § Bootstrap).
#
# It deliberately creates only two things — the state bucket and the GitHub
# OIDC identity provider — because both are account-scoped singletons that
# every environment depends on. Everything else belongs to an environment.
##############################################################################

data "aws_caller_identity" "current" {}

locals {
  # S3 bucket names are globally unique, so the account id is the standard
  # disambiguator. It is not a secret, but it is also not committed anywhere:
  # environments read the resulting name from a `-backend-config` value.
  state_bucket_name = "${var.project}-tfstate-${data.aws_caller_identity.current.account_id}"
}

# ---------------------------------------------------------------------------
# Terraform state bucket
# ---------------------------------------------------------------------------

# checkov skips go inside the block, trivy ignores go above it. Neither
# scanner errors on the wrong placement — it just stops checking.
# trivy:ignore:AWS-0089
resource "aws_s3_bucket" "tfstate" {
  bucket = local.state_bucket_name

  # State is the one thing worth protecting from a stray `terraform destroy`.
  lifecycle {
    prevent_destroy = true
  }

  # checkov:skip=CKV_AWS_18:Access logging off by design (§15). The only writers are two CI roles whose calls are already in CloudTrail; a log bucket adds storage plus a PUT per state write for data nobody reads.
  # checkov:skip=CKV_AWS_144:No cross-region replication. Versioning covers the realistic failure (a bad apply), and both resources in this directory are trivially importable if state is lost entirely.
  # checkov:skip=CKV_AWS_145:SSE-S3, not KMS. A CMK is ~$1/mo, roughly twice the entire monthly bill, and the threat it addresses is an S3 operator reading state.
  # checkov:skip=CKV2_AWS_62:No event notifications. Nothing subscribes to state writes.
}

resource "aws_s3_bucket_versioning" "tfstate" {
  bucket = aws_s3_bucket.tfstate.id

  versioning_configuration {
    status = "Enabled"
  }
}

# SSE-S3, per the KMS reasoning on the bucket above.
# trivy:ignore:AWS-0132
resource "aws_s3_bucket_server_side_encryption_configuration" "tfstate" {
  bucket = aws_s3_bucket.tfstate.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
    bucket_key_enabled = true
  }
}

resource "aws_s3_bucket_public_access_block" "tfstate" {
  bucket = aws_s3_bucket.tfstate.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_ownership_controls" "tfstate" {
  bucket = aws_s3_bucket.tfstate.id

  rule {
    object_ownership = "BucketOwnerEnforced"
  }
}

resource "aws_s3_bucket_lifecycle_configuration" "tfstate" {
  bucket = aws_s3_bucket.tfstate.id

  # Versioning is what makes state recoverable, but every apply writes a new
  # version, so unbounded retention is a slow storage leak.
  rule {
    id     = "expire-noncurrent-state-versions"
    status = "Enabled"

    filter {}

    noncurrent_version_expiration {
      noncurrent_days = var.noncurrent_version_expiration_days
    }
  }

  rule {
    id     = "abort-incomplete-uploads"
    status = "Enabled"

    filter {}

    abort_incomplete_multipart_upload {
      days_after_initiation = 7
    }
  }

  depends_on = [aws_s3_bucket_versioning.tfstate]
}

data "aws_iam_policy_document" "tfstate" {
  # Public access is already blocked; this closes the remaining hole of a
  # signed request arriving over plaintext HTTP.
  statement {
    sid     = "DenyInsecureTransport"
    effect  = "Deny"
    actions = ["s3:*"]

    resources = [
      aws_s3_bucket.tfstate.arn,
      "${aws_s3_bucket.tfstate.arn}/*",
    ]

    principals {
      type        = "*"
      identifiers = ["*"]
    }

    condition {
      test     = "Bool"
      variable = "aws:SecureTransport"
      values   = ["false"]
    }
  }
}

resource "aws_s3_bucket_policy" "tfstate" {
  bucket = aws_s3_bucket.tfstate.id
  policy = data.aws_iam_policy_document.tfstate.json

  depends_on = [aws_s3_bucket_public_access_block.tfstate]
}

# ---------------------------------------------------------------------------
# GitHub Actions OIDC identity provider
# ---------------------------------------------------------------------------

# One provider per URL per account, which is why it lives here rather than in
# modules/ci-oidc — two environments calling that module would collide.
resource "aws_iam_openid_connect_provider" "github" {
  url             = "https://token.actions.githubusercontent.com"
  client_id_list  = ["sts.amazonaws.com"]
  thumbprint_list = local.github_oidc_thumbprints
}

locals {
  # Since mid-2023 AWS validates token.actions.githubusercontent.com against
  # its own trusted-CA library and ignores these values, but the API still
  # requires the field. Both of GitHub's published thumbprints are listed so a
  # rotation on their side cannot break an older AWS validation path.
  github_oidc_thumbprints = [
    "6938fd4d98bab03faadb97b34396831e3780aea1",
    "1c58a3a8518e8759bf075b76b750d4f2df264fcd",
  ]
}
