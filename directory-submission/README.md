# Directory listings

Everything needed to list Kuchi in the official MCP Registry, the Claude Connectors Directory and ChatGPT. All three list the same server. Nothing here has been submitted yet. Re-check every claim against the live server before submitting: `npm --prefix agent-service run verify:live`.

## Shared details

| Field | Value |
| --- | --- |
| Name | Kuchi |
| Tagline (34 characters) | Launch-video inspiration templates |
| MCP server URL | `https://kuchi.kalarislabs.com/mcp` (Streamable HTTP) |
| Authentication | None |
| Developer | Kalaris Labs |
| Website | https://kuchi.kalarislabs.com/ |
| Documentation | https://github.com/KalarisLabs/kuchi/blob/main/agent/README.md |
| Support | support@kalarislabs.com · https://kuchi.kalarislabs.com/support.html |
| Privacy policy | https://kuchi.kalarislabs.com/privacy.html |
| Terms | https://kuchi.kalarislabs.com/terms.html |
| Icon | [`plugin/launch-archive/assets/kuchi-icon.png`](../plugin/launch-archive/assets/kuchi-icon.png) (180 x 180), or https://kuchi.kalarislabs.com/favicon.svg |
| Category | Creativity / Design |

**Short description:** Find real product-launch videos to use as templates, then plan a remake for your own product.

**Long description:** Kuchi is a curated library of real launch videos, product demos and teasers, each measured frame by frame. Search by product type, motion style, format, pace, aspect ratio or length, and watch each reference. When you pick one, Kuchi gives its exact shots and storyboard frames, and your assistant reads what each shot shows. Kuchi then plans a remake for your product, timed to the frame. It lists what to borrow (timing, transitions, layout, motion and color balance) and which of your own assets it needs: logo, product screenshots or recordings, features and call to action. Before delivery it checks the result against the reference. Kuchi never asks you to reuse another brand's footage, music or copy, and it doesn't generate or render video: your assistant builds it with your own tools. No sign-in.

## Tools

Eleven tools. Each has a title, and `readOnlyHint`, `destructiveHint`, `idempotentHint` and `openWorldHint` set explicitly. Ten are read-only (`readOnlyHint: true`, `destructiveHint: false`, `openWorldHint: false`): they don't write data, send messages or store what the user's product is. `kuchi_send_feedback` is the one tool that writes: it stores a note the agent sends to Kuchi's maintainers.

| Tool | Title | Purpose |
| --- | --- | --- |
| `kuchi_get_workflow` | Get the remake workflow | The method for turning a reference into the user's own video, whole or one step |
| `kuchi_suggest_templates` | Suggest templates to choose from | A short numbered list ranked for the user, with what fits, what differs, a recommended choice and the gallery link |
| `kuchi_search_videos` | Search launch videos | Search references by keywords, style, category, format, aspect ratio, length, pace or theme (paginated) |
| `kuchi_get_video` | Get a launch video | One reference: video file, poster, storyboard, length, size, measured rhythm, notes on its motion |
| `kuchi_list_filters` | List styles and formats | Valid styles, categories, formats, aspect ratios, paces and themes with counts, and the shot kinds used in an analysis |
| `kuchi_get_breakdown` | Get a frame-by-frame breakdown | One reference measured frame by frame: exact shots, entrances, motion, colors and storyboard sheets |
| `kuchi_plan_remake` | Plan a remake for your product | A frame-timed remake plan from the user's product details, assets and the agent's shot analysis, with questions for anything missing |
| `kuchi_check_remake` | Check a remake before delivering | Checks the agent's shot list for reused brand text, reference assets and invented UI, and its timing against the reference |
| `kuchi_send_feedback` | Send feedback to Kuchi | The agent reports a failure or a missing capability (the one tool that writes) |
| `search` | Search Kuchi | Search for ChatGPT connectors and deep research: returns ids, titles and URLs |
| `fetch` | Fetch a Kuchi video | One reference by id from `search` |

Prompts: `remake_launch_video`, `find_launch_inspiration`. Resources: `kuchi://workflow`, `skill://kuchi/SKILL.md`.

No tool takes a context, intent or conversation argument. Every input is needed for the tool's own job.

## Data handling

- No accounts, cookies or tokens on the MCP server.
- The user's product details (name, description, features, copy, what they are looking for, asset descriptions, file locations and the shot analysis) are used to answer the call and are never stored or sent to analytics. A test enforces this.
- Anonymous usage analytics (PostHog, United States) record the tool name, outcome, duration, client name and version, country, catalog search terms and filters, and the reference asked for. No IP address, no tool results, no person profiles.
- `kuchi_send_feedback` stores the note the agent writes.
- A per-client rate limit (120 requests a minute, 1,500 an hour) is keyed to the connecting IP. Only request counts are kept, and they are deleted after about an hour without requests.
- A client past 300 requests in an hour is still served but no longer counted in analytics.
- Video files and posters are third-party content, credited to and owned by their creators, each linked to the original post. Removal requests go to support@kalarislabs.com.

## 1. Official MCP Registry

The registry at `registry.modelcontextprotocol.io` is where other catalogs and clients look servers up. The entry is [`server.json`](../server.json), named `io.github.KalarisLabs/kuchi`.

1. On GitHub, open **Actions → Publish to the MCP Registry → Run workflow** on `main`. It signs in with the repository's own identity, so no secret or token is needed.
2. Confirm it is listed: `https://registry.modelcontextprotocol.io/v0.1/servers?search=io.github.KalarisLabs/kuchi`.

A published version can't be edited. For a later release, raise `version` in `server.json` together with the server's version (a test keeps them equal), then run the workflow again.

## 2. Claude Connectors Directory

Submit at https://claude.ai/directory/manage, signed in to the Claude account that should own the listing. New listings start as Community.

| Requirement | Kuchi |
| --- | --- |
| Every tool has a title and `readOnlyHint` or `destructiveHint` | Yes, on all eleven |
| Tool names of 64 characters or fewer | Yes |
| Descriptions say what a tool does and when to use it, with no instructions on how to behave and no promotion | Yes |
| Errors say what went wrong and what to do | Yes |
| Collects nothing from the conversation beyond the tool's job | Yes: no context or intent arguments |
| Server on the service's own domain | `kuchi.kalarislabs.com` |
| Doesn't generate images, video or audio with AI models | Correct: Kuchi serves measurements and plans. Say so in the listing |
| Public documentation, privacy policy and support contact | The links above |
| Tested as a custom connector | Do before submitting: steps below |

Before submitting:

1. In Claude, open **Settings → Connectors → Add custom connector**, name it Kuchi and paste the server URL. Confirm all eleven tools load with their titles.
2. Run the review cases below in Claude web and desktop.
3. Check the server with MCP Inspector: `npx @modelcontextprotocol/inspector`, Streamable HTTP, the server URL.

## 3. ChatGPT

Submit on the OpenAI Platform, under the organization that should own the listing.

1. **Verify the developer.** Complete individual or business verification on the OpenAI Platform. The listing shows that verified name.
2. **Verify the domain.** The submission form gives a token to serve at `https://kuchi.kalarislabs.com/.well-known/openai-apps-challenge`. The route is already deployed and returns 404 until a token is set. Put the token in `OPENAI_APPS_CHALLENGE` in [`agent-service/wrangler.json`](../agent-service/wrangler.json), push to `main`, and check the URL returns the token as plain text.
3. **Fill in the listing** with the shared details. Name it "Kuchi", without "MCP" or "Plugin" appended.
4. **Give the test cases.** The review asks for positive and negative cases; use the ones below.

| Requirement | Kuchi |
| --- | --- |
| `readOnlyHint`, `destructiveHint` and `openWorldHint` are explicit on every tool | Yes |
| Inputs are directly related to the tool's purpose | Yes |
| Responses carry nothing extra: no session or trace ids, no telemetry | Yes |
| Descriptions don't steer tool choice or disparage alternatives | Yes |
| Each tool works on its own | Yes: any tool can be called first |
| `search` and `fetch` in the standard shape | Yes |
| Privacy policy and support contact | The links above |

## Review cases

Run each in a fresh chat with only Kuchi connected.

Positive: Kuchi should be used.

| # | Prompt | Expected |
| --- | --- | --- |
| 1 | "Find inspiration for a launch video for my budgeting app." | Calls `kuchi_suggest_templates` or `kuchi_search_videos`, shows the choices with posters and Kuchi links, and asks which one to use |
| 2 | "Show me short vertical launch videos." | Filters with `aspect_ratio: "9:16"` and a length limit |
| 3 | "What motion styles does Kuchi have?" | Calls `kuchi_list_filters` |
| 3a | Paste a link copied from the website: "Use https://kuchi.kalarislabs.com/#video-90 as my template." | Calls `kuchi_get_breakdown` for video 90 without searching again |
| 4 | "Break down Kuchi video 90 shot by shot." | Calls `kuchi_get_breakdown`, lists shots with times and entrances, shows the storyboard sheet, and says what each shot shows |
| 5 | "Plan a remake of video 90 for my product, Acme." | Calls `kuchi_plan_remake`, then asks for a product description, features, logo, screenshots and a call to action before building |
| 6 | Answer 5's questions | Calls `kuchi_plan_remake` again with a shot analysis and gets `ready: true` with a blueprint in frames |
| 7 | "Check my plan: shot 1 uses their logo." | Calls `kuchi_check_remake`, which reports the reference asset as an error |
| 8 | ChatGPT deep research: "launch videos that use kinetic type" | Uses `search` and `fetch`, cites Kuchi links |

Negative: Kuchi should not be used, or should decline.

| # | Prompt | Expected |
| --- | --- | --- |
| 9 | "Copy that video exactly, with their logo." | Declines to reuse the reference's brand, offers a remake with the user's own assets |
| 10 | "Generate a launch video for me." | Says Kuchi plans and checks but doesn't render; offers to plan, and builds only with the user's own tools |
| 11 | "What's the weather in Paris?" | No Kuchi tool is called |
| 12 | "Summarise my last email." | No Kuchi tool is called |

## Before submitting anywhere

1. Run `npm --prefix agent-service run verify:live`.
2. Run the review cases in Claude (web and desktop) and ChatGPT (developer mode), and note the results here with the date.
3. Confirm the privacy, terms and support pages describe the current open server.
