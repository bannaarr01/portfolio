variable "project" {
  description = "Project slug, used in the budget name."
  type        = string
}

variable "monthly_limit_usd" {
  description = "Monthly cost ceiling in USD. Steady state is ~$0.55, so $5 is a wide margin that only trips on a structural mistake."
  type        = number
  default     = 5
}

variable "alert_emails" {
  description = "Addresses notified when a threshold is crossed. An empty list creates the budget with no notifications — the AWS API rejects a notification with no subscribers, so the blocks are omitted rather than sent empty."
  type        = list(string)
  default     = []
}

variable "actual_threshold_percent" {
  description = "Percent of the limit already spent that triggers the ACTUAL alert."
  type        = number
  default     = 80
}

variable "forecast_threshold_percent" {
  description = "Percent of the limit the month is forecast to reach that triggers the FORECASTED alert."
  type        = number
  default     = 100
}
