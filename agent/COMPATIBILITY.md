# Claude and ChatGPT compatibility plan

Goal: anyone can add Kuchi to Claude or ChatGPT in under a minute, with no account, and get the same behavior: find a reference, plan a remake, ask for the user's own assets.

## What makes one server work in both

| Need | Claude | ChatGPT | Kuchi |
| --- | --- | --- | --- |
| Transport | Remote MCP over Streamable HTTP | Remote MCP over Streamable HTTP | `https://kuchi.kalarislabs.com/mcp`, stateless |
| Auth | Authless connectors supported | "No authentication" option | Open, with a per-IP rate limit |
| Tool discovery | Any tools | Any tools in developer mode; connectors and deep research look for `search` and `fetch` | `kuchi_*` tools plus `search` and `fetch` |
| Guidance | Server `instructions`, prompts, skills | Server `instructions` and tool descriptions | Short instructions; each tool description stands alone |
| Prompts | Shown in the prompt menu | Not used | `remake_launch_video`, `find_launch_inspiration` |
| Safety hints | Tool annotations; read-only tools need less confirmation | Tool annotations | All tools `readOnlyHint: true`, `destructiveHint: false` |

Rules that keep both working:

1. **Tool descriptions carry the workflow.** ChatGPT doesn't use prompts, and some clients ignore `instructions`. Each tool says when to use it and what to call next. `kuchi_plan_remake` returns `missing_inputs` and `next_steps`, so the agent asks for assets even with no skill installed.
2. **Keep `search` and `fetch` exactly as specified:** `search(query)` returns `{"results":[{"id","title","url"}]}` as JSON text, and `fetch(id)` returns `{"id","title","text","url","metadata"}`. Don't add required arguments to them.
3. **Never rename a tool without a transition.** Clients cache tool lists. Add the new name, keep the old one for a release, then remove it.
4. **Small outputs.** Markdown by default, JSON on request, and under 25,000 characters per result.

## Phase 1: shipped

- Open remote MCP server with 6 read-only tools, 2 prompts and 1 resource
- Remake planner that separates what to borrow from what the user must supply
- Setup prompt ([README](README.md)), skill file ([SKILL.md](SKILL.md)) and a Claude Code plugin with a marketplace (`/plugin install kuchi --marketplace KalarisLabs/kuchi`)
- Catalog cache (1 minute fresh, up to 1 day stale on GitHub failure) and a 120 requests/minute per-IP limit

## Phase 2: verify in each client

Run the setup prompt, then "Find inspiration for a budgeting app launch video and plan a remake". Record the result for each client in `agent-service/verification/clients.md`.

| Client | Check |
| --- | --- |
| Claude web and desktop (custom connector) | Tools load; the remake prompt appears in the menu; the plan asks for a logo and screenshots |
| Claude Code (`claude mcp add`, and the plugin) | The skill triggers on "make a launch video" without naming Kuchi |
| ChatGPT developer mode | Tools load with no authentication; `kuchi_plan_remake` is called with the user's details |
| ChatGPT deep research | `search` and `fetch` are used and cite Kuchi links |
| Codex, Cursor, VS Code | Tools load from the one-line config |

Also run `npm run verify:live` after every deploy. CI's smoke test only checks health.

## Phase 3: listings

1. **Anthropic connector directory.** Needs a public privacy policy (done), support contact (done), accurate tool annotations (done) and a review case list. The listing copy is ready in [`directory-submission/`](../directory-submission/README.md).
2. **OpenAI app directory.** Submit through the OpenAI platform with the same endpoint. Consider an Apps SDK widget (a `ui://` resource template) that renders video cards with an inline player in ChatGPT; this is the biggest UX gain there.
3. **MCP Registry.** Publish a `server.json` for `https://kuchi.kalarislabs.com/mcp` so clients that browse the registry can find it.
4. **Claude skill upload.** Package `agent/SKILL.md` as a zip for people who add skills in Claude's settings rather than through a plugin.

## Phase 4: when traffic grows

- If the per-IP limit hits real users behind shared networks, raise it or key it per MCP session.
- If abuse comes from many IPs at once, add a Cloudflare WAF rate rule in front of `/mcp`. The per-IP Durable Object limit doesn't stop distributed traffic.
- Add optional API keys only if a paid tier ever exists. The open tier stays.
