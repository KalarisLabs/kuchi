// Agent harnesses Kuchi works with, one indexable page each at /agents/<slug> (see
// pages/agents/[slug].astro) plus the /agents hub. Each entry is written by hand so every
// page answers the query "launch video with <harness>" with its own install steps,
// prompts, FAQ, videos and components, not a template with the name swapped.
//
// Only harnesses with an install path the site already supports (components/AgentConnect.astro
// and scripts/connect.js) get a page. Before adding one, confirm its install path is real.
import { newestFirst, type Video } from './catalog';
import { components, type RegistryItem } from './components-catalog';

export const MCP_URL = 'https://kuchi.kalarislabs.com/mcp';

/** The full setup prompt, the same text scripts/connect.js copies and deep-links. */
export const SETUP_PROMPT = `Connect the Kuchi MCP server at ${MCP_URL} (Streamable HTTP, no sign-in) and confirm it works by listing its tools.

Kuchi is a library of real product-launch videos to use as inspiration templates. When I want a launch video, read kuchi_get_workflow and follow it: get a short list with kuchi_suggest_templates and show me each one's poster and link so I can choose, in chat or by picking a video on kuchi.kalarislabs.com and pasting its link. Once I pick one, study it with kuchi_get_breakdown, look at its storyboard and note what each shot shows, then call kuchi_plan_remake with my product details and your shot analysis, and ask me for my logo, screenshots and anything else it lists as missing. Build to the blueprint's frames. Before you deliver, run kuchi_check_remake and compare your frames with the reference. Copy only the reference's motion and taste; everything on screen comes from my product.`;

export const PLUGIN_COMMAND = '/plugin install kuchi --marketplace KalarisLabs/kuchi';
export const SKILL_COMMAND = 'npx skills add kalarislabs/kuchi';

const claudeWeb = 'https://claude.ai/customize/connectors?' + new URLSearchParams({ modal: 'add-custom-connector', connectorName: 'Kuchi', connectorUrl: MCP_URL });
const vsCode = 'https://vscode.dev/redirect/mcp/install?' + new URLSearchParams({ name: 'kuchi', config: JSON.stringify({ type: 'http', url: MCP_URL }) });
const deep = (base: string, key: string) => `${base}${key}=${encodeURIComponent(SETUP_PROMPT)}`;

/** One install step. `code` is shown in a copyable block; `link` is a button. */
export interface Step { text: string; code?: string; link?: { label: string; href: string } }
export interface Faq { q: string; a: string }

export interface Harness {
  slug: string;
  name: string;
  maker: string;
  logo: string;
  brandColor?: boolean;
  /** coding: writes and renders the video itself. chat: picks, studies and plans. */
  kind: 'coding' | 'chat';
  /** One line for cards and the hub. */
  tagline: string;
  /** <title> and meta description. */
  title: string;
  description: string;
  /** Opening paragraphs, specific to how this harness works. */
  intro: string[];
  /** Primary one-click install, when there is one. */
  primary?: { label: string; href: string };
  install: Step[];
  /** What this harness is good at, for the "Why" list. */
  strengths: string[];
  /** Prompts to paste once connected. */
  prompts: string[];
  /** Harness-specific questions; shared ones are appended by faqFor(). */
  faq: Faq[];
  /** Picks the featured launch videos: styles in order of preference. */
  styles: string[];
  /** Components to feature, by registry name (missing names are skipped). */
  components: string[];
  /** Extra words for search (palette and keywords). */
  keywords: string[];
}

export const harnesses: Harness[] = [
  {
    slug: 'claude-code',
    name: 'Claude Code',
    maker: 'Anthropic',
    logo: '/logos/claude.svg',
    brandColor: true,
    kind: 'coding',
    tagline: 'Plugin install brings the skill and the MCP together. Builds and renders in your repo.',
    title: 'Make a launch video with Claude Code — Kuchi',
    description: 'Connect Kuchi to Claude Code with one plugin command, pick a real product-launch video as the template, and let Claude Code rebuild its motion for your product in Remotion.',
    intro: [
      'Claude Code works in your terminal and your repository, so it can do the whole job: pick a reference launch video from Kuchi, read its shot-by-shot breakdown, write the Remotion scenes and render the MP4 on your machine.',
      'Kuchi supplies what Claude Code cannot see on its own: real launch videos measured frame by frame (when each shot starts, how it enters, how much moves, its colours) and a plan that maps your product onto those frames.',
    ],
    install: [
      { text: 'In Claude Code, install the Kuchi plugin. It adds the skill and the MCP server in one step.', code: PLUGIN_COMMAND },
      { text: 'Or add only the MCP server from your shell.', code: `claude mcp add --transport http kuchi ${MCP_URL}` },
      { text: 'Using the Claude desktop app? Open Claude Code there with the setup prompt filled in.', link: { label: 'Open in Claude Code', href: deep('claude://code/new?', 'q') } },
    ],
    strengths: [
      'Writes and renders Remotion or HTML video in your own project, so the output is code you keep.',
      'Installs Kuchi video components straight into the repo with the shadcn CLI.',
      'Checks its own render against the reference with kuchi_check_remake before handing it over.',
    ],
    prompts: [
      'Make a 30-second launch video for this repo. Use Kuchi to find three templates that fit a developer tool and show me the posters.',
      'Remake https://kuchi.kalarislabs.com/#video-92 for our product. Use my logo in ./brand and screenshots in ./screens.',
      'Build the video in Remotion, render it to out/launch.mp4, then run kuchi_check_remake and fix the shots that drift.',
    ],
    faq: [
      { q: 'Can Claude Code render the video itself?', a: 'Yes. Claude Code runs commands in your project, so it can install Remotion, write the scenes from the Kuchi blueprint and render an MP4 locally. Kuchi does not render anything; it measures references and plans the remake.' },
      { q: 'Plugin or MCP server: which should I install in Claude Code?', a: 'The plugin. It installs the Kuchi skill, which teaches the workflow, and the MCP server, which serves the latest videos, in one command. The MCP server alone also works.' },
    ],
    styles: ['Terminal', 'Kinetic type'],
    components: ['claude-code', 'terminal-session', 'glass-code-walk', 'agent-run', 'karaoke-captions', 'release-teaser'],
    keywords: ['claude code launch video', 'claude code remotion', 'claude code video', 'anthropic'],
  },
  {
    slug: 'codex',
    name: 'Codex',
    maker: 'OpenAI',
    logo: '/logos/codex.svg',
    kind: 'coding',
    tagline: 'One command in Codex CLI, or one click in the Codex app.',
    title: 'Make a launch video with Codex — Kuchi',
    description: 'Add the Kuchi MCP to Codex in one command, choose a real product-launch video as your template, and have Codex build and render the remake for your product.',
    intro: [
      'Codex can edit files and run commands, which is what turning a reference video into your own takes: write the scenes, render, compare, fix. Kuchi gives Codex the reference and the plan.',
      'Ask Codex for a launch video and it gets a short list of fitting templates from Kuchi, studies the one you choose shot by shot, asks you for your logo and screenshots, and builds to the reference\'s exact frame timings.',
    ],
    primary: { label: 'Open in Codex', href: deep('codex://new?', 'prompt') },
    install: [
      { text: 'In a terminal, add the server to Codex CLI. No sign-in or API key is needed.', code: `codex mcp add kuchi --url ${MCP_URL}` },
      { text: 'In the Codex app, open a new task with the setup prompt filled in.', link: { label: 'Open in Codex', href: deep('codex://new?', 'prompt') } },
      { text: 'Optional: install the Kuchi skill so Codex knows the workflow before it calls a tool.', code: SKILL_COMMAND },
    ],
    strengths: [
      'Runs the build, render and check loop without you copying files around.',
      'Works in the CLI and the desktop app with the same server URL.',
      'Pairs with Kuchi components, installed into the project with one command each.',
    ],
    prompts: [
      'Use Kuchi to suggest launch video templates for a B2B SaaS dashboard. Show me each poster and link.',
      'Plan a remake of the template I picked with my product details, and list everything you still need from me.',
      'Render the remake, then compare your frames with the reference at the times kuchi_check_remake gives you.',
    ],
    faq: [
      { q: 'Does Kuchi work with Codex CLI and the Codex app?', a: 'Yes, both. The CLI adds it with codex mcp add kuchi --url https://kuchi.kalarislabs.com/mcp; the app opens a task with the setup prompt from the button on this page.' },
      { q: 'What does Codex build the video with?', a: 'Whatever your project uses. The Kuchi workflow suggests Remotion, and Kuchi serves ready-made Remotion components for kinetic type, captions, UI screens, cursors and logos.' },
    ],
    styles: ['Terminal', 'UI motion'],
    components: ['terminal-session', 'code-morph', 'prompt-to-app', 'agent-steps', 'glass-code-block', 'word-captions'],
    keywords: ['codex launch video', 'codex cli mcp', 'openai codex video', 'openai'],
  },
  {
    slug: 'cursor',
    name: 'Cursor',
    maker: 'Anysphere',
    logo: '/logos/cursor.svg',
    kind: 'coding',
    tagline: 'One-click MCP install. The agent builds the video beside your code.',
    title: 'Make a launch video with Cursor — Kuchi',
    description: 'Install the Kuchi MCP in Cursor with one click, then ask the Cursor agent to remake a real product-launch video for your product, shot for shot, in Remotion.',
    intro: [
      'Cursor\'s agent already knows your codebase. With Kuchi connected it also knows how great launch videos are cut: which shot comes when, how it enters, and how much moves.',
      'Pick a template, give the agent your screenshots, and it writes the video as components next to your code, so the next launch reuses the same scenes.',
    ],
    primary: { label: 'Add to Cursor', href: 'https://cursor.com/en/install-mcp?name=kuchi&config=eyJ1cmwiOiJodHRwczovL2t1Y2hpLmthbGFyaXNsYWJzLmNvbS9tY3AifQ%3D%3D' },
    install: [
      { text: 'Add the server with Cursor\'s one-click install. It opens Cursor and fills in the URL.', link: { label: 'Add to Cursor', href: 'https://cursor.com/en/install-mcp?name=kuchi&config=eyJ1cmwiOiJodHRwczovL2t1Y2hpLmthbGFyaXNsYWJzLmNvbS9tY3AifQ%3D%3D' } },
      { text: 'Or add it by hand in Settings → MCP with this URL. No authentication.', code: MCP_URL },
      { text: 'Optional: install the Kuchi skill into the project.', code: SKILL_COMMAND },
    ],
    strengths: [
      'Builds the video inside the repo the product lives in, using its real UI where you want it.',
      'Cursor-demo and UI-motion templates map straight onto your own app screens.',
      'Kuchi components install as editable source, so the agent can restyle them to your brand.',
    ],
    prompts: [
      'Find a Kuchi template with a cursor demo that fits our onboarding flow, and show me the options.',
      'Remake the template I chose in Remotion under /video. Use screenshots from /public/screens.',
      'Add the Kuchi click-type and cursor components and use them for the sign-up shot.',
    ],
    faq: [
      { q: 'How do I add Kuchi to Cursor?', a: 'Use the Add to Cursor button on this page, or open Settings → MCP and add https://kuchi.kalarislabs.com/mcp as a server. It needs no sign-in or API key.' },
      { q: 'Can the Cursor agent use my real app UI in the video?', a: 'Yes. The remake uses your screenshots, screen recordings or rebuilt UI components; Kuchi only lends the reference\'s timing, motion and layout, never its footage.' },
    ],
    styles: ['Cursor demo', 'UI motion'],
    components: ['cursor', 'click-type', 'screen-recording', 'cursor-track', 'button-press', 'code-morph'],
    keywords: ['cursor launch video', 'cursor mcp', 'cursor ide video', 'cursor agent'],
  },
  {
    slug: 'vs-code',
    name: 'VS Code',
    maker: 'Microsoft',
    logo: '/logos/vscode.png',
    brandColor: true,
    kind: 'coding',
    tagline: 'One-click install for agent mode in VS Code.',
    title: 'Make a launch video in VS Code with GitHub Copilot — Kuchi',
    description: 'Add the Kuchi MCP to VS Code in one click and use Copilot agent mode to remake a real product-launch video for your product, frame for frame.',
    intro: [
      'VS Code agent mode can call MCP tools, edit your workspace and run tasks. Add Kuchi and it can take a real launch video as its template and rebuild it for your product in your editor.',
      'The agent asks Kuchi for templates that fit your product, studies the shots of the one you pick, and writes the scenes in the workspace you already have open.',
    ],
    primary: { label: 'Add to VS Code', href: vsCode },
    install: [
      { text: 'Add the server with the VS Code install link. VS Code asks you to confirm.', link: { label: 'Add to VS Code', href: vsCode } },
      { text: 'Or add an HTTP server named kuchi with this URL to your MCP configuration.', code: MCP_URL },
      { text: 'Open Copilot Chat in agent mode and paste the setup prompt from this page.' },
    ],
    strengths: [
      'Runs in the editor your team already uses, with the workspace and terminal at hand.',
      'Chart and data-graphics templates suit release notes and metrics launches.',
      'Kuchi components drop into the workspace as editable TypeScript.',
    ],
    prompts: [
      'Use Kuchi to find a launch video template with animated charts for our analytics release.',
      'Plan a remake with our product details, then scaffold the Remotion project in /video.',
      'Swap the placeholder screens for the PNGs in /assets and render a 1080p MP4.',
    ],
    faq: [
      { q: 'Does Kuchi work with GitHub Copilot in VS Code?', a: 'Yes. Copilot agent mode in VS Code can use MCP servers. Add Kuchi with the install link on this page, then ask the agent for a launch video.' },
      { q: 'Do I need a Copilot plan or a Kuchi account?', a: 'Kuchi needs no account or API key. Using agent mode depends on your own VS Code and Copilot setup.' },
    ],
    styles: ['Charts', 'UI motion'],
    components: ['glass-code-block', 'laptop-frame', 'terminal-cursor-zoom', 'animated-line-chart', 'animated-bar-chart', 'check-list'],
    keywords: ['vscode launch video', 'github copilot video', 'copilot agent mode mcp', 'visual studio code'],
  },
  {
    slug: 'gemini-cli',
    name: 'Gemini CLI',
    maker: 'Google',
    logo: '/logos/gemini.svg',
    kind: 'coding',
    tagline: 'Three lines in settings.json. Plans and builds from your terminal.',
    title: 'Make a launch video with Gemini CLI — Kuchi',
    description: 'Connect Kuchi to Gemini CLI with three lines of settings, pick a real product-launch video as your template, and let Gemini rebuild it for your product.',
    intro: [
      'Gemini CLI is an agent in your terminal that can read your project, write files and run commands. With Kuchi connected it can turn a real launch video into a blueprint for yours and then build it.',
      'Kuchi\'s storyboard sheets give the agent real frames to look at, so it can say what each shot shows before it writes a line of the remake.',
    ],
    install: [
      { text: 'Add this to ~/.gemini/settings.json, then restart Gemini CLI. No sign-in is needed.', code: JSON.stringify({ mcpServers: { kuchi: { httpUrl: MCP_URL } } }, null, 2) },
      { text: 'Optional: install the Kuchi skill so the workflow is loaded from the start.', code: SKILL_COMMAND },
    ],
    strengths: [
      'Reads storyboard frames and describes each shot before planning.',
      'Works from the terminal in any project, with nothing to install but a settings entry.',
      'Abstract-motion and kinetic-type templates need no product footage to start.',
    ],
    prompts: [
      'Use Kuchi to find a kinetic-type launch template for an API launch. Show me the posters.',
      'Read the breakdown of the one I pick and describe every shot before you plan.',
      'Build the remake and run kuchi_check_remake on your shot list.',
    ],
    faq: [
      { q: 'How do I add an MCP server to Gemini CLI?', a: 'Add an entry under mcpServers in ~/.gemini/settings.json. For Kuchi it is {"mcpServers":{"kuchi":{"httpUrl":"https://kuchi.kalarislabs.com/mcp"}}}. Restart Gemini CLI to load it.' },
      { q: 'Can Gemini CLI see the reference video?', a: 'It sees what Kuchi serves: each shot\'s exact frames and a sheet of real frames from the video, which the agent looks at to note what every shot shows.' },
    ],
    styles: ['Abstract motion', 'Kinetic type'],
    components: ['terminal-simulator', 'agent-steps', 'text-build', 'dot-bloom', 'logo-assemble', 'punch-lines'],
    keywords: ['gemini cli launch video', 'gemini cli mcp', 'google gemini video'],
  },
  {
    slug: 'claude',
    name: 'Claude',
    maker: 'Anthropic',
    logo: '/logos/claude.svg',
    brandColor: true,
    kind: 'chat',
    tagline: 'Custom connector on claude.ai and the desktop app. Chooses, studies and plans.',
    title: 'Plan a launch video with Claude — Kuchi',
    description: 'Add Kuchi as a custom connector in Claude, browse real product-launch videos with it, and get a frame-timed plan that turns your chosen template into your own launch video.',
    intro: [
      'In Claude on the web or the desktop app, Kuchi works as a connector. Describe your product and Claude brings back a short list of real launch videos that fit, with posters and links.',
      'Choose one and Claude studies it shot by shot and writes a frame-timed blueprint with your product in every shot. To render the MP4, hand that blueprint to a coding agent such as Claude Code.',
    ],
    primary: { label: 'Add to Claude', href: claudeWeb },
    install: [
      { text: 'On claude.ai, add Kuchi as a custom connector. The link fills in the name and URL.', link: { label: 'Add connector', href: claudeWeb } },
      { text: 'In the Claude desktop app, open a chat with the setup prompt filled in.', link: { label: 'Open in Claude', href: deep('claude://claude.ai/new?', 'q') } },
      { text: 'Or add a custom connector by hand with this URL. No authentication.', code: MCP_URL },
    ],
    strengths: [
      'Good for deciding the video: comparing templates, writing the script, naming each shot.',
      'Shows posters and links in the chat so you can choose without leaving it.',
      'The blueprint it writes is the same one a coding agent builds from.',
    ],
    prompts: [
      'We are launching an AI note-taking app next week. Use Kuchi to suggest five launch video templates and say why each fits.',
      'Break down the second one shot by shot and write my script to its timings.',
      'List everything you need from me for the remake: logo, screenshots, copy.',
    ],
    faq: [
      { q: 'Can Claude make the video file in the chat?', a: 'Claude in chat chooses the template, studies it and writes the frame-timed plan. Rendering an MP4 needs a tool that runs code, such as Claude Code, which builds from the same plan.' },
      { q: 'How do I add a custom connector to Claude?', a: 'Use the Add connector button on this page, or open Settings → Connectors on claude.ai, add a custom connector and paste https://kuchi.kalarislabs.com/mcp. It needs no authentication.' },
    ],
    styles: ['Kinetic type', 'Image collage'],
    components: ['claude-chat', 'answer-stream', 'prompt-send', 'punch-lines', 'logo-construct', 'release-teaser'],
    keywords: ['claude launch video', 'claude connector', 'claude ai video', 'claude desktop mcp', 'anthropic'],
  },
  {
    slug: 'chatgpt',
    name: 'ChatGPT',
    maker: 'OpenAI',
    logo: '/logos/chatgpt.svg',
    kind: 'chat',
    tagline: 'Add a custom MCP server in Plugins. Chooses, studies and plans.',
    title: 'Plan a launch video with ChatGPT — Kuchi',
    description: 'Add Kuchi to ChatGPT as a custom MCP server, find real product-launch videos that fit your product, and get a shot-by-shot plan for your own launch video.',
    intro: [
      'Add Kuchi in ChatGPT\'s Plugins and ChatGPT can search a library of real product-launch videos, show you the posters, and explain why each one suits your launch.',
      'Once you choose, it reads the shot breakdown and writes a plan timed to the reference\'s frames, with your product, copy and assets in each shot. A coding agent such as Codex builds the video from that plan.',
    ],
    primary: { label: 'Open Plugins', href: 'https://chatgpt.com/plugins' },
    install: [
      { text: 'In ChatGPT, open Plugins and select + → Add custom MCP server.', link: { label: 'Open Plugins', href: 'https://chatgpt.com/plugins' } },
      { text: 'Name it Kuchi, paste this URL and choose No authentication. Create and install.', code: MCP_URL },
      { text: 'Start a chat and paste the setup prompt from this page.' },
    ],
    strengths: [
      'Quick to try: no terminal, nothing to install on your machine.',
      'Good at comparing templates and drafting the script and on-screen copy.',
      'Hands a plan to Codex, which can build and render it.',
    ],
    prompts: [
      'Use Kuchi to find launch videos for a consumer mobile app with phone mockups. Show me the posters.',
      'Compare the top three: pacing, length and what I would need to supply.',
      'Write the shot list for my app to the timings of the one I pick.',
    ],
    faq: [
      { q: 'How do I connect an MCP server to ChatGPT?', a: 'In ChatGPT open Plugins, select + → Add custom MCP server, name it Kuchi, paste https://kuchi.kalarislabs.com/mcp and choose No authentication.' },
      { q: 'Can ChatGPT render the launch video?', a: 'ChatGPT plans it: the template, the shot breakdown and a frame-timed blueprint with your content. A coding agent such as Codex renders the MP4 from that blueprint.' },
    ],
    styles: ['Device motion', 'Mixed media'],
    components: ['chat-gpt', 'search-typing', 'answer-highlight', 'phone-frame', 'phone-stack', 'launch-anything'],
    keywords: ['chatgpt launch video', 'chatgpt mcp', 'chatgpt custom connector', 'openai'],
  },
  {
    slug: 'grok',
    name: 'Grok',
    maker: 'xAI',
    logo: '/logos/grok.svg',
    kind: 'chat',
    tagline: 'Add a custom connector. Chooses, studies and plans.',
    title: 'Plan a launch video with Grok — Kuchi',
    description: 'Add Kuchi to Grok as a custom connector and plan a launch video from real product launches that did well on X, with a shot-by-shot blueprint for your product.',
    intro: [
      'Every Kuchi reference is a real launch video posted on X, with its impressions, plays and likes recorded on the day it was measured. Connected to Grok, that becomes a way to find the format that suits your launch post.',
      'Grok suggests templates, studies the one you pick and writes a frame-timed plan with your product in each shot. A coding agent builds the video from it.',
    ],
    primary: { label: 'Open Connectors', href: 'https://grok.com/connectors' },
    install: [
      { text: 'Sign in to Grok and open Connectors. Select New Connector → Custom.', link: { label: 'Open Connectors', href: 'https://grok.com/connectors' } },
      { text: 'Paste this URL. No sign-in is needed.', code: MCP_URL },
      { text: 'Start a chat and paste the setup prompt from this page.' },
    ],
    strengths: [
      'Helps shape the video and the launch post together.',
      'Every reference carries its X stats, so you can see what a format earned.',
      'Plans that any coding agent can build.',
    ],
    prompts: [
      'Use Kuchi to find short launch videos under 30 seconds that suit a post on X. Show me the posters.',
      'Plan a remake of the one I pick and write the launch post to go with it.',
      'Tell me which shots I can make from screenshots alone.',
    ],
    faq: [
      { q: 'How do I add a custom connector to Grok?', a: 'Sign in to grok.com, open Connectors, select New Connector → Custom and paste https://kuchi.kalarislabs.com/mcp. No sign-in to Kuchi is needed.' },
      { q: 'Are the stats on Kuchi videos from X?', a: 'Yes. Impressions, plays, likes, bookmarks and reposts come from the original post on X and are dated with the day they were captured.' },
    ],
    styles: ['Abstract motion', '3D animation'],
    components: ['x-follow-card', 'channel-thread', 'upvote-burst', 'hero-launch', 'font-shuffle', 'logo-flicker'],
    keywords: ['grok launch video', 'grok connector', 'grok mcp', 'xai', 'x launch post'],
  },
];

export const harnessPath = (h: Harness) => `/agents/${h.slug}`;
export const bySlug = (slug: string) => harnesses.find((h) => h.slug === slug);

/** Six launch videos that suit this harness: preferred styles first, most-seen first. */
export function videosFor(h: Harness, count = 6): Video[] {
  const picked: Video[] = [];
  const byReach = [...newestFirst].sort((a, b) => b.impressions - a.impressions);
  for (const style of h.styles) {
    for (const video of byReach) {
      if (picked.length >= count) break;
      if (video.styles.includes(style) && !picked.includes(video)) picked.push(video);
    }
  }
  for (const video of newestFirst) if (picked.length < count && !picked.includes(video)) picked.push(video);
  return picked;
}

export function componentsFor(h: Harness): RegistryItem[] {
  return h.components.map((name) => components.find((c) => c.name === name)).filter((c): c is RegistryItem => Boolean(c));
}

/** The harness's own questions, then the ones every page answers. */
export function faqFor(h: Harness): Faq[] {
  return [
    ...h.faq,
    { q: `Is Kuchi free to use with ${h.name}?`, a: 'Yes. The Kuchi MCP server is open: no account, no API key and no payment. Your own agent plan applies as usual.' },
    { q: 'Will my video copy the reference?', a: 'No. A remake borrows the reference\'s timing, motion and layout. Every logo, screen, line of copy and asset on screen comes from your product.' },
  ];
}
