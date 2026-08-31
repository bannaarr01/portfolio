# Worktree Setup

Two ways to do this: the **easy way** (`claude --worktree`) and the **manual way** (`git worktree add` yourself). Use the easy way unless you have a reason not to.

---

## A. The easy way: `claude --worktree`

```bash
# In your repo root
cd ~/myrepo

# Start Claude in a new worktree named "feature-auth"
claude --worktree feature-auth
# or shorthand:
claude -w feature-auth
```

What this does behind the scenes:
1. Creates `.claude/worktrees/feature-auth/` (a new working directory)
2. Branches `worktree-feature-auth` from `origin/HEAD` (configurable, see below)
3. Copies any files listed in `.worktreeinclude` (e.g. `.env`)
4. Launches `claude` with that directory as cwd
5. On exit: if no changes, removes the worktree; if changes exist, asks you what to do

**Auto-generated names** — omit the name and Claude picks one:

```bash
claude --worktree           # creates .claude/worktrees/<auto-name>/
```

**Worktree from a GitHub PR** — fetch and check out a PR for review:

```bash
claude -w "#142"                          # fetch PR #142 from origin
claude -w "https://github.com/o/r/pull/142"   # full URL form
```

**Auto-spawn a tmux session for it** (requires `tmux` installed):

```bash
claude -w feature-auth --tmux
# Equivalent to: tmux new -s feature-auth -d 'cd ... && claude'
```

---
---

V2

---
---

```bash
(base) josh@joshmacstudio demo % tmux ls
claude-multi: 1 windows (created Sun May 17 19:00:24 2026)
# To kill this session
(base) josh@joshmacstudio demo % tmux kill-session -t claude-multi
# Or Kill all
(base) josh@joshmacstudio demo % tmux kill-server

1. Ctrl-a % — split vertical → now 2 panes side by side
2. Ctrl-a " — split the focused pane horizontal → now 3 panes (one tall on left, two stacked on right)
3. Ctrl-a ← — move focus to the left pane
4. Ctrl-a " — split it horizontal → now 4 panes in a 2×2 grid

Useful follow-ups:

- Ctrl-a <arrow> — move focus between panes
- Ctrl-a z — zoom the focused pane fullscreen, press again to unzoom
- Ctrl-a x — kill the focused pane
- Ctrl-a q — flash pane numbers; press the number to jump to it
- Ctrl-a Ctrl-<arrow> — resize the focused pane (hold to repeat)

- Ctrl-a s — opens an interactive session picker. Use arrows to highlight a session, Enter to switch. You can also expand a session   
with → to see its windows.                                                                                                            
- Ctrl-a ( — switch to the previous session
- Ctrl-a ) — switch to the next session                                                                                               
- Ctrl-a $ — rename the current session (helpful so they're easy to identify in the picker)

tmux ls                    # list all sessions                                                                                        
tmux attach -t <name>      # attach to a specific session 
tmux attach                # attach to the most recent 
```


```bash
./scripts/tmux-multi-claude.sh
```

Or do it manually:

```bash
# From inside your repo
tmux new-session -d -s claude-multi -c "$(pwd)"

# Pane 1: feature work
tmux send-keys -t claude-multi "claude -w feature-auth" Enter

# Split horizontally, pane 2: bug fix
tmux split-window -h -t claude-multi -c "$(pwd)"
tmux send-keys -t claude-multi "claude -w bugfix-cart" Enter

# Split vertically, pane 3: refactor
tmux split-window -v -t claude-multi -c "$(pwd)"
tmux send-keys -t claude-multi "claude -w refactor-logging" Enter

# Even out the layout
tmux select-layout -t claude-multi tiled

# Attach
tmux attach -t claude-multi
```

Resulting layout:

```
┌──────────────────────┬──────────────────────┐
│  feature-auth        │  bugfix-cart         │
│  Claude session A    │  Claude session B    │
├──────────────────────┴──────────────────────┤
│  refactor-logging                            │
│  Claude session C                            │
└──────────────────────────────────────────────┘
```


---

## D. Let Claude do it for you: `claude --tmux`

`--tmux` automatically creates a tmux session named after the worktree:

```bash
claude -w feature-auth --tmux
```

This:
1. Creates the worktree
2. Spawns `tmux new-session -s feature-auth` detached
3. Runs `claude` inside it
4. Attaches you to the session

Useful when scripting — you can fire off three of these and `tmux ls` will show all three sessions ready to attach.

```bash
# Spawn three detached tmux sessions, each with its own Claude
for branch in feature-auth bugfix-cart refactor-logging; do
  claude -w "$branch" --tmux &
done
wait
tmux ls
# claude-feature-auth: 1 windows (created Mon May 11 ...)
# claude-bugfix-cart:  1 windows (created Mon May 11 ...)
# claude-refactor-logging: 1 windows (created Mon May 11 ...)

# Attach to one
tmux attach -t feature-auth


  Run when you're ready
  ./scripts/cleanup.sh                # sweep up the prunable demo worktrees (offer to delete worktree-* branches when 
  prompted)                                                                                                            
  ./scripts/spawn-worktrees.sh        # create enrollment / policy / alerts worktrees                                          
  ./scripts/tmux-multi-claude.sh      # spin up the three sessions and attach        
                                                                                                                               
  
```


  enrollment  feature/phase1-enrollment-component     8 modified · 2 untracked
  policy      feature/phase1-policy-service-expand    11 modified · 11 untracked
  alerts      feature/phase1-alerts-component-expand  7 modified · 6 untracked

  What it shows per worktree
  - Slug (column 1) + currently checked-out branch (column 2).
  - Counts vs. base (default develop, override with WT_STATUS_BASE=main ./scripts/wt-status.sh):
    - +N ahead — local commits not in base
    - -N behind — commits base has that this worktree doesn't
    - N modified — staged/unstaged tracked-file changes
    - N untracked — files not yet git add-ed
  - clean if everything is at zero.
  - If the actual branch drifts from what's configured in worktrees.env (you git checkout-ed something else inside a worktree),
   the configured branch shows in (cfg: ...).
  - Missing worktree dirs are flagged with (missing — run spawn-worktrees.sh).

  Drill into one when you want detail
  cd .claude/worktrees/policy
  git status -sb           # full file list
  git diff --stat          # what's changed

  Once any worktree actually commits, you'll see the +N ahead column light up, which is the cue that PR/handoff time is near.
  Mention of the script is now in AGENTS.md §5.1 and §18 alongside the others.

git add . -- ':!file1.txt' ':!file2.txt'

---

git add .
git restore --staged file1.txt file2.txt

If the files are already tracked and you want to be extra explicit:
git add -u -- ':!file1.txt' ':!file2.txt'