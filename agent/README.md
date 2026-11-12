# Connect your agent to Kuchi

Kuchi is a library of real product-launch videos to use as **inspiration templates**. Your agent finds a reference, then plans a remake for your product. The reference supplies structure (pacing, transitions, layout, motion); your product, assets and copy supply everything on screen.

**MCP server:** `https://kuchi.kalarislabs.com/mcp` (Streamable HTTP, read-only, no sign-in or token)

## Setup prompt

Paste this into any agent that can add MCP servers:

```text
Connect the Kuchi MCP server at https://kuchi.kalarislabs.com/mcp (Streamable HTTP, no sign-in) and confirm it works by listing its tools.

Kuchi is a library of real product-launch videos to use as inspiration templates. When I want a launch video: find references with kuchi_search_videos and show me their posters and links. Once I pick one, call kuchi_plan_remake with my product details and ask me for my logo, screenshots and anything else it lists as missing. Borrow only the reference's structure and motion; everything on screen comes from my product.
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

[`SKILL.md`](SKILL.md) teaches an agent when and how to use Kuchi. It is also served at https://kuchi.kalarislabs.com/agent/SKILL.md and bundled in the [plugin](../plugin/launch-archive). Copy it into your agent's skills folder (for example `.claude/skills/kuchi/SKILL.md`), or adapt it: keep the three steps and the rule that only the user's assets go on screen.

## Tools

| Tool | What it does |
| --- | --- |
| `kuchi_search_videos` | Search by keywords, style, category, format, aspect ratio or length. Paginated (`limit`, `offset`). |
| `kuchi_get_video` | One video by id, slug, Kuchi link or X URL: video file, poster, length, size, notes on its motion. |
| `kuchi_list_filters` | Every style, category, format and aspect ratio, with counts. |
| `kuchi_plan_remake` | Takes the user's product details and assets. Returns what to borrow, a beat sheet, the rules, and `missing_inputs`: what to ask the user before building. |
| `search`, `fetch` | The two tools ChatGPT's connectors and deep research look for. Same catalog. |

Every tool is read-only. Text output is Markdown by default; pass `response_format: "json"` for structured data.

**Prompts:** `remake_launch_video` (product name, optional reference) and `find_launch_inspiration` (product, optional vibe). In Claude they appear in the prompt menu.

**Resource:** `kuchi://workflow`, the full workflow ([workflow.md](workflow.md)).

Without MCP, the same data is at https://kuchi.kalarislabs.com/agent/catalog.json and https://kuchi.kalarislabs.com/agent/workflow.md.

## Limits

- 120 requests a minute per IP (a sliding window, enforced exactly by a Durable Object per IP), shared by the MCP server and the `/agent` routes. Over the limit you get HTTP 429 with `Retry-After` set to the seconds until a slot frees. The website and video files are not limited.
- MCP request bodies are capped at 64 KiB.
- The catalog refreshes from this repository's `main` branch at most once a minute. If GitHub is unreachable, the last good copy keeps serving for up to a day.

## Updating the library

Merge changes to `main`: videos in `data/videos.json` (see [CURATOR.md](CURATOR.md)), formats in `agent/manifest.json`, the workflow in `agent/workflow.md`. Connected agents see them within a minute, with no reinstall. Changing tools, the skill text or server instructions needs a Worker deploy (`.github/workflows/deploy.yml` does it on push).

## Development

```bash
cd agent-service
npm ci
npm test              # tools, prompts, remake planning, caching, rate limit
npm run dev           # local Worker
npm run verify:live   # checks the deployed server with current and legacy SDK clients
```

See [COMPATIBILITY.md](COMPATIBILITY.md) for the Claude and ChatGPT plan, and [Privacy](https://kuchi.kalarislabs.com/privacy.html).
