# Connecting AI Clients & IDEs to Kuchi MCP

Kuchi is an open, remote Model Context Protocol (MCP) server providing launch video inspiration templates, frame-by-frame measurements, remake planners, and Remotion video components.

* **Server Endpoint:** `https://kuchi.kalarislabs.com/mcp`
* **Transport Protocol:** Streamable HTTP (spec revisions 2026-07-28, 2025-03-26, and 2024-11-05 SSE backward compatibility)
* **Authentication:** None (zero-auth, stateless, open rate-limited tier)
* **Capabilities:** 13 tools (12 read-only, 1 write feedback), 2 prompts (`remake_launch_video`, `find_launch_inspiration`), and resources (`kuchi://workflow`, `skill://kuchi/SKILL.md`)

This guide provides exact copy-paste configuration snippets, setup walkthroughs, transport caveats, and community sharing locations for every major client ecosystem.

---

## Quick Reference Summary

| Client / Environment | Config Location | Transport Method | Auth / Headers | Native Support? |
| :--- | :--- | :--- | :--- | :--- |
| **Claude Desktop** | `claude_desktop_config.json` | `stdio` via `mcp-remote` proxy | None | Proxy needed for JSON; UI Connectors native |
| **Claude Web / Team** | Settings → Connectors | Streamable HTTP | None | Yes (native UI) |
| **Claude Code (CLI)** | CLI / `.claude.json` | HTTP / Plugin | None | Yes (`claude mcp add --transport http`) |
| **Cursor AI** | `.cursor/mcp.json` | Streamable HTTP / SSE | None | Yes (native) |
| **Windsurf (Codeium)** | `mcp_config.json` | SSE (`serverUrl`) | None | Yes (native) |
| **VS Code (Copilot)** | `.vscode/mcp.json` | HTTP | None | Yes (native) |
| **Cline (VS Code)** | `cline_mcp_settings.json` | SSE | None | Yes (native) |
| **Roo Code (VS Code)** | `mcp_settings.json` | SSE (`type: "sse"`) | None | Yes (native) |
| **Continue.dev** | `config.yaml` | `streamable-http` / `sse` | None | Yes (Agent mode) |
| **Raycast** | `Install MCP Server` | HTTP | None | Yes (macOS & iOS) |
| **Open-WebUI** | Admin → Integrations | `MCP (Streamable HTTP)` | None | Yes (v0.6.31+) |
| **LibreChat** | `librechat.yaml` | `streamable-http` / `sse` | None | Yes (native) |

---

## 1. Claude Desktop & Claude for Work

### A. Claude Desktop (`claude_desktop_config.json`)
Claude Desktop's JSON configuration strictly executes local command subprocesses (`stdio`). Because Kuchi is hosted over Streamable HTTP, Claude Desktop requires a lightweight local bridge like `mcp-remote` to proxy the streamable connection to standard I/O.

#### Configuration Path:
* **macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
* **Windows:** `%APPDATA%\Claude\claude_desktop_config.json`
* **Linux:** `~/.config/Claude/claude_desktop_config.json`

#### Copy-Paste JSON Config:
```json
{
  "mcpServers": {
    "kuchi": {
      "command": "npx",
      "args": [
        "-y",
        "mcp-remote",
        "https://kuchi.kalarislabs.com/mcp"
      ]
    }
  }
}
```

### B. Claude Desktop & Web UI Custom Connectors (Pro, Max, Team, Enterprise)
If you have access to Claude's native Custom Connectors UI:
1. Open Claude (web or desktop app) and go to **Settings → Connectors**.
2. Click **Add custom connector**.
3. Set Name to `Kuchi`, URL to `https://kuchi.kalarislabs.com/mcp`, and choose **No authentication**.
4. Or open the prefilled direct connect link: [https://kuchi.kalarislabs.com/agent/connect/claude](https://kuchi.kalarislabs.com/agent/connect/claude).

### C. Claude for Work (Team & Enterprise Organizations)
1. Team/Enterprise Workspace Admins navigate to **Admin Console → Integrations / Connectors**.
2. Add `https://kuchi.kalarislabs.com/mcp` as an organization-wide connector.
3. Once added, every member in the organization automatically has Kuchi available in their chat sessions without local configuration.

### D. Claude Code (CLI)
Connect directly via the terminal:
```bash
claude mcp add --transport http kuchi https://kuchi.kalarislabs.com/mcp
```
Or install the full plugin bundle (MCP server + SKILL):
```bash
claude plugin install kuchi --marketplace KalarisLabs/kuchi
```

### Community Sharing / Listing:
* **Claude Directory:** Submit at `claude.ai/directory/manage` (Connector & Plugin bundle).

---

## 2. Cursor AI

Cursor provides first-class native support for remote MCP endpoints over both SSE and Streamable HTTP.

### Setup Option 1: Via Cursor Settings UI
1. Open Cursor Settings (`Cmd+,` on macOS, `Ctrl+,` on Windows/Linux).
2. Navigate to **Features → MCP**.
3. Click **+ Add New MCP Server**.
4. Fill in:
   * **Name:** `kuchi`
   * **Type:** `sse`
   * **Server URL:** `https://kuchi.kalarislabs.com/mcp`
5. Click **Add**. The tools list will refresh and display green status indicators.

### Setup Option 2: Project-Level `.cursor/mcp.json`
To share the configuration with your entire engineering team via git:
Create `.cursor/mcp.json` in your repository root:
```json
{
  "mcpServers": {
    "kuchi": {
      "url": "https://kuchi.kalarislabs.com/mcp"
    }
  }
}
```

### Setup Option 3: Global User Config
Place the same snippet in your user-level configuration file:
* **macOS / Linux:** `~/.cursor/mcp.json`
* **Windows:** `%USERPROFILE%\.cursor\mcp.json`

### Community Sharing / Listing:
* **cursor.directory:** Submit Kuchi to [cursor.directory/mcp](https://cursor.directory/mcp) (or pull request to `pontusab/cursor.directory`). Tag under Creative, Video, Remotion, and Developer Tools.

---

## 3. Windsurf (Codeium)

Windsurf connects to MCP servers natively inside the Cascade AI interface.

### Configuration File Path:
* **macOS / Linux:** `~/.codeium/windsurf/mcp_config.json`
* **Windows:** `%USERPROFILE%\.codeium\windsurf\mcp_config.json`

*(Quick shortcut: Open Command Palette `Cmd+Shift+P` / `Ctrl+Shift+P` → type `Windsurf: Configure MCP Servers`).*

### Copy-Paste JSON Config:
```json
{
  "mcpServers": {
    "kuchi": {
      "serverUrl": "https://kuchi.kalarislabs.com/mcp",
      "transport": "sse"
    }
  }
}
```
*Note: Windsurf uses `"serverUrl"` with `"transport": "sse"`. No authentication headers are needed.*

### How to Apply:
1. Save `mcp_config.json`.
2. Open the Cascade panel in Windsurf and click the **Refresh** icon in the MCP servers list (or restart Windsurf).
3. All 13 Kuchi tools will appear active in Cascade.

### Community Sharing / Listing:
* **Codeium Community:** Share in the Codeium Discord (`discord.gg/codeium`) channels `#windsurf-mcp` and `#showcase`.
* **Awesome Windsurf:** Community GitHub registries for Windsurf extensions.

---

## 4. VS Code & Extensions (GitHub Copilot, Cline, Roo Code, Continue.dev)

### A. VS Code Native & GitHub Copilot
VS Code supports MCP natively for GitHub Copilot in Agent / Chat mode.
Depending on your VS Code MCP version and workflow, use either workspace format:

**Option 1: `.vscode/mcp.json` (Workspace Servers schema)**
```json
{
  "servers": {
    "kuchi": {
      "type": "http",
      "url": "https://kuchi.kalarislabs.com/mcp"
    }
  }
}
```

**Option 2: `.mcp.json` (Root Portable schema)**
```json
{
  "mcpServers": {
    "kuchi": {
      "type": "http",
      "url": "https://kuchi.kalarislabs.com/mcp"
    }
  }
}
```
Alternatively, run the Command Palette command `MCP: Add Server`, select **HTTP**, and input `https://kuchi.kalarislabs.com/mcp`.

### B. Cline (VS Code Extension)
1. Open the Cline sidebar in VS Code.
2. Click the **MCP Servers** icon (stacked plugs) → **Configure** tab → **Configure MCP Servers**.
3. Edit `~/.cline/data/settings/cline_mcp_settings.json`:
```json
{
  "mcpServers": {
    "kuchi": {
      "url": "https://kuchi.kalarislabs.com/mcp",
      "type": "sse",
      "disabled": false
    }
  }
}
```

### C. Roo Code (Roo Cline)
1. Open Roo Code in the sidebar → click the **MCP Servers** icon at the top.
2. Click **Edit Global MCP** (for global `mcp_settings.json`) or **Edit Project MCP** (for workspace `.roo/mcp.json`).
3. Add the server snippet (*Important: Roo Code requires `"type": "sse"` when a URL is given*):
```json
{
  "mcpServers": {
    "kuchi": {
      "type": "sse",
      "url": "https://kuchi.kalarislabs.com/mcp"
    }
  }
}
```

### D. Continue.dev
In Continue.dev, remote MCP tools are available in **Agent Mode**.
Edit your global configuration (`~/.continue/config.yaml` on macOS/Linux or `%USERPROFILE%\.continue\config.yaml` on Windows), or create a workspace file `.continue/mcpServers/kuchi.yaml`:

```yaml
name: Kuchi Tools
version: 1.0.0
schema: v1

mcpServers:
  - name: kuchi
    type: streamable-http
    url: https://kuchi.kalarislabs.com/mcp
```
*(If using the legacy `config.json` schema: `{"mcpServers": {"kuchi": {"transport": {"type": "sse", "url": "https://kuchi.kalarislabs.com/mcp"}}}}`).*

### Community Sharing / Listing:
* **Continue Hub:** Share on [hub.continue.dev](https://hub.continue.dev).
* **Cline / Roo Code Community:** Post in Cline Discord and community directories.

---

## 5. Raycast & Desktop Launchers

### A. Raycast (macOS & iOS)
Raycast features built-in native support for remote HTTP MCP servers across AI Chat, Quick AI, and AI Commands.

#### Installation Steps:
1. Open Raycast (`Cmd+Space`).
2. Search for and execute **`Install MCP Server`**.
3. Fill in the form fields:
   * **Name:** `Kuchi`
   * **Transport:** `HTTP`
   * **URL:** `https://kuchi.kalarislabs.com/mcp`
   * **HTTP Headers:** (Leave blank)
   * **OAuth Type:** (Leave blank / None)
4. Press `Cmd+Enter` to install.
5. Raycast handshakes with Kuchi immediately and registers all 13 tools.

#### Daily Workflow:
* Open Raycast AI Chat (`Cmd+Shift+Space`) and type `@kuchi` to plan launch videos, look up reference timings, or fetch Remotion components without opening a browser or IDE.

#### Community Sharing / Listing:
* **Raycast Store Extension:** Build and publish a community extension or custom AI Command package to the [Raycast Store](https://www.raycast.com/store) via the `raycast/extensions` GitHub repository.

### B. Alfred & Flow Launcher
* Integrate via terminal workflows executing `npx mcp-remote https://kuchi.kalarislabs.com/mcp` or curl scripts querying Kuchi's public JSON API (`https://kuchi.kalarislabs.com/agent/catalog.json`).

---

## 6. Open-WebUI & LibreChat

### A. Open-WebUI (v0.6.31+)
Open-WebUI supports native Streamable HTTP MCP connections without requiring third-party proxies.

#### Setup Steps:
1. Log in to your Open-WebUI instance as an **Admin**.
2. Navigate to **Admin Settings → Integrations**.
3. In the **External Tool Servers** section, click **+ Add Connection**.
4. Configure the server:
   * **Type:** Select **`MCP (Streamable HTTP)`** *(Do NOT select OpenAPI)*.
   * **Name:** `Kuchi`
   * **Server URL:** `https://kuchi.kalarislabs.com/mcp`
   * **Auth:** None / Leave blank.
5. Click **Save**.
6. When chatting with any tool-calling model (e.g. Claude 3.5 Sonnet, GPT-4o, Llama 3.3), enable the Kuchi tools in the chat interface.

#### Community Sharing / Listing:
* Share Modelfiles and custom Kuchi system prompts on the [Open WebUI Community Portal](https://openwebui.com).

### B. LibreChat (v0.7.x+)
LibreChat supports native remote MCP endpoints configured in `librechat.yaml`.

#### Configuration (`librechat.yaml`):
```yaml
version: 1.2

mcpServers:
  kuchi:
    type: streamable-http
    url: https://kuchi.kalarislabs.com/mcp
    timeout: 60000
    serverInstructions: true
```
*Note: Setting `serverInstructions: true` automatically pulls Kuchi's official prompt workflow guidance directly into LibreChat.*

#### Apply Changes:
1. Save `librechat.yaml`.
2. Restart the LibreChat API container:
   ```bash
   docker compose restart api
   ```
3. Kuchi tools will appear in the MCP agent/tools dropdown for all users.

#### Community Sharing / Listing:
* Share in LibreChat GitHub Discussions and the Discord `#config-sharing` channel.

---

## Universal Setup Prompt for Any AI Agent

If an agent or tool does not have a dedicated configuration file but accepts natural language MCP instructions, paste this universal prompt:

```text
Connect the Kuchi MCP server at https://kuchi.kalarislabs.com/mcp (Streamable HTTP, no sign-in) and confirm it works by listing its tools.

Kuchi is a library of real product-launch videos to use as inspiration templates. When I want a launch video, read kuchi_get_workflow and follow it: get a short list with kuchi_suggest_templates and show me each one's poster and link so I can choose, in chat or by picking a video on kuchi.kalarislabs.com and pasting its link. Once I pick one, study it with kuchi_get_breakdown, look at its storyboard and note what each shot shows, then call kuchi_plan_remake with my product details and your shot analysis, and ask me for my logo, screenshots and anything else it lists as missing. Build to the blueprint's frames. Before you deliver, run kuchi_check_remake and compare your frames with the reference. Copy only the reference's motion and taste; everything on screen comes from my product.
```
