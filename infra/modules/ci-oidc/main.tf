##############################################################################
# modules/ci-oidc — GitHub Actions roles.
#
# Two roles, never one. A single role able to both deploy the site and rewrite
# the infrastructure means a compromised build script can change DNS, detach
# the certificate, or open the bucket. Separating them costs nothing and caps
# the blast radius of the workflow that runs most often on the least review.
#
# The OIDC identity provider itself is created by infra/bootstrap, because an
# account may hold only one provider per URL and two environments calling this
# module would collide on it.
##############################################################################

data "aws_caller_identity" "current" {}
data "aws_partition" "current" {}

data "aws_iam_openid_connect_provider" "github" {
  count = var.oidc_provider_arn == null ? 1 : 0
  url   = "https://token.actions.githubusercontent.com"
}

locals {
  name_prefix = "${var.project}-${var.environment}"
  account_id  = data.aws_caller_identity.current.account_id
  partition   = data.aws_partition.current.partition

  oidc_provider_arn = (
    var.oidc_provider_arn != null
    ? var.oidc_provider_arn
    : data.aws_iam_openid_connect_provider.github[0].arn
  )

  repo = "${var.github_owner}/${var.github_repo}"

  # The repository half of the `sub` claim is fixed by the module. Callers
  # supply only the ref-or-environment suffix, and wildcards are rejected by
  # variable validation, so `repo:<owner>/*` cannot be expressed here.
  deploy_subjects    = [for claim in var.deploy_subject_claims : "repo:${local.repo}:${claim}"]
  terraform_subjects = [for claim in var.terraform_subject_claims : "repo:${local.repo}:${claim}"]

  # IAM has no per-region ARNs, so the terraform role's IAM permissions are
  # narrowed by name prefix instead. Without this it could create a role with
  # any policy at all, which is administrator access wearing a costume.
  iam_scope = [
    "arn:${local.partition}:iam::${local.account_id}:role/${var.project}-*",
    "arn:${local.partition}:iam::${local.account_id}:policy/${var.project}-*",
    "arn:${local.partition}:iam::${local.account_id}:oidc-provider/token.actions.githubusercontent.com",
  ]
}

# ---------------------------------------------------------------------------
# Trust policies (§12.3)
# ---------------------------------------------------------------------------

# Both conditions are mandatory:
#
#   aud — pins the audience to sts.amazonaws.com. Without it a token minted
#         for some other audience could be replayed here.
#   sub — pins WHICH repository and which ref or environment. This is the one
#         that matters. StringEquals against an explicit list, never
#         StringLike against a pattern: `repo:<owner>/*` would let any
#         repository the owner can create assume the role, and an attacker who
#         can open a repo in the org then owns the account.
data "aws_iam_policy_document" "assume_deploy" {
  statement {
    sid     = "GitHubActionsWebIdentity"
    effect  = "Allow"
    actions = ["sts:AssumeRoleWithWebIdentity"]

    principals {
      type        = "Federated"
      identifiers = [local.oidc_provider_arn]
    }

    condition {
      test     = "StringEquals"
      variable = "token.actions.githubusercontent.com:aud"
      values   = ["sts.amazonaws.com"]
    }

    condition {
      test     = "StringEquals"
      variable = "token.actions.githubusercontent.com:sub"
      values   = local.deploy_subjects
    }
  }
}

data "aws_iam_policy_document" "assume_terraform" {
  statement {
    sid     = "GitHubActionsWebIdentity"
    effect  = "Allow"
    actions = ["sts:AssumeRoleWithWebIdentity"]

    principals {
      type        = "Federated"
      identifiers = [local.oidc_provider_arn]
    }

    condition {
      test     = "StringEquals"
      variable = "token.actions.githubusercontent.com:aud"
      values   = ["sts.amazonaws.com"]
    }

    condition {
      test     = "StringEquals"
      variable = "token.actions.githubusercontent.com:sub"
      values   = local.terraform_subjects
    }
  }
}

# ---------------------------------------------------------------------------
# Role 1 — site-deploy
# ---------------------------------------------------------------------------

resource "aws_iam_role" "site_deploy" {
  count = var.create_deploy_role ? 1 : 0

  name                 = "${local.name_prefix}-site-deploy"
  description          = "GitHub Actions: sync dist/ to ${var.environment} and invalidate that one distribution. Cannot mutate infrastructure."
  assume_role_policy   = data.aws_iam_policy_document.assume_deploy.json
  max_session_duration = var.max_session_duration

  tags = {
    Name = "${local.name_prefix}-site-deploy"
  }
}

data "aws_iam_policy_document" "site_deploy" {
  count = var.create_deploy_role ? 1 : 0

  # Deliberately no s3:GetObject. `aws s3 sync` uploading local -> S3 compares
  # against the ListObjectsV2 response and never reads an object body, so a
  # leaked deploy token cannot be used to read the bucket back out. If a
  # future sync flag needs it, adding it should be a decision, not a default.
  statement {
    sid    = "ListSiteBucket"
    effect = "Allow"

    actions = [
      "s3:ListBucket",
      "s3:GetBucketLocation",
    ]

    resources = [var.site_bucket_arn]
  }

  statement {
    sid    = "WriteSiteObjects"
    effect = "Allow"

    actions = [
      "s3:PutObject",
      "s3:DeleteObject",
      # Only reachable if a build artefact ever exceeds the CLI's 8 MB
      # multipart threshold, but without it a failed part leaks storage.
      "s3:AbortMultipartUpload",
    ]

    resources = ["${var.site_bucket_arn}/*"]
  }

  statement {
    sid    = "InvalidateThisDistributionOnly"
    effect = "Allow"

    actions = [
      "cloudfront:CreateInvalidation",
      # To poll the invalidation it just created.
      "cloudfront:GetInvalidation",
    ]

    resources = [var.distribution_arn]
  }
}

resource "aws_iam_role_policy" "site_deploy" {
  count = var.create_deploy_role ? 1 : 0

  name   = "${local.name_prefix}-site-deploy"
  role   = aws_iam_role.site_deploy[0].id
  policy = data.aws_iam_policy_document.site_deploy[0].json
}

# ---------------------------------------------------------------------------
# Role 2 — terraform
# ---------------------------------------------------------------------------

resource "aws_iam_role" "terraform" {
  count = var.create_terraform_role ? 1 : 0

  name                 = "${var.project}-terraform"
  description          = "GitHub Actions: terraform plan and apply, gated behind a protected GitHub Environment."
  assume_role_policy   = data.aws_iam_policy_document.assume_terraform.json
  max_session_duration = var.max_session_duration

  tags = {
    Name = "${var.project}-terraform"
  }
}

# trivy:ignore:AWS-0345
# trivy:ignore:AWS-0057
data "aws_iam_policy_document" "terraform" {
  count = var.create_terraform_role ? 1 : 0

  # Service-level wildcards are unavoidable for a role whose whole job is to
  # create and destroy resources: a CloudFront distribution ARN does not exist
  # until the distribution does, so it cannot be enumerated in advance. What
  # *is* available — and is used below — is narrowing by service, narrowing S3
  # and IAM by name prefix, and an explicit Deny that no later Allow can
  # override on every service capable of producing a real bill.
  #
  # checkov:skip=CKV_AWS_111:Unconstrained write access is intrinsic to an IaC role. Narrowed by service, by name prefix on S3 and IAM, and bounded by the DenyExpensiveServices statement below.
  # checkov:skip=CKV_AWS_109:Permissions-management actions are scoped to arn:*:iam::<account>:role/<project>-* and policy/<project>-*, so this role cannot mint an administrator role.
  # checkov:skip=CKV_AWS_356:Wildcard resources are limited to CloudFront, ACM, Route 53, SNS and Budgets, whose ARNs are unknown before creation.

  statement {
    sid    = "TerraformState"
    effect = "Allow"

    actions = [
      "s3:ListBucket",
      "s3:GetBucketLocation",
      "s3:GetObject",
      "s3:PutObject",
      "s3:DeleteObject",
    ]

    resources = [
      var.state_bucket_arn,
      "${var.state_bucket_arn}/*",
    ]
  }

  # Project buckets only. A name prefix, not `*`, so this role cannot touch an
  # unrelated bucket that happens to share the account.
  #
  # The action is `s3:*` rather than an enumerated list, and that is a
  # considered trade rather than laziness: managing a bucket through Terraform
  # needs create, delete, tagging, policy, versioning, lifecycle, encryption,
  # public-access-block and ownership-controls actions, and an enumeration that
  # misses one fails halfway through an apply — a worse failure than the
  # breadth it prevents. The meaningful constraint here is the resource prefix.
  statement {
    sid    = "ProjectBuckets"
    effect = "Allow"

    actions = ["s3:*"]

    resources = [
      "arn:${local.partition}:s3:::${var.project}-*",
      "arn:${local.partition}:s3:::${var.project}-*/*",
    ]
  }

  statement {
    sid       = "EnumerateBuckets"
    effect    = "Allow"
    actions   = ["s3:ListAllMyBuckets"]
    resources = ["*"]
  }

  statement {
    sid    = "EdgeAndCertificates"
    effect = "Allow"

    actions = [
      "cloudfront:*",
      "acm:*",
      "route53:*",
    ]

    resources = ["*"]
  }

  statement {
    sid    = "Guardrails"
    effect = "Allow"

    actions = [
      "cloudwatch:DescribeAlarms",
      "cloudwatch:PutMetricAlarm",
      "cloudwatch:DeleteAlarms",
      "cloudwatch:ListTagsForResource",
      "cloudwatch:TagResource",
      "cloudwatch:UntagResource",
      "sns:*",
      "budgets:*",
    ]

    resources = ["*"]
  }

  statement {
    sid    = "ProjectIam"
    effect = "Allow"

    actions = [
      "iam:CreateRole",
      "iam:DeleteRole",
      "iam:UpdateRole",
      "iam:UpdateAssumeRolePolicy",
      "iam:PutRolePolicy",
      "iam:DeleteRolePolicy",
      "iam:AttachRolePolicy",
      "iam:DetachRolePolicy",
      "iam:TagRole",
      "iam:UntagRole",
      "iam:CreatePolicy",
      "iam:DeletePolicy",
      "iam:CreatePolicyVersion",
      "iam:DeletePolicyVersion",
      "iam:TagPolicy",
      "iam:UntagPolicy",
      "iam:UpdateOpenIDConnectProviderThumbprint",
    ]

    resources = local.iam_scope
  }

  # Reads are safe and Terraform refresh needs them account-wide.
  statement {
    sid    = "ReadOnlyDiscovery"
    effect = "Allow"

    actions = [
      "iam:Get*",
      "iam:List*",
      "sts:GetCallerIdentity",
      "tag:GetResources",
    ]

    resources = ["*"]
  }

  # The hard constraint from astro.md §1, expressed as IAM rather than as a
  # code-review convention. An explicit Deny cannot be overridden by any
  # Allow, so even a mistaken policy edit above cannot make this role able to
  # start a NAT Gateway, an ALB, or an RDS instance — the four resources that
  # turn a $0.55/month static site into a $60/month one.
  statement {
    sid    = "DenyExpensiveServices"
    effect = "Deny"

    actions = [
      "ec2:*",
      "rds:*",
      "ecs:*",
      "eks:*",
      "elasticloadbalancing:*",
      "elasticache:*",
      "elasticmapreduce:*",
      "redshift:*",
      "sagemaker:*",
      "lambda:*",
      "dynamodb:*", # native S3 state locking; a lock table here would be a regression
    ]

    resources = ["*"]
  }
}

resource "aws_iam_role_policy" "terraform" {
  count = var.create_terraform_role ? 1 : 0

  name   = "${var.project}-terraform"
  role   = aws_iam_role.terraform[0].id
  policy = data.aws_iam_policy_document.terraform[0].json
}
