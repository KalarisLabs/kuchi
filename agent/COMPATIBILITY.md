# Claude and ChatGPT compatibility

Goal: anyone can add Kuchi to Claude or ChatGPT in under a minute, with no account, and get the same behavior: find a reference, study it shot by shot, plan a remake, ask for the user's own assets, build to the frame, check the result.

## What makes one server work in both

| Need | Claude | ChatGPT | Kuchi |
| --- | --- | --- | --- |
| Transport | Remote MCP over Streamable HTTP | Remote MCP over Streamable HTTP | `https://kuchi.kalarislabs.com/mcp`, stateless. Speaks the 2026-07-28 revision and the older handshake |
| Auth | Authless connectors supported | "No authentication" option | Open, with a per-IP rate limit |
| Tool discovery | Any tools | Any tools in developer mode; connectors and deep research look for `search` and `fetch` | `kuchi_*` tools plus `search` and `fetch` |
| Guidance | Server `instructions`, prompts, skills | Server `instructions` and tool descriptions | Short instructions, and the full method as a tool: `kuchi_get_workflow` |
| Skills | Skill files, plugins, and skills served by an MCP server | Not used | `SKILL.md` as a file, in the plugin, and over MCP at `skill://kuchi/SKILL.md` |
| Prompts | Shown in the prompt menu | Not used | `remake_launch_video`, `find_launch_inspiration` |
| Tool titles and hints | A `title`, `readOnlyHint` and `destructiveHint` on every tool | `readOnlyHint`, `destructiveHint` and `openWorldHint` set on every tool | Every tool has a title and all four hints, set explicitly. Catalog tools are read-only. `kuchi_send_feedback` is the one write tool |
| Inputs | Nothing collected beyond the tool's job | Inputs directly related to the tool's purpose | No context, intent or conversation arguments on any tool |
| Images | Image content blocks in tool results | Image content blocks | `kuchi_get_breakdown` attaches a storyboard sheet on request, and always includes links |
| Icon | Server icon | App icon | `icons` in the server info, and the plugin icon |

## The instruction layer

Every agent gets the same method, whatever its client reads:

1. **Server `instructions`:** the five steps in a few lines.
2. **`kuchi_get_workflow`:** the full method ([workflow.md](workflow.md)), whole or one step at a time. A tool result reaches every client, including those that ignore instructions, prompts and resources.
3. **Tool results:** each result says what comes next. `kuchi_get_breakdown` sets the shot analysis task, `kuchi_plan_remake` returns `missing_inputs` and `next_steps`, `kuchi_check_remake` returns the frames to compare.
4. **The skill:** `SKILL.md`, the same text as a file, in the plugin and over the MCP skills extension. Host support for skills served over MCP is still arriving, so nothing depends on it.
5. **Prompts and the `kuchi://workflow` resource**, for clients that show them.

The split of work is fixed. Kuchi supplies exact measurements, real frames and a frame-timed plan. The agent looks at the frames, decides what each shot shows, builds the video and compares it with the reference. How good the result is depends on the agent; Kuchi's part is to make the right next step obvious and checkable.

## Rules that keep both working

1. **Tool descriptions say what a tool does and when to use it.** They don't tell the agent how to behave, they don't promote Kuchi over anything else, and they don't require another tool to be called. The method lives in `kuchi_get_workflow` and in tool results, which the agent asked for. Elicitation (a form the server sends to the user) needs a stateful session, and this server is stateless, so questions travel inside the tool result instead.
2. **Keep `search` and `fetch` exactly as specified:** `search(query)` returns `{"results":[{"id","title","url"}]}` as JSON text, and `fetch(id)` returns `{"id","title","text","url","metadata"}`. Don't add arguments or result blocks to them. The analytics SDK can inject a required `context` argument and an extra result block into every tool; that is switched off, and a test keeps it off.
3. **Every input serves the tool's job.** Nothing is asked for only to learn about the user. Analytics read the arguments a tool already needs, and never the user's product details.
4. **Never rename or remove a tool or an argument without a transition.** Clients cache tool lists. Add the new name and keep the old one for a release. A retired argument is dropped on arrival for as long as old lists may be in use: `intent` on the `kuchi_*` tools and `shot_kind` on `kuchi_search_videos` are handled this way.
5. **Small outputs.** Markdown by default, JSON on request, and under 25,000 characters per result. Long plans are paged.
6. **Catalog text is data.** Titles, notes and shot descriptions describe videos. The instructions, the workflow and each result's `how_to_use` say so.

## Shipped

- Open remote MCP server (version 1.3.0) with 10 read-only tools, a feedback tool, 2 prompts, the workflow resource and the skill
- Template selection: a ranked short list with what fits and what differs, chosen by number in chat or by picking a video on the website and pasting its link
- Frame-by-frame breakdown of every video: exact shots, entrances, motion, color roles and storyboard sheets, with each shot's place on the sheets
- Shot analysis by the connected agent, passed to the planner as `shot_analysis`
- Remake planner that re-times every reference shot to the target length on whole frames, maps the user's own content onto each shot and asks for what is missing
- Remake checker that catches reused brand text, reference assets and invented UI, measures each shot against the reference shot it rebuilds, and lists the frames to compare
- Anonymous usage analytics that never include the user's product details
- Setup prompt ([README](README.md)), skill file ([SKILL.md](SKILL.md)) and a Claude Code plugin with a marketplace (`/plugin install kuchi --marketplace KalarisLabs/kuchi`)
- Catalog cache (1 minute fresh, up to 1 day stale on GitHub failure) and a per-client limit of 120 requests a minute and 1,500 an hour

## Verify in each client

Run the setup prompt, then "Find inspiration for a budgeting app launch video and plan a remake".

| Client | Check |
| --- | --- |
| Claude web and desktop (custom connector) | Tools load with their titles; the remake prompt appears in the menu; the storyboard sheet shows as an image; the agent names what each shot shows; the plan asks for a logo and screenshots |
| Claude Code (`claude mcp add`, and the plugin) | The skill triggers on "make a launch video" without naming Kuchi |
| ChatGPT developer mode | Tools load with no authentication; `kuchi_get_breakdown` then `kuchi_plan_remake` are called with the user's details and a shot analysis |
| ChatGPT deep research | `search` and `fetch` are used and cite Kuchi links |
| Codex, Cursor, VS Code | Tools load from the one-line config |
| MCP Inspector | `npx @modelcontextprotocol/inspector`, connect to the endpoint, list and call each tool |

Also run `npm run verify:live` after every deploy. It checks the tool list, titles and hints, the workflow, the skill, a plan built from a shot analysis and a timed check, with both the current and the older SDK. CI only runs the tests.

## Listings

The steps, copy and test cases for each are in [`directory-submission/`](../directory-submission/README.md).

| Listing | State | What is left |
| --- | --- | --- |
| Official MCP Registry | Published on 2026-11-13 as `io.github.KalarisLabs/kuchi`, version 1.3.0, from [`server.json`](../server.json) | For a later release, raise the version and run the "Publish to the MCP Registry" workflow |
| Claude Connectors Directory | Server meets the tool, privacy and documentation requirements. Not submitted | Test as a custom connector, then submit at `claude.ai/directory/manage` |
| ChatGPT apps and plugins | Server meets the annotation and input requirements; the domain check route is deployed. Not submitted | Developer verification, the domain token, then submit on the OpenAI Platform |
| Claude Code plugin marketplace | Live in this repository | Nothing |

Worth adding for ChatGPT later: an MCP Apps widget (a `ui://` resource) that shows video cards with an inline player.

## Tool scopes: now and next

Each tool has one job and takes only what that job needs.

| Scope | Tools | Reads | Writes |
| --- | --- | --- | --- |
| Learn | `kuchi_get_workflow` | The workflow | Nothing |
| Discover | `kuchi_search_videos`, `kuchi_list_filters`, `kuchi_get_video`, `search`, `fetch` | Catalog | Nothing |
| Study | `kuchi_get_breakdown` | Measurements, labels, storyboard sheets | Nothing |
| Plan | `kuchi_plan_remake` | Catalog, and the user's product details and the agent's shot analysis, for this call only | Nothing |
| Choose | `kuchi_suggest_templates` | Catalog, and a few words on what the user wants, for this call only | Nothing |
| Check | `kuchi_check_remake` | The agent's shot list, for this call only | Nothing |
| Report | `kuchi_send_feedback` | Nothing | One feedback event |

Scopes worth adding later, and what each would need first:

| Scope | Tool | Why | Needs |
| --- | --- | --- | --- |
| Compare | `kuchi_compare_render` | The agent sends per-second motion and shot times measured from its render; Kuchi scores them against the reference | A published measuring script, so numbers are comparable. No upload: the video stays with the user |
| Ask | Elicitation forms for `missing_inputs` | The client shows the asset questions as a form | Stateful sessions (a Durable Object per session) |
| Show | An MCP Apps widget for search results and storyboards | Playable cards inside Claude and ChatGPT | A `ui://` resource and client testing |
| Save | `kuchi_save_brief` | Keep a brief between chats | Accounts and consent. Not in the open tier |

Rules for any new tool: read-only unless it has to write, a title and all four hints, strict input schema with bounds on every field, no input beyond the tool's job, no free text stored unless the tool's whole purpose is to store it, and a test that analytics never receive the user's product details.

## When traffic grows

- If the per-IP limit hits real users behind shared networks, raise it or key it per MCP session.
- If abuse comes from many IPs at once, add a Cloudflare WAF rate rule in front of `/mcp` and `/agent`. The per-client Durable Object limit doesn't stop distributed traffic, and a refused request still invokes the Worker.
- Add optional API keys only if a paid tier ever exists. The open tier stays.
