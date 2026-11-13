# Connect your agent to Kuchi

Kuchi is a library of real product-launch videos to use as **inspiration templates**. Every video is measured frame by frame. Your agent finds a reference, studies it shot by shot, plans a remake for your product, and checks its own work before delivering. The reference supplies motion and taste (timing, transitions, layout, color balance); your product, assets and copy supply everything on screen.

**MCP server:** `https://kuchi.kalarislabs.com/mcp` (Streamable HTTP, read-only, no sign-in or token)

## Setup prompt

Paste this into any agent that can add MCP servers:

```text
Connect the Kuchi MCP server at https://kuchi.kalarislabs.com/mcp (Streamable HTTP, no sign-in) and confirm it works by listing its tools.

Kuchi is a library of real product-launch videos to use as inspiration templates. When I want a launch video: find references with kuchi_search_videos and show me their posters and links. Once I pick one, study it with kuchi_get_breakdown, then call kuchi_plan_remake with my product details and ask me for my logo, screenshots and anything else it lists as missing. Before you deliver, run kuchi_check_remake on your shot list. Copy only the reference's motion and taste; everything on screen comes from my product.
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

## Skill

[`SKILL.md`](SKILL.md) teaches an agent when and how to use Kuchi. It is also served at https://kuchi.kalarislabs.com/agent/SKILL.md and bundled in the [plugin](../plugin/launch-archive). Copy it into your agent's skills folder (for example `.claude/skills/kuchi/SKILL.md`), or adapt it: keep the five steps and the rule that only the user's assets go on screen.

## Tools

| Tool | What it does |
| --- | --- |
| `kuchi_search_videos` | Search by keywords, style, category, format, aspect ratio, length, pace, theme or shot kind. Paginated (`limit`, `offset`). |
| `kuchi_get_video` | One video by id, slug, Kuchi link or X URL: video file, poster, storyboard sheet, length, size, measured rhythm, notes on its motion. |
| `kuchi_list_filters` | Every style, category, format, aspect ratio, pace, theme and shot kind, with counts. |
| `kuchi_get_breakdown` | The frame-by-frame measurement of one video: every shot with its exact start and end, how it enters, how much moves, its colors, and storyboard sheets of real frames (attached as an image on request). |
| `kuchi_plan_remake` | Takes the user's product details and assets. Returns what to borrow, a shot-by-shot blueprint re-timed to the target length, the rules, and `missing_inputs`: what to ask the user before building. |
| `kuchi_check_remake` | Takes the agent's shot list before delivery. Flags reused brand words, assets taken from the reference, invented logos or UI, placeholders, gaps and pacing drift. |
| `kuchi_send_feedback` | Lets an agent report a failure, a confusing result or a missing capability to Kuchi's maintainers. |
| `search`, `fetch` | The two tools ChatGPT's connectors and deep research look for. Same catalog. |

Every catalog tool is read-only. `kuchi_send_feedback` is the one tool that records what the agent writes. Text output is Markdown by default; pass `response_format: "json"` for structured data. The `kuchi_*` tools accept an optional `intent`: one line on what the user is trying to do, which helps us see what people need.

**Prompts:** `remake_launch_video` (product name, optional reference) and `find_launch_inspiration` (product, optional vibe). In Claude they appear in the prompt menu.

**Resource:** `kuchi://workflow`, the full workflow ([workflow.md](workflow.md)).

Without MCP, the same data is at https://kuchi.kalarislabs.com/agent/catalog.json, https://kuchi.kalarislabs.com/agent/breakdowns/<id>.json and https://kuchi.kalarislabs.com/agent/workflow.md.

## Limits

- 120 requests a minute and 1,500 an hour per IP, shared by the MCP server and the `/agent` routes. Counts are exact (a Durable Object per client) and survive the object going idle: they are saved every 10 requests and deleted after about an hour without requests. IPv6 clients are counted per /64 network, so rotating addresses doesn't reset the count. Over the limit you get HTTP 429 with `Retry-After` set to the seconds until a slot frees. The website and video files are not limited.
- Every JSON-RPC message counts as one request. One HTTP request may carry at most 10 messages.
- MCP request bodies are capped at 64 KiB.
- Tool inputs are validated strictly: unknown arguments are rejected, and every string, list and number has a bound.
- The catalog refreshes from this repository's `main` branch at most once a minute. If GitHub is unreachable, the last good copy keeps serving for up to a day.

## Updating the library

Merge changes to `main`: videos in `data/videos.json` (see [CURATOR.md](CURATOR.md)), their measurements in `data/breakdowns.json`, reviewed shot labels in `data/shot_labels.json`, formats in `agent/manifest.json`, the workflow in `agent/workflow.md`. Connected agents see them within a minute, with no reinstall. Changing tools, the skill text or server instructions needs a Worker deploy (`.github/workflows/deploy.yml` does it on push).

## Development

```bash
cd agent-service
npm ci
npm test              # tools, prompts, breakdowns, remake planning and checking, analytics privacy, caching, rate limit
npm run dev           # local Worker
npm run verify:live   # checks the deployed server with current and legacy SDK clients
```

## How the frame-by-frame breakdown works

`scripts/analyze_video.py` decodes every frame of every video and records what it measures: where each shot starts and ends, how it enters, how much of the frame moves, the colors and the loudness. The same file always gives the same result, and `agent-service/test/data.test.mjs` checks that the shots of every video cover each frame exactly once. Each shot's class (entrance, motion level, tone) comes from fixed thresholds on those measurements, so it is reproducible rather than a model's opinion.

What a shot *shows* (a logo, a product screen, a chart) is a judgement, so it is not automated. A person reviews the storyboard sheets and writes a label from a fixed list of 14 kinds into `data/shot_labels.json`. Labels are tied to the measurement they were written against: if a video is re-measured and its shots change, its labels stop being served until someone reviews them again.

## Analytics

The server sends anonymous usage events to PostHog: which tool ran, how long it took, whether it failed, the client's name and version, the country, catalog search terms and filters, the reference asked for, and the optional `intent`. It never sends what `kuchi_plan_remake` or `kuchi_check_remake` receive about the user's product (name, description, features, copy, asset descriptions or file locations), tool results, or IP addresses. `agent-service/test/server.test.mjs` enforces this. A client past 300 requests in an hour is still served but no longer counted, so one client can't use up the analytics quota. Set `POSTHOG_PROJECT_TOKEN` to `""` in `agent-service/wrangler.json` to switch analytics off.

See [COMPATIBILITY.md](COMPATIBILITY.md) for the Claude and ChatGPT plan, and [Privacy](https://kuchi.kalarislabs.com/privacy.html).
