#!/usr/bin/env bash
# wt-status.sh — one-line status per worktree in worktrees.env.
#
# Shows: slug, current branch, summary of ahead/behind ${BASE} (default
# `develop`, override with `WT_STATUS_BASE=main`), and counts of modified
# and untracked files.
#
# Worktrees whose directory is missing are flagged but not skipped silently.
# If the worktree is checked out on a branch other than the one configured
# in worktrees.env, the configured branch is shown as drift in parentheses.

set -euo pipefail

if ! git rev-parse --show-toplevel >/dev/null 2>&1; then
  echo "✗ Not inside a git repo." >&2
  exit 1
fi
REPO_ROOT="$(git rev-parse --show-toplevel)"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=worktrees.env
source "${SCRIPT_DIR}/worktrees.env"

BASE="${WT_STATUS_BASE:-develop}"
if ! git rev-parse --verify --quiet "${BASE}" >/dev/null; then
  echo "ℹ Base ref '${BASE}' not found; ahead/behind counts skipped." >&2
  BASE=""
fi

# Column widths.
max_slug=4
max_branch=6
for i in "${!SLUGS[@]}"; do
  (( ${#SLUGS[$i]} > max_slug )) && max_slug=${#SLUGS[$i]}
  (( ${#BRANCHES[$i]} > max_branch )) && max_branch=${#BRANCHES[$i]}
done

for i in "${!SLUGS[@]}"; do
  slug="${SLUGS[$i]}"
  cfg_branch="${BRANCHES[$i]}"
  path="${REPO_ROOT}/.claude/worktrees/${slug}"

  if [[ ! -d "${path}" ]]; then
    printf "%-${max_slug}s  %-${max_branch}s  (missing — run spawn-worktrees.sh)\n" \
      "${slug}" "${cfg_branch}"
    continue
  fi

  branch="$(git -C "${path}" symbolic-ref --short HEAD 2>/dev/null || echo DETACHED)"

  ahead=0
  behind=0
  if [[ -n "${BASE}" ]]; then
    # Output is "<ahead>\t<behind>"; if HEAD has no common ancestor with BASE,
    # rev-list errors out and we fall back to zeros.
    counts="$(git -C "${path}" rev-list --left-right --count "HEAD...${BASE}" 2>/dev/null || printf '0\t0')"
    ahead="$(printf '%s' "${counts}" | cut -f1)"
    behind="$(printf '%s' "${counts}" | cut -f2)"
  fi

  modified=0
  untracked=0
  porcelain="$(git -C "${path}" status --porcelain)"
  while IFS= read -r line; do
    [[ -z "${line}" ]] && continue
    if [[ "${line}" == "??"* ]]; then
      untracked=$((untracked + 1))
    else
      modified=$((modified + 1))
    fi
  done <<< "${porcelain}"

  parts=()
  (( ahead > 0 ))     && parts+=("+${ahead} ahead")
  (( behind > 0 ))    && parts+=("-${behind} behind")
  (( modified > 0 ))  && parts+=("${modified} modified")
  (( untracked > 0 )) && parts+=("${untracked} untracked")

  summary="clean"
  if [[ ${#parts[@]} -gt 0 ]]; then
    summary=""
    for p in "${parts[@]}"; do
      [[ -n "${summary}" ]] && summary+=" · "
      summary+="${p}"
    done
  fi

  drift=""
  if [[ "${branch}" != "${cfg_branch}" && "${branch}" != "DETACHED" ]]; then
    drift="  (cfg: ${cfg_branch})"
  fi

  printf "%-${max_slug}s  %-${max_branch}s  %s%s\n" \
    "${slug}" "${branch}" "${summary}" "${drift}"
done
