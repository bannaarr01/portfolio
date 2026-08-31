#!/usr/bin/env bash
# tmux-multi-claude.sh — drive a tmux layout for the worktrees in worktrees.env.
#
# Modes:
#   (default)   One detached session per worktree, full-height. Switch with
#               Ctrl-b s, or `tmux attach -t <slug>` from any terminal.
#   --tiled     One session called `claude-multi-<repo>` with N tiled
#               panes, run on its OWN tmux socket -L claude-multi-<repo>
#               (both socket and session are namespaced by repo basename
#               so running --tiled in another project doesn't tear this
#               one down). A stray `tmux attach` from another Terminal
#               also can't mirror or resize it. Fresh start: kills any
#               existing per-worktree sessions (default socket) plus any
#               prior session of the same name on the isolated socket,
#               then spawns claude in each pane.
#               To reattach from elsewhere (replace <repo>):
#                 tmux -L claude-multi-<repo> attach -t claude-multi-<repo>
#   --retile    For when you've already got per-worktree sessions running.
#               Pulls them together into a single `claude-multi` session
#               with tiled panes WITHOUT restarting Claude. Uses
#               `tmux join-pane`, which moves panes between sessions; the
#               source sessions end up empty and tmux closes them.
#   -h | --help
#
# Reads (SLUGS, BRANCHES) from scripts/worktrees.env.

set -euo pipefail

MODE="multi"
while [[ $# -gt 0 ]]; do
  case "$1" in
    --tiled)   MODE="tiled" ;;
    --retile)  MODE="retile" ;;
    -h|--help)
      sed -n '2,26p' "$0"
      exit 0
      ;;
    *)
      echo "✗ Unknown flag: $1"
      echo "  Try: $0 --help"
      exit 1
      ;;
  esac
  shift
done

if ! command -v tmux >/dev/null 2>&1; then
  echo "✗ tmux not installed. Install it (brew install tmux) or use spawn-worktrees.sh + manual terminals."
  exit 1
fi

if ! git rev-parse --show-toplevel >/dev/null 2>&1; then
  echo "✗ Not inside a git repo. Run from your repo root."
  exit 1
fi
REPO_ROOT="$(git rev-parse --show-toplevel)"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=worktrees.env
source "${SCRIPT_DIR}/worktrees.env"

REPO_NAME="$(basename "${REPO_ROOT}")"
# Namespace the tiled session+socket by repo basename so running --tiled in
# one project doesn't kill the tiled session of another project (both used
# to grab the literal name `claude-multi` on the same per-user socket).
TILED_SESSION="claude-multi-${REPO_NAME}"

# ──────────────────────────────────────────────────────────────────────────
# --retile: take running per-worktree sessions and combine them in-place.
# ──────────────────────────────────────────────────────────────────────────
if [[ "${MODE}" == "retile" ]]; then
  # Verify the per-worktree sessions actually exist.
  missing=()
  for slug in "${SLUGS[@]}"; do
    tmux has-session -t "${slug}" 2>/dev/null || missing+=("${slug}")
  done
  if [[ ${#missing[@]} -gt 0 ]]; then
    echo "✗ These sessions are not running, can't retile: ${missing[*]}"
    echo "  Start them first with:   $0"
    echo "  Or do a fresh tiled start: $0 --tiled"
    exit 1
  fi

  if tmux has-session -t "${TILED_SESSION}" 2>/dev/null; then
    echo "✗ A session called '${TILED_SESSION}' already exists."
    echo "  Kill it first:   tmux kill-session -t ${TILED_SESSION}"
    exit 1
  fi

  # Rename the first slug's session to claude-multi, then join the rest.
  echo "→ Renaming ${SLUGS[0]} → ${TILED_SESSION}"
  tmux rename-session -t "${SLUGS[0]}" "${TILED_SESSION}"

  for i in "${!SLUGS[@]}"; do
    [[ $i -eq 0 ]] && continue
    slug="${SLUGS[$i]}"
    echo "→ join-pane ${slug}:0 → ${TILED_SESSION}:0"
    # `join-pane -s` moves the only pane out of the source window; tmux then
    # cleans up the empty window and session automatically.
    tmux join-pane -t "${TILED_SESSION}:0" -s "${slug}:0"
  done

  tmux select-layout -t "${TILED_SESSION}:0" tiled
  tmux set-option -t "${TILED_SESSION}" status-left "[${TILED_SESSION}] "
  tmux set-option -t "${TILED_SESSION}" status-right "Ctrl-b o cycle · Ctrl-b z zoom · Ctrl-b d detach"

  echo
  echo "✓ Retiled into ${TILED_SESSION}. Claude processes were NOT restarted."
  tmux ls
  echo
  echo "Attaching..."
  tmux attach -t "${TILED_SESSION}"
  exit 0
fi

# Beyond this point both `multi` and `tiled` modes need worktrees on disk.
"${SCRIPT_DIR}/spawn-worktrees.sh"

for slug in "${SLUGS[@]}"; do
  path="${REPO_ROOT}/.claude/worktrees/${slug}"
  if [[ ! -d "${path}" ]]; then
    echo "✗ Worktree directory missing: ${path}"
    echo "  spawn-worktrees.sh did not create it. Check worktrees.env."
    exit 1
  fi
done

# ──────────────────────────────────────────────────────────────────────────
# --tiled: fresh single-session layout with N tiled panes.
# ──────────────────────────────────────────────────────────────────────────
if [[ "${MODE}" == "tiled" ]]; then
  # Run the tiled layout on its own tmux server (separate socket) so:
  #   - `tmux attach` from another Terminal can't grab into this session
  #     and mirror keystrokes / resize panes,
  #   - `tmux kill-server` against the default socket can't reach this,
  #   - and `tmux ls` on the default socket stays uncluttered.
  # The trade-off: to interact with it from outside this script you must
  # always pass `-L ${TILED_SESSION}` (see attach hint at the end).
  TMUX_ISO=(tmux -L "${TILED_SESSION}")

  # Kill anything that would collide. (We're doing a fresh start; running
  # Claude processes in per-worktree sessions WILL be terminated. Use
  # --retile instead if you need to preserve them.)
  if "${TMUX_ISO[@]}" has-session -t "${TILED_SESSION}" 2>/dev/null; then
    echo "→ Killing existing session on isolated socket: ${TILED_SESSION}"
    "${TMUX_ISO[@]}" kill-session -t "${TILED_SESSION}"
  fi
  for slug in "${SLUGS[@]}"; do
    # Per-worktree sessions live on the DEFAULT socket — kill them there
    # so we don't end up with two Claudes pointed at the same worktree.
    if tmux has-session -t "${slug}" 2>/dev/null; then
      echo "→ Killing existing session (default socket): ${slug}"
      tmux kill-session -t "${slug}"
    fi
  done

  # Pane 0 — top-left
  slug0="${SLUGS[0]}"
  branch0="${BRANCHES[0]}"
  path0="${REPO_ROOT}/.claude/worktrees/${slug0}"
  echo "→ Creating ${TILED_SESSION} on isolated socket (top-left: ${slug0})"
  "${TMUX_ISO[@]}" new-session -d -s "${TILED_SESSION}" -c "${path0}" \
    "echo '── ${slug0} (${branch0}) ──'; claude; exec \$SHELL"

  n=${#SLUGS[@]}
  if [[ $n -eq 3 ]]; then
    # Custom layout for exactly 3 worktrees, per AGENTS.md / allMultiClaude.md:
    #
    #   ┌──────────────┬──────────────┐
    #   │ SLUGS[0]     │ SLUGS[1]     │  ← top row, 50/50
    #   ├──────────────┴──────────────┤
    #   │ SLUGS[2]                    │  ← bottom row, full width
    #   └─────────────────────────────┘
    #
    # tmux's built-in `tiled` layout produces an even grid for N=3 (not
    # this shape) — so we drive the splits by hand and skip the trailing
    # `select-layout tiled` that would otherwise rewrite the result.
    slug1="${SLUGS[1]}"; branch1="${BRANCHES[1]}"
    path1="${REPO_ROOT}/.claude/worktrees/${slug1}"
    slug2="${SLUGS[2]}"; branch2="${BRANCHES[2]}"
    path2="${REPO_ROOT}/.claude/worktrees/${slug2}"

    # 1) Split the only pane top/bottom. The new pane (bottom, full width)
    #    runs SLUGS[2] and becomes the active pane.
    echo "→ split-window -v   (bottom, full width: ${slug2})"
    "${TMUX_ISO[@]}" split-window -v -t "${TILED_SESSION}" -c "${path2}" \
      "echo '── ${slug2} (${branch2}) ──'; claude; exec \$SHELL"

    # 2) Move focus back to the top pane, then split it left/right. The
    #    new right pane runs SLUGS[1].
    "${TMUX_ISO[@]}" select-pane -t "${TILED_SESSION}" -U
    echo "→ split-window -h   (top-right: ${slug1})"
    "${TMUX_ISO[@]}" split-window -h -t "${TILED_SESSION}" -c "${path1}" \
      "echo '── ${slug1} (${branch1}) ──'; claude; exec \$SHELL"

    # Land focus on top-left so SLUGS[0]'s Claude is the active pane.
    "${TMUX_ISO[@]}" select-pane -t "${TILED_SESSION}" -L
  else
    # Fallback for any N ≠ 3: tmux's built-in `tiled` grid. The custom
    # 2-on-top / 1-spanning-bottom layout is wired for N=3 only.
    echo "ℹ  ${n} worktrees — falling back to built-in 'tiled' grid."
    for i in "${!SLUGS[@]}"; do
      [[ $i -eq 0 ]] && continue
      slug="${SLUGS[$i]}"
      branch="${BRANCHES[$i]}"
      path="${REPO_ROOT}/.claude/worktrees/${slug}"
      echo "→ split-window (pane $i: ${slug})"
      "${TMUX_ISO[@]}" split-window -t "${TILED_SESSION}" -c "${path}" \
        "echo '── ${slug} (${branch}) ──'; claude; exec \$SHELL"
      # Re-tile after each split so split-window has a sane direction to pick.
      "${TMUX_ISO[@]}" select-layout -t "${TILED_SESSION}" tiled
    done
    "${TMUX_ISO[@]}" select-layout -t "${TILED_SESSION}" tiled
  fi
  "${TMUX_ISO[@]}" set-option -t "${TILED_SESSION}" status-left "[${TILED_SESSION}] "
  "${TMUX_ISO[@]}" set-option -t "${TILED_SESSION}" status-right "Ctrl-b o cycle · Ctrl-b z zoom · Ctrl-b d detach"

  echo
  echo "✓ Tiled session ready on isolated socket: -L ${TILED_SESSION}"
  "${TMUX_ISO[@]}" ls
  echo
  echo "Reattach from another terminal:"
  echo "  tmux -L ${TILED_SESSION} attach -t ${TILED_SESSION}"
  echo "List sessions on this socket:"
  echo "  tmux -L ${TILED_SESSION} ls"
  echo
  echo "Useful keys:"
  echo "  - Ctrl-b o      cycle panes"
  echo "  - Ctrl-b z      zoom current pane (toggle fullscreen-within-window)"
  echo "  - Ctrl-b !      break pane back into its own session"
  echo "  - Ctrl-b d      detach"
  echo
  echo "Attaching..."
  "${TMUX_ISO[@]}" attach -t "${TILED_SESSION}"
  exit 0
fi

# ──────────────────────────────────────────────────────────────────────────
# default (multi): one detached session per worktree.
# ──────────────────────────────────────────────────────────────────────────
for i in "${!SLUGS[@]}"; do
  slug="${SLUGS[$i]}"
  branch="${BRANCHES[$i]}"
  path="${REPO_ROOT}/.claude/worktrees/${slug}"

  if tmux has-session -t "${slug}" 2>/dev/null; then
    echo "→ Killing existing tmux session: ${slug}"
    tmux kill-session -t "${slug}"
  fi

  echo "→ Creating tmux session: ${slug} (${branch})"
  tmux new-session -d -s "${slug}" -c "${path}" \
    "echo '── ${slug} (${branch}) ──'; claude; exec \$SHELL"

  tmux set-option -t "${slug}" status-left "[${slug}] "
  tmux set-option -t "${slug}" status-right "Ctrl-b s switch · Ctrl-b d detach"
done

echo
echo "✓ Sessions ready:"
tmux ls
echo
echo "Useful keys once attached:"
echo "  - Ctrl-b s            session picker (switch between worktrees)"
echo "  - Ctrl-b d            detach (Claudes keep running in the background)"
echo "  - tmux attach -t <slug>   attach to a specific worktree from any terminal"
echo
echo "Want them in one window with tiled panes instead?"
echo "  $0 --retile     # combine running sessions in-place (no Claude restart)"
echo "  $0 --tiled      # fresh start: kills everything and tiles from scratch"
echo
echo "Attaching to: ${SLUGS[0]}"
tmux attach -t "${SLUGS[0]}"
