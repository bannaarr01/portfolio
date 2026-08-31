##############################################################################
# modules/guardrails — account-level cost ceiling (§15 guardrail 1).
#
# A budget is account-scoped, not environment-scoped, so this module is
# instantiated exactly once (from envs/prod). Calling it from both
# environments would create two budgets watching the same spend.
#
# $5 is roughly nine times the expected steady state of ~$0.55. That gap is
# the point: it never fires on normal variance, and if it does fire something
# structural is wrong — an accidental NAT Gateway, a public bucket being
# scraped, an invalidation loop.
##############################################################################

resource "aws_budgets_budget" "monthly_cost" {
  name         = "${var.project}-monthly-cost"
  budget_type  = "COST"
  limit_amount = tostring(var.monthly_limit_usd)
  limit_unit   = "USD"
  time_unit    = "MONTHLY"

  cost_types {
    # Measure real charges. Counting credits as spend makes a free-tier
    # account look like it is at zero right up until the credits run out.
    include_credit             = false
    include_refund             = false
    include_discount           = true
    include_other_subscription = true
    include_recurring          = true
    include_subscription       = true
    include_support            = true
    include_tax                = true
    include_upfront            = true
    use_amortized              = false
    use_blended                = false
  }

  # ACTUAL at 80% — something already happened.
  dynamic "notification" {
    for_each = length(var.alert_emails) > 0 ? [1] : []

    content {
      comparison_operator        = "GREATER_THAN"
      threshold                  = var.actual_threshold_percent
      threshold_type             = "PERCENTAGE"
      notification_type          = "ACTUAL"
      subscriber_email_addresses = var.alert_emails
    }
  }

  # FORECASTED at 100% — the trend says it is going to happen. This is the
  # useful one: it fires on day three of a runaway rather than day twenty-six.
  dynamic "notification" {
    for_each = length(var.alert_emails) > 0 ? [1] : []

    content {
      comparison_operator        = "GREATER_THAN"
      threshold                  = var.forecast_threshold_percent
      threshold_type             = "PERCENTAGE"
      notification_type          = "FORECASTED"
      subscriber_email_addresses = var.alert_emails
    }
  }
}
