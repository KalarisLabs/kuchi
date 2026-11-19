# Kuchi MCP Server: Distribution & Launch Playbook

An actionable, multi-channel distribution strategy for launching **Kuchi** (`https://kuchi.kalarislabs.com/`), the open Streamable HTTP MCP server that measures top developer and SaaS launch videos frame-by-frame and plans remakes for your product without generative AI video slop.

---

## Executive Summary & Positioning

| Attribute | Specification |
| :--- | :--- |
| **Product Name** | Kuchi (by Kalaris Labs) |
| **Live MCP Endpoint** | `https://kuchi.kalarislabs.com/mcp` (Streamable HTTP, JSON-RPC 2.0) |
| **Auth / Paywall** | Zero sign-in, zero authentication tokens, completely free and open |
| **Catalog** | 89+ viral launch videos (Cursor, Notion, Vercel, Grok Bot, etc.) measured frame-by-frame |
| **Output Stack** | Remotion (React code-to-video) components, frame-accurate blueprints, kinetic typography |
| **Core Value Proposition** | Eliminates generative AI video slop (morphing buttons, hallucinatory UI, muddy textures) by generating mathematically timed, frame-accurate code blueprints and Remotion components based on proven viral tech launches. |

---

## 1. Product Hunt Launch Strategy

### 1.1 Product Hunt Listing Details
- **Product Name**: Kuchi
- **Primary Tagline**: `AI launch videos without video slop: frame-measured remakes` (58 characters)
  - *Alternative A (Agent-focused)*: `Viral launch video remakes for your AI coding agent` (52 characters)
  - *Alternative B (Developer-focused)*: `Frame-measured launch video blueprints & Remotion templates` (59 characters)
- **Categories**: Developer Tools, Artificial Intelligence, Design Tools, Marketing, Video.
- **Topics**: #DeveloperTools #ArtificialIntelligence #DesignTools #VideoMarketing #OpenSource

### 1.2 The Maker Comment
To be posted immediately at 00:01 PST upon launch:

```markdown
Hey Product Hunt! 👋

I'm thrilled to introduce Kuchi.

If you’ve launched a software product recently, you know the launch video dilemma:
1. Pay a motion design agency $5,000–$15,000 and wait 3 weeks.
2. Try generative AI video tools (Sora, Runway, Kling) and get fever-dream slop: melting UI buttons, illegible code, nightmarish floating hands, and zero brand control.

The best tech launches—Notion, Cursor, Grok Bot, Vercel, Coinbase—don't use diffusion video slop. They win with mathematical rhythm: kinetic typography, 0.8s–1.5s shot pacing, macro camera pans, and pixel-perfect UI captures.

So we built **Kuchi**:
We decoded 89+ of the greatest tech launch videos frame-by-frame using computer vision (OpenCV). We measured their exact cut times, entrance directions, motion energy, and visual rhythm.

Then, we packaged it into an open **Model Context Protocol (MCP)** server:
👉 `https://kuchi.kalarislabs.com/mcp`

### How it works:
1. **Connect your agent**: Add our MCP endpoint to Claude Desktop, Cursor, Codex, or ChatGPT in 2 seconds. Zero sign-in. Zero API keys.
2. **Pick a template**: Your agent queries `kuchi_suggest_templates` or browses https://kuchi.kalarislabs.com/ to find a reference matching your product's vibe.
3. **Frame-timed blueprint**: Kuchi measures the exact rhythm and returns a frame-by-frame remake blueprint adapted to your product's screenshots, copy, and logo.
4. **Remotion code components**: Kuchi provides battle-tested React/Remotion components (`<OrbSwarm />`, `<AnnounceTitle />`, `<ReelCollage />`, `<SpecSweep />`, `<ButtonPress />`) to render a deterministic, 60fps MP4.
5. **Anti-slop check**: `kuchi_check_remake` audits your shot list to ensure you never accidentally copy reference brand names, placeholders, or break timing.

Best of all: **Our own launch film was built entirely using Kuchi's Remotion components**—no video editing software, no generative slop, pure code.

Try it right now:
Connect your agent to `https://kuchi.kalarislabs.com/mcp` or visit https://kuchi.kalarislabs.com/ to browse the breakdown library.

We'd love your feedback, feature ideas, and suggestions for what viral launch videos we should decode next! 🍿
```

### 1.3 Asset Recommendations
All assets adhere strictly to Kuchi’s high-contrast brand system (`#FFFFFF` paper, `#171717` ink, `#ED4035` popcorn red, `#FFF3D2` butter):

1. **Hero Video (60s MP4)**:
   - Source: `launch/kuchi-launch.mp4` (or newly rendered via `npm run render` to `launch/out/kuchi-launch.mp4`).
   - Resolution: 1920×1080 @ 30fps.
   - Narrative arc: Hook (`Orb Swarm`) → Brand reveal (`Announce Title`) → Curated reference collage (`Reel Collage`) → The frame measurement breakdown (`Spec Sweep`) → Agent interaction (`Claude Chat` + `Agent Steps`) → Code compilation (`Button Press` + `Confetti`) → The payoff (`Gather Lockup`) → Component ecosystem (`Brand Wheel`).
2. **Gallery Carousel (5 Slides - 1270×760px)**:
   - *Slide 1*: **The Anti-Slop Difference** (Side-by-side: Hallucinatory generative AI video with distorted UI vs. Kuchi's crisp, 60fps Remotion kinetic typography).
   - *Slide 2*: **Frame-by-Frame Deconstruction** (Visual storyboard sheet showing exact timestamps, cut pacing, and optical flow vectors from `launch/cand-sheet.jpg`).
   - *Slide 3*: **Connect in 2 Seconds** (Clean UI capture of Claude Desktop and Cursor connecting to `https://kuchi.kalarislabs.com/mcp` with zero authentication).
   - *Slide 4*: **Remotion Component Registry** (Code-to-video workflow showing `<OrbSwarm />` and `<CaretDolly />` in a React IDE with real-time preview).
   - *Slide 5*: **Anti-Slop Audit Engine** (`kuchi_check_remake` CLI/agent output flagging borrowed brand copy and timing discrepancies).
3. **Animated GIFs for Gallery & Comments**:
   - `kuchi-claude-workflow.gif`: 8-second looping capture of Claude executing `kuchi_plan_remake` and producing frame timing.
   - `kuchi-button-render.gif`: 4-second looping clip of `<ButtonPress />` triggering Remotion confetti render.
4. **Thumbnail & Avatar**:
   - The iconic popcorn glyph (`web/public/favicon-180.png` or `web/public/favicon.svg`) centered on pure white (`#FFFFFF`) with a 1px subtle hairline border.

### 1.4 Hunter Outreach & Launch Coordination
- **Self-Hunt vs. Hunter**: While self-hunting works well on modern Product Hunt, partnering with a hunter in the AI/developer tooling space amplifies distribution.
- **Target Hunters**:
  - *Chris Messina* (Top hunter of developer & AI utilities)
  - *Kevin William David* (Prolific SaaS/DevTool hunter)
  - *Michael Novotny* (Design & creator tool specialist)
- **Hunter Outreach Pitch (Email / X DM)**:
  > "Hey [Name], quick question: have you noticed how every AI launch video looks like a melting, hallucinatory fever dream lately?
  >
  > We built an open MCP server called **Kuchi** that decodes 89+ top tech launch videos (Cursor, Notion, Vercel) frame-by-frame so AI agents like Claude can plan crisp, kinetic Remotion video remakes for your product—without video generation slop. Zero sign-in, completely open.
  >
  > We’re launching on Product Hunt on [Date]. Would you be interested in taking a look at our demo and hunting us, or would you prefer a preview link first?"

---

## 2. Hacker News ("Show HN")

### 2.1 Title Strategy
- **Recommended Title**: `Show HN: Kuchi – Open MCP server to plan software launch videos without AI slop`
- *Alternative 1*: `Show HN: Kuchi – Frame-accurate launch video breakdowns and Remotion templates for agents`
- *Alternative 2*: `Show HN: We decoded 89 viral tech launch videos frame-by-frame into an MCP server`

### 2.2 Submission Body

```markdown
Hi HN,

We built Kuchi (https://kuchi.kalarislabs.com/), an open Model Context Protocol (MCP) server that analyzes real tech launch videos frame-by-frame and helps your coding agent plan crisp, code-rendered remakes for your product.

### The Problem
When launching software, you usually have two choices for video:
1. Hire an agency ($5,000–$15,000, 3 weeks turnaround).
2. Use generative video models (Runway, Sora, Luma). For devtools, diffusion video is practically unusable: text is illegible, UI buttons melt into background noise, and frame pacing is sluggish.

High-converting launch videos (like Notion, Cursor, Vercel, or Grok Bot) don't use AI video diffusion. They rely on mathematical pacing: 0.8s–1.6s shot durations, kinetic typography, crisp UI captures, and macro pans.

### What Kuchi Does
We analyzed 89+ viral launch videos using OpenCV (scripts/analyze_video.py) to measure:
- Exact shot start and end timestamps (to the frame)
- Entrance directions and transition velocities
- Optical flow motion energy and color palettes
- Storyboard contact sheets of real frames

We exposed this dataset through a zero-auth, Streamable HTTP MCP server:
`https://kuchi.kalarislabs.com/mcp`

### Technical Architecture
- **Transport**: JSON-RPC 2.0 over Streamable HTTP (SSE compatible), deployed on Cloudflare Workers edge nodes.
- **Zero Auth / Zero Friction**: No accounts, tokens, or sign-in. You can test it immediately via curl:
  ```bash
  curl -s -X POST https://kuchi.kalarislabs.com/mcp \
    -H "Content-Type: application/json" \
    -d '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"kuchi_list_filters","arguments":{}}}'
  ```
- **13 Scoped Tools**: 12 read-only tools (`kuchi_suggest_templates`, `kuchi_get_breakdown`, `kuchi_plan_remake`, etc.) and 1 feedback tool.
- **Privacy Guarantee**: An automated test suite enforces that user product details, features, and assets passed to `kuchi_plan_remake` are never persisted to a database or sent to telemetry.
- **Remotion Component Registry**: 15+ copy-paste React components (`<OrbSwarm />`, `<AnnounceTitle />`, `<SpecSweep />`, `<ButtonPress />`) that render to 60fps MP4 via Remotion.
- **Anti-Slop Audit**: `kuchi_check_remake` validates that the generated shot list does not borrow brand names or assets from the reference video.

### How to use it in Claude / Cursor
Paste this into your agent:
`Connect the Kuchi MCP server at https://kuchi.kalarislabs.com/mcp (Streamable HTTP, no sign-in) and confirm it works by listing its tools.`

Our own 60-second launch video (in launch/kuchi-launch.mp4) was rendered entirely with these open Remotion components.

Source code and catalog: https://github.com/KalarisLabs/kuchi
Gallery and breakdown viewer: https://kuchi.kalarislabs.com/

We’d love to hear your feedback on the architecture, the dataset, and what references you’d like measured next.
```

### 2.3 HN Discussion & Comment Strategy
- **Anticipate Objections**:
  - *“Is copying launch videos copyright infringement?”*: Clarify immediately: Kuchi measures mathematical rhythm, shot durations, and entrance directions (ideas/structure). It explicitly forbids and checks against copying original footage, logos, copy, or audio (`kuchi_check_remake`).
  - *“Why MCP instead of a regular REST API or web app?”*: Explain that agents need structured tool primitives to ingest multimodal storyboard sheets, plan shot timing, and output Remotion TSX directly in your IDE workspace.
  - *“Why Remotion over After Effects?”*: Code-based video allows version control, automated parameter injection (swapping product screenshots and text strings in code), and deterministic rendering.
- **Engagement Cadence**: Respond within 5 minutes to every technical question during the first 4 hours of posting. Maintain a humble, transparent engineering tone.

---

## 3. Reddit Community Outreach

### 3.1 Subreddit Playbook

| Subreddit | Community Size | Tone / Angle | Primary Hook |
| :--- | :--- | :--- | :--- |
| **r/mcp** | ~25k | Technical architecture & MCP best practices | Deep dive into a production-grade Streamable HTTP MCP server on Cloudflare Workers (13 tools, zero auth, rate limiting). |
| **r/ClaudeAI** | ~220k | Practical workflow & side-project utility | "How I use Claude Desktop + Kuchi MCP to build 30s kinetic launch videos for my side projects in code." |
| **r/ChatGPTCoding** | ~110k | OpenAI MCP Connectors & Remotion code generation | Connecting ChatGPT custom MCP connectors to generate Remotion video components from real SaaS references. |
| **r/LocalLLaMA** | ~360k | Open data, anti-slop, local agent compatibility | Open dataset of 89 frame-by-frame measured launch videos; connectable to Open-WebUI, LibreChat, and local models. |
| **r/Anthropic** | ~55k | Claude Code plugin ecosystem | "The Kuchi Claude Code plugin: `/plugin install kuchi --marketplace KalarisLabs/kuchi`. Vision-based storyboard planning." |
| **r/SideProject** | ~260k | Founder empathy & bootstrapping | "Tired of $5,000 agency quotes and melting AI video slop? We deconstructed 89 viral tech launches so you can code your own." |

### 3.2 Tailored Post Drafts

#### Draft A: For `r/mcp`
- **Title**: *Architecture breakdown of a zero-auth, Streamable HTTP MCP server on Cloudflare Workers (13 tools, Remotion integration)*
- **Body**: Focus on the technical implementation: JSON-RPC 2.0 streaming, `readOnlyHint` / `destructiveHint` compliance, Durable Object rate-limiting (120 req/min), how multimodal storyboard images are passed to agents, and zero-auth design. Include code snippets of the Cloudflare Worker handler and the `server.json` schema.

#### Draft B: For `r/ClaudeAI`
- **Title**: *I connected Claude to an MCP server that measures top tech launch videos frame-by-frame. Here's how it planned my 30s launch video.*
- **Body**: Share screenshots of Claude Desktop. Walk through the prompt: asking Claude to find a reference like Cursor Computer Use, Claude inspecting the storyboard frames with `kuchi_get_breakdown`, generating the shot list, and outputting the Remotion code for `<OrbSwarm />` and `<AnnounceTitle />`. Include the full copy-paste setup prompt.

#### Draft C: For `r/SideProject`
- **Title**: *I spent weeks analyzing 89 viral SaaS launch videos frame-by-frame so indie hackers can stop paying $5,000 for launch videos*
- **Body**: Vulnerable, founder-to-founder story. Discuss the frustration with Runway/Sora producing weird morphing UI, the absurdity of agency pricing for a 30s clip, and how viral tech videos actually work (timing, typography, pacing). Link to the free gallery and MCP server.

### 3.3 Anti-Spam & Moderator Compliance Rules
1. **Karma & Account Age**: Use an aged account (6+ months old, 1,000+ comment karma).
2. **Staggered Cadence**: Space Reddit posts across 72 hours.
   - Day 1: `r/mcp` and `r/ClaudeAI`.
   - Day 2: `r/SideProject` and `r/Anthropic`.
   - Day 3: `r/ChatGPTCoding` and `r/LocalLLaMA`.
3. **100% Value in Post**: The post must provide standalone value (full breakdown, timing rules, prompt instructions) even if the reader never visits the website.
4. **No Direct Affiliate/Tracking Links**: Use clean, canonical URLs (`https://kuchi.kalarislabs.com/mcp`).
5. **Fast Response Rate**: Reply to every comment with thoughtful technical context within 15 minutes.

---

## 4. X/Twitter Tech & AI Agent Ecosystem

### 4.1 High-Engagement Hooks & Video Clips

#### Hook 1: The "Anti-Slop" Side-by-Side (High Virality)
- **Video Clip**: 12-second side-by-side video.
  - Left side: Generative AI video slop (glitching buttons, blurry text, dreamlike morphing).
  - Right side: Kuchi's crisp 60fps Remotion launch film (`OrbSwarm` into `AnnounceTitle`).
- **Post Copy**:
  > Generative AI video is incredible for sci-fi movies.
  >
  > But for software launches, it’s unusable slop: blurry text, melting buttons, and hallucinated UI.
  >
  > We decoded 89 viral tech launches (Cursor, Notion, Vercel) frame-by-frame.
  >
  > Now your AI agent can plan and code crisp Remotion launch videos in 30 seconds.
  >
  > Introducing Kuchi (open MCP server, zero sign-in) 🧵👇

#### Hook 2: Claude Desktop Live Workflow (High Utility)
- **Video Clip**: 25-second screencast of Claude Desktop executing `kuchi_suggest_templates` → `kuchi_plan_remake` → rendering the code in Remotion Studio.
- **Post Copy**:
  > Watch Claude plan a 15-second kinetic launch video for a developer CLI in 30 seconds.
  >
  > 1. Measures the rhythm of top dev launches
  > 2. Sets exact frame cut timestamps
  > 3. Emits copy-paste Remotion React components
  >
  > Endpoint: https://kuchi.kalarislabs.com/mcp (Streamable HTTP, free)

#### Hook 3: The Deconstruction Mega-Thread (High Educational Value)
- **Post Copy**:
  > We analyzed 89 viral developer launch videos frame-by-frame using computer vision.
  >
  > Notion, Cursor, Grok Bot, Vercel, Coinbase.
  >
  > Here are the 5 pacing rules that separate a viral developer launch from a video that gets ignored: 🧵👇
  >
  > 1/ The 1.2-Second Cut Rule...
  > 2/ The Paper-and-Ink Contrast System...
  > 3/ Kinetic Typography over Voiceovers...
  > 4/ Macro Pan to Dropzone Transitions...
  > 5/ The Anti-Slop Audit...

### 4.2 Target Accounts & Influencer Engagement List

| Persona / Name | Handle | Why Engage | Engagement Tactic |
| :--- | :--- | :--- | :--- |
| **Alex Albert** | `@alexalbert__` | Head of Claude Relations at Anthropic | Quote-tweet showing Claude Desktop seamlessly calling the Kuchi MCP server. |
| **Simon Willison** | `@simonw` | Creator of Datasette, leading independent MCP evangelist | Reply to his MCP threads demonstrating Kuchi's clean zero-auth Streamable HTTP architecture. |
| **Swyx (Shawn Wang)** | `@swyx` | Host of Latent Space podcast, AI engineering authority | Pitch the "Code-first video vs. Diffusion video" paradigm for developer marketing. |
| **Jonny Burger** | `@JNYBGR` | Creator of Remotion | Share the Kuchi Remotion component library; highlight Remotion as the premier rendering engine for agents. |
| **Logan Kilpatrick** | `@OfficialLoganK` | DevRel leader (Google, ex-OpenAI) | Demo how agents use MCP for multimodal design workflows. |
| **Matt Pocock** | `@mattpocockuk` | TypeScript educator & devtools creator | Highlight type-safe Remotion components and programmatic video generation. |
| **Guillermo Rauch** | `@rauchg` | CEO of Vercel | Note that Vercel's "Run Your Backend" video is featured as a template in the collection! |
| **Amjad Masad** | `@amasad` | CEO of Replit | Demo how coding agents can render marketing collateral natively in code. |

### 4.3 Engagement Protocol
- Never blind-tag influencers in the initial tweet.
- Tag relevant builders only in follow-up thread replies where their work or tool is directly referenced (e.g., tagging `@JNYBGR` on the Remotion component architecture tweet).
- Send personalized 30-second Loom demos to creators showcasing a custom remake blueprint of their own product.

---

## 5. AI Developer Newsletters & Podcasts

### 5.1 Publication Pitch Matrix

| Publication | Audience / Circulation | Target Angle | Key Pitch Asset |
| :--- | :--- | :--- | :--- |
| **Latent Space** (Swyx & Alessio) | 70k+ AI Engineers | Creative MCP tools beyond SQL/search; code-over-diffusion video pipelines | Technical deep dive on computer vision frame analysis + Remotion code generation |
| **The Rundown AI** (Rowan Cheung) | 650k+ AI Enthusiasts & Founders | "Build a high-converting product launch video with Claude in 5 minutes" | 15s screencast of Claude Desktop planning a video |
| **Ben's Bites** (Ben Tossell) | 120k+ Builders & Indie Hackers | "Open MCP tool of the day: frame-by-frame launch video blueprints" | Direct link to MCP URL + 1-sentence prompt |
| **TLDR AI / TLDR Web Dev** | 500k+ Software Developers | Open-source developer tools; Streamable HTTP MCP server on Cloudflare Workers | GitHub repository link + curl command |
| **PulseMCP Newsletter** | 15k+ Dedicated MCP Developers | "Server of the Week": 13 tools, zero auth, Cloudflare Workers implementation | `directory-submission/README.md` spec + live test verification |

### 5.2 Pitch Email Templates

#### Pitch A: For Developer Newsletters (TLDR, Ben's Bites, PulseMCP)
> **Subject**: Open MCP server: frame-by-frame launch video breakdowns for AI agents (zero-auth)
>
> Hey [Name],
>
> Quick heads-up on an open tool that launched today for the MCP and developer ecosystem:
>
> **Kuchi** (`https://kuchi.kalarislabs.com/`) is an open Streamable HTTP MCP server that analyzed 89+ top tech launch videos (Cursor, Notion, Vercel, Grok Bot) frame-by-frame using computer vision.
>
> Instead of generating hallucinatory AI video slop with Sora/Runway, coding agents (Claude, Cursor, Codex) connect to Kuchi with zero sign-in, study real launch pacing, and plan deterministic, 60fps Remotion (React) launch videos.
>
> - **Endpoint**: `https://kuchi.kalarislabs.com/mcp`
> - **Repo**: `https://github.com/KalarisLabs/kuchi`
> - **Key novelty**: 13 tools, zero auth, mathematical rhythm analysis, and built-in anti-slop checks that prevent copying reference brand copy.
>
> Would love to have it featured in this week's edition! Let me know if you need any assets or technical details.

#### Pitch B: For In-Depth Podcasts (Latent Space)
> **Subject**: The case for code-first video over diffusion slop in agent workflows (Kuchi MCP)
>
> Hey Swyx & Alessio,
>
> Loved the recent discussions on MCP expansion. We just open-sourced **Kuchi**, an MCP server on Cloudflare Workers that explores an under-discussed agent primitive: **multimodal video rhythm and code-first motion orchestration**.
>
> Generative video models (Runway/Sora) are fundamentally broken for developer marketing—they hallucinate UI, scramble code, and blur fonts. In contrast, Kuchi measures 89 top developer launches frame-by-frame (cut frequencies, entrance vectors, optical flow energy) and gives agents the exact blueprint to emit React/Remotion code.
>
> We also audited the server against the MCP spec (13 tools, `readOnlyHint`, Streamable HTTP, zero auth, Durable Object rate limiting).
>
> Thought this might be a compelling case study on how agents bridge computer vision datasets and code generation for creative engineering. Happy to share our raw dataset or frame-measurement pipeline!

---

## 6. Launch Timeline & Execution Checklist

### Phase 1: Day -3 (Preparation & Asset Finalization)
- [ ] **Technical Live Audit**: Run `npm --prefix agent-service run verify:live` to verify endpoint response times, CORS headers, and tool listings.
- [ ] **Render Launch Film**: Run `npm run render` in `launch/` to ensure `out/kuchi-launch.mp4` is exported cleanly.
- [ ] **Export Visual Assets**: Generate 5 core GIFs and 5 high-res carousel slides (1270×760px).
- [ ] **Product Hunt Draft**: Complete listing draft, upload video/stills, set scheduled launch for 00:01 PST.
- [ ] **Pre-Notify Core Network**: Reach out to 25 developer friends and early testers with preview links.
- [ ] **Staging Markdown Copies**: Finalize HN submission, Reddit post variations, and X thread drafts.

### Phase 2: Launch Day (Hour-by-Hour Execution)

| Time (PST) | Platform | Action Item |
| :--- | :--- | :--- |
| **00:01** | Product Hunt | Listing goes live. Post the Maker Comment immediately. Pin the comment. |
| **00:15** | X / Twitter | Post short "We're live on Product Hunt" announcement with link to PH. |
| **06:00** | Team / War Room | Check Cloudflare Worker error logs, PostHog telemetry, and PH leaderboard position. |
| **06:30** | Hacker News | Submit "Show HN: Kuchi – Open MCP server to plan software launch videos without AI slop". |
| **07:15** | X / Twitter | Publish the main launch mega-thread with the native 60s Remotion launch video. |
| **08:30** | Email / Newsletters | Dispatch personalized pitch emails to Ben's Bites, TLDR AI, The Rundown, and PulseMCP. |
| **09:30** | Reddit (Wave 1) | Post to `r/mcp` (technical architecture) and `r/ClaudeAI` (practical workflow). |
| **11:00** | Hacker News | First major comment check-in: reply to all technical inquiries on HN thread. |
| **13:00** | Reddit (Wave 2) | Post to `r/SideProject` (founder angle) and `r/Anthropic` (Claude Code plugin). |
| **15:00** | Product Hunt | Midday update comment thanking the community and sharing the most popular video template. |
| **17:00** | X / Twitter | Retweet best user reactions and quote-tweet Remotion creator Jonny Burger. |
| **21:00** | Daily Review | Log day 1 metrics: MCP requests, GitHub stars, PH upvotes, HN score. |

### Phase 3: Day +2 (Follow-Up & Momentum)
- [ ] **X Retrospective Thread**: Publish "What happened when 1,000+ developers connected Claude to Kuchi in 48 hours" (sharing request counts, popular templates, and user-generated remakes).
- [ ] **Community Pull Requests**: Triage and merge community submissions for new launch video breakdowns in `data/videos.json`.
- [ ] **External Directory Submissions**: Submit Kuchi to Smithery.ai, Glama.ai, PulseMCP, and top Awesome-MCP lists referencing the launch momentum.
- [ ] **Newsletter Follow-Up**: Send brief updates to newsletter editors who opened the pitch with current traction numbers.
- [ ] **Post-Mortem Documentation**: Document server load, error rates, and user feedback in `launch/POST_MORTEM.md`.

---

## 7. Metrics & Success KPIs

| Metric | Day 1 Target | Day 7 Target | Measurement Source |
| :--- | :--- | :--- | :--- |
| **Product Hunt Rank** | Top 3 Product of the Day | Golden Kitty Nominee | Product Hunt Dashboard |
| **Hacker News Points** | 100+ points, Front Page | Front Page Archive | Hacker News / Algolia |
| **MCP Requests** | 10,000+ requests | 50,000+ requests | Cloudflare Worker / PostHog |
| **GitHub Stars** | 300+ stars | 1,000+ stars | GitHub Repository |
| **Connected Agents** | 500+ unique IPs | 2,500+ unique IPs | PostHog Anonymous Telemetry |
| **Remotion Remakes Built** | 50+ recorded | 250+ recorded | `kuchi_check_remake` invocations |
