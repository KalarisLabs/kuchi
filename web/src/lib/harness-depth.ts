// Depth for each agent guide (pages/agents/[slug].astro): how the harness loads MCP servers,
// what a full run looks like inside it, and a troubleshooting table. Hand-written per harness
// (owner, 2026-11-19: the cash pages need technical depth and more words to be indexed).
//
// Same rule as lib/harnesses.ts: config paths, keys and commands only as the harness's own docs
// give them (each is already recorded, with its source, in harnesses.ts). Where a harness's
// behaviour is not documented, describe the MCP side instead of guessing.

/** When the guides' technical sections were last reviewed (shown in the byline, dateModified). */
export const DEPTH_UPDATED = '2026-11-19';

export interface Depth {
  /** How this harness finds, stores and reloads MCP servers. */
  config: string[];
  /** A full run of the remake inside this harness. */
  run: string[];
  /** Symptom → fix. */
  troubleshoot: [string, string][];
}

const http = 'Streamable HTTP';

export const depth: Record<string, Depth> = {
  'claude-code': {
    config: [
      'Claude Code keeps MCP servers in three scopes. `claude mcp add` writes to local scope by default (this project, only you); `--scope project` writes a `.mcp.json` at the repo root that teammates get when they pull; `--scope user` makes the server available in every project on your machine. For a library you will use across repos, user scope is the natural choice: `claude mcp add --scope user --transport http kuchi https://kuchi.kalarislabs.com/mcp`.',
      `The \`--transport http\` flag is what selects ${http}. Without it Claude Code assumes a local stdio command and tries to execute the URL. \`claude mcp list\` shows each server with its status, and \`/mcp\` inside a session shows the tools it loaded. The plugin route adds the server and the workflow skill together, and the skill is what makes Claude Code reach for the library unprompted when you say "launch video".`,
      'Claude Code asks before the first call to each tool. Every tool on this server is annotated read-only and idempotent, so allowing them for the session is safe; nothing on the server changes and nothing on your machine is touched by the tools themselves.',
    ],
    run: [
      'A typical run: Claude Code calls kuchi_suggest_templates with a one-line description of your repo, shows the posters, and waits. After your pick it calls kuchi_get_breakdown, opens the storyboard images (Claude Code reads images natively), and writes a shot analysis: one kind per shot, plus a line on what is on screen. That analysis goes into kuchi_plan_remake with your product name, features, colours and the asset paths you gave it.',
      'Once the plan returns ready=true, Claude Code scaffolds Remotion, writes one component per shot and a single shot list with start and end frames from the blueprint, then renders stills at the compare_frames times from kuchi_check_remake. Because it can read those stills next to the reference storyboard, it can see a headline that sits too low or a screen that enters a few frames late, and fix it before the final render.',
      'Put brand rules in CLAUDE.md (hex colours, font files, the folder with screenshots) so a fresh session does not need them repeated, and ask Claude Code to keep the blueprint in a file such as `video/plan.json` so later edits work from the plan, not from memory.',
    ],
    troubleshoot: [
      ['Claude Code says it cannot connect, or tries to run the URL as a command', 'The server was added without `--transport http`. Remove it with `claude mcp remove kuchi` and add it again with the flag.'],
      ['The server works in one repo but not another', 'It was added in local scope. Add it again with `--scope user`.'],
      ['Tools never get called when you ask for a launch video', 'Install the plugin (it adds the skill), or paste the setup prompt once per session.'],
      ['Renders differ from the plan by a frame or two', 'The shot list was rounded to seconds. Ask Claude Code to use the blueprint\'s start_frame and end_frame values directly.'],
    ],
  },
  codex: {
    config: [
      'Codex stores MCP servers in `~/.codex/config.toml`, shared by the CLI and the IDE extension. `codex mcp add kuchi --url https://kuchi.kalarislabs.com/mcp` writes an `[mcp_servers.kuchi]` table with a `url` key, which is how Codex knows the server is remote over Streamable HTTP rather than a local command. `codex mcp list` prints what is configured.',
      'Because the file is plain TOML you can also edit it by hand, and the same entry works wherever Codex reads that config. The Codex app opens a task with the setup prompt filled in from the button on this page, so it knows the workflow from the first message.',
      'Codex runs commands under an approval policy and, depending on how you start it, inside a sandbox. Tool calls to this server are read-only on the server side; the commands that matter for approval are the local ones, such as `npm install` and `npx remotion render`.',
    ],
    run: [
      'In a run, Codex calls kuchi_suggest_templates, shows the posters and waits for your choice, then calls kuchi_get_breakdown. You can attach a frame of the reference as an image if you want it to look closer at one shot. It writes the shot analysis, calls kuchi_plan_remake, and asks you once for anything in missing_inputs.',
      'With the blueprint, Codex writes the Remotion project: a `Root.tsx` registering one composition at the blueprint\'s fps and total frames, and one `<Sequence>` per shot using start_frame and the shot\'s length in frames. It renders, calls kuchi_check_remake with the shot list (each shot keeps its reference_shot so timing can be compared), and fixes what is flagged.',
      'AGENTS.md is the place for project rules: composition size, brand colours, where assets live, and "never round frame numbers". Codex reads it at the start of every task.',
    ],
    troubleshoot: [
      ['`npm install` fails with a network error', 'The sandbox has no network access for that command. Approve network for the step, or run the install yourself.'],
      ['Codex lists no tools from the server', 'Check `~/.codex/config.toml` has `url` (not `command`) under `[mcp_servers.kuchi]`, then start a new session.'],
      ['The app and the CLI behave differently', 'Both read the same config file; make sure both were restarted after adding the server.'],
      ['The plan keeps returning ready=false', 'Read missing_inputs: usually target length, a logo, or shots without a kind. Answer them and call kuchi_plan_remake again.'],
    ],
  },
  cursor: {
    config: [
      'Cursor reads MCP servers from `~/.cursor/mcp.json` (global) and `.cursor/mcp.json` (this project). The one-click install link writes a `kuchi` entry with a `url` key, which Cursor treats as a remote server; a `command` key would mean a local process instead.',
      'Settings → MCP lists every server with a status indicator and its tools; you can switch individual tools off there if you want the agent to see fewer. A project-level `.cursor/mcp.json` checked into the repo gives every teammate the same server.',
      `The server speaks ${http} with no authentication, so the entry needs nothing but the URL: no headers, no environment variables, no API key.`,
    ],
    run: [
      'In Agent mode, Cursor calls kuchi_suggest_templates, shows posters inline and waits. After your pick it reads the breakdown and the storyboard, writes the shot analysis and calls kuchi_plan_remake. Because Cursor indexes your codebase, you can tell it to reuse real components from `src/` for the product shots, which gives you pixel-true UI rather than a redrawn mock.',
      'It then scaffolds Remotion in its own folder, builds one component per shot on the blueprint\'s frames and runs `npx remotion studio` in the terminal so you can watch. Terminal commands wait for your approval unless you allow them; allow the render command for the session to keep the loop fast.',
      'Project rules (a rule file in `.cursor/rules`) are a good place for the video\'s look: fonts, colours, safe margins and the instruction to keep blueprint frame numbers exact.',
    ],
    troubleshoot: [
      ['The server shows a red dot in Settings → MCP', 'Open the entry and check the URL ends in `/mcp`; Cursor shows the error beside it.'],
      ['The agent ignores the tools', 'You are in Ask mode. Switch to Agent mode, or name the tool in the prompt.'],
      ['Imported app components crash the render', 'Remotion renders in a headless browser frame by frame; components that fetch data or depend on window size need a static version for the video.'],
      ['Teammates do not see the server', 'Move the entry from `~/.cursor/mcp.json` to `.cursor/mcp.json` in the repo.'],
    ],
  },
  'vs-code': {
    config: [
      'VS Code stores MCP servers in `.vscode/mcp.json` for a workspace, or in your user configuration for every workspace. The install link on this page adds an entry of type `http` with the URL; VS Code asks you to confirm and trust the server the first time it starts.',
      'In Copilot Chat, agent mode is the only mode that calls tools. The tools picker (the tools icon in the chat input) lists every server and its tools, each with a checkbox; agent mode only sees the ones that are ticked. With many servers installed, untick the ones you do not need for a video so the right tools get chosen.',
      `This server needs no inputs: no API key prompt, no headers. It speaks ${http}, which VS Code selects from the \`http\` type.`,
    ],
    run: [
      'In agent mode Copilot calls kuchi_suggest_templates, shows the posters and waits. It reads the breakdown, analyses the storyboard and plans, then scaffolds Remotion in a folder of your workspace and builds the shots. Every terminal command is shown for confirmation, which keeps installs and renders visible.',
      'For a vertical cut, say so before planning: the plan takes an aspect ratio and re-times the reference to your length, and the composition in Root.tsx should use the matching width and height (1080×1920 for 9:16).',
      'Copilot instructions files are the right place for repeatable rules such as "keep start_frame and end_frame from the blueprint".',
    ],
    troubleshoot: [
      ['Copilot says it has no video tools', 'Open the tools picker in agent mode and tick the server\'s tools.'],
      ['The server never starts', 'Open the MCP server list (Command Palette → MCP: List Servers), start it and read its output.'],
      ['Commands are not run', 'You are in Ask or Edit mode. Switch to agent mode.'],
      ['The wrong tools get picked', 'Too many servers are enabled. Untick the ones you do not need for this task.'],
    ],
  },
  'gemini-cli': {
    config: [
      'Gemini CLI reads `mcpServers` from `~/.gemini/settings.json` (user) and `.gemini/settings.json` in a project. The key matters: `httpUrl` selects Streamable HTTP, `url` selects the older SSE transport, and `command` starts a local process. This server needs `httpUrl`.',
      'Servers load when Gemini CLI starts, so restart after editing the file. Inside a session, `/mcp` lists each server, whether it connected and the tools and descriptions it offers, which is the quickest way to confirm the setup.',
      'GEMINI.md files hold context the CLI loads every session, so brand colours, asset folders and composition size belong there.',
    ],
    run: [
      'A run: Gemini calls kuchi_suggest_templates, shows the list and waits; after your pick it reads kuchi_get_breakdown and the storyboard, writes the shot analysis and calls kuchi_plan_remake. Gemini\'s long context lets it keep the whole blueprint and storyboard in view while it builds every shot, which helps on references with many cuts.',
      'It scaffolds Remotion with `npx create-video@latest`, builds the shots on the blueprint frames and renders. Before rendering the final file, ask it to call kuchi_check_remake and render stills at the compare_frames times.',
      'Gemini CLI asks before running shell commands; approve the Remotion install and render steps.',
    ],
    troubleshoot: [
      ['`/mcp` shows the server as disconnected', 'The entry uses `url`. Change it to `httpUrl` and restart.'],
      ['Changes to settings.json have no effect', 'Restart Gemini CLI; servers load at start.'],
      ['Tools time out on large breakdowns', 'Ask for one step of the workflow at a time, and page the blueprint with shot_offset and shot_limit.'],
      ['It invents a logo', 'Tell it to leave a marked placeholder; the check flags generated logos.'],
    ],
  },
  claude: {
    config: [
      'On claude.ai, custom connectors live under Customize → Connectors. A connector added there belongs to your account, so it appears in the desktop app too. The link on this page opens the add-connector dialog with the name and URL filled in.',
      `The connector is a remote MCP server over ${http}. Claude also supports OAuth for servers that need it; this one needs none, so leave the advanced fields empty. Once added, each chat lets you switch connectors on or off from the tools menu, and Claude asks before the first use of a tool.`,
      'On Team and Enterprise plans an owner may need to allow custom connectors for the organisation before members can add them.',
    ],
    run: [
      'In a chat, Claude calls kuchi_suggest_templates with your description and shows the posters and links; you choose. It reads kuchi_get_breakdown, looks at the storyboard image and describes every shot, then calls kuchi_plan_remake with your details. Missing items come back as missing_inputs and Claude asks for them in one message.',
      'The output is the blueprint: every shot with start and end frame, entrance, motion and what of yours goes in it. Ask Claude to lay it out as an artifact table you can copy, or as JSON for a coding agent. Claude Code then builds and renders it; the plan is the same either way, so nothing is lost in the hand-off.',
      'Claude does not render the video in chat. The split is deliberate: the chat app chooses and plans, a coding agent writes and renders.',
    ],
    troubleshoot: [
      ['Claude does not use the connector', 'Switch it on for this chat from the tools menu.'],
      ['The add dialog asks for OAuth details', 'Leave them empty; this server has no authentication.'],
      ['You cannot add connectors', 'Your organisation may restrict them. Ask an owner to allow custom connectors.'],
      ['Storyboard images do not show', 'Claude fetches them from the CDN; retry, or ask for the storyboard link and open it yourself.'],
    ],
  },
  chatgpt: {
    config: [
      'ChatGPT adds remote MCP servers in Plugins: + → Add custom MCP server. You give a name, the Server URL and the authentication type; this server uses No authentication. ChatGPT warns that custom servers are not reviewed; accept and create it as a plugin.',
      `ChatGPT connects over ${http}. Some ChatGPT surfaces only call two tools, \`search\` and \`fetch\`; this server provides both alongside the richer kuchi_ tools, so it works in either case.`,
      'On business workspaces an admin may need to allow custom MCP servers before members can add them.',
    ],
    run: [
      'In a chat with the plugin on, ChatGPT calls kuchi_suggest_templates and shows the posters with links. After your pick it reads the breakdown, analyses the storyboard and calls kuchi_plan_remake. If you ask for a different length or aspect ratio, it passes target_seconds and aspect_ratio and the blueprint is re-timed on whole frames.',
      'The blueprint is the deliverable: a frame-timed shot list with your content in each shot. Ask ChatGPT for it as JSON, then hand it to Codex or Claude Code to build and render.',
      'Tool results come back as Markdown by default; ask for JSON when you want the structured version.',
    ],
    troubleshoot: [
      ['The plugin is created but never used', 'Turn it on in the chat before asking.'],
      ['ChatGPT only searches and fetches', 'That surface only calls search and fetch. Use a chat where the full plugin is available, or ask it to call kuchi_suggest_templates by name.'],
      ['Creation fails with an auth error', 'Choose No authentication; OAuth is not needed.'],
      ['Your workspace hides the option', 'An admin must allow custom MCP servers.'],
    ],
  },
  grok: {
    config: [
      'Grok adds custom connectors on the Connectors page at grok.com: New Connector → Custom, then paste the server URL. A connector is a remote MCP server; this one speaks Streamable HTTP and needs no sign-in, headers or OAuth, so the URL is the whole configuration.',
      'The connector belongs to your Grok account, so once it is connected you can use it from any chat. Grok, Grok Bot and Grok Build are configured separately: the chat app uses Connectors, the Bot desktop app uses Connect apps, and Grok Build reads `~/.grok/config.toml`. Adding the server to one does not add it to the others.',
      'Every tool on this server is annotated read-only, idempotent and closed-world (readOnlyHint, idempotentHint, openWorldHint false), which tells Grok that calling them changes nothing anywhere and that the same call returns the same answer.',
    ],
    run: [
      'Describe your product in a sentence and ask for templates. Grok calls kuchi_suggest_templates and shows a numbered list with posters and links; each entry says what fits your product, what differs and what you would need to supply. Choose by number, or paste a link from the site, which kuchi_get_video resolves.',
      'Grok then calls kuchi_get_breakdown. The breakdown gives every shot\'s exact start and end, its entrance (cut, transition, hold, or through a black or white frame), how much of the frame moves and the colour roles, plus storyboard sheets with one real frame per shot. Grok reads the storyboard and assigns each shot one of 14 kinds (title card, product UI, end card and so on), which is the shot analysis kuchi_plan_remake needs.',
      'For a post on X, ask for 16:9 or 1:1 and a length before planning; the plan re-times the reference to that length on whole frames. The finished blueprint goes to Grok Build or another coding agent, which writes the Remotion project and renders it.',
    ],
    troubleshoot: [
      ['The Connectors page is missing', 'Sign in; connectors need a Grok account.'],
      ['The connector shows but Grok never calls it', 'Turn it on for the chat, or name the tool in your prompt (for example "call kuchi_suggest_templates").'],
      ['Grok tries to make the video itself', 'Grok plans; hand the blueprint to Grok Build or another coding agent to render.'],
      ['Connection fails', 'Use the `/mcp` address, not the website address.'],
    ],
  },
  'grok-bot': {
    config: [
      'In the Grok Bot desktop app, servers are added from Connect apps → Add a custom connector at the bottom of the list. Name it, choose the Remote HTTPS type, paste the Server URL and leave the headers and OAuth fields empty, then choose Add plugin. Remote HTTPS is the type for a server reached over the network; the other types start local programs.',
      'You can also ask the Bot in chat to add a custom server with the URL. It shows the name and URL it is about to add and asks you to confirm, so nothing is added silently.',
      'The server speaks Streamable HTTP with no authentication. The Bot\'s connectors are separate from grok.com\'s Connectors and from Grok Build\'s config file.',
    ],
    run: [
      'Ask the Bot for launch video templates for your product. It calls kuchi_suggest_templates, shows the posters and waits for your pick. It reads the breakdown and the storyboard, writes a one-line description of every shot with its kind, and calls kuchi_plan_remake with your product name, features, colours and the assets you have.',
      'If anything is missing, the plan returns missing_inputs worded for that template (for example how many screenshots it needs and at what size) and the Bot asks for them in one message. When the plan is ready, every shot has a start and end frame, an entrance, an amount of motion and the content of yours that goes in it.',
      'Save the blueprint to a file or note and give it to a coding agent such as Grok Build or Claude Code; the build works from the exact frames.',
    ],
    troubleshoot: [
      ['Add plugin fails', 'Clear the headers and OAuth fields; this server needs neither.'],
      ['The type list shows local options', 'Pick Remote HTTPS.'],
      ['Nothing was added after asking in chat', 'The Bot waits for your confirmation; confirm in chat.'],
      ['Tools are never used', 'Name the tool in your prompt, or paste the setup prompt.'],
    ],
  },
  'grok-build': {
    config: [
      '`grok mcp add --transport http kuchi <url>` writes the server to `~/.grok/config.toml` as an `[mcp_servers.kuchi]` table with a `url`. A `.grok/config.toml` in the repo shares the same entry with everyone working on the project, which is handy when the video lives in the product repo.',
      '`grok mcp list` prints what is configured. Servers load when a session starts, so start a new one after adding. The `--transport http` flag selects Streamable HTTP; there is no token, header or environment variable to set.',
      'All tools are read-only on the server side. What you approve in Grok Build are the local commands: installing Remotion and rendering.',
    ],
    run: [
      'Grok Build calls kuchi_suggest_templates, shows the posters and waits. After your pick it reads kuchi_get_breakdown and the storyboard, classifies each shot and calls kuchi_plan_remake. If the reference is much longer than your target (under 75% of its length), the plan keeps the reference\'s rhythm by dropping evenly spaced shots instead of speeding everything up; otherwise it keeps every shot and stretches.',
      'It scaffolds Remotion, registers one composition at the blueprint\'s fps and total frames, and writes one component per shot placed with `<Sequence from={start_frame} durationInFrames={end_frame - start_frame + 1}>`. Then it renders, calls kuchi_check_remake with each shot\'s reference_shot, renders stills at the compare_frames times and fixes what drifted.',
      'Ask it to keep the blueprint in `video/plan.json` so a later session can pick up the work from the plan.',
    ],
    troubleshoot: [
      ['No tools in the session', 'Start a new session after `grok mcp add`.'],
      ['The server appears twice', 'User and project config both define it; keep one.'],
      ['The add command is rejected', 'Pass `--transport http` before the name.'],
      ['`npx remotion render` is not found', 'Scaffold first with `npx create-video@latest`, or ask Grok Build to.'],
    ],
  },
  devin: {
    config: [
      'Devin adds MCP servers under Customize → MCPs: select +, choose New MCP, name it, pick the HTTP transport, paste the Server URL and set Authentication to None. Any member can add one for themselves. Save, then use Test tools: it connects and lists the tools, so you know the setup works before a session depends on it.',
      'The Devin CLI has the same as a command: `devin mcp add kuchi <url>`.',
      'Devin runs on its own machine, so tool calls go from there, not from your laptop. That also means your assets must reach Devin: attach them to the session or commit them to the repo it works in.',
    ],
    run: [
      'Start a session with your logo and screenshots attached and ask for templates. Tell Devin to stop after showing the posters and wait for your choice; it works autonomously otherwise. It then studies the breakdown, classifies every shot and plans.',
      'On its machine, Devin installs Remotion, builds one component per shot on the blueprint\'s frames, renders, runs kuchi_check_remake with the shot list and renders stills at the compare_frames times to compare with the reference storyboard. Errors (reused brand text, generated logos, placeholders, timing drift) come back flagged with the shot number, so fixes are targeted.',
      'Ask for a pull request with the Remotion source and the render as an attachment. Devin\'s Knowledge can hold your brand rules so later sessions apply them without being told.',
    ],
    troubleshoot: [
      ['Test tools fails', 'Set Authentication to None and check the URL ends in `/mcp`.'],
      ['Devin cannot find your assets', 'Attach them to the session or commit them to the repo.'],
      ['It chose a template on its own', 'Ask it to wait for your pick after showing the posters.'],
      ['The MP4 is committed to the repo', 'Commit the source; share the render as an attachment or release asset.'],
    ],
  },
  pi: {
    config: [
      '`pi mcp add kuchi --url <url>` writes the server to `~/.pi/agent/mcp.json` under `mcpServers`, with the URL and an optional description that helps the model know when to use it. `pi mcp list` shows what is configured.',
      'In a running session, `/reload` picks up a newly added server without restarting.',
      'The server speaks Streamable HTTP with no authentication, so the entry is just the URL.',
    ],
    run: [
      'Pi keeps its system prompt deliberately short, so paste the setup prompt at the start of the session; it tells Pi to read kuchi_get_workflow and follow the steps. Pi then suggests templates, waits for your pick, reads the breakdown and plans.',
      'Small, explicit steps suit a minimal agent. Ask Pi to save the blueprint to `plan.json` and to read it before each shot, build one Remotion component per shot on the planned frames, and render a still of each shot as it goes.',
      'Finish with kuchi_check_remake: it returns passed, the errors and warnings by shot, and compare_frames, the times in your video and the reference that show the same moment. Render stills at those times, fix, then render the MP4.',
    ],
    troubleshoot: [
      ['The server is not in the session', 'Run `/reload`.'],
      ['Edits to the config do nothing', 'The file is `~/.pi/agent/mcp.json`.'],
      ['The model drops frame numbers', 'Keep the blueprint in a file and build from it shot by shot.'],
      ['No tools listed', 'Check the entry has `url`, then run `pi mcp list`.'],
    ],
  },
  'muse-code': {
    config: [
      'Muse Code reads `~/.config/muse/settings.json`. The file starts with `"schema_version": 1`; servers go in `mcp_servers`, each with a `transport` (`streamable_http` for this server), a `url`, and a `mode`. `optional` keeps the server available without loading it into every task.',
      'If the file already exists, add only the `mcp_servers` block and keep the schema version. Restart Muse Code, then run `/mcp` to see the server and its tools.',
      'No sign-in, headers or API key are needed.',
    ],
    run: [
      'Muse Code calls kuchi_suggest_templates, shows the posters and waits. It reads the breakdown and storyboard, classifies each shot into one of 14 kinds and calls kuchi_plan_remake with your product details.',
      'It scaffolds Remotion, builds each shot on its planned frames and renders in your project. Ask for kuchi_check_remake and stills at the compare_frames times before the final render.',
      'Keep the blueprint in a file in the repo so changes start from the plan.',
    ],
    troubleshoot: [
      ['Settings are rejected', 'Keep `"schema_version": 1` at the top of the file.'],
      ['The server is ignored', 'Use `"transport": "streamable_http"`.'],
      ['It is not in `/mcp`', 'Restart Muse Code after editing settings.'],
      ['Tools are never called', 'Paste the setup prompt from this page.'],
    ],
  },
  't3-code': {
    config: [
      'T3 Code runs agents such as Claude Code and Codex using their own configuration, so MCP servers go into the agent, not into T3 Code. For Claude Code: `claude mcp add --transport http kuchi <url>` (add `--scope user` to make it available in every repo). For Codex: `codex mcp add kuchi --url <url>`, which writes to `~/.codex/config.toml`.',
      'Start a new thread after adding so the agent loads the server.',
      'Other agents T3 Code runs follow their own guides on this site.',
    ],
    run: [
      'Open a thread, ask for templates and pick one. The agent studies the breakdown, plans and builds the Remotion project.',
      'T3 Code\'s threads make comparison cheap: open a second thread on another branch with a different template, build both from the same assets and compare the renders. Templates often feel different once your content is in them.',
      'Finish each thread with kuchi_check_remake and the stills comparison before the final render.',
    ],
    troubleshoot: [
      ['No tools in the thread', 'Add the server to the agent, then start a new thread.'],
      ['Threads overwrite each other', 'Give each its own branch or folder.'],
      ['The two agents give different shot timings', 'Keep the blueprint in a file and have both build from it.'],
      ['The server was added in T3 Code', 'T3 Code reads the agent\'s config; add it there.'],
    ],
  },
  opencode: {
    config: [
      '`opencode mcp add kuchi --global --url <url>` adds the server for every project; without `--global` it goes into the current project. In `opencode.jsonc` the entry needs `type: "remote"` and the `url`; a local server would instead have a command.',
      '`opencode mcp list` confirms the server. OpenCode works with many model providers, and the server is the same whichever model you pick.',
      'No authentication is needed.',
    ],
    run: [
      'OpenCode suggests templates, waits, studies the breakdown and plans. Because the blueprint fixes every shot\'s frames, entrance and motion, results stay consistent across models; the model mostly writes components.',
      'It scaffolds Remotion, builds and renders, then calls kuchi_check_remake and compares stills at the compare_frames times.',
      'With smaller models, save the blueprint to a file and build one shot per step.',
    ],
    troubleshoot: [
      ['The server is missing in another project', 'Add it again with `--global`.'],
      ['Config error on start', 'Set `type: "remote"` on the entry.'],
      ['The model forgets the plan', 'Save the blueprint to a file and point at it.'],
      ['Tools not listed', 'Run `opencode mcp list` and restart.'],
    ],
  },
  cline: {
    config: [
      'In the Cline panel, the MCP Servers icon opens server management. The Remote Servers tab adds a server by name and URL with a transport choice; choose Streamable HTTP for this one. SSE is an older transport and will not connect.',
      'The Cline CLI does the same: `cline mcp add kuchi <url> --transport http --yes`.',
      'Each tool call can require approval. Since every tool on this server is read-only, you can safely auto-approve them in the server\'s settings and keep approval for file writes and commands.',
    ],
    run: [
      'Plan mode: Cline calls kuchi_suggest_templates, shows the posters, then studies your pick and calls kuchi_plan_remake without touching files. Read the plan: shot count, length, what goes in each shot, and missing_inputs.',
      'Act mode: Cline scaffolds Remotion, writes one component per shot on the blueprint\'s frames, renders stills at the compare_frames times from kuchi_check_remake and fixes drift before the final MP4. Every file change appears as a diff.',
      'Splitting the job this way means the expensive mistakes (wrong template, wrong length) are caught before any code exists.',
    ],
    troubleshoot: [
      ['Connection fails', 'Choose Streamable HTTP, not SSE.'],
      ['Too many approval prompts', 'Auto-approve the server\'s read-only tools.'],
      ['Cline writes code too early', 'Stay in Plan mode until the plan is right.'],
      ['The server is missing in the CLI', 'Add it with `cline mcp add`.'],
    ],
  },
  zed: {
    config: [
      'Zed calls MCP servers context servers. Settings → AI → MCP Servers → Add Server → Add Remote Server adds one by URL; in the settings file it is `context_servers.kuchi.url`. No headers are needed.',
      'The agent panel shows each server\'s status. Agent profiles decide which tools the agent may use; a profile without MCP tools will not see this server even when it is running.',
      'The server speaks Streamable HTTP and is read-only.',
    ],
    run: [
      'Zed\'s agent calls kuchi_suggest_templates, waits for your pick, studies the breakdown and plans.',
      'It scaffolds Remotion in the workspace, builds each shot on its frames and renders through the terminal, then runs kuchi_check_remake and compares stills.',
      'Use a profile that allows both the MCP tools and terminal commands.',
    ],
    troubleshoot: [
      ['Tools are missing', 'The active agent profile excludes them; switch or edit the profile.'],
      ['The settings entry is ignored', 'Use `context_servers` with a `url`.'],
      ['The server is not running', 'Check its status in the agent panel.'],
      ['Commands do not run', 'Allow terminal use in the profile.'],
    ],
  },
  amp: {
    config: [
      '`amp mcp add kuchi <url>` adds the server. In settings it lives under `amp.mcpServers` as an entry with a `url`, which marks it as remote; a `command` would start a local process instead.',
      'The Amp CLI and the editor extension read the same settings, so a server added in one is available in the other.',
      'The server speaks Streamable HTTP with no sign-in.',
    ],
    run: [
      'Amp calls kuchi_suggest_templates, shows posters and waits. It reads the breakdown, classifies the shots and plans, asking once for anything in missing_inputs.',
      'It scaffolds Remotion, builds one component per shot on the planned frames, renders, runs kuchi_check_remake and fixes flagged shots.',
      'Use one thread per video and keep the blueprint in a file; a teammate can review the thread from its link.',
    ],
    troubleshoot: [
      ['The server is not found', 'Check `amp.mcpServers` has the `kuchi` entry with a `url`.'],
      ['A long thread drifts from the plan', 'Start a new thread pointed at the saved blueprint.'],
      ['Tools are never called', 'Paste the setup prompt from this page.'],
      ['The render command fails', 'Scaffold Remotion first.'],
    ],
  },
  kiro: {
    config: [
      'Kiro reads `~/.kiro/settings/mcp.json` for every workspace and `.kiro/settings/mcp.json` for one. The entry is `mcpServers.kuchi.url`; a `url` marks it as a remote server.',
      'Kiro picks up changes to the file; the MCP servers view shows each server\'s status and tools.',
      'Steering files hold standing instructions, which is where brand colours, fonts and asset folders belong.',
    ],
    run: [
      'Ask for templates and pick one. Then ask Kiro for a spec: requirements from your product (name, features, call to action), a design taken from the reference shots (frames, entrances, motion), and one task per blueprint shot.',
      'Kiro works through the tasks, building each shot as a Remotion component on its planned frames, then a final task runs kuchi_check_remake and renders. Errors in the check name the shot, which maps straight back to a task.',
      'Reviewing the spec before the tasks run is the cheapest place to change the length, ratio or template.',
    ],
    troubleshoot: [
      ['The server appears twice', 'It is in both user and workspace config; keep one.'],
      ['The spec misses shots', 'Study the breakdown before writing the spec.'],
      ['Tasks are too large to fix', 'Keep one shot per task.'],
      ['No tools', 'Check the MCP servers view.'],
    ],
  },
  'copilot-cli': {
    config: [
      '`copilot mcp add --transport http kuchi <url>` saves the server to `~/.copilot/mcp-config.json`. Inside a session, `/mcp add` does the same interactively.',
      'Copilot CLI asks before running commands and editing files. Tool calls to this server are read-only on the server side.',
      'The server speaks Streamable HTTP with no authentication. This config is separate from VS Code\'s.',
    ],
    run: [
      'Copilot CLI calls kuchi_suggest_templates, shows posters and waits. It reads the breakdown, classifies the shots and plans.',
      'It scaffolds Remotion, builds the shots on the planned frames and renders. Allow the render command for the folder so the build-check-fix loop does not stop for approval each time.',
      'Run kuchi_check_remake and compare stills before the final render.',
    ],
    troubleshoot: [
      ['The add command fails', 'Use `--transport http`.'],
      ['Edits to the config file are ignored', 'Restart Copilot CLI.'],
      ['Commands are blocked', 'Approve them for the folder.'],
      ['No tools', 'Check with `/mcp`.'],
    ],
  },
  droid: {
    config: [
      '`droid mcp add kuchi <url> --type http` adds the server; `--type http` selects Streamable HTTP. `/mcp` inside Droid lists it with its tools.',
      'No sign-in or headers are needed.',
      'Droid runs commands in your project with your approval.',
    ],
    run: [
      'Droid calls kuchi_suggest_templates, shows posters and waits. It studies the breakdown, classifies the shots and plans with your product details.',
      'It scaffolds Remotion, builds one component per shot on the blueprint\'s frames, renders, runs kuchi_check_remake and fixes flagged shots.',
      'Name your asset folder in the prompt so the plan lists real assets.',
    ],
    troubleshoot: [
      ['The server was not added', 'Include `--type http`.'],
      ['No tools', 'Check `/mcp`.'],
      ['Assets are missing from the plan', 'Give the folder path in the prompt.'],
      ['A template was chosen for you', 'Ask Droid to wait for your pick.'],
    ],
  },
  'kimi-code': {
    config: [
      '`kimi mcp add --transport http kuchi <url>` saves the server to `~/.kimi/mcp.json`. `kimi mcp list` confirms the entry.',
      'Start or restart Kimi Code after adding so it loads.',
      'The server speaks Streamable HTTP with no authentication.',
    ],
    run: [
      'Kimi Code calls kuchi_suggest_templates, shows posters and waits. It studies the breakdown and storyboard, classifies shots and plans.',
      'It builds the Remotion project on the planned frames, renders, runs kuchi_check_remake and compares stills.',
      'Keep the blueprint in a file so edits start from the plan.',
    ],
    troubleshoot: [
      ['The add command fails', 'Use `--transport http`.'],
      ['No tools', 'Restart Kimi Code.'],
      ['The plan gets lost', 'Save it to a file.'],
      ['No render command', 'Scaffold Remotion first.'],
    ],
  },
  'qwen-code': {
    config: [
      '`qwen mcp add --transport http kuchi <url>` adds the server. By hand, put it under `mcpServers` in `~/.qwen/settings.json` with `httpUrl`; as in Gemini CLI, `httpUrl` means Streamable HTTP and `url` means SSE.',
      'Restart Qwen Code after editing the file.',
      'No authentication is needed.',
    ],
    run: [
      'Qwen Code calls kuchi_suggest_templates, shows posters and waits. It studies the breakdown, classifies the shots and plans.',
      'It builds the Remotion project on the planned frames, renders, runs kuchi_check_remake and compares stills.',
      'Keep the blueprint in a file.',
    ],
    troubleshoot: [
      ['Shows as disconnected', 'Use `httpUrl`, not `url`.'],
      ['Edits have no effect', 'Restart Qwen Code.'],
      ['The plan gets lost', 'Save it to a file.'],
      ['No tools', 'Check settings.json and restart.'],
    ],
  },
  antigravity: {
    config: [
      'Antigravity reads `~/.gemini/config/mcp_config.json`, or `<workspace>/.agents/mcp_config.json` for one workspace. Remote servers use `serverUrl`, not `url` or `httpUrl`; that key is what differs from Gemini CLI.',
      'The MCP Store in the IDE opens the config file for editing.',
      'The server speaks Streamable HTTP with no authentication.',
    ],
    run: [
      'Antigravity\'s agent calls kuchi_suggest_templates and waits for your pick, then studies the breakdown and presents its plan as an artifact you can review and comment on.',
      'After you approve, it scaffolds Remotion, builds each shot on its planned frames, renders, runs kuchi_check_remake and compares stills.',
      'Commenting on the plan artifact is the place to change shots before any code exists.',
    ],
    troubleshoot: [
      ['The server does not load', 'Use `serverUrl`.'],
      ['The wrong config is used', 'A workspace config overrides the user config.'],
      ['The plan was approved too quickly', 'Read the shot list before approving.'],
      ['No tools', 'Check the MCP Store.'],
    ],
  },
  xum: {
    config: [
      'Xum reads `~/.xum/mcp.jsonc` (older Mux installs read `~/.mux/mcp.jsonc`). Each server is a command; this one bridges stdio to the remote URL with `npx -y mcp-remote <url>`, so Node.js must be installed.',
      'Settings → MCP (Ctrl+,) edits the same file.',
      'No authentication is needed.',
    ],
    run: [
      'Open one workspace per template. Each agent suggests, studies, plans and builds its own Remotion draft from the same assets.',
      'Render each draft, run kuchi_check_remake in each, compare the renders and keep the best.',
      'Two or three drafts is enough to compare.',
    ],
    troubleshoot: [
      ['npx is not found', 'Install Node.js.'],
      ['The config is ignored', 'Older installs read `~/.mux/mcp.jsonc`.'],
      ['Drafts collide', 'Use one workspace per draft.'],
      ['No tools', 'Check Settings → MCP.'],
    ],
  },
  'le-chat': {
    config: [
      'Le Chat adds servers under Intelligence → Connectors → Add Connector, on the Custom MCP Connector tab. Name it and paste the URL; Le Chat detects that no authentication is needed and connects.',
      'On Free, Pro and Student plans you are the admin; on team plans an admin may need to add the connector.',
      'The connection is Streamable HTTP. Connectors are switched on per chat.',
    ],
    run: [
      'Turn the connector on in a chat. Le Chat calls kuchi_suggest_templates, shows the posters and waits. It studies the breakdown and storyboard, classifies each shot and calls kuchi_plan_remake.',
      'The blueprint lists every shot\'s frames and your content. Ask for it as JSON and hand it to a coding agent to build and render.',
      'Ask for the length and ratio you need before planning.',
    ],
    troubleshoot: [
      ['The connector is never used', 'Turn it on in the chat.'],
      ['You cannot add connectors', 'Ask your workspace admin.'],
      ['Connection fails', 'Use the `/mcp` URL.'],
      ['An auth prompt appears', 'None is needed; check the URL.'],
    ],
  },
  manus: {
    config: [
      'Manus adds servers under Settings → Integrations → Custom MCP Servers → Add Server (in the Connectors view: Create → Add MCP by URL). Name it, paste the URL and leave authentication empty; Manus tests the connection and lists the tools.',
      'The connection is Streamable HTTP and every tool is read-only.',
      'Manus works through long tasks on its own, so say when you want it to stop and wait for you.',
    ],
    run: [
      'Ask Manus to compare several templates and recommend one, then wait for your pick. It studies the breakdown, classifies each shot and plans with your assets.',
      'The blueprint is the deliverable. Ask for it as a document and hand it to a coding agent to build and render.',
      'If Manus asks for assets it cannot reach, attach them to the task.',
    ],
    troubleshoot: [
      ['The connection test fails', 'Clear the authentication field.'],
      ['Manus picks a template on its own', 'Ask it to wait for your choice.'],
      ['No video file at the end', 'Manus plans; use a coding agent to render.'],
      ['Connection fails', 'Use the `/mcp` URL.'],
    ],
  },
};
