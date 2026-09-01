---
title: 'Sub-agents are a context decision'
description: 'Delegating does not make the model smarter. It buys a clean context window and charges you visibility, and every good use of a sub-agent follows from that.'
category: ai-engineering
series: claude-code-in-practice
part: 5
publishDate: 2026-08-31
tags: ['claude-code', 'sub-agents', 'context-management']
heroGlyph: bot
---

I asked a question I did not think was expensive. Which service handles refunds? The codebase was about three weeks old to me. Claude grepped, opened a file, followed an import, opened four more, found an interface, went hunting for implementations, and answered correctly a minute later.

Then I looked at what the answer had cost. Fifteen files were sitting in my context window, and they were going to sit there for the rest of the session, because a context window only ever grows. I wanted one sentence. I got one sentence and a research trail I had no intention of reading.

That is the whole case for sub-agents, and it has nothing to do with expertise. The model does not get better at Kubernetes because you told it that it is a Kubernetes specialist. It already knows what it knows. What a sub-agent actually changes is the size and cleanliness of the working set the answer gets produced in, and whether the wreckage of producing it lands in your window or somebody else's.

## Two windows, one paragraph between them

A sub-agent runs in its own context window with its own system prompt and its own tool permissions. It works on its own, and when it finishes, only its report crosses back. Everything else, the searches, the file contents, the reasoning it did to get there, is discarded with the context it lived in.

```text
  main thread                         sub-agent

  ┌───────────────────────┐   task    ┌───────────────────────┐
  │ system prompt         ├──────────▶│ system prompt (agent) │
  │ CLAUDE.md             │           │ task description      │
  │ the conversation      │           │ 4 searches            │
  │                       │◀──────────┤ 15 file reads         │
  │ + one paragraph       │  report   │ the reasoning         │
  └───────────────────────┘           └───────────────────────┘
                                       discarded on return
```

Same refunds question, run through a sub-agent: the left box grows by a paragraph instead of by fifteen files. If you have read [part one](/blog/context-is-the-budget/), this is the same budget argument with a second window attached.

Now the honest half. You lose the journey. When the answer is right this is exactly what you wanted, and when it's wrong you have no idea where it went wrong, because the evidence has been thrown away. You can't scroll up and find the file it misread. All you can do is ask again and hope the second run is better, which is a worse debugging position than reading fifteen files would have been.

There's a second cost that surprised me more. A sub-agent starts cold. It does not inherit your conversation history, the files Claude already read, or the skills already loaded in your session. For a self-contained question that's free. For a task that only makes sense given the last forty minutes of discussion, you pay for it to rediscover all of that, and the isolation you bought is worth less than the context you burned re-establishing. When that's the shape of the work, `/subtask` is the escape hatch: it forks the current conversation, so the delegate inherits your history along with the system prompt, tools, and model.

You are already relying on this before you configure anything. Three sub-agents ship with Claude Code and launch on their own judgement. Explore holds read-only tools with Write and Edit denied, and handles file discovery and code search, which is my refunds question answered the way it should have been. Plan does the same read-only research behind plan mode. General-purpose gets every tool available to sub-agents and takes multi-step work that has to act, not just look.

If you would rather watch the searches happen, you can turn the read-only two off:

```json
{
  "permissions": {
    "deny": ["Agent(Explore)", "Agent(Plan)"]
  }
}
```

I leave them on. Exploration is the single best thing to keep out of a window, and the built-ins are doing it for free.

## The parent writes half the prompt

A sub-agent receives exactly two things. Its system prompt, from its configuration file, which you wrote and can read. And a task description, written by the parent agent, based on what it thinks you asked for.

The second one is where delegation quietly goes wrong. You typed a request with three constraints in it. The parent compressed that into a brief. The sub-agent sees only the compression, has no access to what you actually typed, and cannot ask you a clarifying question. If the constraint you cared about did not survive the compression, you find out when the report comes back confidently wrong about something you thought you had specified.

I ran into this at scale on this site. It was built by dispatching parallel agents across ten git worktrees, one per slice, and the thing that made it survive was a preamble every dispatched agent had to receive verbatim. Two of the five points exist entirely because of the compression problem:

> Write **only** within your owned paths. If you need something outside them, report it, do not create it.

> Report: files created, contracts published, and anything you needed but could not own.

Neither is about capability. Both are about the fact that a delegated agent is working from a summary of my intent, and if I don't nail the boundaries into the brief, the summary loses them. When you write your own task description, be specific in a way that feels excessive. You are not talking to the model, you are talking through a paraphrase of yourself.

## Configuring one

Sub-agents are markdown files with YAML frontmatter. `.claude/agents/` for a project, `~/.claude/agents/` for every project on your machine. Both directories are scanned recursively, so subfolders are free organisation. Identity comes from the `name` field, not the filename.

Only `name` and `description` are required. Here is one I'd actually get value from here, where hardcoded colours are the convention that breaks most often:

```markdown
---
name: token-auditor
description: Finds colour literals outside tokens.css. Run after CSS work.
tools: Read, Grep, Glob
model: haiku
---

You audit styling changes against src/styles/tokens.css. A hex literal
or an rgb() call in any .astro or .css file outside that one is a
finding.

Report each finding as one line: file path, line number, the literal,
and the token that should have been used. If there are none, say so in
a sentence and stop.
```

`tools` is a comma-separated list, and leaving it out means the sub-agent inherits every tool available to sub-agents in the main conversation. That default is worth overriding more often than not. The agent above physically cannot modify a file, which is a stronger guarantee than instructing it not to, and it does a second job too: three tools describe a role more precisely than a paragraph of system prompt does. There's a `disallowedTools` field if a denylist fits better, applied before `tools` is resolved.

`model` pins a model per agent. It takes `sonnet`, `opus`, `haiku`, `fable`, a full model ID, or `inherit`, and it defaults to the main conversation's model. A grep-and-report agent on Haiku while the main thread stays on Opus is one of the few genuinely free wins in this whole system. There's more in the frontmatter than most people need, including `maxTurns`, `permissionMode`, a `skills` list for preloading [skills](/blog/skills-and-progressive-disclosure/) a custom agent would not otherwise get, and an `isolation: worktree` setting that does in one line what the eighty-five lines of my `spawn-worktrees.sh` do by hand.

Now the field that decides whether any of this fires. `description` is the trigger: the main agent reads it and decides, on its own, whether the task in front of it belongs to this agent. Vague descriptions fail in both directions. Write "helps with code quality" and it either never launches or it launches on everything, and the second failure is worse, because you'll be paying for a delegation you didn't want on tasks that were fine in the main thread. Say what it does and when to use it, in that order. When you want it regardless, `@agent-token-auditor` guarantees the run.

## An output format is a stopping condition

This is the least obvious property of the whole feature, and the one that fixed the most for me once I understood it.

A sub-agent with no defined output has no way to know when it has done enough research. It cannot ask you. It has no sense of your patience. So it keeps going, because one more file might improve the answer, and there is always one more file. The runs that go on forever are almost always this, and it reads like a model problem when it's a specification problem.

Define the shape of the report and the problem mostly evaporates. "Return each finding as file path, line number, and the token that should have been used" tells the agent what finished looks like. It can check its own work against the shape and see that the shape is full. That's a stopping condition, and it's the reason my token-auditor prompt spends more words on the output than on the audit. `maxTurns` exists as the blunt version, and it stops a runaway rather than fixing one: you get a partial result instead of a bounded one.

While you're defining the output, add a section asking for obstacles. Something like this, near the end of the system prompt:

```markdown
## Obstacles encountered

Report anything that got in your way: setup problems, workarounds you
found, commands that needed unusual flags, dependencies or imports that
caused trouble.
```

The reasoning is better than it first looks. A sub-agent hits a broken import, works out that the build needs a flag, solves it, finishes the actual task, reports on the actual task, and the fix dies with its context. Twenty minutes later the main thread hits the same broken import and solves it again from scratch. You paid twice for one piece of knowledge, and the only reason is that nobody asked for it. Ask.

## The failures worth knowing about

Expert personas buy nothing. "You are a senior Python engineer" adds tokens and no capability. Launching a sub-agent has real costs, the lost visibility and the cold start, and a persona pays none of them back. The overhead is only worth it when the sub-agent does something the main thread cannot: keeping exploratory work out of your window, or running under tools and permissions you deliberately narrowed.

Multi-step pipelines are more fragile than they look. The tempting one is reproduce the bug, then debug it, then fix it, three agents in a chain. It fails because each step depends on what the previous step discovered, and what crosses between them is a summary. The debugger gets a paragraph about a reproduction it never watched. The fixer gets a paragraph about reasoning it never followed. Pipelines work when the steps are genuinely independent, which a debugging chain is the exact opposite of.

And do not delegate test runs. When a test fails, the thing you need is the failure output: the assertion, the diff, the stack, the line. A sub-agent hands back "the auth tests failed" and a tidy summary of what it believes went wrong, and now you're writing a debug script to recover output you would have seen for free. This one is worth stating as a rule, because the temptation is real. Test output is verbose, verbose output looks exactly like the thing sub-agents are for, and it's the one kind of verbose output you actually wanted to read.

That's the test, in the end. Delegate the work whose intermediate state you don't want, and keep the work whose intermediate state is the answer.
