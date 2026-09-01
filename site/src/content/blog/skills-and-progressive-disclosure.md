---
title: 'A skill is a loading strategy with some knowledge attached'
description: 'A skill that is always in context is a memory file with extra steps. The engineering is in the description field and in everything you keep out of SKILL.md.'
category: ai-engineering
series: claude-code-in-practice
part: 6
publishDate: 2026-09-01
tags: ['claude-code', 'skills', 'plugins', 'context']
heroGlyph: book-open
---

For about a week I opened every session by pasting the same set of prose rules. No em dashes. Straight quotes only, sentence case headings, and never bold the label at the front of a bullet. Different task each time, same paste, because the writing that ships out of this project has a house style and nothing in the model knows it until I say so.

The obvious fix is to put them in `CLAUDE.md`, and it is the wrong fix. Those rules have nothing to say about a failing Terraform plan or a Lighthouse budget, and that is most of what I do in this repo. Memory files load into every conversation whether or not the conversation is about writing. Paying for a style guide while debugging a build is exactly the tax that [context is the budget](/blog/context-is-the-budget/) is about.

A skill is the same knowledge with a load condition attached. That condition is the entire product.

## The two-stage load

A skill is a directory with a `SKILL.md` inside it. Two places to put one:

```text
~/.claude/skills/<skill-name>/SKILL.md    every project on this machine
.claude/skills/<skill-name>/SKILL.md      this project only
```

The directory name is what you type to invoke it. `~/.claude/skills/humanize-writing/` gives you `/humanize-writing`, and if the same name exists at both levels the personal one wins.

Then the part that matters:

```text
  at startup       ┌───────────────────────────────────────┐
                   │  every skill's name + description     │ always
                   └──────────────────┬────────────────────┘
                                      │ description matches
                                      ▼
  on invoke        ┌───────────────────────────────────────┐
                   │  the SKILL.md body                    │ stays for
                   └──────────────────┬────────────────────┘ the session
                                      │ SKILL.md points at it
                                      ▼
  on need          ┌───────────────────────────────────────┐
                   │  references/*.md                      │ once
                   └───────────────────────────────────────┘

  never            scripts/*  ──▶  executed, only the output is read
```

Only the top row is unconditional. A listing of every skill's name and description sits in context from the first token of the session so the model knows what it has; the body arrives when something actually triggers it. That is the whole difference from a memory file, and it is why a twenty-file reference library costs you almost nothing until the day you need it.

Once a skill does load, its rendered content enters the conversation as one message and stays there across later turns. Claude Code does not re-read the file each turn, so every line in the body is a recurring cost for the rest of the session, not a one-off. Write standing instructions, not step-by-step narration you expect to be forgotten.

## The description is the product

Everything else in a skill is downstream of one string. The description is what the model matches your request against to decide whether to load the skill at all, so a description like "help me with docs" either never fires or fires on everything, and in both cases the knowledge inside is irrelevant.

A good one answers two questions in the same breath: what does this do, and when should it be used. Third person, because it gets injected into the system prompt and "I can help you with X" reads as the model talking to itself. Real keywords, the ones a person would actually say. The description on the skill I ended up writing for those prose rules runs to 921 characters and spends most of them on the second question. Abridged, because it does not fit here:

```yaml
description: Strips machine-written tells out of prose before a human
  reads it. Apply automatically to any prose drafted or edited for the
  user that they might publish, submit, or send, including emails, chat
  and Slack messages, blog posts, social captions, articles, docs and
  README prose, bios, cover letters, PR and commit descriptions, and
  academic work such as papers, theses, and literature reviews.
  Does not apply to code, tests, config, or data files.
```

That is not padding. Every noun in the second half is a trigger phrase, and the last sentence is a negative trigger that keeps it from firing on a `.tf` file.

The Agent Skills spec caps `description` at 1,024 characters and `name` at 64, lowercase letters, numbers and hyphens only. Claude Code adds a budget on top: the listing of names and descriptions gets a share of the context window (1% by default) and when it overflows, descriptions are dropped starting with the skills you invoke least. Names always survive; descriptions do not. So the failure mode of installing thirty skills is not that they stop existing, it is that the ones you rarely use silently lose the text that would have made them fire. `/doctor` estimates what the listing is costing you.

Two spelling traps while you are in the frontmatter, because the fields are not consistent with each other. Tool restrictions are hyphenated, `allowed-tools` and `disallowed-tools`. Extra trigger phrases go in `when_to_use`, with underscores. Everything is optional, including `name`, which for a personal or project skill is only a display label; get it wrong and the skill still loads under its directory name.

## Keep the body small and the rest on disk

The rule of thumb is under 500 lines for `SKILL.md`. Past that, split, and the split is the interesting part.

```text
~/.claude/skills/humanize-writing/
├── SKILL.md                 260 lines, the rules I always want
├── references/
│   ├── INDEX.md             routes to everything below
│   ├── academic-writing.md  loaded for a thesis, never for a tweet
│   ├── word-lists.md
│   └── ...21 more
└── scripts/
    └── mechanical-scan.sh   greps for em dashes and curly quotes
```

`SKILL.md` holds the instructions that apply every single time. Everything conditional goes into `references/`, and the trick that makes the structure work is one line of prose in the main file that names the condition:

```markdown
Academic work is in scope with overrides. For a paper, thesis chapter,
or literature review, read `references/academic-writing.md` first.
```

Without that line the reference file is dead weight on disk. With it, the model has a rule for when to spend the tokens. Keep those pointers one level deep: a reference that points at another reference tends to get skimmed with `head` rather than read, and you get half a file's worth of instructions with no error to tell you so.

Scripts are the part I did not expect. A script in a skill is executed, not read. Claude runs it through bash and consumes the output, and the source never enters context at all, so a 400-line Python converter and a two-line shell alias cost exactly the same until one of them runs. That inverts the usual advice. If a piece of your skill is deterministic, pushing it into `scripts/` is not just more reliable than prose instructions, it is cheaper than prose instructions, because prose you have to keep paying for and a script you pay for once per run.

## A skill is not a sub-agent

Both are ways to stop repeating yourself and they are not interchangeable. A skill joins the conversation you are already in: its instructions sit alongside your context and shape the work you are doing right now. A sub-agent gets its own window, does the work out of sight, and hands back a summary, which is a [context decision](/blog/sub-agents-are-a-context-decision/) rather than a knowledge one.

They compose in both directions. Put `context: fork` in a skill's frontmatter and the skill body becomes the prompt for a forked sub-agent. Going the other way, a custom sub-agent takes a `skills` list in its frontmatter, and the full content of each named skill is injected at startup. That field controls preloading, not permission: a sub-agent with no `skills` list can still discover and invoke your skills itself. If you want it to have none, take the `Skill` tool away.

## Plugins are how anyone else gets it

A skill in `.claude/skills/` is committed with the repo and everyone who clones it has it. A skill in `~/.claude/skills/` is yours alone, and telling a teammate to copy a directory is not distribution.

A plugin is a directory with a manifest and the components beside it:

```text
my-plugin/
├── .claude-plugin/
│   └── plugin.json        name, description, version
└── skills/
    └── pr-review/
        └── SKILL.md
```

Only `plugin.json` goes inside `.claude-plugin/`. Put `skills/` in there too and nothing loads, with no complaint. Test with `claude --plugin-dir ./my-plugin` before you ship anything, and run `claude plugin validate ./my-plugin` before you publish. Publishing means a marketplace: a git repository that lists plugins, added with `/plugin marketplace add <owner>/<repo>` and installed from with `/plugin install <name>@<marketplace>`. A private repo works fine for that, which is the usual answer for a team.

## When it will not fire

The first thing to check is the thing you wrote last, which is the description. Read it as a stranger and ask whether the words in it are the words you actually typed at the prompt. Nine times out of ten they are not: the skill says "quality assurance procedures" and you said "check my work".

The rest of the list is short. Ask "what skills are available" and confirm yours is listed at all. Invoke it by name with `/skill-name` to prove the body works, which separates a matching problem from a content problem. If the skill is somehow present but has no description attached to it, the frontmatter did not parse, and `claude --debug` prints the error; `claude plugin validate .claude/skills` will find that across a whole directory.

Then there is the case where the skill fires reliably and the model does something else anyway. No amount of description tuning fixes that one. You do not have a knowledge problem, you have an enforcement problem, and that is what [hooks](/blog/hooks-run-whether-the-model-agrees-or-not/) are for.

The trap in all of this is writing a skill that is really a memory file: a body so general it applies to everything, a description so broad it matches everything, loaded permanently for no reason. If the answer to "when should this load" is "always", you did not need a skill. Write the load condition first and the knowledge second, and the file mostly writes itself.
