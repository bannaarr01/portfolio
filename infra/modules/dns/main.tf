##############################################################################
# modules/dns — the hosted zone, and nothing else.
#
# Split out from static-site on purpose. A zone holds more than web records:
# MX, SPF, DKIM, domain-verification TXT. If the zone lived inside the site
# module, `terraform destroy` on prod would delete email along with the
# website, and re-creating the zone hands you new nameservers to re-delegate
# at the registrar.
#
# Every environment shares this one zone, each on its own subdomain, so the
# $0.50/month is paid once however many exist.
##############################################################################

resource "aws_route53_zone" "this" {
  name    = var.domain_name
  comment = var.comment

  # A zone is expensive to lose and cheap to keep. Deliberately obstructive.
  lifecycle {
    prevent_destroy = true
  }

  tags = {
    Name = var.domain_name
  }

  # checkov:skip=CKV2_AWS_38:No DNSSEC. Route 53 DNSSEC requires an asymmetric KMS key at ~$1/month, which would roughly triple the bill for a static marketing site with no transaction to protect. Recorded as a deliberate non-goal in astro.md §18 and revisitable.
  # checkov:skip=CKV2_AWS_39:No query logging. It writes to CloudWatch Logs and bills per ingested GB for data with no consumer here; there is no security investigation this zone would be evidence in.
}
