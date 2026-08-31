##############################################################################
# 5xx alarm (§15 guardrail 2).
#
# Both resources use aws.us_east_1. CloudFront publishes its CloudWatch
# metrics only to us-east-1 regardless of where anything else lives, so an
# alarm created in ap-southeast-1 would watch a metric that never arrives and
# sit in INSUFFICIENT_DATA forever, looking healthy.
##############################################################################

# trivy:ignore:AWS-0095
resource "aws_sns_topic" "alarms" {
  provider = aws.us_east_1

  name         = "${local.name_prefix}-alarms"
  display_name = "${local.name_prefix} alarms"

  tags = local.common_tags

  # Encryption is deliberately off, and this is the interesting one.
  #
  # SNS server-side encryption needs a KMS key. The obvious free choice is the
  # AWS-managed alias/aws/sns, but its key policy does not grant
  # cloudwatch.amazonaws.com permission to use it — so encrypting this topic
  # with the free key makes every alarm notification fail silently. The alarm
  # still goes to ALARM in the console; nobody is ever told. Doing it properly
  # needs a customer-managed CMK at ~$1/month, twice the entire rest of the
  # bill, to protect the sentence "5xx rate is above 1%".
  #
  # checkov:skip=CKV_AWS_26:Managed-key SSE breaks CloudWatch publishing outright, and a CMK costs more than the whole stack. See the comment above.
}

resource "aws_sns_topic_subscription" "alarm_emails" {
  provider = aws.us_east_1

  for_each = toset(var.alert_emails)

  topic_arn = aws_sns_topic.alarms.arn
  protocol  = "email"
  endpoint  = each.value

  # Email subscriptions land in PendingConfirmation until the recipient clicks
  # the link in the confirmation mail. Terraform reports success either way,
  # so confirm it or the alarm goes nowhere.
}

resource "aws_cloudwatch_metric_alarm" "five_xx_error_rate" {
  provider = aws.us_east_1

  alarm_name        = "${local.name_prefix}-cloudfront-5xx-error-rate"
  alarm_description = "CloudFront 5xx error rate above ${var.five_xx_error_rate_threshold}% over 5 minutes for ${var.primary_domain_name}."

  namespace   = "AWS/CloudFront"
  metric_name = "5xxErrorRate"
  statistic   = "Average"
  unit        = "Percent"

  dimensions = {
    DistributionId = aws_cloudfront_distribution.site.id
    # CloudFront's own dimension for the aggregate across all edge locations.
    # Required — omitting it matches no metric.
    Region = "Global"
  }

  period              = 300
  evaluation_periods  = 1
  threshold           = var.five_xx_error_rate_threshold
  comparison_operator = "GreaterThanThreshold"

  # A low-traffic site regularly has five-minute windows with zero requests
  # and therefore no datapoint. The default (`missing`) would leave the alarm
  # in INSUFFICIENT_DATA most of the time, which reads as "fine" and is not.
  treat_missing_data = "notBreaching"

  alarm_actions = [aws_sns_topic.alarms.arn]
  ok_actions    = [aws_sns_topic.alarms.arn]

  tags = local.common_tags
}
