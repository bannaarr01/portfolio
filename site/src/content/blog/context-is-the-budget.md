---
title: 'Context is the budget'
description: 'Claude Code spends a fixed slice of the window before you type a word. Most sessions that go badly are budget failures, not model failures.'
category: ai-engineering
series: claude-code-in-practice
part: 1
publishDate: 2026-08-26
tags: ['claude-code', 'context', 'agents', 'ai-engineering']
heroGlyph: layers
---

This site was built by nine agents working in parallel on disjoint sets of files. The rule that makes that safe is written down in the repo: an agent that needs something outside its owned paths reports it instead of creating it. One evening I finished the layout slice and, instead of starting a fresh session, pasted the next brief into the same one.

Twenty minutes later the content agent had imported a component from the layout group and written into a directory it did not own.

Nothing about that was a reasoning failure. It had read the ownership rules. It had also sat through two hours of me approving edits across the whole `src/` tree, and as far as the transcript was concerned that was the established shape of the work. The rule was one line in a file loaded at startup. The counter-evidence was a hundred tool calls deep and much fresher.

I have come to think that is what almost every bad session actually is. Not the model being stupid, the window being wrong. And a bigger window does not rescue you: a million tokens of capacity just means you can accumulate more irrelevant material before you notice the answers getting vaguer. The skill worth building is not prompting. It is deciding what Claude is allowed to see.

## The spend before you type

`/context` prints the window as a grid with a breakdown by category. Here is a reading from one of my sessions, a few dozen messages in, on a model configured with a one-million-token window:

```text
  one session, one million tokens available
  ┌───────────────────────────────────────────────────────┐
  │ system prompt         8.9k  ┐                         │
  │ tool definitions       11k  │  fixed overhead, ~23k,  │
  │ skill descriptions    2.1k  │  spent before I typed   │
  │ agent definitions      778  ┘                         │
  ├───────────────────────────────────────────────────────┤
  │ conversation         21.4k     everything I actually  │
  │                                said and did           │
  ├───────────────────────────────────────────────────────┤
  │ autocompact buffer     33k     reserved, not mine     │
  └───────────────────────────────────────────────────────┘
             43k of 1M used
```

Your numbers will be different. The shape is the part that generalises: when I ran this, the setup cost more than the conversation did. Twenty-three thousand tokens of system prompt, tool schemas, skill descriptions and agent definitions were in the window before I said a word, and none of it was about my project.

Two entries in that list are worth understanding rather than skimming. The autocompact buffer is reserved space, not free space. Claude Code compacts automatically as you approach the limit, and it needs room to do the summarising, so the working ceiling is lower than the headline number.

The skill descriptions line is one sentence per skill, not the skills themselves. Bodies load only when a skill is used, which is a deliberate design and the subject of [part six](/blog/skills-and-progressive-disclosure/). But the descriptions are unconditional. Install thirty plugins and you are paying rent on all thirty in every session, including the ones about Postman collections while you are debugging a CSS grid.

## Where the instructions live

Persistent instructions come from a hierarchy of `CLAUDE.md` files, loaded from the broadest scope down to the most specific and concatenated rather than overridden. All of it lands in context together.

```text
  loaded at launch, machine-wide first, working dir last
  ┌───────────────────────────────────────────────────────┐
  │ managed policy   /Library/Application Support/        │
  │                  ClaudeCode/CLAUDE.md                 │
  ├───────────────────────────────────────────────────────┤
  │ user             ~/.claude/CLAUDE.md                  │
  │                  ~/.claude/rules/*.md                 │
  ├───────────────────────────────────────────────────────┤
  │ project          ./CLAUDE.md or ./.claude/CLAUDE.md   │
  │                  .claude/rules/*.md                   │
  ├───────────────────────────────────────────────────────┤
  │ local            ./CLAUDE.local.md   (gitignored)     │
  └───────────────────────────────────────────────────────┘

  loaded later, only when Claude reads a file they match
  ┌───────────────────────────────────────────────────────┐
  │ nested           src/api/CLAUDE.md                    │
  │ path-scoped      .claude/rules/*.md with paths:       │
  └───────────────────────────────────────────────────────┘
```

Every directory above your working directory contributes, so launching in `foo/bar/` picks up `foo/CLAUDE.md` too. In a monorepo that is how you end up reading another team's conventions all day, and `claudeMdExcludes` in your local settings is the fix.

The split between the two boxes is the useful part. Everything in the first is always present. Everything in the second is conditional, which makes it nearly free until it is relevant. So the question for each rule you write is not "is this true?" but "is this true often enough to pay for on every single turn?"

`/init` writes the first version of the project file for you by exploring the codebase and summarising what it finds. Treat that output as a draft. What it produces well is the derivable stuff, directory layouts and build commands, and that is exactly the material worth deleting later: Claude can rediscover a folder structure in one tool call, and paying for it on every turn is a bad trade. What earns permanent residence is the opposite, the things no amount of reading the code will reveal. Which decisions are already settled. Which mistake this codebase invites.

Keep each file under about 200 lines. That is a real threshold rather than a stylistic one, because a longer file measurably reduces adherence: your rule ends up competing with everything else in the window for attention. This repo's `CLAUDE.md` opens by declaring a budget for itself and pointing at `AGENTS.md` for everything about the project. That structure is not tidiness. `CLAUDE.md` holds the handful of facts needed on every turn, and the rest is a document Claude reads when the task calls for it.

That distinction is worth being precise about, because `@` means two different things. Inside a memory file, `@AGENTS.md` is an import: the file is expanded and loaded at launch, so splitting content across imports organises your instructions without saving a single token. A plain markdown link is not an import. It costs one tool call at the moment the information is needed, and nothing at all the rest of the time. I use links.

## The part of the budget you did not write

There is a second memory system alongside `CLAUDE.md`, and it is on by default. As you work, Claude saves notes to itself: your role and working preferences, corrections you gave it, project decisions it cannot derive from the code, and pointers to things outside the repo. They live per repository under `~/.claude/projects/<project>/memory/`, with a `MEMORY.md` index whose first 200 lines load at the start of every session and topic files that are read on demand.

I like it more than I expected to. It absorbs the corrections you would otherwise type twice, and unlike `CLAUDE.md` it costs you nothing to maintain. But it is worth being clear-eyed about what it is: instructions in your startup budget that you did not author and have not read. Run `/memory` occasionally and look. Mine holds a note that this project's commits must never list Claude as an author, which is correct and which I am glad I do not have to repeat, and it got there because I said it once in a session I no longer remember.

One detail matters if you work the way this repo does. Auto memory is keyed to the git repository, so every worktree of the same repo shares one directory. Ten worktrees off one repository, all reading and writing the same notes.

## Naming the file instead of hunting for it

In a prompt, `@` is a file path mention with autocomplete behind it, and its value is almost entirely about what it prevents.

Ask "where do we validate the JWT?" and Claude does what you would do: globs for likely filenames, greps for the term, opens four files, discards three. Every one of those reads lands in your window permanently and the three wrong ones stay there, being wrong, for the rest of the session. File reads dominate context usage in practice, and the reads that cost the most are the speculative ones.

Say `@src/lib/auth.ts` and the search phase does not happen. One read, one file, and the window contains exactly the file you meant.

This is the same instinct as delegating exploration to a subagent, which is the right move when you genuinely do not know where something lives, and which [part five](/blog/sub-agents-are-a-context-decision/) is about. When you do know, just say so. Being specific in a prompt is a token optimisation dressed as politeness.

## Compact keeps what it learned, clear throws it away

Two commands free space and they are not interchangeable.

`/compact` replaces the conversation with a structured summary and keeps going. Startup content comes back from disk: project-root `CLAUDE.md`, auto memory, the plan from plan mode, and up to five of the most recently modified files Claude touched. What gets summarised away is the conversation itself, which is where every correction you typed lives. This is the single best argument for writing rules down: an instruction you gave in chat may not survive compaction, and one in `CLAUDE.md` is re-injected every time.

You can steer it. `/compact focus on the auth bug fix` keeps what you choose instead of what the automatic pass guesses, and a "Compact Instructions" section in `CLAUDE.md` sets that preference permanently.

`/clear` starts a new conversation with an empty context. Everything learned is gone.

The rule I use: same problem, compact; different problem, clear. And the second half of that matters more than people expect, because carrying context across unrelated tasks is not merely wasteful, it is actively misleading. Old conversation crowds out the files you need next, and it costs tokens on every subsequent message. Worse, it is evidence. The model is reasoning about what you appear to be doing, and two hours of layout work is a strong argument that you are still doing layout work. That is precisely how my content agent talked itself into editing another group's files.

Mid-turn there are two smaller levers. `Esc` interrupts immediately and keeps the work done so far, which is how you stop a plan that has expanded past what you asked for without discarding the useful half. Press `Esc` twice on an empty prompt and you get the rewind menu, which restores files and conversation to an earlier point, and can also summarise from or up to a chosen message when only part of the session is worth keeping.

## Buying reasoning on purpose

Plan mode is the one place I spend context deliberately. `Shift+Tab` cycles the permission modes and plan is one of them, or prefix a single prompt with `/plan`. Claude reads, explores, and writes a proposal without touching your source. You approve it or send it back.

The trade is real. Planning costs a research pass you then pay for again during implementation, and for a two-line fix that is silly. For anything touching more than about three files it has been consistently worth it, because the failure it prevents is the expensive one: forty minutes of confident edits in the wrong direction, which you now have to read, understand, and unpick.

Reasoning effort is the other dial, set with `/effort` and running `low`, `medium`, `high`, `xhigh`, `max` on current models, with `high` as the usual default. These are token spend, straightforwardly. `xhigh` and `max` buy deeper reasoning by generating a great deal more of it, and `max` is prone to overthinking a task that did not need it. If you want one turn to think harder without changing the session, put `ultrathink` in the prompt.

None of these levers help if the window is already full of yesterday's problem. Clear first, then spend.
