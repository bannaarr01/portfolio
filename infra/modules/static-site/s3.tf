##############################################################################
# Origin bucket.
#
# Private, in ap-southeast-1, reached only by CloudFront over OAC.
#
# Note what is NOT here: aws_s3_bucket_website_configuration. Static website
# hosting is deliberately unused, because the website endpoint is public HTTP
# only and cannot be fronted by OAC. Using the REST endpoint instead is what
# keeps the bucket private — and what makes the CloudFront Function in
# functions/directory-index.js mandatory rather than optional (§11.1).
#
# Every setting below is its own resource rather than a nested block. That is
# the post-provider-v4 shape; the nested form most tutorials still show is
# removed and will not apply.
##############################################################################

# NOTE ON SCANNER EXCEPTIONS, which appear throughout this module.
#
# The two scanners want their suppressions in different places, and neither
# fails loudly when you get it wrong — you get a clean pass that checked
# nothing. Do not "tidy" these into one block.
#
#   checkov  wants `# checkov:skip=ID:reason` INSIDE the resource body.
#            A skip above the block is ignored; the tell is a clean run
#            reporting `Skipped checks: 0`.
#   trivy    wants `#trivy:ignore:ID` on the line ABOVE the block, and it
#            anchors some findings on a different resource than you would
#            expect (S3 encryption lands on the _configuration resource,
#            not the bucket).
#
# trivy:ignore:AWS-0089
resource "aws_s3_bucket" "site" {
  bucket = local.bucket_name
  tags   = local.common_tags

  # Every exception below is a cost decision measured against a ~$0.55/month
  # total, not an oversight.
  #
  # checkov:skip=CKV_AWS_18:Access logging off by design (§15). The only writer is the CI deploy role, whose calls are already in CloudTrail; a log bucket would cost more than the site it logs.
  # checkov:skip=CKV_AWS_144:No cross-region replication. Every object is reproducible by re-running the deploy workflow, and the content of record is markdown in git.
  # checkov:skip=CKV_AWS_145:SSE-S3, not KMS. A customer-managed key is ~$1/mo — roughly tripling the bill — to encrypt files that are deliberately served to the public.
  # checkov:skip=CKV2_AWS_62:No event notifications. There is no consumer; nothing subscribes to object writes.
}

# Rollback mechanism for a bad deploy: the previous object version is still
# there, so recovery does not depend on rebuilding from git.
resource "aws_s3_bucket_versioning" "site" {
  bucket = aws_s3_bucket.site.id

  versioning_configuration {
    status = "Enabled"
  }
}

# SSE-S3. See the KMS reasoning on the bucket above — trivy anchors this
# finding on the configuration resource rather than the bucket.
# trivy:ignore:AWS-0132
resource "aws_s3_bucket_server_side_encryption_configuration" "site" {
  bucket = aws_s3_bucket.site.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
    bucket_key_enabled = true
  }
}

resource "aws_s3_bucket_public_access_block" "site" {
  bucket = aws_s3_bucket.site.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# BucketOwnerEnforced disables ACLs outright. With OAC there is no reason for
# an object-level ACL to exist, and disabling them removes a whole class of
# accidental-public-object mistake.
resource "aws_s3_bucket_ownership_controls" "site" {
  bucket = aws_s3_bucket.site.id

  rule {
    object_ownership = "BucketOwnerEnforced"
  }
}

resource "aws_s3_bucket_lifecycle_configuration" "site" {
  bucket = aws_s3_bucket.site.id

  # Versioning plus content-hashed asset names means every deploy leaves
  # noncurrent versions behind. Unbounded, that is a slow storage leak.
  rule {
    id     = "expire-noncurrent-versions"
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

  depends_on = [aws_s3_bucket_versioning.site]
}

# ---------------------------------------------------------------------------
# Origin Access Control + bucket policy
# ---------------------------------------------------------------------------

resource "aws_cloudfront_origin_access_control" "site" {
  name                              = "${local.name_prefix}-oac"
  description                       = "OAC for ${local.bucket_name}"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

data "aws_iam_policy_document" "site" {
  # THE important statement. The principal is the CloudFront service, which is
  # shared by every distribution in every AWS account — so without the
  # SourceArn condition, anyone who learns this bucket name can put it behind
  # their own distribution and serve it. The condition narrows it to exactly
  # one distribution ARN. Omitting it is a quiet, total misconfiguration.
  statement {
    sid       = "AllowCloudFrontServicePrincipalReadOnly"
    effect    = "Allow"
    actions   = ["s3:GetObject"]
    resources = ["${aws_s3_bucket.site.arn}/*"]

    principals {
      type        = "Service"
      identifiers = ["cloudfront.amazonaws.com"]
    }

    condition {
      test     = "StringEquals"
      variable = "AWS:SourceArn"
      values   = [aws_cloudfront_distribution.site.arn]
    }
  }

  # Public access is blocked, but that says nothing about the transport used
  # by a signed request. This closes plaintext HTTP for every principal.
  statement {
    sid     = "DenyInsecureTransport"
    effect  = "Deny"
    actions = ["s3:*"]

    resources = [
      aws_s3_bucket.site.arn,
      "${aws_s3_bucket.site.arn}/*",
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

resource "aws_s3_bucket_policy" "site" {
  bucket = aws_s3_bucket.site.id
  policy = data.aws_iam_policy_document.site.json

  # Applying a policy while block_public_policy is still settling can fail.
  depends_on = [aws_s3_bucket_public_access_block.site]
}
