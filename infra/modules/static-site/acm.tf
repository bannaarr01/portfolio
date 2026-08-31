##############################################################################
# TLS certificate.
#
# Every resource here uses provider = aws.us_east_1. CloudFront can only
# attach certificates from us-east-1, with no exceptions and no workaround.
# The bucket stays in ap-southeast-1; only the certificate moves.
##############################################################################

resource "aws_acm_certificate" "site" {
  provider = aws.us_east_1

  domain_name               = var.primary_domain_name
  subject_alternative_names = var.additional_domain_names
  validation_method         = "DNS"

  # A certificate cannot be deleted while a distribution references it, so a
  # change to the name list has to create the replacement before destroying
  # the original. Without this, adding `www` deadlocks the apply.
  lifecycle {
    create_before_destroy = true
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-cert"
  })
}

# One validation record per name on the certificate, discovered from the
# certificate itself rather than hand-written.
#
# allow_overwrite is not optional here: ACM frequently issues the *same*
# validation CNAME for an apex and its www SAN, so two for_each members
# resolve to one Route 53 record. Without it the second create fails with
# "record already exists" and the apply dies half-done.
resource "aws_route53_record" "cert_validation" {
  for_each = {
    for dvo in aws_acm_certificate.site.domain_validation_options : dvo.domain_name => {
      name   = dvo.resource_record_name
      record = dvo.resource_record_value
      type   = dvo.resource_record_type
    }
  }

  zone_id         = var.hosted_zone_id
  name            = each.value.name
  type            = each.value.type
  records         = [each.value.record]
  ttl             = 60
  allow_overwrite = true
}

# Blocks the apply until ACM reports ISSUED, so the distribution is never
# created pointing at a PENDING_VALIDATION certificate — which is an error
# that costs a full 15-minute distribution deploy to discover.
resource "aws_acm_certificate_validation" "site" {
  provider = aws.us_east_1

  certificate_arn         = aws_acm_certificate.site.arn
  validation_record_fqdns = [for record in aws_route53_record.cert_validation : record.fqdn]

  timeouts {
    create = "20m"
  }
}
