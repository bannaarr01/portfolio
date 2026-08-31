#!/usr/bin/env bash
# cleanup.sh — tear down everything spawn-worktrees.sh / tmux-multi-claude.sh
# created in this run.
#
# Kills the per-worktree tmux sessions (and the legacy `claude-multi`
# session if it's still around) and removes the worktrees under
# .claude/worktrees/.
#
# Does NOT delete branches. The Phase 1 branches hold real work — delete
# them manually with `git branch -D <branch>` once their PRs are merged.
# The old demo branches (worktree-*) can still be pruned interactively at
# the end if you want.

set -euo pipefail

if ! git rev-parse --show-toplevel >/dev/null 2>&1; then
  echo "✗ Not inside a git repo."
  exit 1
fi
REPO_ROOT="$(git rev-parse --show-toplevel)"
cd "${REPO_ROOT}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=worktrees.env
source "${SCRIPT_DIR}/worktrees.env"

# 1. Kill each per-worktree tmux session, plus the legacy single-session name.
if command -v tmux >/dev/null 2>&1; then
  for name in "${SLUGS[@]}" claude-multi; do
    if tmux has-session -t "${name}" 2>/dev/null; then
      echo "→ Killing tmux session: ${name}"
      tmux kill-session -t "${name}"
    fi
  done
fi

# 2. Remove every worktree under .claude/worktrees/ (regardless of slug — so
#    this also sweeps up old demo worktrees and any half-broken paths from
#    earlier script versions).
echo "→ Removing worktrees under .claude/worktrees/"
git worktree list --porcelain \
  | awk '/^worktree /{print $2}' \
  | grep -F "${REPO_ROOT}/.claude/worktrees/" \
  | while read -r wt; do
      echo "   removing ${wt}"
      git worktree remove --force "${wt}" || true
    done

# Drop stale entries that point at already-deleted dirs.
git worktree prune

# 3. Offer to delete leftover demo branches from the previous script version
#    (worktree-*). Real feature branches (feature/phase1-*) are never auto-
#    deleted — clean those up by hand once merged.
demo_branches=$(git branch --list 'worktree-*' | sed 's/^[* ]*//')
if [[ -n "${demo_branches}" ]]; then
  echo
  echo "→ Found legacy demo branches from the old script:"
  echo "${demo_branches}" | sed 's/^/     /'
  read -r -p "Delete these? (Phase 1 branches are never touched.) [y/N] " ans
  case "${ans}" in
    y|Y|yes|YES)
      echo "${demo_branches}" | while read -r b; do
        [[ -z "${b}" ]] && continue
        git branch -D "${b}" || true
      done
      ;;
    *) echo "→ Keeping branches." ;;
  esac
fi

echo
echo "✓ Cleanup complete. Remaining worktrees:"
git worktree list
echo
echo "ℹ Feature branches were NOT deleted. Delete merged Phase 1 branches"
echo "  manually with 'git branch -D <branch>'."
