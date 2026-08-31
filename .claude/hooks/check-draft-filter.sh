#!/usr/bin/env bash
# PostToolUse/Edit|Write — flag direct getCollection('blog') calls.
#
# The draft filter exists in exactly one place: getPublishedPosts() in
# site/src/lib. Calling getCollection('blog') anywhere else bypasses it and
# leaks drafts into production.
#
# See AGENTS.md, "Content model".

set -uo pipefail

input="$(cat)"
f="$(printf '%s' "$input" | jq -r '.tool_input.file_path // .tool_response.filePath // ""')"

[ -n "$f" ] || exit 0
[ -f "$f" ] || exit 0

# src/lib is where the helper legitimately lives.
case "$f" in
  */src/lib/*) exit 0 ;;
esac

case "$f" in
  *.astro | *.ts | *.tsx | *.js | *.mjs) ;;
  *) exit 0 ;;
esac

if grep -Eq "getCollection\([[:space:]]*['\"]blog['\"]" "$f"; then
  # Built here rather than inside the jq program: apostrophes are literal in a
  # double-quoted bash string, but would close the jq program's single quotes.
  call="getCollection('blog')"
  reason="${f} calls ${call} directly, bypassing the draft filter. That filter exists in exactly one place — getPublishedPosts() in src/lib — and calling the collection directly leaks drafts into production. Import the helper instead."
  note="Draft-filter guard: direct ${call} in ${f}"

  jq -n --arg reason "$reason" --arg note "$note" \
    '{decision: "block", reason: $reason, systemMessage: $note}'
fi

exit 0
