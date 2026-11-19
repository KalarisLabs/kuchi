# Cash pages and harness blogs (plan of 2026-11-19)

Owner's brief: one money page ("cash page") for every agent and chat app the site supports,
plus one separate blog post for each, written around what people actually search for. The
product name is not the keyword and does not lead any title. Then get it all indexed.

## Two pages per harness, two different searches

Each harness gets one page per search intent, so the two never compete for the same query.

| Page | URL | Search it answers | Title shape (no product name) |
|---|---|---|---|
| Cash page | `/agents/<slug>` | "launch video with X", "X video MCP": someone ready to make one | `Make a product launch video with X: MCP setup and prompts` |
| Blog post, coding agent | `/blog/remotion-<slug>` style | "Remotion with X", "X make a video": someone learning how | `Remotion with X: build and render a product video` |
| Blog post, chat app | `/blog/<slug>-custom-mcp-connector` style | "add custom MCP server to X", "X custom connector": someone setting X up | `How to add a custom MCP connector to X` |

- The cash page keeps the install steps, prompts, featured templates and FAQ. Only its
  `<title>` and H1 change, to lead with the search phrase.
- Each blog post teaches the job end to end in that harness: what the harness does well for
  video, the install, a worked prompt sequence, the build-and-render loop (coding agents) or
  the plan-and-hand-off loop (chat apps), the mistakes specific to it, and three FAQs of its own.
  The product is the worked example, not the keyword.
- Each pair links both ways: the cash page links its post ("Step-by-step guide"), the post
  links its cash page in the intro and in Related.
- Install commands in posts come from `lib/harnesses.ts`, so a post never disagrees with its
  cash page and every path stays one we checked against the harness's own docs.

All 27 harnesses: 21 coding agents (Claude Code, Codex, Cursor, VS Code + Copilot, Gemini CLI,
Grok Build, Devin, Pi, Muse Code, T3 Code, OpenCode, Cline, Zed, Amp, Kiro, Copilot CLI,
Factory Droid, Kimi Code, Qwen Code, Antigravity, Xum) and 6 chat apps (Claude, ChatGPT,
Grok, Grok Bot, Le Chat, Manus).

Keyword volumes were not measured: the OpenSEO account has 5 credits, too few for 54 terms.
The intents above follow the query shapes in SEO_STRATEGY.md (tier A: "X launch video";
tier C: "Remotion + agent", "custom MCP connector"). Re-rank once Search Console shows
real impressions (about four weeks after indexing).

## Indexing

1. **Sitemap.** Already automatic: `sitemap.xml.ts` lists every harness and post, with
   `lastmod`. The 27 cash pages and 30 posts appear on the next build.
2. **Deploy.** Pages exist for Google only once they are on main (Workers Builds deploys).
   Needs the owner's go-ahead to push.
3. **Google Search Console** (property `sc-domain:kalarislabs.com`, connected through
   OpenSEO). On 2026-11-19 only `/` was indexed; `/agents`, `/blog`, `/components` and the
   agent guides were "URL is unknown to Google". After the deploy:
   - Resubmit `https://kuchi.kalarislabs.com/sitemap.xml` under Sitemaps (the API path we
     have can inspect URLs but not submit sitemaps, so this is one click in GSC).
   - Request indexing by hand in URL Inspection for the hubs first (`/agents`, `/blog`), then
     the highest-intent cash pages (Claude Code, Codex, Cursor, ChatGPT, Claude). GSC allows
     roughly 10 requests a day; the rest follow from the sitemap and the hub links.
   - A week later, check coverage with `inspect_urls` and fix anything "Crawled, not indexed".
4. **IndexNow** (Bing, Yandex, Seznam, Naver; Bing feeds ChatGPT search and Copilot). Needs
   a key file at `https://kuchi.kalarislabs.com/<key>.txt`. `web/public` is rebuilt by
   `stage.mjs`, so the key would be served from a route in `src/pages`. Then submit every new
   URL with OpenSEO `submit_indexnow_urls`.
5. **Agents and AI search.** `robots.txt` already allows all crawlers. `llms.txt` is generated
   by `scripts/site_llms.py` (outside the frontend scope): adding an "Agent guides" and "Blog"
   section there needs the owner's OK.
6. **Internal links.** `/agents` links every cash page; `/blog` lists every post; every post
   links its cash page and three related posts; every cash page links its post.

## Rules kept

- Real install paths only (from the harness's own docs, as recorded in `harnesses.ts`).
- No GitHub buttons or links, no shell download of SKILL.md, nothing about pricing beyond
  "free, no account, no API key".
- MCP stays frozen at 1.3.0: posts describe the tools as they are.
- Every page builds, passes `npm test` and `npm run check:scope`.

## Depth and authorship (added 2026-11-19, owner)

The owner asked for technical depth and far more words, so the pages are worth indexing, and for
every cash page and post to carry Sayan Chowdhury's byline, linking to
https://kalarislabs.com/team/sayan-chowdhury.

- **Cash pages** went from about 950 to 2,700–3,350 words. Each page has, per harness
  (`lib/harness-depth.ts`): how it loads MCP servers (file, key, scope, reload), a full run
  inside it, and a troubleshooting table. Shared but filled in per harness (`lib/mcp-reference.ts`,
  mirroring the frozen MCP 1.3.0): the protocol flow, all 13 tools with when this harness calls
  them, how the blueprint times the video (retimed vs condensed, whole frames, compare_at_s),
  the 14 shot kinds, the entrance and motion legend, and what the check catches. Coding agents
  also get the Remotion composition and `<Sequence>` mapping.
- **Posts** average about 1,300 words. The technical angle differs from the cash pages, so the
  two do not repeat each other: coding posts teach writing a shot in Remotion (entrances to
  `interpolate`/`spring`, `staticFile`, no randomness); chat posts explain how a remote MCP
  connector works and what it can and cannot see.
- **Overlap:** about 70% of each cash page's 8-word phrases also appear on other cash pages
  (the shared tables, video cards and navigation). Each page has roughly 1,000 unique words.
  The next lever is more per-harness material, not more shared tables.
- **Author:** `lib/authors.ts` and `components/AuthorByline.astro` (a byline line under the
  title and an author card at the end). The photo is a 256 px local copy. JSON-LD carries
  `author` as a schema.org `Person` (BlogPosting, and HowTo on cash pages). The tests enforce
  the byline and the author markup.
