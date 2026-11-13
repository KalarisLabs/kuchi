# Connect your agent to Kuchi

Kuchi is a library of real product-launch videos to use as **inspiration templates**. Every video is measured frame by frame. Kuchi measures and plans; your agent does the seeing and the building. It finds a reference, reads what each shot shows from the storyboard frames, plans a remake for your product to the frame, and checks its own work against the reference before delivering. The reference supplies motion and taste (timing, transitions, layout, color balance); your product, assets and copy supply everything on screen.

**MCP server:** `https://kuchi.kalarislabs.com/mcp` (Streamable HTTP, read-only, no sign-in or token)

## Setup prompt

Paste this into any agent that can add MCP servers:

```text
Connect the Kuchi MCP server at https://kuchi.kalarislabs.com/mcp (Streamable HTTP, no sign-in) and confirm it works by listing its tools.

Kuchi is a library of real product-launch videos to use as inspiration templates. When I want a launch video, read kuchi_get_workflow and follow it: find references with kuchi_search_videos and show me their posters and links. Once I pick one, study it with kuchi_get_breakdown, look at its storyboard and note what each shot shows, then call kuchi_plan_remake with my product details and your shot analysis, and ask me for my logo, screenshots and anything else it lists as missing. Build to the blueprint's frames. Before you deliver, run kuchi_check_remake and compare your frames with the reference. Copy only the reference's motion and taste; everything on screen comes from my product.
```

## Per client

| Client | Setup |
| --- | --- |
| Claude (web, desktop) | Settings → Connectors → **Add custom connector**. Name `Kuchi`, URL above, no authentication. Or open [this prefilled link](https://kuchi.kalarislabs.com/agent/connect/claude). |
| Claude Code | `claude mcp add --transport http kuchi https://kuchi.kalarislabs.com/mcp`, or install the plugin (MCP + skill): `/plugin install kuchi --marketplace KalarisLabs/kuchi` |
| ChatGPT | Turn on developer mode, then add a custom MCP app: name `Kuchi`, URL above, **No authentication**. Deep research uses the `search` and `fetch` tools. |
| Codex CLI | `codex mcp add kuchi --url https://kuchi.kalarislabs.com/mcp` |
| Cursor | Add `{"mcpServers":{"kuchi":{"url":"https://kuchi.kalarislabs.com/mcp"}}}` to `.cursor/mcp.json` |
| VS Code | MCP: Add Server → HTTP → URL above |
| Gemini CLI | Add `{"mcpServers":{"kuchi":{"httpUrl":"https://kuchi.kalarislabs.com/mcp"}}}` to `~/.gemini/settings.json` |
| Anything else | Use the URL above as a remote MCP server, or send the setup prompt |

## One set of instructions for every agent

Every agent that connects gets the same method, whichever way it arrives:

| Where | What it carries |
| --- | --- |
| Server instructions (sent when a client connects) | The five steps in brief |
| `kuchi_get_workflow` tool | The full method ([workflow.md](workflow.md)), whole or one step at a time. Works in every client, including those that ignore instructions, prompts and resources |
| Each tool result | What to do next: `missing_inputs`, `next_steps`, the shot analysis task, the frames to compare |
| [`SKILL.md`](SKILL.md) | When to use Kuchi and the five steps. Install it as a file, get it with the [plugin](../plugin/launch-archive), read it at https://kuchi.kalarislabs.com/agent/SKILL.md, or load it over MCP as `skill://kuchi/SKILL.md` (the MCP skills extension) |
| Prompts and the `kuchi://workflow` resource | The same text for clients that show prompt menus and resources |

The split of work is fixed. Kuchi supplies exact measurements, real frames and a frame-timed plan. The agent looks at the frames, decides what each shot shows, builds the video and compares it with the reference. To install the skill by hand, copy `SKILL.md` into your agent's skills folder (for example `.claude/skills/kuchi/SKILL.md`).

## Tools

| Tool | What it does |
| --- | --- |
| `kuchi_get_workflow` | The remake method: how to pick a reference, analyse each shot from the storyboard, ask for assets, match timing to the frame and check the result. Whole, or one step (`find`, `study`, `plan`, `build`, `check`). |
| `kuchi_search_videos` | Search by keywords, style, category, format, aspect ratio, length, pace or theme. Paginated (`limit`, `offset`). |
| `kuchi_get_video` | One video by id, slug, Kuchi link or X URL: video file, poster, storyboard sheet, length, size, measured rhythm, notes on its motion. |
| `kuchi_list_filters` | Every style, category, format, aspect ratio, pace and theme, with counts, plus the 14 shot kinds used when analysing a storyboard. |
| `kuchi_get_breakdown` | The frame-by-frame measurement of one video: every shot with its exact start and end, how it enters, how much moves, its colors, and storyboard sheets of real frames (attached as an image on request). Each shot says where its frame is on the sheets, and the result sets the analysis task: the kind of each shot and what it shows. |
| `kuchi_plan_remake` | Takes the user's product details and assets, and the agent's `shot_analysis`. Returns what to borrow, a blueprint that re-times every reference shot to the target length on whole frames (`start_frame`, `end_frame` at the chosen `fps`) with the user's content in each shot, the rules, and `missing_inputs`: what to ask the user before building. Long references are paged, never thinned. |
| `kuchi_check_remake` | Takes the agent's shot list before delivery. Flags reused brand words, assets taken from the reference, invented logos or UI, placeholders and gaps. With each shot's `reference_shot`, it also measures the shot's length and entrance against the reference shot it rebuilds, and returns `compare_frames`: the times in both videos that show the same moment. |
| `kuchi_send_feedback` | Lets an agent report a failure, a confusing result or a missing capability to Kuchi's maintainers. |
| `search`, `fetch` | The two tools ChatGPT's connectors and deep research look for. Same catalog. |

Every catalog tool is read-only. `kuchi_send_feedback` is the one tool that records what the agent writes. Text output is Markdown by default; pass `response_format: "json"` for structured data. Every argument serves the tool's own job; none exists only to collect context.

**Prompts:** `remake_launch_video` (product name, optional reference) and `find_launch_inspiration` (product, optional vibe). In Claude they appear in the prompt menu.

**Resources:** `kuchi://workflow`, the full workflow ([workflow.md](workflow.md)), and `skill://kuchi/SKILL.md`, the skill.

Without MCP, the same data is at https://kuchi.kalarislabs.com/agent/catalog.json, https://kuchi.kalarislabs.com/agent/breakdowns/<id>.json and https://kuchi.kalarislabs.com/agent/workflow.md.

## Limits

- 120 requests a minute and 1,500 an hour per IP, shared by the MCP server and the `/agent` routes. Counts are exact (a Durable Object per client) and survive the object going idle: they are saved every 10 requests and deleted after about an hour without requests. IPv6 clients are counted per /64 network, so rotating addresses doesn't reset the count. Over the limit you get HTTP 429 with `Retry-After` set to the seconds until a slot frees. The website and video files are not limited.
- Every JSON-RPC message counts as one request. One HTTP request may carry at most 10 messages.
- MCP request bodies are capped at 64 KiB.
- Tool inputs are validated strictly: unknown arguments are rejected, and every string, list and number has a bound. Two arguments that older versions advertised (`intent`, and `shot_kind` on search) are dropped without an error, because clients can keep an old tool list for a long time.
- The catalog refreshes from this repository's `main` branch at most once a minute. If GitHub is unreachable, the last good copy keeps serving for up to a day.

## Updating the library

Merge changes to `main`: videos in `data/videos.json` (see [CURATOR.md](CURATOR.md)), their measurements in `data/breakdowns.json`, optional reviewed shot labels in `data/shot_labels.json`, formats in `agent/manifest.json`, the workflow in `agent/workflow.md`. Connected agents see them within a minute, with no reinstall. Changing tools, the skill text or server instructions needs a Worker deploy (`.github/workflows/deploy.yml` does it on push).

## Development

```bash
cd agent-service
npm ci
npm test              # tools, workflow, skill, breakdowns, remake planning and checking, analytics privacy, caching, rate limit
npm run dev           # local Worker
npm run verify:live   # checks the deployed server with current and legacy SDK clients
```

## How the frame-by-frame breakdown works

`scripts/analyze_video.py` decodes every frame of every video and records what it measures: where each shot starts and ends, how it enters, how much of the frame moves, the colors and the loudness. The same file always gives the same result, and `agent-service/test/data.test.mjs` checks that the shots of every video cover each frame exactly once. Each shot's class (entrance, motion level, tone) comes from fixed thresholds on those measurements, so it is reproducible rather than a model's opinion.

What a shot *shows* (a logo, a product screen, a chart) is a judgement, so Kuchi does not guess it. The connected agent reads it from the storyboard sheets: `kuchi_get_breakdown` says where each shot's frame is and lists the 14 kinds to classify against, and the agent passes its reading to `kuchi_plan_remake` as `shot_analysis`. The quality of that reading, and of the build that follows, rests on the agent; Kuchi's part is exact numbers, real frames and a plan that holds the agent to them.

A curator can still review a video and write labels into `data/shot_labels.json`. A reviewed label takes the place of the agent's reading for that shot. Labels are tied to the measurement they were written against: if a video is re-measured and its shots change, its labels stop being served until someone reviews them again.

## Analytics

The server sends anonymous usage events to PostHog: which tool ran, how long it took, whether it failed, the client's name and version, the country, catalog search terms and filters, and the reference asked for. It never sends what `kuchi_plan_remake` or `kuchi_check_remake` receive about the user's product (name, description, features, copy, asset descriptions, file locations or the shot analysis), tool results, or IP addresses. `agent-service/test/server.test.mjs` enforces this. A client past 300 requests in an hour is still served but no longer counted, so one client can't use up the analytics quota. Set `POSTHOG_PROJECT_TOKEN` to `""` in `agent-service/wrangler.json` to switch analytics off.

See [COMPATIBILITY.md](COMPATIBILITY.md) for how one server works in Claude, ChatGPT and the rest, [directory-submission](../directory-submission/README.md) for the directory listings, and [Privacy](https://kuchi.kalarislabs.com/privacy.html).
