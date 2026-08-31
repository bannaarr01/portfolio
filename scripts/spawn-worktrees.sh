#!/usr/bin/env bash
# spawn-worktrees.sh — create git worktrees ready for separate Claude sessions.
#
# Reads the (SLUGS, BRANCHES) pair from scripts/worktrees.env and ensures
# each worktree exists at .claude/worktrees/<slug> tracking <branch>.
# If a branch already exists it is reused; otherwise it is branched from
# whatever HEAD currently points at (normally `develop`).
#
# To launch Claude in each, either open one terminal per worktree:
#
#   cd .claude/worktrees/<slug> && claude
#
# or use tmux-multi-claude.sh which spawns one tmux session per worktree.

set -euo pipefail

if ! git rev-parse --show-toplevel >/dev/null 2>&1; then
  echo "✗ Not inside a git repo. Run from your repo root."
  exit 1
fi
REPO_ROOT="$(git rev-parse --show-toplevel)"
cd "${REPO_ROOT}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=worktrees.env
source "${SCRIPT_DIR}/worktrees.env"

if [[ "${#SLUGS[@]}" -ne "${#BRANCHES[@]}" ]]; then
  echo "✗ worktrees.env: SLUGS and BRANCHES have different lengths."
  exit 1
fi

mkdir -p .claude/worktrees

for i in "${!SLUGS[@]}"; do
  slug="${SLUGS[$i]}"
  branch="${BRANCHES[$i]}"
  path=".claude/worktrees/${slug}"

  if [[ "${slug}" == */* ]]; then
    echo "✗ slug '${slug}' must not contain '/'."
    exit 1
  fi

  if [[ -d "${path}" ]]; then
    echo "→ ${path} already exists, skipping worktree create"
  elif git show-ref --verify --quiet "refs/heads/${branch}"; then
    echo "→ Branch ${branch} exists — reusing it for ${path}"
    git worktree add "${path}" "${branch}"
  else
    echo "→ Creating worktree ${path} on new branch ${branch}"
    git worktree add -b "${branch}" "${path}"
  fi

  # .claude/settings.local.json is gitignored, so worktrees don't get it from
  # the checkout. Without it Claude Code re-prompts for trust on the project's
  # .mcp.json (e.g. playwright) in every worktree on every launch. Symlink to
  # the repo-root copy so edits propagate and no per-worktree drift occurs.
  root_settings="${REPO_ROOT}/.claude/settings.local.json"
  wt_settings="${path}/.claude/settings.local.json"
  if [[ -f "${root_settings}" ]]; then
    if [[ -L "${wt_settings}" ]]; then
      :  # already a symlink — leave it
    elif [[ -e "${wt_settings}" ]]; then
      echo "  ⚠ ${wt_settings} exists as a regular file — leaving it alone (delete it to convert to a symlink)"
    else
      mkdir -p "$(dirname "${wt_settings}")"
      ln -s "${root_settings}" "${wt_settings}"
      echo "  ↳ linked .claude/settings.local.json → repo root"
    fi
  fi
done

# Drop any stale entries left over from previous runs (e.g. dirs removed by
# hand without `git worktree remove`).
git worktree prune

echo
echo "✓ Worktrees ready:"
git worktree list
echo
echo "Now open one terminal per worktree (or use tmux-multi-claude.sh):"
for slug in "${SLUGS[@]}"; do
  echo "  cd .claude/worktrees/${slug} && claude"
done
