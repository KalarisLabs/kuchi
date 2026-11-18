# Kuchi SEO strategy

Written 2026-11-18. Owner: Kalaris Labs. Scope: kuchi.kalarislabs.com (the `web/` Astro site).

## The bet

Component libraries such as shadcn/ui, Magic UI and Aceternity get most of their search traffic
from **many specific pages**, not from the home page. Each component, block and integration has
its own URL that answers one query exactly ("animated beam react component", "shadcn
sidebar"), and the pages link to each other.

Kuchi already has the raw material for this. Every launch video, every component and now every
agent harness has its own prerendered page with structured data. The plan is to own the
long tail where three things meet:

1. **Agent**: "launch video with Claude Code", "Codex MCP video", "Cursor Remotion".
2. **Format or style**: "kinetic typography launch video", "SaaS product demo video examples".
3. **Building block**: "Remotion captions component", "terminal animation Remotion".

Nobody else holds measured data on real launch videos. That data is what keeps these pages
from being thin, and it is what AI answer engines quote.

## What exists today

| Page type | URL | Count | Structured data | Targets |
|---|---|---|---|---|
| Home | `/` | 1 | FAQPage | brand, "AI launch video" |
| Collection | `/videos` | 1 | CollectionPage | "launch video examples" |
| Video | `/videos/<slug>` | 89 and growing daily | VideoObject, BreadcrumbList; video sitemap | "<brand> launch video", style terms |
| Components hub | `/components` | 1 | n/a | "Remotion components" |
| Component | `/components/<name>` | ~178 | SoftwareSourceCode, VideoObject, BreadcrumbList; video sitemap | "<thing> Remotion component" |
| Registry | `/r/<name>.json` | ~185 | n/a | shadcn CLI installs (an adoption channel, not a ranking one) |
| **Agents hub (new)** | `/agents` | 1 | CollectionPage, BreadcrumbList | "make a launch video with AI agent" |
| **Agent guide (new)** | `/agents/<harness>` | 8 | HowTo, FAQPage, ItemList, BreadcrumbList | "launch video with <harness>", "<harness> MCP" |
| For agents | `/llms.txt`, `/agent/SKILL.md`, MCP | n/a | n/a | AI assistants and agent directories |

All pages are prerendered, served with `max-age=120, stale-while-revalidate=604800`
(`web/scripts/cache-headers.mjs`), listed in `/sitemap.xml` and searchable from Cmd/Ctrl-K.

### The agent guides (shipped in this change)

`/agents/claude-code`, `/agents/codex`, `/agents/cursor`, `/agents/vs-code`,
`/agents/gemini-cli`, `/agents/claude`, `/agents/chatgpt`, `/agents/grok`.

Each one is written by hand in `web/src/lib/harnesses.ts`, so it does not read as a template
with the name swapped:

- an opening that explains what that harness can do (coding agents build and render; chat
  apps choose, study and plan);
- its real install steps: commands, deep links and settings snippets that already appear in
  the connect section;
- the setup prompt with a copy button, plus a one-click install where one exists;
- three prompts to try that fit the harness;
- six launch videos picked by the styles that suit it, and six components it can install;
- an FAQ that answers the question people search for ("How do I add an MCP server to Gemini
  CLI?", "Can ChatGPT render the video?");
- links to every other harness, the hub, the collection and the components.

Copying the setup prompt sends `setup_prompt_copied` with `placement: agent-page` and the
harness as `client`. Install links send `quick_connect_clicked`. Both events were already on
the privacy allowlist, so PostHog shows which guide converts.

## Keyword map

Search volumes are **not verified yet**: the Semrush account had no API units left on
2026-11-18. Treat the tiers below as hypotheses and confirm them in Search Console after
4–6 weeks of impressions.

| Tier | Intent | Example queries | Page |
|---|---|---|---|
| A: agent × job | high; ready to act | launch video claude code · codex mcp server setup · cursor remotion video · gemini cli mcp settings | `/agents/<harness>` |
| B: format examples | research, top of the funnel | product launch video examples · saas launch video · kinetic typography product video · app launch video ideas | `/videos`, new style and category pages |
| C: brand references | navigational long tail | figma 3d transforms launch video · notion agents launch video | `/videos/<slug>` |
| D: building blocks | developer | remotion captions · remotion terminal animation · remotion text animation · shadcn video components | `/components/<name>`, new category pages |
| E: how-to | learning | how to make a product launch video with ai · remotion launch video tutorial · launch video length | new guides |

Every keyword gets **one** page. When two pages would compete, the more specific one wins and
the other links to it.

## Next page types, in order

These follow the pattern component libraries use. Each must pass the quality bar below before
it ships.

1. **Style pages: `/videos/style/<style>`** (14 styles, such as Kinetic type, UI motion,
   Device motion, Terminal). Each one lists every video in the style and adds a short written
   section on what makes the style work, drawn from the notes on those videos, plus the
   components that produce it. Targets tier B ("kinetic typography launch video examples").
2. **Category pages: `/videos/category/<category>`** (AI launch, Startup launch, Feature
   clip...). Same build as the style pages. Do this only for categories with 5 or more videos.
3. **Component category pages: `/components/category/<category>`** (Captions, Code & CLI, AI
   chat, Logos...). Today these are only filters on `/components`; filters do not get
   indexed. Targets "Remotion caption components" and similar.
4. **Agent × building block**, chosen with care: "Remotion with Claude Code" or "Claude Code
   video components". Build one only where Search Console shows impressions for that pair.
   Never build the full grid.
5. **Guides: `/guides/<topic>`**, 5–8 long pages written once and kept up to date. Topics:
   how to make a launch video with an AI agent; launch video length and pacing (backed by
   Kuchi's measured shot data); what top launch videos have in common (a data study across
   the collection, the main link-earning page); writing the launch post that goes with the
   video. The data study is the asset other sites will cite.
6. **More harnesses** once each install path is confirmed: Windsurf, Antigravity, Raft,
   Zed, Cline, Goose. Add an entry to `harnesses.ts` and the hub, sitemap, search and tests
   pick it up. Rule from the owner: confirm the install path is real first.

## Quality bar for programmatic pages

Google's scaled-content policy demotes pages made in bulk with little unique value. Every
generated page must:

- answer its query in the first 2–3 sentences, in plain words;
- show data or content that exists on no other page of the site, such as measured shots,
  stats, real install steps or code;
- keep a unique `<title>`, meta description and H1 (the agent test already fails on duplicate
  titles);
- link up to its hub, across to 3–8 siblings and down to the detail pages;
- stay out of the sitemap, or carry `noindex`, while it has fewer than 3 items; an empty
  style page is worse than none;
- never name upstream component projects (existing rule, enforced by tests).

## Technical

Already in place: prerendering, canonicals, a video sitemap, JSON-LD on every detail page,
cache headers, Open Graph and Twitter cards, and an `og:image` on video and component pages.

To do:

1. **Search Console and Bing Webmaster Tools**: verify the domain and submit `/sitemap.xml`.
   Nothing below can be measured until this is done.
2. **IndexNow on deploy**: turn on Cloudflare Crawler Hints for the zone, or ping IndexNow
   from the deploy pipeline. A video added today is then crawled today, not next week.
3. **Open Graph images for the agent pages**: today they use the site card. A 1200×630 card
   per harness (Kuchi × harness logo, the headline) gets more clicks when the pages are
   shared on X.
4. **Sitemap `lastmod`**: agent and hub pages use the newest video's date. Switch to the date
   the content itself last changed once the guides are edited on their own schedule.
5. **`/llms.txt`**: add an "Agent guides" section linking the 8 guides. The file is
   generated by `scripts/site_llms.py`, which is outside the frontend scope, so it needs the
   owner's go-ahead.
6. **Core Web Vitals**: keep the video `preload="none"` and lazy posters. Watch LCP on
   `/videos`, the heaviest page.
7. **Video page titles**: put the format into the title ("Figma 3D Transforms: launch video
   with kinetic type") so style queries match the detail pages too.

## AI answer engines

People now ask ChatGPT, Claude, Perplexity and Google AI Overviews "how do I make a launch
video with Claude Code?". Being the cited source there matters as much as ranking:

- The agent guides open with a direct answer and end with an FAQ. Keep that format.
- Keep FAQPage and HowTo JSON-LD. Google shows fewer rich results for them now, but the markup
  still helps machines read the page.
- Stay listed in MCP directories (Registry done; Claude and ChatGPT listings pending, see
  `directory-submission/`). Directory pages rank and link back.
- Publish the data study (guide 5) with clear numbers, the kind of thing an AI answer quotes.
- Track mentions: Ahrefs Brand Radar or OpenSEO AI visibility on prompts such as "best launch
  video templates for AI agents" and "Remotion components for launch videos".

## Links and distribution

- **"Remade with Kuchi" showcase**: invite people to submit what they built from a reference.
  Each submission is a new page and a link back from the maker's own post.
- **shadcn registry directories and awesome lists**: list `/r/registry.json` in the community
  registry index, and add Kuchi to awesome-mcp-servers, awesome-remotion and
  awesome-claude-code.
- **Harness communities**: post each guide where that harness's users gather (the Cursor
  forum, Claude Code and Codex discussions, r/ClaudeAI), and only where self-promotion is
  allowed.
- **X**: every new video is already a reason to post. Link the video page, not the home page,
  so the long-tail pages build authority.
- No paid links, no link exchanges.

## Measurement

| Metric | Source | 90-day target (set after the first 4 weeks of data) |
|---|---|---|
| Indexed pages / submitted | Search Console | > 90% |
| Impressions and clicks on `/agents/*` | Search Console | trend up week on week |
| Queries ranking in the top 10, by tier | Search Console | tier A first |
| Setup prompt copies from agent pages | PostHog `setup_prompt_copied`, placement `agent-page` | baseline in week 2 |
| Install clicks by harness | PostHog `quick_connect_clicked` | baseline in week 2 |
| MCP sessions after a visit from organic search | PostHog funnel | baseline |
| AI answer mentions | Brand Radar / OpenSEO | appear for 3+ tracked prompts |

## 30 / 60 / 90 days

- **Days 0–30**: ship the agent guides (done, pending push to `main`); set up Search Console and
  Bing; IndexNow; Open Graph cards for the agents; `llms.txt` section; submit to directories
  and awesome lists.
- **Days 31–60**: style and category pages; component category pages; the first two guides,
  including the data study.
- **Days 61–90**: read Search Console; build agent × building-block pages only where
  impressions show demand; more harnesses; the showcase; rewrite titles on pages ranked 8–20.

## Going live

The pages reach production when `main` deploys, through Workers Builds. Before pushing, run
`npm run build`, `npm test` and `npm run check:scope` in `web/`. After the deploy, request
indexing in Search Console for `/agents` and the 8 guides.
