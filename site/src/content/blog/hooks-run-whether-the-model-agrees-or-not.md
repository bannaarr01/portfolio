---
title: 'Hooks run whether the model agrees or not'
description: 'A CLAUDE.md rule is a request. A hook is shell the harness runs regardless, which makes it the only place to put a rule you cannot afford to have ignored.'
category: ai-engineering
series: claude-code-in-practice
part: 4
publishDate: 2026-08-29
tags: ['claude-code', 'hooks', 'automation', 'shell']
heroGlyph: shield
---

There is a file in this site's content directory called `draft-should-not-appear.md`. Its frontmatter sets `draft: true`, its body opens with "do not delete it", and its only job is to be the thing that goes wrong first. If it ever renders on the live site, the draft filter is broken and I want to find out from a fixture rather than from someone reading a half-written post.

The filter itself is one function. `getPublishedPosts()` in `src/lib` is the only place in the codebase allowed to call `getCollection('blog')`. Every page imports the helper. The rule exists because a second entry point to the collection is exactly how an unpublished draft reaches production, and there is no version of that bug that gets caught in review, because the diff looks fine.

I wrote that rule into `AGENTS.md`. I wrote it into `CLAUDE.md` too. Both of those are text the model reads and mostly follows.

Mostly is doing a lot of work in that sentence.

## The rule that could not be a request

Everything else in Claude Code persuades the model. `CLAUDE.md` is a document loaded into the prompt. A skill is a document loaded on demand. A slash command is a document you triggered by hand. They all work by being convincing, and they all compete for the same finite window, which means their influence decays exactly when you need it most: forty tool calls in, near the compaction boundary, on the run where the model is holding six other constraints at once. See [part one](/blog/context-is-the-budget/) for why that decay is structural rather than a bug.

A hook is not a document. It is a shell command the harness runs at a fixed point in its own lifecycle, with the model nowhere in the decision. The model does not read the hook, cannot see the hook, and has no ability to weigh it against anything else it was told. It just finds out afterwards.

That is the whole value proposition. You are trading expressiveness for certainty, and for a small number of rules that trade is obviously correct.

Here is the one wired into this repo, in `.claude/settings.json`:

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          {
            "type": "command",
            "command": "bash \"$CLAUDE_PROJECT_DIR/.claude/hooks/check-draft-filter.sh\"",
            "timeout": 10,
            "statusMessage": "Checking draft filter"
          }
        ]
      }
    ]
  }
}
```

`matcher` matches tool names. If it contains only letters, digits, spaces, underscores, hyphens, commas and pipes, it is read as an exact string or a pipe-separated list of exact strings, so `Edit|Write` is two exact matches rather than a regex. Put any other character in it and the whole thing is treated as an unanchored JavaScript regular expression instead, which is how you match a whole MCP server at once: `mcp__playwright__.*`.

`$CLAUDE_PROJECT_DIR` resolves to the directory the session started in and stays put even when Claude moves into a git worktree. That matters here, because this project spawns ten of them.

Hook config can live in `~/.claude/settings.json` for every project, `.claude/settings.json` for one project, `.claude/settings.local.json` for one checkout, or in managed policy settings your admin controls. It can also ride along in a plugin, a skill's frontmatter, or a subagent's. The levels merge rather than override, so a project hook does not replace your personal one.

## Where the hook fires

The event list is long now, past thirty entries, covering compaction, model switches, worktree creation, config changes and subagent lifecycle. Most of them you will never touch. Four carry almost all the weight.

`PreToolUse` runs before a tool call and can stop it. `PostToolUse` runs after a tool call succeeded and can only talk. `UserPromptSubmit` runs on your prompt before the model sees it. `SessionStart` runs once at the top.

The split between the first two is the thing to internalise:

```text
   Claude proposes a tool call
             │
             ▼
      ┌─────────────┐
      │ PreToolUse  │──── deny ────┐   the tool never runs
      └──────┬──────┘              │
             │ allowed             │
             ▼                     │
       permission flow             │
             │                     │
             ▼                     │
        the tool runs              │   files are already written
             │                     │
             ▼                     │
      ┌─────────────┐              │
      │ PostToolUse │─── block ────┤   reason rides along with
      └──────┬──────┘              │   the tool result
             │                     │
             ▼                     ▼
        tool result ──────▶ Claude's next turn
```

`PostToolUse` cannot undo anything. By the time it fires, the file is on disk, the command has run, the request has left the machine. Its `decision: "block"` does not roll the edit back and the name is misleading: it attaches a `reason` to the tool result, and Claude still sees the original output alongside it. So it is feedback, not enforcement.

Which is fine, because feedback is what I actually want for the draft filter. Blocking a `Write` after the write has happened would leave the file there and the model confused. Handing back a sentence explaining what is wrong lets it fix the file on the next turn, which is the correct repair for a bad import.

`UserPromptSubmit` and `SessionStart` have a property the others do not: their plain stdout is added to context as something Claude can read. Everywhere else, a successful hook's stdout goes to the debug log and nobody sees it. This catches people. You write `echo "remember to run the tests"` in a `PostToolUse` hook, watch nothing happen, and conclude hooks are broken.

## Blocking and feedback are different tools

A hook communicates two ways and you should pick one per script rather than mixing them.

The blunt one is the exit code. Exit 0 is success. Exit 2 is a blocking error on the events that can block, and the message Claude sees is whatever you wrote to stderr. Every other exit code, including 1, is a non-blocking error: the transcript shows a notice, and the action proceeds anyway.

That last part deserves a moment. `exit 1` is the conventional Unix failure and it does not block. Neither does a crashed script, and neither does a hook whose path you mistyped, which exits 127 from the shell and leaves your policy gate silently disabled while looking configured. If a hook is enforcing something, exit 2 or return JSON, and watch the first run to confirm it is actually firing.

The precise one is JSON on stdout. Exit 0, print an object, and the harness reads fields off it. `PreToolUse` puts its verdict inside `hookSpecificOutput` and gets four outcomes: `allow` skips the permission prompt, `deny` kills the call, `ask` forces a prompt, `defer` parks it for a `-p` caller to resume. The top-level `decision` and `reason` fields are deprecated for `PreToolUse` specifically, though they remain the current format for `PostToolUse` and `Stop`. It is the kind of asymmetry you only discover by having a hook quietly do nothing.

The draft-filter script uses the `PostToolUse` form. It reads the edited path off stdin, exits early for anything under `src/lib` where the helper legitimately lives, and only then greps:

```bash
if grep -Eq "getCollection\([[:space:]]*['\"]blog['\"]" "$f"; then
  call="getCollection('blog')"
  reason="${f} calls ${call} directly, bypassing the draft filter..."

  jq -n --arg reason "$reason" --arg note "$note" \
    '{decision: "block", reason: $reason, systemMessage: $note}'
fi

exit 0
```

`reason` goes to Claude. `systemMessage` goes to me, on screen, so I know the guard fired rather than discovering it in a transcript later. Building the string outside the `jq` program is not stylistic: the literal `getCollection('blog')` contains an apostrophe, which would close the single-quoted jq program mid-flight.

## Determinism cuts both ways

The hook has a bug. I hit it while writing this post.

`grep` does not parse TypeScript, and it has no concept of a comment. So the guard fires on any file that merely mentions the call, and two files here mention it for entirely good reasons:

```text
site/src/types/content.ts:41
  * component should be handling a raw `getCollection('blog')` result.

site/src/pages/rss.xml.ts:5
  * lives. Never call `getCollection('blog')` here: a feed is cached and
```

Both are doc comments. Both are telling a reader not to do the thing. The second is a comment that exists to explain the rule, and it trips the guard that enforces the rule. Editing either file blocks every single time, and the model gets handed a paragraph accusing it of a violation that is not there.

The cheap fix is to drop comment lines before matching, which is one more `grep` in the pipeline and handles both cases:

```bash
grep -vE '^[[:space:]]*(\*|//|/\*)' "$f" | grep -Eq "getCollection\(..."
```

It is still a heuristic. It would miss a trailing comment on a line of real code, and it would fire on a string literal. The correct fix is parsing the file, which is more machinery than this rule is worth.

The failure is worth sitting with, though, because it is not a quirk of one badly written script. It is the property I wanted, seen from the other side. A hook does not weigh context. It cannot notice that the match is inside a block comment, that the file declares types and runs no code, or that the sentence wrapped around the match is an instruction not to do it. It matched, so it fired, and it will keep firing that way on every run until I go and edit the shell myself.

That is the same reason it works. What stops the hook being talked out of a real violation on turn ninety is exactly what stops it being reasoned into ignoring a comment on turn one, and you do not get to have one without the other.

Which sets the design rule: make the pattern as narrow as you can while still catching the thing, and plan to pay for the false positives out of your own pocket rather than expecting the model to route around them. Mine is too wide. A guard that cries wolf at prose is a guard you start waving through, and at that point it has quietly turned back into a suggestion.

## Arbitrary shell, with your credentials

A hook is a command running as you, with your environment, your keys, and write access to everything you can write to. The docs say this plainly and I will repeat it: review a hook before you add it, the same way you would review anything else that runs unattended.

The part worth knowing beyond that is the trust boundary. In an interactive session, Claude Code holds every settings-file hook back until you accept the workspace trust dialog for the folder, including hooks from your own `~/.claude/settings.json`. In a `-p` or SDK session there is no dialog and the folder is treated as trusted, which means hooks committed into a repository's `.claude/settings.json` run on a checkout you have never opened by hand. If you are scripting `claude -p` across repositories you did not write, read their `.claude/` directory first, or pass `--settings '{"disableAllHooks": true}'` for that run.

You do not need to restart after editing a hook. Hook config is not snapshotted at session start: a file watcher picks up direct edits to settings files while the session is running, and a restart is the fallback for when the watcher misses a change rather than the routine. `/hooks` lists what is currently registered, with the source file for each, which is the fastest way to answer "is this thing even loaded".

The tempting move, once hooks click, is to push everything into them. Resist it. Anything that needs the model to weigh a situation belongs in a [skill](/blog/skills-and-progressive-disclosure/), which loads when the request looks relevant and then argues its case. Hooks are event-driven and skills are request-driven, and the test for which one you want is whether you would accept the rule being skipped on a bad day.

For the draft filter the answer was no. So it is forty lines of bash that will go on being wrong about two comments until I get round to fixing them, and I will take that over a rule that only holds while the context is short.
