# Directory listings

Listing copy for the Anthropic connector directory and the OpenAI app directory. Both list the same server. Re-check every claim here against the live server before submitting.

## Shared details

| Field | Value |
| --- | --- |
| Name | Kuchi |
| Tagline | Launch-video inspiration templates |
| MCP server URL | `https://kuchi.kalarislabs.com/mcp` (Streamable HTTP) |
| Authentication | None |
| Developer | Kalaris Labs |
| Website | https://kuchi.kalarislabs.com/ |
| Support | support@kalarislabs.com · https://kuchi.kalarislabs.com/support.html |
| Privacy policy | https://kuchi.kalarislabs.com/privacy.html |
| Terms | https://kuchi.kalarislabs.com/terms.html |
| Icon | [`plugin/launch-archive/assets/kuchi-icon.png`](../plugin/launch-archive/assets/kuchi-icon.png) |
| Category | Creativity / Design |

**Short description:** Find real product-launch videos to use as templates, then plan a remake for your own product.

**Long description:** Kuchi is a curated library of real launch videos, product demos and teasers, each measured frame by frame. Search by product type, motion style, format, pace, aspect ratio or length, and watch each reference. When you pick one, Kuchi shows its exact shots and storyboard, then plans a remake for your product. It lists what to borrow (timing, transitions, layout, motion and color balance) and which of your own assets it needs: logo, product screenshots or recordings, features and call to action. Kuchi never asks you to reuse another brand's footage, music or copy, and it doesn't render video. Build the video with your own tools. No sign-in.

## Tools

The eight catalog tools are read-only: `readOnlyHint: true`, `destructiveHint: false`, `idempotentHint: true`, `openWorldHint: false`. None of them write data, send messages or store what the user's product is. One more tool, `kuchi_send_feedback`, is not read-only: it lets the agent send Kuchi's maintainers a note about a failure or a missing capability, and stores that note.

| Tool | Purpose |
| --- | --- |
| `kuchi_search_videos` | Search references by keywords, style, category, format, aspect ratio, length, pace, theme or shot kind (paginated) |
| `kuchi_get_video` | One reference: video file, poster, storyboard, length, size, measured rhythm, notes on its motion |
| `kuchi_list_filters` | Valid styles, categories, formats, aspect ratios, paces, themes and shot kinds, with counts |
| `kuchi_get_breakdown` | One reference measured frame by frame: exact shots, entrances, motion, colors and storyboard sheets |
| `kuchi_plan_remake` | A shot-by-shot remake plan from the user's product details and assets, with questions for anything missing |
| `kuchi_check_remake` | Checks the agent's shot list for reused brand text, reference assets, invented UI and pacing drift |
| `kuchi_send_feedback` | The agent reports a failure or a missing capability (the one tool that writes) |
| `search` | Search for ChatGPT connectors and deep research: returns ids, titles and URLs |
| `fetch` | One reference by id from `search` |

Prompts: `remake_launch_video`, `find_launch_inspiration`. Resource: `kuchi://workflow`.

## Data handling

- No accounts, cookies or tokens on the MCP server.
- The user's product details (name, description, features, copy, asset descriptions and file locations) are used to answer the call and are never stored or sent to analytics. A test enforces this.
- Anonymous usage analytics (PostHog, United States) record the tool name, outcome, duration, client name and version, country, catalog search terms and filters, the reference asked for, and an optional one-line `intent` the agent may pass. No IP address, no tool results, no person profiles.
- `kuchi_send_feedback` stores the note the agent writes.
- A per-client rate limit (120 requests a minute, 1,500 an hour) is keyed to the connecting IP. Only request counts are kept, and they are deleted after about an hour without requests.
- A client past 300 requests in an hour is still served but no longer counted in analytics.
- Video files and posters are third-party content, credited to and owned by their creators, each linked to the original post. Removal requests go to support@kalarislabs.com.

## Review cases

Run each in a fresh chat with only Kuchi connected.

| # | Prompt | Expected |
| --- | --- | --- |
| 1 | "Find inspiration for a launch video for my budgeting app." | Calls `kuchi_search_videos`, shows 3 to 5 references with posters and Kuchi links |
| 2 | "Show me short vertical launch videos." | Filters with `aspect_ratio: "9:16"` and a length limit |
| 3 | "What motion styles does Kuchi have?" | Calls `kuchi_list_filters` |
| 4 | "Tell me about Kuchi video 90." | Calls `kuchi_get_video`, shows its notes, length and links |
| 5 | "Plan a remake of video 90 for my product, Acme." | Calls `kuchi_plan_remake`, then asks for a product description, features, logo, screenshots and a call to action before building |
| 6 | Answer 5's questions | Calls `kuchi_plan_remake` again and gets `ready: true` with a shot blueprint |
| 6a | "Break down video 90 shot by shot." | Calls `kuchi_get_breakdown`, lists shots with times and entrances, shows the storyboard sheet |
| 6b | "Check my plan: shot 1 uses their logo." | Calls `kuchi_check_remake`, which reports the reference asset as an error |
| 7 | "Copy that video exactly, with their logo." | Declines to reuse the reference's brand, offers a remake with the user's own assets |
| 8 | ChatGPT deep research: "launch videos that use kinetic type" | Uses `search` and `fetch`, cites Kuchi links |

## Before submitting

1. Run `npm --prefix agent-service run verify:live`.
2. Run the review cases in Claude (web and desktop) and ChatGPT (developer mode), and note the results here with the date.
3. Confirm the privacy, terms and support pages describe the current open server.
