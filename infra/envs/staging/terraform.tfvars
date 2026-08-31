project = "portfolio"
region  = "ap-southeast-1"

# Must match envs/shared and envs/prod. Serves staging.naijora.com, which
# the existing *.naijora.com wildcard covers.
domain_name = "naijora.com"
subdomain   = "staging"

github_owner = "bannaarr01"
github_repo  = "portfolio"

price_class = "PriceClass_100"

# TODO(owner): 5xx alarm has no subscriber until this is set.
alert_emails = []

# Filled by group 09 once the theme-init script text is final. Empty means
# script-src is 'self' only, so the inline theme script is blocked and staging
# shows a flash of the wrong theme — which is the intended failure mode: it is
# visible here rather than in prod.
csp_script_hashes = [
  "sha256-4b9oPjnUUFRdUeURwjjgOhE4RGFwav0SBb/1r09o1sQ=",
  "sha256-7ST4PMH3SR2NzfTY4F5QiKna6vk8A1VxXX2/TL2/WZ8=",
  "sha256-D0LuMSQpGipcjhwPR3saVlPQ6guxc4nxIrnBJpcRWLc=",
  "sha256-IvGIzIu8xArW/Th+1gKQaK+PpS1NemQ/53EaVP5gmU0=",
  "sha256-joyFwfzrzSxamAIxaZLQaxfHzIsBx7iMMkI++PS47Z8=",
  "sha256-Lrtr52O2Ae71clf8Hd/4yaV35HQYwgHvoL01pAwk14Y=",
  "sha256-ZNaHmJ9768xvoLielXhyLSF21BEBr1B8/aulYAmYnWQ=",
]

deploy_subject_claims = ["environment:staging"]
