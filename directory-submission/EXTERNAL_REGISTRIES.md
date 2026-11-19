# External MCP Directories, Registries & Aggregators Guide for Kuchi

This guide provides research, submission mechanisms, compatibility audits, reach/traffic tier analysis, and copy-paste submission payloads for listing the **Kuchi** MCP Server across all major third-party directories, registries, and curated lists.

---

## Server Profile Reference
* **Server Name:** Kuchi (`io.github.KalarisLabs/kuchi`)
* **Transport:** Streamable HTTP
* **Endpoint URL:** `https://kuchi.kalarislabs.com/mcp`
* **Website:** https://kuchi.kalarislabs.com/
* **Repository:** https://github.com/KalarisLabs/kuchi
* **Authentication:** None (`🔓` Zero auth / anonymous)
* **Tools:** 13 tools (12 read-only, 1 feedback write tool)
* **Infrastructure:** Cloudflare Workers (edge compute, sub-50ms latency globally)
* **Category:** Video, Multimedia, Design, Creativity, Developer Tools

---

## Directory Summary Matrix

| Directory / Aggregator | Reach / Traffic Tier | Submission Mechanism | Streamable HTTP Compatibility | Key Requirements |
| :--- | :--- | :--- | :--- | :--- |
| **Smithery.ai** | **Tier 1** (Global MCP leader) | Web Portal (GitHub OAuth) + CLI / API | **Native** (HTTP / remote + proxy) | `smithery.yaml` in repo root or web endpoint declaration |
| **Glama.ai** | **Tier 1** (Registry + Inspector) | Web Portal (GitHub OAuth) | **Native** (First-class live check) | Verified GitHub repo ownership; yields Glama Badge |
| **PulseMCP** | **Tier 1** (Directory + Newsletter) | Web Portal + Email Editorial Pitch | **Native** (Featured in remote tag) | Public endpoint, clear docs, zero-auth appeal |
| **punkpeye/awesome-remote-mcp-servers** | **Tier 1** (Top GitHub remote list) | GitHub Pull Request | **Native** (100% remote-focused) | Star repo, public URL, **Glama Connector Badge required** |
| **punkpeye/awesome-mcp-servers** | **Tier 1** (Top GitHub repo list) | GitHub Pull Request | Repo-level (Local/installable code) | Public GitHub repo, alphabetical order, agent tag `🤖🤖🤖` |
| **wong2 / mcpservers.org** | **Tier 1** (Top ranked web directory) | **Web Portal Only** (`mcpservers.org/submit`) | **Compatible** | **Do NOT open PR on GitHub**; use submission form |
| **mcp.so** | **Tier 1** (20,800+ servers index) | Web Form (`mcp.so/submit`) | **Native** (Remote server tag) | Free review or instant verified listing |
| **cursor.directory** | **Tier 1** (IDE developer focus) | Web Portal (GitHub login) | **Native** (Cursor `mcp.json` URL format) | Ready-to-use Cursor config snippet |
| **MCPHub (`mcphub.dev`)** | **Tier 2** (Gateway / control plane) | Portal / Registry catalog | **Native** | Control-plane integration |
| **mcp-get** | **DEPRECATED** | *N/A (Deprecated)* | *N/A* | Maintainer deprecated in favor of **Smithery.ai** |

---

## Detailed Directory Profiles & Submission Playbooks

### 1. Smithery.ai
* **Website:** https://smithery.ai
* **Profile / Listing URL Format:** `https://smithery.ai/server/@kalarislabs/kuchi`
* **Reach / Traffic:** Tier 1. Top registry referenced by CLI tooling (`npx -y @smithery/cli install ...`) and desktop clients.
* **Compatibility with Streamable HTTP:** Fully compatible. Smithery connects directly to hosted HTTP endpoints and supports zero-install remote routing.
* **Configuration File (`smithery.yaml`):**
  Add `smithery.yaml` to the root of `KalarisLabs/kuchi`:
  ```yaml
  name: "@kalarislabs/kuchi"
  description: "Pick a real launch video as a template, get its frame-by-frame breakdown and plan your own remake without AI video generation slop."
  version: "1.4.0"
  icon: "https://kuchi.kalarislabs.com/favicon-180.png"
  websiteUrl: "https://kuchi.kalarislabs.com/"
  repository: "https://github.com/KalarisLabs/kuchi"
  startCommand:
    type: http
    url: "https://kuchi.kalarislabs.com/mcp"
  tags:
    - video
    - remotion
    - launch-videos
    - design
    - templates
    - creativity
  ```
* **Submission Steps:**
  1. Commit `smithery.yaml` to `main` branch on GitHub.
  2. Visit [smithery.ai](https://smithery.ai) and sign in via GitHub OAuth.
  3. Navigate to **Publish on Smithery** (`https://smithery.ai/publish`).
  4. Select `KalarisLabs/kuchi`. Smithery auto-detects `smithery.yaml` and executes an `initialize` handshake against `https://kuchi.kalarislabs.com/mcp`.
  5. Verify that all 13 tools are indexed. Click **Publish**.
  6. Confirm installation syntax: `npx -y @smithery/cli install @kalarislabs/kuchi --client claude`.

---

### 2. Glama.ai (Registry, Playground & Inspector)
* **Website:** https://glama.ai/mcp/servers & https://glama.ai/mcp/connectors
* **Inspector / Playground:** `https://glama.ai/mcp/inspector?url=https%3A%2F%2Fkuchi.kalarislabs.com%2Fmcp&transport=http`
* **Reach / Traffic:** Tier 1. Major MCP intelligence platform, tracks tool definition quality score (TDQS), server health, and uptime.
* **Compatibility with Streamable HTTP:** 100% native. Glama tests and benchmarks remote endpoints over HTTP/SSE.
* **Prerequisite for other directories:** Having an active Glama connector badge is **mandatory** for `punkpeye/awesome-remote-mcp-servers`.
* **Submission Steps:**
  1. Navigate to https://glama.ai/mcp/servers and click **Add MCP Server** (or https://glama.ai/mcp/connectors).
  2. Log in with the GitHub account that maintains `KalarisLabs/kuchi`.
  3. Enter Repository: `https://github.com/KalarisLabs/kuchi`.
  4. Enter Remote Endpoint: `https://kuchi.kalarislabs.com/mcp`.
  5. Glama will trigger an automated build, inspect the 13 tools, and publish the connector at:
     `https://glama.ai/mcp/connectors/io.github.KalarisLabs/kuchi`
  6. Test the server using the online Glama Inspector to verify tool parameter schemas and zero-auth operation.
  7. Copy the generated connector badge for README and awesome list PRs:
     ```markdown
     [![Kuchi MCP connector](https://glama.ai/mcp/connectors/io.github.KalarisLabs/kuchi/badges/score.svg)](https://glama.ai/mcp/connectors/io.github.KalarisLabs/kuchi)
     ```

---

### 3. PulseMCP
* **Website:** https://www.pulsemcp.com
* **Submission Portal:** https://www.pulsemcp.com/submit
* **Contact Email:** `hello@pulsemcp.com`
* **Newsletter:** *The Agentic Loop* / PulseMCP Weekly.
* **Reach / Traffic:** Tier 1 community hub and newsletter with thousands of AI agent developers.
* **Compatibility with Streamable HTTP:** Fully compatible. Actively tags and showcases remote endpoints.
* **Submission Steps:**
  1. Go to `https://www.pulsemcp.com/submit`.
  2. Fill out server details:
     * **Name:** Kuchi
     * **Endpoint URL:** `https://kuchi.kalarislabs.com/mcp`
     * **Repository URL:** `https://github.com/KalarisLabs/kuchi`
     * **Category:** Media / Design / Video
     * **Auth:** None (Public / Free)
     * **Description:** "Curated library of real launch videos measured frame-by-frame. Plan product remake blueprints and copy-paste Remotion video components without AI video generation slop."
  3. Send an editorial pitch email for newsletter inclusion to `hello@pulsemcp.com` (and `contact@mcpnewsletter.com`):
     * **Subject:** `[Feature Pitch] Kuchi: Frame-measured launch video template MCP server (Zero Auth, Streamable HTTP)`
     * **Body:**
       > Hi PulseMCP team,
       >
       > We built Kuchi, a production-ready MCP server for AI coding agents (Claude, Cursor, Codex) that solves product launch video creation without AI generation slop:
       >
       > • Endpoint: https://kuchi.kalarislabs.com/mcp (Streamable HTTP, zero auth, Cloudflare Workers hosted)
       > • GitHub: https://github.com/KalarisLabs/kuchi (server.json v1.4.0)
       > • What it does: 13 tools that query real measured launch videos frame-by-frame, plan customized remake blueprints (motion styles, timing, entrances), and serve copy-paste Remotion video components.
       >
       > Would love to have Kuchi featured in the PulseMCP directory and the upcoming newsletter edition!

---

### 4. Curated GitHub Awesome Lists

#### A. `punkpeye/awesome-remote-mcp-servers` (Highest Priority List for Remote Endpoints)
* **Repository:** https://github.com/punkpeye/awesome-remote-mcp-servers
* **Reach / Traffic:** Tier 1. Primary curated GitHub resource dedicated specifically to hosted/remote MCP endpoints.
* **Crucial Submission Rules:**
  1. The submitting GitHub account **MUST STAR the repository**. PRs from non-stargazers fail CI and are closed.
  2. Must have an active Glama connector badge (resolving at `glama.ai/mcp/connectors/...`).
  3. Keep alphabetical order in the chosen category (`🎥 Multimedia` or `🎨 Art & Design`).
  4. If automated agent, append `🤖🤖🤖` to PR title for fast-tracked auto-merge.
* **PR Entry Snippet:**
  Place under `### 🎥 Multimedia` (in alphabetical order):
  ```markdown
  - 🔓 [Kuchi](https://kuchi.kalarislabs.com/) `https://kuchi.kalarislabs.com/mcp` [![Kuchi MCP connector](https://glama.ai/mcp/connectors/io.github.KalarisLabs/kuchi/badges/score.svg)](https://glama.ai/mcp/connectors/io.github.KalarisLabs/kuchi) - Pick a real launch video as a template, get its frame-by-frame breakdown and plan your own remake without AI video generation slop.
  ```
  *(Note: Must be on a single continuous line for CI Markdown linters).*
* **PR Title:** `Add Kuchi launch video template server 🤖🤖🤖`

#### B. `punkpeye/awesome-mcp-servers` (Open Source Code Repository List)
* **Repository:** https://github.com/punkpeye/awesome-mcp-servers
* **PR Entry Snippet:**
  Place under `### 🎨 Art & Culture` or `### 📐 Architecture & Design`:
  ```markdown
  - [KalarisLabs/kuchi](https://github.com/KalarisLabs/kuchi) ☁️ ⌨️ - Pick a real launch video as a template, get its frame-by-frame breakdown and plan your own remake.
  ```
* **PR Title:** `Add KalarisLabs/kuchi server 🤖🤖🤖`

#### C. `wong2/awesome-mcp-servers` & `mcpservers.org`
* **Repository:** https://github.com/wong2/awesome-mcp-servers
* **Website:** https://mcpservers.org
* **CRITICAL RULE:** **DO NOT SUBMIT GITHUB PULL REQUESTS.** The maintainer explicitly disables PR contributions on GitHub and redirects all submissions to the web form.
* **Submission Portal:** https://mcpservers.org/submit
* **Submission Form Fields:**
  * **Repository URL:** `https://github.com/KalarisLabs/kuchi`
  * **Server Name:** Kuchi
  * **Remote URL:** `https://kuchi.kalarislabs.com/mcp`
  * **Category:** Design / Media
  * **Description:** "Curated launch videos measured frame by frame. Pick a reference template, get shot breakdowns, and plan remakes for AI coding agents."

#### D. `korchasa/awesome-mcp`
* **Repository:** https://github.com/korchasa/awesome-mcp
* **Submission Mechanism:** GitHub PR to `README.md` under `Servers` -> `Media & Entertainment`.
* **Entry Format:**
  ```markdown
  - [Kuchi](https://github.com/KalarisLabs/kuchi) - Reference launch video templates measured frame-by-frame with Remotion components for AI coding agents.
  ```

---

### 5. Other Top Aggregators

#### A. `mcp.so`
* **Website:** https://mcp.so
* **Submission URL:** https://mcp.so/submit
* **Scale / Reach:** Over 20,800 indexed servers and 1,500+ remote endpoints. Strong developer traffic.
* **Compatibility:** Native remote Streamable HTTP support.
* **Submission Steps:**
  1. Visit `https://mcp.so/submit`.
  2. Select Type: **MCP Server**.
  3. Enter Name: `Kuchi`.
  4. Repository URL: `https://github.com/KalarisLabs/kuchi`.
  5. Remote Endpoint: `https://kuchi.kalarislabs.com/mcp`.
  6. Tags: `video`, `remotion`, `design`, `templates`, `streamable-http`.
  7. Select Free Review tier.

#### B. `cursor.directory`
* **Website:** https://cursor.directory & https://cursor.directory/mcp
* **Reach:** Top destination for Cursor AI IDE developers.
* **Compatibility:** Native via Cursor `mcp.json`.
* **Submission Steps:**
  1. Sign in via GitHub on `https://cursor.directory`.
  2. Click **Submit** -> **MCP Server**.
  3. Provide Name: `Kuchi Launch Video Templates`.
  4. Provide Configuration JSON:
     ```json
     {
       "mcpServers": {
         "kuchi": {
           "url": "https://kuchi.kalarislabs.com/mcp"
         }
       }
     }
     ```
  5. Add Description and tags (`cursorrules`, `remotion`, `video`, `mcp`).

#### C. `MCPHub` (`mcphub.dev` & `samanhappy/mcphub`)
* **Website:** https://mcphub.dev
* **Nature:** Self-hosted and cloud MCP gateway / aggregator.
* **Submission:** Submit repo and remote endpoint for inclusion in the built-in MCPHub marketplace registry.

#### D. `mcp-get` (`@michaellatman/mcp-get`)
* **Status:** **DEPRECATED**.
* **Finding:** The package maintainer has officially deprecated `mcp-get` and recommends migrating to **Smithery.ai**. No submission action required.

---

## Action Plan & Execution Checklist

1. [ ] **Add `smithery.yaml` to repository root** of `KalarisLabs/kuchi` and publish to Smithery.ai.
2. [ ] **Submit to Glama.ai (`glama.ai/mcp/servers`)** to index the server and generate the verified `score.svg` badge.
3. [ ] **Submit PR to `punkpeye/awesome-remote-mcp-servers`** with the Glama badge under `🎥 Multimedia` (ensuring the submitting account has starred the repo, and adding `🤖🤖🤖` to title).
4. [ ] **Submit PR to `punkpeye/awesome-mcp-servers`** under `🎨 Art & Culture`.
5. [ ] **Submit form on `mcpservers.org/submit`** (wong2's directory).
6. [ ] **Submit form on `mcp.so/submit`** under MCP Server (Remote).
7. [ ] **Submit on `cursor.directory`** with Cursor `mcp.json` copy-paste snippet.
8. [ ] **Submit to `pulsemcp.com/submit`** and dispatch editorial pitch email to `hello@pulsemcp.com` and `contact@mcpnewsletter.com`.
