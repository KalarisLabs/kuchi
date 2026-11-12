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

**Long description:** Kuchi is a curated library of real launch videos, product demos and teasers. Search by product type, motion style, format, aspect ratio or length, and watch each reference. When you pick one, Kuchi plans a remake for your product. It lists what to borrow (pacing, transitions, layout and motion) and which of your own assets it needs: logo, product screenshots or recordings, features and call to action. Kuchi never asks you to reuse another brand's footage, music or copy, and it doesn't render video. Build the video with your own tools. No sign-in.

## Tools

All tools are read-only: `readOnlyHint: true`, `destructiveHint: false`, `idempotentHint: true`, `openWorldHint: false`. None of them write data, send messages or store user input.

| Tool | Purpose |
| --- | --- |
| `kuchi_search_videos` | Search references by keywords, style, category, format, aspect ratio or length (paginated) |
| `kuchi_get_video` | One reference: video file, poster, length, size, notes on its motion |
| `kuchi_list_filters` | Valid styles, categories, formats and aspect ratios, with counts |
| `kuchi_plan_remake` | A remake plan from the user's product details and assets, with questions for anything missing |
| `search` | Search for ChatGPT connectors and deep research: returns ids, titles and URLs |
| `fetch` | One reference by id from `search` |

Prompts: `remake_launch_video`, `find_launch_inspiration`. Resource: `kuchi://workflow`.

## Data handling

- No accounts, cookies or tokens on the MCP server.
- Arguments are used to answer the call and not stored. Logs record only the tool name, outcome and duration, with no queries or product details.
- A per-IP rate limit (120 requests a minute) uses the connecting IP in memory only.
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
| 6 | Answer 5's questions | Calls `kuchi_plan_remake` again and gets `ready: true` with a beat sheet |
| 7 | "Copy that video exactly, with their logo." | Declines to reuse the reference's brand, offers a remake with the user's own assets |
| 8 | ChatGPT deep research: "launch videos that use kinetic type" | Uses `search` and `fetch`, cites Kuchi links |

## Before submitting

1. Run `npm --prefix agent-service run verify:live`.
2. Run the review cases in Claude (web and desktop) and ChatGPT (developer mode), and note the results here with the date.
3. Confirm the privacy, terms and support pages describe the current open server.
