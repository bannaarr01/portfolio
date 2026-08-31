##############################################################################
# Alias records.
#
# A and AAAA alias records for every name the distribution serves.
#
# Alias, not CNAME, for two reasons: a CNAME cannot exist at a zone apex at
# all (DNS forbids it alongside the SOA and NS records), and alias queries are
# free while CNAME queries bill per million. Route 53 aliases pointing at
# CloudFront are the only way to put a bare domain on a distribution.
##############################################################################

resource "aws_route53_record" "ipv4" {
  for_each = toset(local.all_domain_names)

  zone_id = var.hosted_zone_id
  name    = each.value
  type    = "A"

  alias {
    name                   = aws_cloudfront_distribution.site.domain_name
    zone_id                = aws_cloudfront_distribution.site.hosted_zone_id
    evaluate_target_health = false # CloudFront has no health check to evaluate
  }
}

resource "aws_route53_record" "ipv6" {
  for_each = toset(local.all_domain_names)

  zone_id = var.hosted_zone_id
  name    = each.value
  type    = "AAAA"

  alias {
    name                   = aws_cloudfront_distribution.site.domain_name
    zone_id                = aws_cloudfront_distribution.site.hosted_zone_id
    evaluate_target_health = false
  }
}
