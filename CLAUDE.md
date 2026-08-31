# CLAUDE.md

> **Claude-Code-specific configuration.** Everything about the project itself — architecture, design contracts, content model, conventions, gotchas — lives in **[`AGENTS.md`](./AGENTS.md)**. Read that first.
>
> This file covers only what's specific to Claude Code here: what's already wired up, how to dispatch the build, and how to keep context clean.

---

## What's wired up

| Path | Does |
|---|---|
| `.mcp.json` | Playwright, AWS Knowledge, Context7 — all enabled in `.claude/settings.json` |
| `.claude/hooks/block-npm-install.sh` | PreToolUse/Bash. Blocks `npm install\|i\|add`; `npm ci` and `npm run` pass |
| `.claude/hooks/check-draft-filter.sh` | PostToolUse/Edit\|Write. Flags `getCollection('blog')` outside `src/lib` |
| `scripts/worktrees.env` | The slice set — slugs, branches, and what each group owns |

Still worth adding: a PostToolUse hex-literal check on `*.astro` / `*.css` outside `tokens.css`. The no-hardcoded-colour rule is the easiest convention to break by accident and the most tedious to clean up later. `.github/` is group 08's to create — don't pre-empt it.

**Playwright** is the highest-value server here: the site is visual, and screenshots are the only way to verify rendering rather than assume it. It cannot open `file://` — serve the build first (`npx serve dist`) and navigate to localhost.

---

## Dispatching the build

Nine group briefs in `../grouped/plans/`, structured for concurrency. Wave order, group ownership, and the three concurrency rules are in AGENTS.md — read them there rather than trusting a copy.

Ten worktrees, one per slice, live under `.claude/worktrees/` (gitignored) on `feature/<slug>` branches:

```bash
scripts/spawn-worktrees.sh      # create the set
scripts/tmux-multi-claude.sh    # one tmux session per slice
scripts/wt-status.sh            # what each worktree has changed
scripts/cleanup.sh              # tear down
```

Edit `scripts/worktrees.env` to change which slices exist — `spawn`, `tmux`, and `cleanup` all read it.

### Required prompt preamble

Every dispatched agent needs these five points verbatim, or the parallelism guarantee breaks:

1. Read `../grouped/plans/PLAN.md` first, then your assigned brief.
2. Write **only** within your owned paths. If you need something outside them, report it — do not create it.
3. Take structure from `../mockup-*.html`; take colour and type from `PLAN.md` §4. Where they conflict, `PLAN.md` wins.
4. Satisfy your brief's Acceptance criteria before reporting complete.
5. Report: files created, contracts published, and anything you needed but could not own.

### Before starting Wave 2

Confirm group 00 actually delivered the contract layer — seven agents build against it simultaneously, so a gap here multiplies:

- `npm ci && npm run build && npx astro check` all clean
- Every cross-group component exists as an implementation or a working stub
- Dark renders by default with empty `localStorage`

---

## Verification loop

Claude cannot see the site. Prove rendering rather than asserting it:

1. `npm run build && npx astro check`
2. Serve `dist/` and screenshot the affected routes with Playwright
3. Toggle the theme and screenshot again — **both** themes, every time
4. Emulate `prefers-reduced-motion: reduce` and confirm animation genuinely stops
5. Report what you verified *and* what you couldn't

A Wave 2 worktree has no `site/` of its own — group 00 owns the scaffold. To verify a slice in isolation, build a scratchpad Astro harness with the group-00 stubs and mount the slice's components into it.

When something fails a budget, say so with the number. "Homepage JS is 11.2 KB against a 9 KB budget" is actionable; "should be fine" is not.

---

## Context hygiene

This file loads every session — keep it under ~150 lines. Project facts go in `AGENTS.md`; build instructions go in the group briefs.

- `/clear` at task boundaries. Wave 2 groups are unrelated; don't carry one group's context into the next.
- `/compact Prioritize keeping the design tokens, type contracts, and component signatures` past roughly 50 messages.
- Name files and functions in prompts instead of asking Claude to go exploring.
- Don't paste whole mockup files into context — they're 40–70 KB each. Point at a section or a `reference-screenshots/*.png`.
- A `.claudeignore` should exclude `node_modules/`, `dist/`, `.astro/`, `infra/.terraform/`, `*.tfstate*`, and `reference-screenshots/`.

Skills that map to this repo: `frontend-design` for Wave 2 groups 01–05, `code-review` before merging a group, `security-review` after group 08 lands IAM and headers, `humanize-writing` for any prose that ships.
