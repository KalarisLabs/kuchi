# Claude and ChatGPT compatibility plan

Goal: anyone can add Kuchi to Claude or ChatGPT in under a minute, with no account, and get the same behavior: find a reference, study it shot by shot, plan a remake, ask for the user's own assets, check the result.

## What makes one server work in both

| Need | Claude | ChatGPT | Kuchi |
| --- | --- | --- | --- |
| Transport | Remote MCP over Streamable HTTP | Remote MCP over Streamable HTTP | `https://kuchi.kalarislabs.com/mcp`, stateless |
| Auth | Authless connectors supported | "No authentication" option | Open, with a per-IP rate limit |
| Tool discovery | Any tools | Any tools in developer mode; connectors and deep research look for `search` and `fetch` | `kuchi_*` tools plus `search` and `fetch` |
| Guidance | Server `instructions`, prompts, skills | Server `instructions` and tool descriptions | Short instructions; each tool description stands alone |
| Prompts | Shown in the prompt menu | Not used | `remake_launch_video`, `find_launch_inspiration` |
| Safety hints | Tool annotations; read-only tools need less confirmation | Tool annotations | Catalog tools are `readOnlyHint: true`, `destructiveHint: false`. `kuchi_send_feedback` is the one write tool |
| Images | Image content blocks in tool results | Image content blocks | `kuchi_get_breakdown` attaches a storyboard sheet on request, and always includes links |

Rules that keep both working:

1. **Tool descriptions carry the workflow.** ChatGPT doesn't use prompts, and some clients ignore `instructions`. Each tool says when to use it and what to call next. `kuchi_plan_remake` returns `missing_inputs` and `next_steps`, so the agent asks for assets even with no skill installed. Elicitation (a form the server sends to the user) needs a stateful session, and this server is stateless, so questions travel inside the tool result instead.
2. **Keep `search` and `fetch` exactly as specified:** `search(query)` returns `{"results":[{"id","title","url"}]}` as JSON text, and `fetch(id)` returns `{"id","title","text","url","metadata"}`. Don't add arguments or result blocks to them. The analytics SDK can inject a required `context` argument and an extra result block into every tool; that is switched off, and a test keeps it off.
3. **Never rename a tool without a transition.** Clients cache tool lists. Add the new name, keep the old one for a release, then remove it.
4. **Small outputs.** Markdown by default, JSON on request, and under 25,000 characters per result.

## Phase 1: shipped

- Open remote MCP server with 8 read-only tools, a feedback tool, 2 prompts and 1 resource
- Frame-by-frame breakdown of every video: exact shots, entrances, motion, color roles and storyboard sheets
- Remake planner that maps the reference's real shots onto the user's own content and asks for what is missing
- Remake checker that catches reused brand text, reference assets and invented UI before delivery
- Anonymous usage analytics that never include the user's product details
- Setup prompt ([README](README.md)), skill file ([SKILL.md](SKILL.md)) and a Claude Code plugin with a marketplace (`/plugin install kuchi --marketplace KalarisLabs/kuchi`)
- Catalog cache (1 minute fresh, up to 1 day stale on GitHub failure) and a per-client limit of 120 requests a minute and 1,500 an hour

## Phase 2: verify in each client

Run the setup prompt, then "Find inspiration for a budgeting app launch video and plan a remake". Record the result for each client in `agent-service/verification/clients.md`.

| Client | Check |
| --- | --- |
| Claude web and desktop (custom connector) | Tools load; the remake prompt appears in the menu; the storyboard sheet shows as an image; the plan asks for a logo and screenshots |
| Claude Code (`claude mcp add`, and the plugin) | The skill triggers on "make a launch video" without naming Kuchi |
| ChatGPT developer mode | Tools load with no authentication; `kuchi_get_breakdown` then `kuchi_plan_remake` are called with the user's details |
| ChatGPT deep research | `search` and `fetch` are used and cite Kuchi links |
| Codex, Cursor, VS Code | Tools load from the one-line config |

Also run `npm run verify:live` after every deploy. CI's smoke test only checks health.

## Phase 3: listings

1. **Anthropic connector directory.** Needs a public privacy policy (done), support contact (done), accurate tool annotations (done) and a review case list. The listing copy is ready in [`directory-submission/`](../directory-submission/README.md).
2. **OpenAI app directory.** Submit through the OpenAI platform with the same endpoint. Consider an Apps SDK widget (a `ui://` resource template) that renders video cards with an inline player in ChatGPT; this is the biggest UX gain there.
3. **MCP Registry.** Publish a `server.json` for `https://kuchi.kalarislabs.com/mcp` so clients that browse the registry can find it.
4. **Claude skill upload.** Package `agent/SKILL.md` as a zip for people who add skills in Claude's settings rather than through a plugin.

## Tool scopes: now and next

Each tool has one job and takes only what that job needs.

| Scope | Tools | Reads | Writes |
| --- | --- | --- | --- |
| Discover | `kuchi_search_videos`, `kuchi_list_filters`, `kuchi_get_video`, `search`, `fetch` | Catalog | Nothing |
| Study | `kuchi_get_breakdown` | Measurements, labels, storyboard sheets | Nothing |
| Plan | `kuchi_plan_remake` | Catalog and the user's product details, for this call only | Nothing |
| Check | `kuchi_check_remake` | The agent's shot list, for this call only | Nothing |
| Report | `kuchi_send_feedback` | Nothing | One feedback event |

Scopes worth adding later, and what each would need first:

| Scope | Tool | Why | Needs |
| --- | --- | --- | --- |
| Compare | `kuchi_compare_render` | The agent sends per-second motion and shot times measured from its render; Kuchi scores them against the reference | A published measuring script, so numbers are comparable. No upload: the video stays with the user |
| Ask | Elicitation forms for `missing_inputs` | The client shows the asset questions as a form | Stateful sessions (a Durable Object per session) |
| Show | An MCP Apps widget for search results and storyboards | Playable cards inside Claude and ChatGPT | A `ui://` resource and client testing |
| Save | `kuchi_save_brief` | Keep a brief between chats | Accounts and consent. Not in the open tier |

Rules for any new tool: read-only unless it has to write, strict input schema with bounds on every field, no free text stored unless the tool's whole purpose is to store it, and a test that analytics never receive the user's product details.

## Phase 4: when traffic grows

- If the per-IP limit hits real users behind shared networks, raise it or key it per MCP session.
- If abuse comes from many IPs at once, add a Cloudflare WAF rate rule in front of `/mcp` and `/agent`. The per-client Durable Object limit doesn't stop distributed traffic, and a refused request still invokes the Worker.
- Add optional API keys only if a paid tier ever exists. The open tier stays.
