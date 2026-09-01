---
title: 'MCP servers are capabilities, not knowledge'
description: 'A server gives Claude something new to do, not something new to know. Which is why adding one never fixes a model that keeps forgetting your conventions.'
category: ai-engineering
series: claude-code-in-practice
part: 3
publishDate: 2026-08-28
tags: ['claude-code', 'mcp', 'tooling', 'playwright']
heroGlyph: server
---

For most of a week I kept telling Claude that every colour in this site lives in `tokens.css` and nowhere else, and it kept writing `#0f1115` into component files anyway. Somewhere in that week I caught myself scrolling a list of MCP servers looking for the one that would fix it.

There isn't one. There cannot be one. Working out why is most of what you need to know about MCP.

## A client, a server, and a list of tools

Claude Code is an MCP client. A server is a separate thing that speaks the protocol: either a process on your machine that the client launches and talks to over stdin and stdout, or an endpoint it talks to over HTTP. Four transports are supported. `stdio` for local processes, `http` for remote servers, `sse` for remote servers using server-sent events (deprecated, use HTTP where it exists), and `ws` for a persistent WebSocket, which you can only configure as JSON because `claude mcp add --transport` doesn't accept it.

Adding one is a line of shell:

```bash
claude mcp add --transport stdio playwright -- npx @playwright/mcp@latest
claude mcp add --transport http context7 https://mcp.context7.com/mcp
```

At session start the client connects to each configured server and asks what it offers. What comes back is a tool list: names, descriptions, and JSON input schemas.

```text
  Claude Code = the MCP client
       │
       ├── stdio ──▶ playwright     npx, local child process
       ├── http  ──▶ aws-knowledge  knowledge-mcp.global.api.aws
       └── http  ──▶ context7       mcp.context7.com/mcp
                            │
                    tool list at session start
                            ▼
  ┌────────────────── context window ──────────────────┐
  │ system prompt · built-in tools · CLAUDE.md · files │
  │ ·················································· │
  │ MCP tool names       definitions fetched on demand │
  └────────────────────────────────────────────────────┘
```

Nothing in that exchange is knowledge. `browser_navigate` arrives as a name, a sentence of description, and a schema saying it wants a URL. That is a function signature plus a way to call it across a process boundary. The model still decides when to call it, and everything it knows about my project it knows from my files.

So a server is the right answer to "Claude cannot open a browser" and the wrong answer to "Claude keeps forgetting our conventions". The second problem is a file that gets read, or an event that fires whether the model agrees or not. It is never a new tool.

## Scope is the decision people skip

Three scopes, and the difference between them is who else gets the server.

Local is the default. The server goes into `~/.claude.json` under the entry for the current project's path, so it loads in that project and nowhere else, and stays private to you. Project scope writes `.mcp.json` at the repository root, which is the only scope that travels with a clone. User scope also lives in `~/.claude.json`, at the top level, and loads in every project on your machine.

When the same server name is defined in more than one place, precedence runs local, then project, then user, then plugin-provided servers, then claude.ai connectors. The whole entry from the winning source is used. Fields are not merged across scopes, which is worth knowing before you try to override one URL from a shared config and quietly lose the rest of the entry.

Commit the project file. This repo's is three servers and no secrets:

```json
{
  "mcpServers": {
    "playwright": {
      "command": "npx",
      "args": ["@playwright/mcp@latest"]
    },
    "aws-knowledge": {
      "type": "http",
      "url": "https://knowledge-mcp.global.api.aws"
    },
    "context7": {
      "type": "http",
      "url": "https://mcp.context7.com/mcp"
    }
  }
}
```

That file is the difference between "here is how I verify a rendering change" and "here is how I verify a rendering change, and it works on your machine too". A local-scoped server is a thing you have to describe to a teammate in Slack.

The safety catch is that a repository cannot approve its own servers. Claude Code prompts before it will use anything from `.mcp.json`, because otherwise cloning a repo would be enough to run a command from it. Approve one and the choice lands in your untracked `.claude/settings.local.json` under `enabledMcpjsonServers`, which is where mine still is, three names and nothing else in the file. `claude mcp reset-project-choices` throws those choices away.

The same key can go in the tracked file, which is what this repo does:

```json
{
  "enabledMcpjsonServers": ["playwright", "aws-knowledge", "context7"]
}
```

That copy lives in `.claude/settings.json`, committed, and it still doesn't skip the gate. A committed approval is ignored in a folder nobody has trusted yet, so a fresh clone shows the servers as pending until someone runs `claude` there and accepts the workspace trust dialog. After that, the approval is already made and no one has to think about it again. That is the right shape: one human decision per checkout, not one per server per person.

## Allowing a whole server is a decision, not a shortcut

MCP tools are namespaced `mcp__<server>__<tool>`, so Playwright's navigate tool is `mcp__playwright__browser_navigate`. Permission rules use the same names, and how much of the name you write is the whole question.

A bare `mcp__playwright` matches every tool the server provides. So does `mcp__playwright__*`. A full name matches exactly one tool. Wildcards in an allow rule only work after a literal `mcp__<server>__` prefix, so the server segment has to be spelled out; an unanchored allow glob like `"*"` or `"mcp__*"` is skipped with a warning and approves nothing. Deny and ask rules are looser and take a bare `mcp__*`, and a deny that matches by glob removes those tools from Claude's context entirely rather than just refusing the call. MCP rules also take no parentheses, so you cannot match on an argument. Write one anyway and it is dropped at load time and reported in the invalid-settings dialog and in `claude doctor` output, which is the kind of failure you can stare past for a week.

So the shape of a rule I would write for a browser:

```json
{
  "permissions": {
    "allow": [
      "mcp__playwright__browser_navigate",
      "mcp__playwright__browser_take_screenshot",
      "mcp__playwright__browser_snapshot"
    ]
  }
}
```

Three tools, named, all of them read-shaped. Navigating and screenshotting a localhost build is not a decision I want to re-approve forty times an hour. The version that saves more typing is `"mcp__playwright"` on its own, and that one also hands over `browser_run_code_unsafe`, which does exactly what the name promises.

The reason to bother is that the allow-list is where blast radius is actually set. Take the GitHub server, which authenticates with a fine-grained personal access token you generate yourself. Put `mcp__github` in `allow` and you have said yes, in advance, to every tool it exposes, including the ones that open pull requests and file issues. Claude will use them correctly almost every time. The failure case is not a model that turns on you, it's a model that misreads a sentence and opens a PR against the wrong repository at two in the afternoon, and the token you minted decided how far that goes.

Scope the token to the repositories you meant. Name the tools you meant. "Proceed with caution" is not a setting.

One asymmetry to know: allow rules in the shared project settings file wait for workspace trust before they apply, while `deny` and `ask` rules apply immediately. Restrictions you commit take effect on a fresh clone. Permissions you commit do not, until someone says yes.

## What a connected server costs

It used to be that every tool definition from every server sat in the window before you typed anything, and a chatty server with forty tools was a tax you paid on the first message of every session. That is now the opt-out rather than the default. Tool search is on by default: only tool names and each server's instructions load at session start, and the full definitions are fetched when Claude decides it needs them. Descriptions and server instructions are truncated at 2KB each, so a server author who buries the important sentence at the bottom loses it.

You can change the trade. `ENABLE_TOOL_SEARCH=false` puts everything back upfront. `auto` loads definitions upfront while they stay under 10% of the context window and defers them all past that line, and `auto:5` moves the line to 5%. A single server can opt out with `"alwaysLoad": true` in its config entry, which also makes startup wait for that server's tool list, capped at the five second connect timeout. Worth it for two tools Claude needs on every turn. Not worth it for a server you touch twice a week.

The cost that still bites is output, not definitions. Claude Code warns when a single MCP tool result exceeds 10,000 tokens and truncates at 25,000 by default, with `MAX_MCP_OUTPUT_TOKENS` to raise the ceiling. One call to a documentation server that returns a whole page is a larger context event than the entire tool list it came from. Everything in [part one about context being a budget](/blog/context-is-the-budget/) applies here, except the spending decision is being made by a process you did not write.

## The one that earned its place

Playwright is the server on this project I would fight to keep, and it is the clearest case of a capability I cannot fake with a shell.

The site is visual. Claude cannot see it. Left alone, it writes a component, reads the file back, and tells me the layout is correct, which is an assertion about source code dressed up as an observation about a page. With the browser attached, the loop closes: build, serve the output, navigate, take a screenshot, look at what actually rendered, then change the code. The repo's own `CLAUDE.md` puts it more bluntly than I would, that screenshots are the only way to verify rendering rather than assume it.

It comes with a real constraint. The Playwright server cannot open `file://` URLs, so the freshly built `dist/` directory sitting on disk is unreachable. Something has to serve it first:

```bash
npm run build && npx astro check
npx serve dist
```

Then navigate to localhost and start looking. The checklist that follows is boring on purpose: screenshot the affected routes, toggle the theme and screenshot again because this site ships dark and light and a token fix in one can break contrast in the other, then re-run with reduced motion emulated and confirm the animation genuinely stopped rather than got faster.

None of that is knowledge Claude gained. It is a feedback signal it could not previously obtain, which is a different thing, and it changes what the model is able to be wrong about. Before, it could be wrong about the rendered page and never find out. Now it finds out in the same turn.

That is the test I run before adding anything now. Finish the sentence "Claude cannot do this with a shell and a filesystem." If the sentence won't finish, what I wanted was for the model to remember something, and remembering is a file or an event, not a tool. The hex literals were the second one. No server was ever going to catch them, because catching them means running a grep on a file the instant it is written, which is a [hook](/blog/hooks-run-whether-the-model-agrees-or-not/), and a hook does not need the model's cooperation.
