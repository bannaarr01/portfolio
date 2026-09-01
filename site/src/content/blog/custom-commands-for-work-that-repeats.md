---
title: 'Custom commands for work that repeats'
description: 'A slash command is a prompt you got tired of retyping. What changes when it becomes a file is that it can be reviewed, shared, and wrong in only one place.'
category: ai-engineering
series: claude-code-in-practice
part: 2
publishDate: 2026-08-27
tags: ['claude-code', 'slash-commands', 'automation', 'workflow']
heroGlyph: code
---

I typed the same paragraph into three sessions in one afternoon. It said that every colour on this site comes from a token in `tokens.css`, that a hex literal anywhere else fails `npm run no-hex`, and that dark is the default theme when `localStorage` is empty. By the third time I had shortened it. The short version dropped the dark-default sentence, and the component I got back looked right in light and wrong in dark.

That is not a prompting problem. It is a version control problem. I had three copies of one instruction, all slightly different, none of them authoritative, and no way to tell which was current except by reading my own scrollback.

The fix is not clever. Put the paragraph in a file.

## The file is the command

A markdown file in `.claude/commands/` becomes a slash command named after the file. `.claude/commands/audit.md` gives you `/audit`. Commit it and everyone who clones the repo has `/audit` too. The same file in `~/.claude/commands/` gives you `/audit` in every project on your machine instead. There is no registry to update, nothing to declare, and no build step.

Anthropic has since folded custom commands into skills, and the two are now the same mechanism. A file at `.claude/commands/deploy.md` and a directory at `.claude/skills/deploy/SKILL.md` both produce `/deploy` and behave identically. Existing command files keep working. What the skill form buys you is a directory, so a reference doc or a helper script can sit next to the prompt instead of being inlined into it. For anything longer than a screen, take the directory.

Precedence, when the same name exists twice: enterprise beats personal, personal beats project, and a skill beats a command file. Plugin skills carry a `plugin-name:skill-name` namespace and cannot collide with anything you wrote. In a monorepo, a `.claude/skills/` directory below your working directory loads the first time Claude reads or edits a file inside it, and if its name clashes with one at the root it appears under a directory-qualified name like `apps/web:deploy` while plain `/deploy` still runs the root one.

On restarting: Claude Code watches skill directories. Add or edit a `SKILL.md` under `~/.claude/skills/` or the project's `.claude/skills/` and the change lands in the session you are already sitting in. Two cases still need a restart. One is a top-level skills directory that did not exist when the session started, because there was nothing to watch. The other is a command or subagent file inside a directory you passed with `--add-dir`, which Claude Code never watches at all.

## Arguments, and the ways to spell them

`$ARGUMENTS` is everything you typed after the command name, as one string. It is the right choice when the argument is a description rather than a value, which is most of the time.

For values, you can index. `$ARGUMENTS[0]` is the first argument and `$0` is shorthand for the same thing. Zero-based, which will catch you exactly once. Indexed arguments use shell-style quoting, so `/component ThemeToggle "swaps the theme and remembers it"` puts the whole quoted phrase in `$1`. If you would rather not count, declare names in the frontmatter with `arguments: [component, brief]` and write `$component` and `$brief` in the body.

The two behave differently when an argument is missing. A named placeholder expands to an empty string. An indexed one stays in the text as the literal characters `$2`, which then reaches the model as part of your instructions. And if you pass arguments to a command whose body has no placeholder at all, Claude Code appends `ARGUMENTS: <what you typed>` to the end rather than dropping them, so a command you forgot to parameterise is untidy rather than broken.

Here is the paragraph I kept retyping, as a file:

```markdown
---
description: Build a new Astro component to this site's conventions
argument-hint: [component-name] [what it should do]
---

Build a component called `$0`.

What it needs to do: $1

Conventions that are not negotiable:

- Every colour, space and font size comes from a token in
  `src/styles/tokens.css`. A hex literal in an `.astro` or `.css`
  file fails `npm run no-hex`.
- Dark is the default theme when `localStorage` is empty. Render
  and check both themes before calling it done.
- Islands cost page weight. `node scripts/budgets.mjs --check`
  exits 1 when a route goes over its budget.
```

When the dark-default rule changes, it changes in one place, and the change shows up in a diff that someone can argue with.

## Frontmatter turns a prompt into a contract

Command files take the same frontmatter as skills, with two exceptions: `name` and `paths` are ignored in a command file. The fields that earn their line:

- `description` says what the command does and when it applies. It is also what Claude reads when deciding whether to reach for the command without being asked, so vague descriptions cause both mis-triggering and silence.
- `argument-hint` shows in autocomplete. `[component-name] [what it should do]` is worth ten seconds of typing because it is the only documentation anyone will read.
- `allowed-tools` lists tools Claude may use without a permission prompt during the turn that invoked the command. The grant clears when you send your next message, so it is per-turn, not per-session.
- `disallowed-tools` removes tools from the pool while the command is active, on the same per-turn basis.
- `model` and `effort` pin the model or the effort level for the command. A mechanical formatting command does not need your expensive model.
- `disable-model-invocation: true` means only you can invoke it. I set this on anything with side effects. You do not want Claude deciding your code looks ready to deploy.

One thing worth knowing about `allowed-tools` before you clone somebody's repo and start a session in it: workspace trust does not gate that field. A project command can grant itself broad tool access, and Claude Code honours it whenever the command is invoked. Read the frontmatter of commands that arrive with a checkout.

Keep the body short for a reason that has nothing to do with taste. Once a command is invoked, its rendered content enters the conversation as a message and stays there for the rest of the session. Claude Code does not re-read the file on later turns. Every line you wrote is a recurring cost against the same window your actual work is competing for, so write standing instructions rather than a tutorial, and move the long reference material into a skill directory where it can sit unread until something needs it.

## The backtick that runs before Claude reads anything

This is the feature that turns a saved prompt into something closer to a script. A `` !`command` `` in the body runs before the file is sent to the model, and the output replaces the placeholder. Claude receives data, not an instruction to go and fetch data. For several commands in a row, open a fenced block whose info string is a single `!` and put one command per line inside it.

The `!` is only recognised at the start of a line or immediately after whitespace. Put it after another character, as in ``KEY=!`cmd` ``, and the placeholder stays as literal text and the command never runs.

Now the part that cost me an afternoon. A non-zero exit code aborts the entire invocation, not just that placeholder. Claude never sees any of the file, and you get `Shell command failed for pattern "..."` instead of an answer. My `no-hex` script exits 1 precisely when it has found something worth telling me about, which is the exact case I wanted the command for. Append `|| true` to anything that exits non-zero by design.

Injected commands also never prompt for permission. If the permission check returns anything other than allow, including a rule that would normally ask you, the invocation aborts. Pre-approve with `allowed-tools`.

```markdown
---
description: Find and fix vulnerable dependencies, then prove
  nothing broke
allowed-tools: Bash(npm audit *) Bash(npm run *) Bash(npx astro *)
disable-model-invocation: true
---

## Current state

Advisories: !`npm --prefix site audit || true`
Outdated: !`npm --prefix site outdated || true`

## What to do

1. Apply what `npm audit fix` resolves on its own. Do not pass
   `--force`. A major version bump is a decision, not a fix.
2. For anything left, read the advisory and say whether it reaches
   shipped code. A prototype-pollution finding in a build-only
   dependency of a static site is not the same risk as one in
   something that goes to the browser.
3. Run `npm run build`, `npx astro check`, and
   `node scripts/budgets.mjs --check`. All three, in that order.
4. Report every advisory you did not fix, with the reason.
```

Both `npm audit` and `npm outdated` exit non-zero when they find something, so both need the `|| true`. That is not a quirk of those two commands. It is true of most check tools, because exiting non-zero on a finding is what makes them usable in CI, and it means the tools most worth injecting are the ones most likely to abort the command that injects them.

You can also name files with an `@` reference in the body and Claude Code attaches them, the same way `@` works when you type it into the prompt. Putting `@site/src/styles/tokens.css` at the top of the component command saves a lookup Claude would otherwise do on its own.

## A command is invoked, a skill is reached for

That is the whole distinction, and since the two are now one file format, it comes down to a frontmatter field. `disable-model-invocation: true` makes something invocation-only: it stays out of Claude's context until you type the slash. `user-invocable: false` makes it reach-for-only, for background knowledge that is not a meaningful action to take. Leave both off and you get both behaviours. [Part 6](/blog/skills-and-progressive-disclosure/) covers what that second mode is actually for.

The line that matters more day to day is the one between a command file and `CLAUDE.md`. `CLAUDE.md` loads at the start of every session, relevant or not, and that is [the entire cost model](/blog/context-is-the-budget/). It should hold facts that apply broadly: the build commands, the conventions that differ from the language defaults, the gotchas nobody could infer from reading the code. A procedure that only matters when you are doing one particular thing has no business being in context while you debug something else.

My test is a grammar test. If it reads as an instruction, it goes in `CLAUDE.md`. If it reads as a procedure with steps, it goes in a file with a slash in front of it.

The paragraph I kept retyping is now eleven lines in a file that anyone on the project can open, and the last time it was wrong, it was wrong in exactly one place.
