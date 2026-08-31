output "budget_name" {
  description = "Name of the monthly cost budget."
  value       = aws_budgets_budget.monthly_cost.name
}

output "budget_limit_usd" {
  description = "The configured ceiling."
  value       = aws_budgets_budget.monthly_cost.limit_amount
}
