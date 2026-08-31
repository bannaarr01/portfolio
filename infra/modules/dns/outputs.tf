output "zone_id" {
  description = "Hosted zone id, consumed by static-site for alias and ACM validation records."
  value       = aws_route53_zone.this.zone_id
}

output "name_servers" {
  description = "Delegate these four nameservers at the registrar. This is the one manual step in the whole build."
  value       = aws_route53_zone.this.name_servers
}

output "domain_name" {
  description = "Apex domain the zone is authoritative for."
  value       = aws_route53_zone.this.name
}
