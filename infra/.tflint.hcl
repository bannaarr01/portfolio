config {
  call_module_type = "local"
}

plugin "terraform" {
  enabled = true
  preset  = "recommended"
}

plugin "aws" {
  enabled = true
  version = "0.42.0"
  source  = "github.com/terraform-linters/tflint-ruleset-aws"

  # Enables checks that call AWS APIs would be needed for; the static subset is
  # what runs in CI without credentials.
  deep_check = false
}

# Naming is <project>-<environment>-<thing>, applied consistently. The default
# rule wants snake_case Terraform identifiers, which is already the case.
rule "terraform_naming_convention" {
  enabled = true
  format  = "snake_case"
}

# Every variable and output in this repo carries a description, and that should
# stay true — these files are the documentation for anyone reading a plan.
rule "terraform_documented_variables" {
  enabled = true
}

rule "terraform_documented_outputs" {
  enabled = true
}

# Provider versions are pinned with ~> in every versions.tf.
rule "terraform_required_providers" {
  enabled = true
}

rule "terraform_required_version" {
  enabled = true
}

# Deliberately off: the modules here are referenced by relative path within
# this repository, so there is no version to pin.
rule "terraform_module_pinned_source" {
  enabled = false
}
