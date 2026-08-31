data "aws_caller_identity" "current" {}

locals {
  name_prefix = "${var.project}-${var.environment}"

  # Every alias on the distribution, and every name on the certificate. The
  # primary is first because ACM treats the first as the common name.
  all_domain_names = concat([var.primary_domain_name], var.additional_domain_names)

  bucket_name = coalesce(
    var.bucket_name,
    "${local.name_prefix}-site-${data.aws_caller_identity.current.account_id}"
  )

  origin_id = "s3-${local.bucket_name}"

  common_tags = {
    Name = local.name_prefix
  }
}
