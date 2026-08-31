#!/usr/bin/env bash
# PreToolUse/Bash — block `npm install`, `npm i`, `npm add`.
#
# Group 00 owns package.json and the lockfile so seven Wave 2 agents never
# collide on them. Everyone else installs with `npm ci`. A new dependency is
# an ownership gap to report, not something to install.
#
# See AGENTS.md, "The parallel build model".

set -uo pipefail

cmd="$(jq -r '.tool_input.command // ""')"

# Matched anywhere in the command so `cd site && npm install` is caught too.
# `npm ci`, `npm init`, and `npm run *` deliberately do not match.
if printf '%s' "$cmd" | grep -Eq '(^|[;&|(]|[[:space:]])npm[[:space:]]+(install|i|add)([[:space:]]|$)'; then
  cat <<'JSON'
{
  "hookSpecificOutput": {
    "hookEventName": "PreToolUse",
    "permissionDecision": "deny",
    "permissionDecisionReason": "Group 00 owns package.json and the lockfile — no other group runs npm install. Use `npm ci` to install from the committed lockfile. If you genuinely need a new dependency, stop and report it as an ownership gap rather than installing it."
  }
}
JSON
fi

exit 0
