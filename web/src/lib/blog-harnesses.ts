// One blog post per agent harness (owner, 2026-11-19; plan in docs/CASH_PAGES_PLAN.md).
//
// Each harness has two pages that answer two different searches:
//   /agents/<slug>  the cash page: "make a launch video with X", ready to install.
//   /blog/<slug>    this post: coding agents get "Remotion with X" (how to build and render a
//                   product video in that agent); chat apps get "add a custom MCP connector to
//                   X" (how to set the app up, then plan a video in it).
// Titles and keywords lead with what people search for, never with the product name.
//
// The hand-written parts (intro, fit, prompts, pitfalls, FAQ) are specific to each harness.
// Install steps come from lib/harnesses.ts so a post never disagrees with its cash page, and
// every path there was checked against the harness's own docs. Keep claims about a harness to
// what its docs say; when unsure, leave it out.
import type { Block, Faq, Post } from './blog';
import { harnesses, MCP_URL, SETUP_PROMPT, type Harness } from './harnesses';

const DATE = '2026-11-19';

interface Spec {
  harness: string;
  slug: string;
  heading: string;
  title: string;
  description: string;
  summary: string;
  keywords: string[];
  /** Opening paragraphs. The link to the cash page is added after them. */
  intro: string[];
  /** Why this harness suits the job. */
  fit: string[];
  /** The prompt sequence, in order. */
  prompts: string[];
  /** Mistakes specific to this harness. */
  pitfalls: string[];
  faq: Faq[];
  /** Chat apps: how to tell the connector works. */
  check?: string;
  /** One more related post or page, beside the cash page and the shared guides. */
  also?: { label: string; href: string };
}

const harnessBy = (slug: string): Harness => {
  const h = harnesses.find((x) => x.slug === slug);
  if (!h) throw new Error(`blog-harnesses: no harness ${slug}`);
  return h;
};

/** Install steps as blocks: each step's text, then its command or config if it has one. */
function installBlocks(h: Harness): Block[] {
  const blocks: Block[] = [];
  h.install.forEach((step, i) => {
    const text = step.link ? `${step.text} The [${h.name} page](/agents/${h.slug}) has the ${step.link.label} button.` : step.text;
    blocks.push({ type: 'p', text: `**${i + 1}.** ${text}` });
    if (step.code) blocks.push({ type: 'code', code: step.code });
  });
  return blocks;
}

function codingPost(s: Spec): Post {
  const h = harnessBy(s.harness);
  return {
    slug: s.slug,
    harness: h.slug,
    heading: s.heading,
    title: s.title,
    description: s.description,
    summary: s.summary,
    published: DATE,
    updated: DATE,
    minutes: 6,
    keywords: s.keywords,
    body: [
      ...s.intro.map((text): Block => ({ type: 'p', text })),
      { type: 'p', text: `Want only the install and a few prompts? The [${h.name} launch video page](/agents/${h.slug}) has them on one screen.` },

      { type: 'h2', id: 'why', text: `Why ${h.name} suits video work` },
      { type: 'ul', items: s.fit },

      { type: 'h2', id: 'project', text: 'Start a Remotion project' },
      { type: 'p', text: `Remotion turns React components into video: every frame is a render of your component at that frame number, so ${h.name} edits a video the way it edits any other code. You need Node.js. Ask ${h.name} to scaffold the project, or run it yourself:` },
      { type: 'code', code: 'npx create-video@latest' },

      { type: 'h2', id: 'connect', text: `Give ${h.name} a reference to work from` },
      { type: 'p', text: `A blank prompt gets a generic video. A real launch video measured frame by frame gets one with a rhythm: when each shot starts, how it enters and how much moves. The library at \`${MCP_URL}\` is a free MCP server with no sign-in and no API key. Add it to ${h.name}:` },
      ...installBlocks(h),
      { type: 'p', text: 'Then paste the setup prompt, so the agent knows how to use the library:' },
      { type: 'code', label: 'Setup prompt', code: SETUP_PROMPT },

      { type: 'h2', id: 'prompts', text: `The prompts, in order` },
      { type: 'ol', items: s.prompts },

      { type: 'h2', id: 'shot-code', text: `Writing one shot in Remotion` },
      { type: 'p', text: `A Remotion video is a React component rendered once per frame. Inside a shot, \`useCurrentFrame()\` returns the frame number counted from the start of that shot's \`<Sequence>\`, and \`useVideoConfig()\` gives the fps and size. Everything that moves is a function of that number, which is why ${h.name} can match a reference to the frame: an entrance that takes 12 frames in the reference takes exactly 12 frames in yours.` },
      { type: 'p', text: 'The blueprint says how each shot enters. Each entrance has a direct translation:' },
      { type: 'table', head: ['Blueprint `enters`', 'In Remotion'], rows: [
        ['`cut`', 'No entrance animation: the shot is fully on screen at its first frame.'],
        ['`transition`', 'Animate over the first frames: `interpolate(frame, [0, 12], [0, 1], { extrapolateRight: \'clamp\' })` for opacity, or a `spring()` for scale or position.'],
        ['`hold`', 'Same scene as the shot before: keep the layout and resume the motion where it stopped.'],
        ['`blank_black`, `blank_white`', 'Put a frame or two of solid black or white between the shots, as the reference does.'],
      ] },
      { type: 'p', text: `Here is a product-screen shot that enters with a short transition, written the way ${h.name} should write every shot: assets from \`public/\` through \`staticFile()\`, timing from the frame number, nothing random.` },
      { type: 'code', label: 'src/shots/Shot3.tsx', code: `import { AbsoluteFill, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';

// Blueprint shot 3: kind ui_screen, enters "transition", motion "medium".
export const Shot3 = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const opacity = interpolate(frame, [0, 12], [0, 1], { extrapolateRight: 'clamp' });
  const rise = spring({ frame, fps, config: { damping: 200 } });

  return (
    <AbsoluteFill style={{ background: '#0b0b0f', alignItems: 'center', justifyContent: 'center' }}>
      <Img
        src={staticFile('screens/dashboard.png')}
        style={{ width: '78%', borderRadius: 16, opacity, transform: \`translateY(\${(1 - rise) * 40}px)\` }}
      />
    </AbsoluteFill>
  );
};` },
      { type: 'p', text: 'For a screen recording use `<OffthreadVideo src={staticFile(\'screens/demo.mp4\')} />` instead of `<Img>`. Never use `Math.random()` or the clock inside a shot: Remotion renders frames in parallel and out of order, so anything not derived from the frame number flickers. Use Remotion\'s `random(seed)` when you need variation.' },

      { type: 'h2', id: 'render', text: 'Preview, check and render' },
      { type: 'p', text: `Open the Remotion Studio to scrub through the video while ${h.name} works, render single frames to compare with the reference at the times the check gives, then render the file. \`Launch\` stands for your composition id.` },
      { type: 'code', code: 'npx remotion studio\nnpx remotion still Launch out/frame-90.png --frame=90\nnpx remotion render Launch out/launch.mp4' },

      { type: 'h2', id: 'pitfalls', text: `What trips people up in ${h.name}` },
      { type: 'ul', items: s.pitfalls },
    ],
    faq: s.faq,
    howTo: {
      name: `How to make a product video with ${h.name} and Remotion`,
      steps: [
        { name: 'Start a Remotion project', text: 'Run npx create-video@latest, or ask the agent to.' },
        { name: `Connect the library to ${h.name}`, text: h.install[0].code ? `${h.install[0].text} ${h.install[0].code}` : h.install[0].text },
        { name: 'Pick a reference', text: 'Ask for launch video templates that fit your product and choose one.' },
        { name: 'Plan and build', text: 'Have the agent plan the remake with your logo, screens and copy, then build each shot on the planned frames.' },
        { name: 'Check and render', text: 'Compare frames with the reference, fix what drifts, then render with npx remotion render.' },
      ],
    },
    related: [
      { label: `Make a product launch video with ${h.name}`, href: `/agents/${h.slug}` },
      s.also ?? { label: 'Remotion components your AI agent can install', href: '/blog/remotion-components-for-ai-agents' },
      { label: 'Browse launch video templates', href: '/videos' },
    ],
  };
}

function chatPost(s: Spec): Post {
  const h = harnessBy(s.harness);
  return {
    slug: s.slug,
    harness: h.slug,
    heading: s.heading,
    title: s.title,
    description: s.description,
    summary: s.summary,
    published: DATE,
    updated: DATE,
    minutes: 5,
    keywords: s.keywords,
    body: [
      ...s.intro.map((text): Block => ({ type: 'p', text })),

      { type: 'h2', id: 'what', text: `What a custom connector lets ${h.name} do` },
      { type: 'ul', items: s.fit },

      { type: 'h2', id: 'add', text: `Add a custom MCP server to ${h.name}` },
      { type: 'p', text: `The example here is a free library of real product-launch videos at \`${MCP_URL}\`. It is a remote MCP server over Streamable HTTP with no authentication, which makes it a good first connector: nothing to sign in to and nothing to leak.` },
      ...installBlocks(h),

      { type: 'h2', id: 'check', text: 'Check that it works' },
      { type: 'p', text: s.check ?? `Ask ${h.name} to list the tools from the connector. It should see 13: eleven that start with \`kuchi_\`, plus \`search\` and \`fetch\`.` },

      { type: 'h2', id: 'how', text: `How a remote MCP connector works in ${h.name}` },
      { type: 'p', text: `A connector is a client for a server somewhere else. ${h.name} connects to the URL over Streamable HTTP: each message is a JSON-RPC 2.0 request sent as an HTTP POST. On connect it asks the server what it is (\`initialize\`) and what it can do (\`tools/list\`). Each tool comes with a name, a description, a JSON Schema for its arguments and annotations that say whether it changes anything.` },
      { type: 'p', text: `When you ask for something a tool can do, ${h.name} writes the arguments, sends a \`tools/call\`, and reads the result back into the conversation. Results can be text, structured JSON and links to files, which is how a storyboard image or a video file arrives without being pasted into the chat.` },

      { type: 'h2', id: 'security', text: 'What the connector can and cannot see' },
      { type: 'ul', items: [
        `**It sees only what ${h.name} sends.** A tool call carries the arguments ${h.name} writes: your product description, the template you picked, your shot analysis. It does not see the rest of the chat, your files or your account.`,
        '**Every tool is read-only.** They are annotated `readOnlyHint: true`, `destructiveHint: false`, `idempotentHint: true` and `openWorldHint: false`: nothing on the server changes, repeated calls return the same answer, and no tool reaches the wider web.',
        '**No credentials.** The server needs no sign-in, token or API key. If a connector you did not write asks for credentials it does not need, do not give them.',
        `**Nothing is kept from your plans.** The server records anonymous usage (which tool ran, how long it took, whether it failed, the client's name), never the contents of your plan or check, and never your IP address. The [privacy page](/privacy) has the details.`,
        `**Data it returns is data.** Catalog text describes videos; ${h.name} should treat it as information, never as instructions. That is the right stance for every connector.`,
      ] },

      { type: 'h2', id: 'use', text: 'First thing to try: plan a launch video' },
      { type: 'p', text: 'Paste the setup prompt once, then work through these:' },
      { type: 'code', label: 'Setup prompt', code: SETUP_PROMPT },
      { type: 'ol', items: s.prompts },
      { type: 'p', text: `${h.name} ends with a frame-timed blueprint: every shot with its start and end frame, how it enters and what of yours goes in it. A coding agent such as [Claude Code](/agents/claude-code) or [Codex](/agents/codex) builds and renders that blueprint in Remotion. The [${h.name} launch video page](/agents/${h.slug}) has more prompts.` },

      { type: 'h2', id: 'pitfalls', text: 'Common problems' },
      { type: 'ul', items: s.pitfalls },
    ],
    faq: s.faq,
    howTo: {
      name: `How to add a custom MCP connector to ${h.name}`,
      steps: h.install.map((step, i) => ({ name: `Step ${i + 1}`, text: step.code ? `${step.text} ${step.code}` : step.text })),
    },
    related: [
      { label: `Plan a product launch video with ${h.name}`, href: `/agents/${h.slug}` },
      s.also ?? { label: 'MCP server and agent skill setup for every agent', href: '/blog/kuchi-mcp-server-and-agent-skill' },
      { label: 'Browse launch video templates', href: '/videos' },
    ],
  };
}

const coding: Spec[] = [
  {
    harness: 'claude-code',
    slug: 'remotion-with-claude-code',
    heading: 'Remotion with Claude Code: make a product video from a prompt',
    title: 'Remotion with Claude Code: make a product video from a prompt',
    description: 'Use Claude Code and Remotion to build and render a product launch video in your own repo: project setup, a real reference to copy the rhythm from, the prompts in order, and how to check frames.',
    summary: 'Scaffold Remotion, give Claude Code a measured reference, and render an MP4 in your repo.',
    keywords: ['remotion claude code', 'claude code video', 'claude code remotion', 'make a video with claude code', 'product launch video', 'remotion'],
    intro: [
      'Claude Code can write a whole Remotion project, run it and render the MP4 without leaving your terminal. What it lacks is taste in timing: left alone it tends to give every shot the same length and the same fade. The fix is a real launch video to copy the rhythm from.',
      'This walkthrough sets up Remotion, connects a library of launch videos measured frame by frame, and runs Claude Code through choosing a reference, planning your version and checking it shot by shot.',
    ],
    fit: [
      'It runs commands in your project, so it installs Remotion, renders and re-renders without you copying files around.',
      'It reads images, so it can look at a rendered still next to the reference frame and see what drifted.',
      'A plugin installs the workflow skill and the MCP server together, so it knows the method before its first tool call.',
      'Project memory in CLAUDE.md keeps your brand colours, fonts and asset paths across sessions.',
    ],
    prompts: [
      'Make a 30-second launch video for this repo. Suggest three launch video templates that fit a developer tool and show me the posters.',
      'Use number 2. Study its breakdown and tell me what each shot shows before you plan anything.',
      'Plan the remake with my logo in ./brand and screenshots in ./screens. List anything you still need from me.',
      'Build it in Remotion on the planned frames, render stills at the check times and compare them with the reference.',
      'Fix the shots that drift, then render out/launch.mp4.',
    ],
    pitfalls: [
      'Letting it round shots to half seconds. Ask it to keep the planned frame numbers exactly; the rhythm lives there.',
      'Skipping the stills. One rendered frame per shot, compared with the reference, catches layout drift a quick watch misses.',
      'Putting brand rules only in the chat. Write colours, fonts and asset paths in CLAUDE.md so a new session keeps them.',
    ],
    faq: [
      { q: 'Can Claude Code make videos?', a: 'Yes, through code. With Remotion it writes React components for each shot and renders them to MP4 on your machine.' },
      { q: 'Do I need the plugin or just the MCP server?', a: 'Either works. The plugin adds the workflow skill and the MCP server in one command; the MCP server alone also gives Claude Code the library.' },
      { q: 'How long does a render take?', a: 'It depends on your machine and the scenes, but a single still with npx remotion still is much faster than a full render, which is why checking shot by shot is cheap.' },
    ],
  },
  {
    harness: 'codex',
    slug: 'remotion-with-codex',
    heading: 'Remotion with OpenAI Codex: build and render a product video',
    title: 'Remotion with OpenAI Codex: build and render a product video',
    description: 'Have OpenAI Codex build a product launch video in Remotion: one command to connect a measured reference library, the prompts in order, and the render-and-check loop in the CLI or the Codex app.',
    summary: 'Codex writes the scenes, renders and compares; a measured reference keeps the timing right.',
    keywords: ['codex remotion', 'openai codex video', 'codex make a video', 'codex cli mcp', 'remotion', 'product video'],
    intro: [
      'Codex edits files and runs commands, which is most of what making a video in Remotion takes: write a shot, render, look, fix. Give it a measured reference and it also gets the part people usually skip, the timing.',
      'The same steps work in Codex CLI and the Codex app, since both read the same MCP server URL.',
    ],
    fit: [
      'It runs the build, render and check loop itself instead of handing you code to paste.',
      'AGENTS.md carries your project rules (brand colours, composition size, asset folders) into every task.',
      'It accepts images, so you can give it a frame of the reference and a frame of your render and ask what differs.',
      'Install the workflow skill and it knows the remake method before it calls a tool.',
    ],
    prompts: [
      'Suggest launch video templates for a B2B SaaS dashboard and show me each poster and link.',
      'Study the one I picked shot by shot and list what each shot shows.',
      'Plan the remake for our product at 1920×1080, 30 fps, about 30 seconds. Ask me for anything missing.',
      'Build each shot as its own Remotion component on the planned frames, then render.',
      'Run the remake check and fix every shot it flags before you give me the file.',
    ],
    pitfalls: [
      'Network-restricted sandboxes. If the npm install fails, approve network access for that step or run it yourself.',
      'One giant component. Ask for a component per shot and one shot list with frame counts, so a retime is a one-line change.',
      'Approving a render without looking. Ask Codex to render stills at the check times first.',
    ],
    faq: [
      { q: 'Can OpenAI Codex make a video?', a: 'Yes. Codex writes Remotion code and renders it to MP4 in your project; the library gives it a real reference to copy the motion from.' },
      { q: 'Does it work in the Codex app as well as the CLI?', a: 'Yes. The CLI adds the server with one command; the app opens a task with the setup prompt from the button on the Codex page.' },
      { q: 'Which model should Codex use for this?', a: 'Use your usual coding model. The hard part, timing and layout, comes from the reference plan rather than the model guessing.' },
    ],
  },
  {
    harness: 'cursor',
    slug: 'remotion-in-cursor',
    heading: 'How to make videos in Cursor with Remotion',
    title: 'How to make videos in Cursor with Remotion and the agent',
    description: 'Build a product launch video in Cursor: scaffold Remotion, add a library of measured launch videos as an MCP server in one click, and let the agent build, preview and render it beside your code.',
    summary: 'Cursor\'s agent builds the video in the same repo as your product, from a real reference.',
    keywords: ['cursor remotion', 'make videos in cursor', 'cursor video', 'cursor mcp', 'remotion', 'product launch video'],
    intro: [
      'Cursor\'s agent can create files, run the terminal and iterate, so a Remotion video is just another folder in your project. Keeping the video beside the product code also means it can import your real components, colours and icons instead of redrawing them.',
      'Here is the setup, the prompt sequence that gets a good first cut, and the mistakes worth avoiding.',
    ],
    fit: [
      'One-click MCP install: a link opens Cursor with the server filled in.',
      'The agent sees your product code, so screens in the video can use your real components and design tokens.',
      'Project rules keep the video\'s look (fonts, colours, safe areas) consistent across chats.',
      'You can watch the Remotion Studio in a browser tab while the agent edits.',
    ],
    prompts: [
      'Create a Remotion project in ./video. Then suggest three launch video templates that fit this product and show me the posters.',
      'I pick number 1. Read its breakdown and storyboard and note what each shot shows.',
      'Plan the remake using our real UI: reuse components from ./src where a shot shows the product.',
      'Build the shots on the planned frames and start the Remotion Studio so I can watch.',
      'Check the remake against the reference and fix the shots that drift, then render.',
    ],
    pitfalls: [
      'Terminal commands waiting for approval. Approve the Remotion install and render steps, or allow them for this project.',
      'Mixing the video into the app bundle. Keep it in its own folder with its own package.json.',
      'Asking for "something like Apple". Pick a real template instead; the agent cannot measure a vibe.',
    ],
    faq: [
      { q: 'Can Cursor make videos?', a: 'Yes, as code. Cursor\'s agent writes a Remotion project and renders it to MP4 with a terminal command.' },
      { q: 'Where do I add an MCP server in Cursor?', a: 'Use the one-click install link, or add it in Cursor\'s MCP settings with the server URL and no authentication.' },
      { q: 'Can the video use my app\'s real components?', a: 'Often, yes. Remotion renders React, so components without browser-only side effects can be imported straight into a shot.' },
    ],
  },
  {
    harness: 'vs-code',
    slug: 'remotion-in-vs-code-copilot',
    heading: 'Make a Remotion video in VS Code with Copilot agent mode',
    title: 'Make a Remotion video in VS Code with GitHub Copilot agent mode',
    description: 'Use GitHub Copilot agent mode in VS Code to build a product launch video in Remotion: install the MCP server with one link, pick a real reference, and run the build, preview and render loop.',
    summary: 'Copilot agent mode plus Remotion, with a real launch video to time it against.',
    keywords: ['vs code remotion', 'copilot agent mode video', 'github copilot remotion', 'vs code mcp server', 'remotion', 'product video'],
    intro: [
      'Agent mode turns Copilot Chat in VS Code into an agent that edits files and runs terminal commands. That is enough to build and render a Remotion video, once it has something to aim at.',
      'This guide installs a library of measured launch videos as an MCP server, then walks Copilot through choosing a reference and building your version shot by shot.',
    ],
    fit: [
      'An install link adds the MCP server; VS Code asks you to confirm.',
      'The tools picker shows exactly which MCP tools agent mode may call.',
      'It runs in the editor you already use, with your extensions and terminal.',
      'Each terminal command is shown before it runs, so you see every install and render.',
    ],
    prompts: [
      'In agent mode: suggest three launch video templates for a mobile fitness app and show me the posters.',
      'Use the second one. Study it shot by shot before planning.',
      'Plan a 9:16 remake for Reels with my screenshots in ./screens.',
      'Scaffold Remotion in ./video and build each shot on the planned frames.',
      'Render stills at the check times, compare with the reference, fix, then render the MP4.',
    ],
    pitfalls: [
      'Asking in Ask mode. Only agent mode runs tools and commands.',
      'Tools switched off in the picker. If Copilot says it has no video tools, enable the server\'s tools there.',
      'Too many MCP servers at once. Turn off the ones you do not need for this task so the right tools get picked.',
    ],
    faq: [
      { q: 'Can GitHub Copilot make videos?', a: 'In agent mode it can build and render a Remotion video in your workspace, the same way it builds any other code.' },
      { q: 'How do I add an MCP server to VS Code?', a: 'Use an install link, or add an HTTP server to your MCP configuration with the server URL. VS Code asks you to trust it the first time.' },
      { q: 'Does the video library need an account?', a: 'No. The MCP server takes no sign-in and no API key; your Copilot setup applies as usual.' },
    ],
    also: { label: 'Make a launch video with GitHub Copilot CLI', href: '/agents/copilot-cli' },
  },
  {
    harness: 'gemini-cli',
    slug: 'remotion-with-gemini-cli',
    heading: 'Remotion with Gemini CLI: make a product video from the terminal',
    title: 'Remotion with Gemini CLI: make a product video in the terminal',
    description: 'Make a product launch video with Gemini CLI and Remotion: three lines in settings.json connect a measured reference library, then Gemini plans, builds, checks and renders from your terminal.',
    summary: 'Three lines of settings, then Gemini CLI builds and renders a timed launch video.',
    keywords: ['gemini cli remotion', 'gemini cli video', 'gemini cli mcp server', 'make a video with gemini', 'remotion'],
    intro: [
      'Gemini CLI is an agent in your terminal that reads files, writes code and runs commands. Remotion needs nothing more, so the CLI can take a video from an empty folder to an MP4.',
      'The missing piece is a reference. Below, a library of launch videos measured frame by frame goes into settings.json, and Gemini works from one of them.',
    ],
    fit: [
      'A large context window holds a whole storyboard and shot list at once.',
      'GEMINI.md keeps your brand and project rules for every session.',
      'The /mcp command shows connected servers and their tools at a glance.',
      'It runs everything in your terminal, so renders land in your project.',
    ],
    prompts: [
      'Suggest launch video templates for an AI writing tool. Show me each poster and link.',
      'Study the one I picked: list every shot with its start and end frame and what it shows.',
      'Plan my remake at 30 seconds with the assets in ./brand.',
      'Scaffold Remotion and build the shots on those frames.',
      'Check the remake, compare stills with the reference, fix, render.',
    ],
    pitfalls: [
      'Using "url" instead of "httpUrl" in settings.json. Gemini CLI reads "httpUrl" for Streamable HTTP servers.',
      'Not restarting after editing settings.json. The CLI loads servers at start.',
      'Letting it invent a logo. If an asset is missing, ask for a marked placeholder and add yours later.',
    ],
    faq: [
      { q: 'Can Gemini CLI make videos?', a: 'It can write and render a Remotion video in your project. The video is code you keep and can re-render.' },
      { q: 'Where is the Gemini CLI MCP config?', a: 'In ~/.gemini/settings.json under mcpServers. Use httpUrl for a remote Streamable HTTP server.' },
      { q: 'How do I see if the server loaded?', a: 'Run /mcp inside Gemini CLI. It lists each server and its tools.' },
    ],
    also: { label: 'Make a launch video in Google Antigravity', href: '/agents/antigravity' },
  },
  {
    harness: 'grok-build',
    slug: 'remotion-with-grok-build',
    heading: 'Grok Build and Remotion: code a product video from the terminal',
    title: 'Grok Build and Remotion: code a product video in the terminal',
    description: 'Make a product launch video with xAI\'s Grok Build: one grok mcp add command connects a measured launch video library, then Grok plans and builds the video in Remotion and renders it locally.',
    summary: 'One grok mcp add command, then Grok Build plans, builds and renders the video.',
    keywords: ['grok build', 'grok build mcp', 'grok remotion', 'grok coding agent video', 'xai grok build', 'remotion'],
    intro: [
      'Grok Build is xAI\'s coding agent for the terminal. It writes code and runs commands in your project, so it can build a Remotion video and render it like any other build artefact.',
      'This guide connects a library of real launch videos with one command, so Grok has a measured reference to copy the timing and motion from.',
    ],
    fit: [
      'One command adds the server; it is saved in ~/.grok/config.toml.',
      'A project-level .grok/config.toml shares the server with everyone on the repo.',
      'grok mcp list confirms the connection before you start.',
      'It renders locally, so the MP4 and its source stay in your project.',
    ],
    prompts: [
      'Suggest three launch video templates that fit a CLI tool and show me the posters.',
      'Study the one I pick and describe each shot.',
      'Plan the remake with our README screenshots and logo.',
      'Scaffold Remotion, build each shot on its planned frames and render.',
      'Run the remake check and fix what it flags.',
    ],
    pitfalls: [
      'Adding the server inside a session that already started. Start a new session after grok mcp add.',
      'Personal and project configs disagreeing. Keep the server in one of them.',
      'Rushing the build. Ask for the shot analysis first; the plan depends on it.',
    ],
    faq: [
      { q: 'What is Grok Build?', a: 'xAI\'s coding agent for the terminal. It edits files and runs commands in your project.' },
      { q: 'How do I add an MCP server to Grok Build?', a: 'Run grok mcp add --transport http with a name and URL, or add an [mcp_servers.<name>] block with url to ~/.grok/config.toml.' },
      { q: 'Is Grok Build the same as the Grok chat app?', a: 'No. The chat app adds servers as connectors and plans; Grok Build writes and renders the video.' },
    ],
    also: { label: 'Plan a launch video in Grok', href: '/agents/grok' },
  },
  {
    harness: 'devin',
    slug: 'devin-product-demo-video',
    heading: 'Have Devin build a product demo video in Remotion',
    title: 'Have Devin build a product demo video with Remotion',
    description: 'Hand a product demo video to Devin: add a launch video library under Customize → MCPs, give it a reference and your assets, and let it build and render the video in Remotion on its own machine.',
    summary: 'Give Devin a measured reference and your assets, and get back a rendered Remotion video.',
    keywords: ['devin video', 'devin mcp', 'devin ai remotion', 'ai product demo video', 'cognition devin', 'remotion'],
    intro: [
      'Devin works on its own machine and reports back, which suits a video: it can install Remotion, build the shots, render and iterate while you do something else.',
      'Give it a measured reference first. With a library of real launch videos connected, Devin can match a shot list frame for frame instead of guessing at pacing.',
    ],
    fit: [
      'It runs long tasks on its own and reports progress, so a full build-render-check loop needs no babysitting.',
      'Any member can add an MCP server for themselves under Customize → MCPs.',
      'Test tools on the MCP page confirms the connection before a session starts.',
      'A Devin CLI is there if you would rather add servers from a terminal.',
    ],
    prompts: [
      'Suggest three launch video templates for our product and send me the posters and links. Wait for my pick.',
      'Use number 3. Study its breakdown, then plan the remake with the logo and screenshots attached here.',
      'Build it in Remotion in a new video/ folder of our repo, on the planned frames.',
      'Render stills at the check times and compare them with the reference before rendering the MP4.',
      'Open a pull request with the video source and attach the render.',
    ],
    pitfalls: [
      'Not attaching assets. Devin cannot reach files on your laptop; attach the logo and screenshots to the session.',
      'Letting it pick the template. Ask it to stop and wait for your choice.',
      'Authentication set to something other than None. This server needs no auth; a token field left filled can fail the test.',
    ],
    faq: [
      { q: 'Can Devin make videos?', a: 'Yes, as code. Devin can build a Remotion project and render it on its machine, then share the file and source.' },
      { q: 'How do I add an MCP server to Devin?', a: 'Open Customize → MCPs, choose + and New MCP, pick HTTP, paste the URL and set Authentication to None. Or use devin mcp add in the CLI.' },
      { q: 'Should Devin commit the video?', a: 'Commit the Remotion source; the MP4 is a build artefact. Ask for the render as an attachment or a release asset.' },
    ],
  },
  {
    harness: 'pi',
    slug: 'pi-coding-agent-video',
    heading: 'Make a product video with the Pi coding agent and Remotion',
    title: 'Make a product video with the Pi coding agent and Remotion',
    description: 'Use the minimal Pi coding agent to make a product launch video: add a measured launch video library with pi mcp add, then build and render the video in Remotion from your terminal.',
    summary: 'A minimal agent and a measured reference: Pi builds the video in Remotion.',
    keywords: ['pi coding agent', 'pi mcp', 'pi agent video', 'pi.dev', 'remotion', 'terminal coding agent'],
    intro: [
      'Pi is a deliberately small coding agent: a short system prompt, a few tools and nothing hidden. That makes it predictable on a job like a video, where you want it to follow a plan rather than improvise.',
      'Connect a library of launch videos measured frame by frame and Pi has the plan: exact shot boundaries, entrances and motion, mapped onto your product.',
    ],
    fit: [
      'Few moving parts, so it does what the blueprint says.',
      'pi mcp add writes the server to ~/.pi/agent/mcp.json in one step.',
      '/reload picks up a new server in a running session.',
      'Works with whichever model provider you have set up.',
    ],
    prompts: [
      'Suggest launch video templates for an open-source library and show me each poster and link.',
      'Read the breakdown of the one I choose and describe each shot.',
      'Plan the remake with my logo at ./logo.svg.',
      'Create a Remotion project and build the shots on those frames.',
      'Check the remake against the reference, then render.',
    ],
    pitfalls: [
      'Forgetting /reload after adding the server mid-session.',
      'A small model losing the shot list. Ask Pi to write the plan to plan.md and read it back per shot.',
      'Skipping pi mcp list. It confirms the URL was saved correctly.',
    ],
    faq: [
      { q: 'What is the Pi coding agent?', a: 'A minimal, extensible coding agent for the terminal from pi.dev. It reads and edits files and runs commands.' },
      { q: 'Where does Pi keep MCP servers?', a: 'In ~/.pi/agent/mcp.json. pi mcp add writes it for you.' },
      { q: 'Can a small agent handle a whole video?', a: 'Yes, shot by shot. The plan gives every shot exact frames, so each step is small and checkable.' },
    ],
  },
  {
    harness: 'muse-code',
    slug: 'muse-code-remotion-video',
    heading: 'Muse Code and Remotion: build a product launch video',
    title: 'Muse Code and Remotion: build a product launch video',
    description: 'Make a product launch video with Meta\'s Muse Code: add a measured launch video library in settings.json, then let Muse plan, build and render the video in Remotion from your terminal.',
    summary: 'A few lines in settings.json, then Muse Code builds a launch video in Remotion.',
    keywords: ['muse code', 'muse code mcp', 'meta muse code', 'muse code video', 'remotion', 'coding agent'],
    intro: [
      'Muse Code is Meta\'s coding agent for the terminal. It reads your project, writes code and runs commands, which covers building and rendering a Remotion video.',
      'Below, a library of real launch videos is added to Muse\'s settings so it can work from a measured reference instead of a guess.',
    ],
    fit: [
      'MCP servers are a few lines in ~/.config/muse/settings.json.',
      '/mcp shows the server and its tools inside a session.',
      'It builds and renders locally, so the source and the MP4 stay yours.',
      'Optional servers stay out of the way until a task needs them.',
    ],
    prompts: [
      'Suggest launch video templates for a design tool and show me the posters.',
      'Study the one I pick shot by shot.',
      'Plan my 20-second remake with the assets in ./brand.',
      'Build it in Remotion on the planned frames.',
      'Compare stills with the reference at the check times, fix, render.',
    ],
    pitfalls: [
      'Overwriting settings.json. If the file exists, add only the mcp_servers block and keep "schema_version": 1.',
      'Using "http" as the transport name. Muse expects "streamable_http".',
      'Not checking /mcp before the first prompt.',
    ],
    faq: [
      { q: 'What is Muse Code?', a: 'Meta\'s coding agent for the terminal. It edits files and runs commands in your project.' },
      { q: 'Where is the Muse Code MCP config?', a: 'In ~/.config/muse/settings.json under mcp_servers, with schema_version 1 at the top.' },
      { q: 'Can Muse Code render the video?', a: 'Yes. It runs Remotion\'s render command in your project like any other build.' },
    ],
  },
  {
    harness: 't3-code',
    slug: 't3-code-video',
    heading: 'Make a product video in T3 Code with Remotion',
    title: 'Make a product video in T3 Code with Claude Code or Codex',
    description: 'T3 Code runs Claude Code and Codex in one window. Connect a launch video library to the agent underneath, then build and render a Remotion product video from a T3 Code thread.',
    summary: 'T3 Code drives Claude Code or Codex; connect the agent once and build the video in a thread.',
    keywords: ['t3 code', 't3 code mcp', 't3 code claude code', 't3 code codex', 'remotion', 'product video'],
    intro: [
      'T3 Code is a desktop app for running coding agents such as Claude Code and Codex side by side. It uses the agent\'s own configuration, so you connect MCP servers to the agent, not to T3 Code.',
      'That makes setup one command for whichever agent you run. After that, each thread can build a video.',
    ],
    fit: [
      'Several threads at once: try two templates in parallel and keep the better cut.',
      'It uses the agent\'s own MCP setup, so nothing is configured twice.',
      'A desktop view of diffs and output while the agent renders.',
      'Works with Claude Code, Codex and other agents it supports.',
    ],
    prompts: [
      'In a new thread: suggest three launch video templates for this product and show me the posters.',
      'Open a second thread on the same repo with a different template, so I can compare.',
      'In each thread, plan the remake with my assets and build it in Remotion.',
      'Render both, then check each against its reference.',
      'Keep the better one and delete the other branch.',
    ],
    pitfalls: [
      'Adding the server in T3 Code\'s settings. Add it to Claude Code or Codex; T3 Code reads theirs.',
      'Two threads writing to the same folder. Give each its own branch or folder.',
      'Starting the thread before the agent has the server. Start a new thread after adding it.',
    ],
    faq: [
      { q: 'What is T3 Code?', a: 'A desktop app for running coding agents like Claude Code and Codex, with several threads side by side.' },
      { q: 'How do I add an MCP server in T3 Code?', a: 'Add it to the agent T3 Code runs: claude mcp add for Claude Code, or codex mcp add for Codex.' },
      { q: 'Can I compare two video drafts?', a: 'Yes. Run one thread per template on separate branches and render both.' },
    ],
    also: { label: 'Remotion with Claude Code', href: '/blog/remotion-with-claude-code' },
  },
  {
    harness: 'opencode',
    slug: 'opencode-remotion-video',
    heading: 'OpenCode and Remotion: make a product video with any model',
    title: 'OpenCode and Remotion: make a product video with any model',
    description: 'Use the open-source OpenCode agent with any model to build a product launch video in Remotion: one opencode mcp add command connects a measured reference library, then build, check and render.',
    summary: 'Open source, any model: OpenCode builds a timed launch video from a real reference.',
    keywords: ['opencode', 'opencode mcp', 'opencode remotion', 'open source coding agent video', 'remotion', 'opencode mcp server'],
    intro: [
      'OpenCode is an open-source coding agent for the terminal that works with many model providers. It writes code and runs commands, so it can build and render a Remotion video with whichever model you prefer.',
      'Different models have different taste. A measured reference evens that out: the plan fixes every shot\'s frames and motion, and the model fills in your content.',
    ],
    fit: [
      'Pick any model; the reference keeps the result consistent across them.',
      'opencode mcp add --global makes the server available in every project.',
      'Config lives in opencode.jsonc, easy to commit for a team.',
      'opencode mcp list confirms the server before you start.',
    ],
    prompts: [
      'Suggest three launch video templates for a database product. Show me the posters and links.',
      'Study my pick shot by shot.',
      'Plan the remake with my logo and screenshots.',
      'Build it in Remotion on the planned frames, then render.',
      'Run the remake check and fix the shots it flags.',
    ],
    pitfalls: [
      'A server entry without type "remote". A URL alone is not enough in opencode.jsonc.',
      'Small local models dropping the frame numbers. Ask it to save the plan to a file and work from that.',
      'Forgetting --global, then wondering why another project has no server.',
    ],
    faq: [
      { q: 'What is OpenCode?', a: 'An open-source AI coding agent for the terminal that works with many model providers.' },
      { q: 'How do I add an MCP server to OpenCode?', a: 'Run opencode mcp add with --url, or add a remote server entry to opencode.jsonc.' },
      { q: 'Which model is best for video?', a: 'Any capable coding model. The reference plan carries the timing, so the model mostly writes components.' },
    ],
  },
  {
    harness: 'cline',
    slug: 'cline-remotion-video',
    heading: 'Make a Remotion video with Cline',
    title: 'Make a Remotion product video with Cline in your editor',
    description: 'Build a product launch video with Cline: add a remote MCP server in the MCP Servers panel, plan the video in Plan mode against a real reference, then build and render it in Act mode.',
    summary: 'Plan the shots in Plan mode, build and render in Act mode, from a measured reference.',
    keywords: ['cline remotion', 'cline mcp', 'cline remote mcp server', 'cline video', 'remotion', 'vs code agent'],
    intro: [
      'Cline separates thinking from doing: Plan mode works out the approach, Act mode edits files and runs commands. A video fits that split well. Plan the shots against a reference, then build them.',
      'This guide adds a library of launch videos measured frame by frame as a remote MCP server, then runs Cline through both modes.',
    ],
    fit: [
      'Plan mode for the shot analysis and plan, Act mode for the build.',
      'Remote servers are added in the MCP Servers panel, no file editing.',
      'Every file change and command is shown for approval.',
      'A Cline CLI is there for adding servers from a terminal.',
    ],
    prompts: [
      'Plan mode: suggest launch video templates for a browser extension and show me the posters.',
      'Plan mode: study my pick and plan the remake with my assets. Do not write code yet.',
      'Act mode: scaffold Remotion and build the shots on the planned frames.',
      'Act mode: render stills at the check times and compare with the reference.',
      'Act mode: fix the drift and render the MP4.',
    ],
    pitfalls: [
      'Choosing SSE as the transport. Pick Streamable HTTP.',
      'Auto-approving everything. Approve renders, but read the plan before Act mode starts.',
      'Starting in Act mode. The plan is cheaper to fix than the code.',
    ],
    faq: [
      { q: 'Can Cline make videos?', a: 'Yes, with Remotion. Cline writes the components and runs the render command in your workspace.' },
      { q: 'How do I add a remote MCP server to Cline?', a: 'Open MCP Servers → Remote Servers, enter a name and URL, choose Streamable HTTP and add it.' },
      { q: 'Plan or Act mode for this?', a: 'Both: Plan for choosing, studying and planning; Act for building, checking and rendering.' },
    ],
  },
  {
    harness: 'zed',
    slug: 'zed-agent-video',
    heading: 'Make a product video in Zed with its agent and Remotion',
    title: 'Make a product video in Zed with the agent and Remotion',
    description: 'Use Zed\'s agent to build a product launch video in Remotion: add a remote MCP server in Settings → AI, pick a real reference, and build and render the video in your Zed project.',
    summary: 'Add a remote MCP server in Zed, then its agent builds a launch video in Remotion.',
    keywords: ['zed mcp server', 'zed agent', 'zed remotion', 'zed editor video', 'zed context server', 'remotion'],
    intro: [
      'Zed\'s agent panel edits your project and runs commands, and Zed can add remote MCP servers from its settings. Together that is everything a Remotion video needs.',
      'Below: the server setup, a prompt sequence for a first cut, and the Zed-specific things to watch.',
    ],
    fit: [
      'Remote MCP servers from Settings → AI → MCP Servers.',
      'Or one context_servers entry in your settings file.',
      'A fast editor to review each shot component as it is written.',
      'Agent profiles let you choose which tools the agent may use.',
    ],
    prompts: [
      'Suggest launch video templates for a code editor plugin and show me the posters.',
      'Study my pick and list each shot.',
      'Plan the remake with my assets in ./brand.',
      'Scaffold Remotion and build each shot on its frames.',
      'Check against the reference, fix, render.',
    ],
    pitfalls: [
      'A profile without MCP tools. Make sure the active profile allows the server\'s tools.',
      'Writing the entry under the wrong key. Remote servers go under context_servers with a url.',
      'Not waiting for the server to show as running in the panel.',
    ],
    faq: [
      { q: 'Does Zed support remote MCP servers?', a: 'Yes. Add one in Settings → AI → MCP Servers → Add Remote Server, or under context_servers in settings.' },
      { q: 'Can Zed\'s agent render a video?', a: 'Yes, by running Remotion\'s render command in the project terminal.' },
      { q: 'What is a context server in Zed?', a: 'Zed\'s name for an MCP server in its settings file.' },
    ],
  },
  {
    harness: 'amp',
    slug: 'amp-remotion-video',
    heading: 'Amp and Remotion: build a product launch video',
    title: 'Amp and Remotion: build a product launch video',
    description: 'Make a product launch video with Amp: one amp mcp add command connects a measured launch video library, then Amp plans, builds and renders the video in Remotion from the terminal or editor.',
    summary: 'One amp mcp add command, then Amp builds a timed launch video in Remotion.',
    keywords: ['amp coding agent', 'amp mcp', 'amp remotion', 'ampcode', 'remotion', 'product launch video'],
    intro: [
      'Amp is a coding agent for the terminal and the editor. It reads your project, writes code and runs commands, so a Remotion video is in reach once it has a plan.',
      'The plan comes from a real launch video measured frame by frame, connected with one command.',
    ],
    fit: [
      'amp mcp add connects the server in one line.',
      'The same server works in the CLI and the editor extension.',
      'Threads keep the whole build history, easy to share with a teammate.',
      'It renders locally, in your repo.',
    ],
    prompts: [
      'Suggest launch video templates for an API product and show me the posters.',
      'Study my pick shot by shot.',
      'Plan the remake with my logo and three screenshots.',
      'Build it in Remotion on the planned frames and render.',
      'Run the remake check and fix the flagged shots.',
    ],
    pitfalls: [
      'Settings in the wrong file. In settings, servers go under amp.mcpServers.',
      'Letting a long thread drift. Start a new thread per video and point it at the saved plan.',
      'Skipping the shot analysis before planning.',
    ],
    faq: [
      { q: 'How do I add an MCP server to Amp?', a: 'Run amp mcp add with a name and URL, or add it under amp.mcpServers in settings.' },
      { q: 'Can Amp make a video?', a: 'Yes, by writing and rendering a Remotion project.' },
      { q: 'CLI or editor?', a: 'Either. The server is shared, so start in one and continue in the other.' },
    ],
  },
  {
    harness: 'kiro',
    slug: 'kiro-spec-product-video',
    heading: 'Spec a product video in Kiro and build it with Remotion',
    title: 'Spec a product video in Kiro, then build it with Remotion',
    description: 'Use Kiro\'s spec-driven flow for a product launch video: connect a measured launch video library in mcp.json, turn the reference plan into a spec and tasks, then build and render in Remotion.',
    summary: 'Turn a measured reference into a Kiro spec, then build the video task by task.',
    keywords: ['kiro mcp', 'kiro spec', 'kiro ide video', 'aws kiro', 'remotion', 'spec driven development'],
    intro: [
      'Kiro builds from specs: requirements, a design and a list of tasks. A video is a natural spec. The reference supplies the design (every shot, its frames and motion) and each shot becomes a task.',
      'This guide connects a library of real launch videos so Kiro can write that spec from a measured reference.',
    ],
    fit: [
      'Specs turn the shot plan into reviewable requirements, design and tasks.',
      'One task per shot makes progress easy to follow and to redo.',
      'Steering files keep brand rules in every session.',
      'Servers are three lines in mcp.json, per user or per workspace.',
    ],
    prompts: [
      'Suggest launch video templates for a cloud dashboard and show me the posters.',
      'Study my pick and write a spec: requirements from my product, design from the reference shots, one task per shot.',
      'Run the tasks: scaffold Remotion and build each shot on its planned frames.',
      'Add a final task to check the remake against the reference and render.',
      'Fix the tasks the check flags.',
    ],
    pitfalls: [
      'Writing the spec before the shot analysis. Study the reference first.',
      'Workspace and user mcp.json both defining the server. Keep one.',
      'Tasks that span several shots. Keep one shot per task so a fix stays small.',
    ],
    faq: [
      { q: 'Where is the Kiro MCP config?', a: 'In ~/.kiro/settings/mcp.json for every workspace, or .kiro/settings/mcp.json for one.' },
      { q: 'Can Kiro build a video?', a: 'Yes. It writes the Remotion project from its tasks and runs the render.' },
      { q: 'Why use a spec for a video?', a: 'A spec makes the plan reviewable before code, and each shot task can be checked on its own.' },
    ],
  },
  {
    harness: 'copilot-cli',
    slug: 'copilot-cli-remotion-video',
    heading: 'GitHub Copilot CLI and Remotion: render a product video',
    title: 'GitHub Copilot CLI and Remotion: render a product video',
    description: 'Make a product launch video with GitHub Copilot CLI: copilot mcp add connects a measured launch video library, then Copilot builds the video in Remotion and renders it from your terminal.',
    summary: 'copilot mcp add, then Copilot CLI builds and renders a launch video in Remotion.',
    keywords: ['github copilot cli', 'copilot cli mcp', 'copilot cli video', 'copilot mcp add', 'remotion'],
    intro: [
      'GitHub Copilot CLI brings Copilot\'s agent to the terminal: it edits files and runs commands with your approval. That covers a Remotion project from scaffold to render.',
      'Connect a library of real launch videos and Copilot builds to a measured shot list instead of inventing one.',
    ],
    fit: [
      'One copilot mcp add command, saved to ~/.copilot/mcp-config.json.',
      'Or /mcp add inside a running session.',
      'Every command is shown for approval, so you see each install and render.',
      'Pairs with the VS Code setup if you also use agent mode.',
    ],
    prompts: [
      'Suggest launch video templates for a GitHub Action and show me the posters.',
      'Study my pick shot by shot.',
      'Plan the remake with my README screenshots.',
      'Build it in Remotion on the planned frames, then render.',
      'Check the remake and fix what drifts.',
    ],
    pitfalls: [
      'Adding with the wrong transport. Use --transport http.',
      'Denying the render command. Allow it for this folder so iteration stays quick.',
      'Forgetting to restart after editing the config file by hand.',
    ],
    faq: [
      { q: 'How do I add an MCP server to Copilot CLI?', a: 'Run copilot mcp add --transport http with a name and URL, or /mcp add in a session.' },
      { q: 'Can Copilot CLI make videos?', a: 'Yes, by building and rendering a Remotion project in your folder.' },
      { q: 'Is this the same as agent mode in VS Code?', a: 'The same idea in the terminal. Each has its own MCP config.' },
    ],
    also: { label: 'Remotion in VS Code with Copilot agent mode', href: '/blog/remotion-in-vs-code-copilot' },
  },
  {
    harness: 'droid',
    slug: 'factory-droid-video',
    heading: 'Factory Droid and Remotion: build a product demo video',
    title: 'Factory Droid and Remotion: build a product demo video',
    description: 'Build a product demo video with Factory\'s Droid: droid mcp add connects a measured launch video library, then Droid plans, builds and renders the video in Remotion from your terminal.',
    summary: 'One droid mcp add command, then Droid builds a timed demo video in Remotion.',
    keywords: ['factory droid', 'droid mcp', 'factory ai droid', 'droid cli video', 'remotion', 'product demo video'],
    intro: [
      'Droid is Factory\'s coding agent for the terminal. It works through a task in your project, editing files and running commands, which includes building and rendering a Remotion video.',
      'A measured reference gives it the shot list; your assets give it the content.',
    ],
    fit: [
      'droid mcp add with --type http connects the server in one line.',
      '/mcp inside Droid confirms the tools.',
      'Good at long multi-step tasks like build, render, check, fix.',
      'Renders locally, in your repo.',
    ],
    prompts: [
      'Suggest launch video templates for a developer platform and show me the posters.',
      'Study my pick and describe each shot.',
      'Plan the remake with our logo and screenshots.',
      'Build it in Remotion on the planned frames and render.',
      'Check against the reference and fix what it flags.',
    ],
    pitfalls: [
      'Leaving out --type http when adding the server.',
      'Letting it choose a template for you. Ask it to wait for your pick.',
      'Not giving it the asset folder. Name the path in the prompt.',
    ],
    faq: [
      { q: 'How do I add an MCP server to Droid?', a: 'Run droid mcp add with a name, the URL and --type http, then check it with /mcp.' },
      { q: 'Can Droid render a video?', a: 'Yes, by running Remotion\'s render command in your project.' },
      { q: 'What is Factory Droid?', a: 'Factory\'s AI coding agent, used from the terminal.' },
    ],
  },
  {
    harness: 'kimi-code',
    slug: 'kimi-code-remotion-video',
    heading: 'Kimi Code and Remotion: make a product video',
    title: 'Kimi Code and Remotion: make a product launch video',
    description: 'Make a product launch video with Moonshot AI\'s Kimi Code: kimi mcp add connects a measured launch video library, then Kimi builds and renders the video in Remotion from your terminal.',
    summary: 'One kimi mcp add command, then Kimi Code builds a launch video in Remotion.',
    keywords: ['kimi code', 'kimi code mcp', 'kimi cli', 'moonshot kimi video', 'remotion', 'kimi k2'],
    intro: [
      'Kimi Code is Moonshot AI\'s coding agent for the terminal. Like other terminal agents it reads, writes and runs, so it can build a Remotion video and render it.',
      'Connect a library of launch videos measured frame by frame, and Kimi has exact shots to build to.',
    ],
    fit: [
      'kimi mcp add saves the server to ~/.kimi/mcp.json.',
      'kimi mcp list confirms it before you start.',
      'A long context holds the full storyboard and plan.',
      'Renders locally in your project.',
    ],
    prompts: [
      'Suggest launch video templates for a productivity app and show me the posters.',
      'Study my pick shot by shot.',
      'Plan my remake with the assets in ./brand.',
      'Build it in Remotion on the planned frames and render.',
      'Run the remake check, then fix.',
    ],
    pitfalls: [
      'Leaving out --transport http.',
      'Starting Kimi Code before adding the server; restart it after.',
      'Asking for the build before the plan.',
    ],
    faq: [
      { q: 'What is Kimi Code?', a: 'Moonshot AI\'s coding agent for the terminal.' },
      { q: 'How do I add an MCP server to Kimi Code?', a: 'Run kimi mcp add --transport http with a name and URL. It is saved to ~/.kimi/mcp.json.' },
      { q: 'Can Kimi Code make a video?', a: 'Yes, by writing and rendering a Remotion project.' },
    ],
  },
  {
    harness: 'qwen-code',
    slug: 'qwen-code-remotion-video',
    heading: 'Qwen Code and Remotion: make a product video',
    title: 'Qwen Code and Remotion: make a product launch video',
    description: 'Make a product launch video with Qwen Code: add a measured launch video library with qwen mcp add or settings.json, then Qwen builds and renders the video in Remotion from your terminal.',
    summary: 'qwen mcp add or a few lines of settings, then Qwen Code builds a launch video.',
    keywords: ['qwen code', 'qwen code mcp', 'qwen coder video', 'qwen cli', 'remotion', 'alibaba qwen'],
    intro: [
      'Qwen Code is a terminal coding agent tuned for Qwen\'s coder models. It edits your project and runs commands, which is all a Remotion video needs.',
      'Give it a measured reference and it builds to exact frames instead of guessing.',
    ],
    fit: [
      'qwen mcp add connects the server in one command.',
      'Or httpUrl in ~/.qwen/settings.json.',
      'Works with Qwen\'s coder models and other providers.',
      'Renders locally.',
    ],
    prompts: [
      'Suggest launch video templates for a data tool and show me the posters.',
      'Study my pick shot by shot.',
      'Plan the remake with my logo and screenshots.',
      'Build it in Remotion on the planned frames and render.',
      'Check against the reference and fix.',
    ],
    pitfalls: [
      'Using "url" in settings.json. Qwen Code reads "httpUrl" for Streamable HTTP.',
      'Not restarting after editing settings.',
      'Skipping the stills check.',
    ],
    faq: [
      { q: 'How do I add an MCP server to Qwen Code?', a: 'Run qwen mcp add --transport http with a name and URL, or add httpUrl under mcpServers in ~/.qwen/settings.json.' },
      { q: 'Can Qwen Code make videos?', a: 'Yes, as a Remotion project it writes and renders.' },
      { q: 'Is Qwen Code related to Gemini CLI?', a: 'It started from Gemini CLI, which is why its settings look similar.' },
    ],
  },
  {
    harness: 'antigravity',
    slug: 'antigravity-remotion-video',
    heading: 'Make a product video in Google Antigravity with Remotion',
    title: 'Make a product video in Google Antigravity with Remotion',
    description: 'Use Google Antigravity\'s agents to build a product launch video in Remotion: add a measured launch video library in mcp_config.json, review the plan as an artifact, then build and render.',
    summary: 'Antigravity\'s agents plan, build and render a launch video from a real reference.',
    keywords: ['google antigravity', 'antigravity mcp', 'antigravity mcp_config', 'antigravity ide video', 'remotion'],
    intro: [
      'Antigravity is Google\'s agent-first IDE. Agents plan a task, show you artifacts such as task lists and plans to review, then do the work in the editor and terminal.',
      'That review step suits a video: approve the shot plan from a measured reference before any code is written.',
    ],
    fit: [
      'Plans arrive as artifacts you can comment on before the build.',
      'Servers are three lines in mcp_config.json, per user or per workspace.',
      'The MCP Store opens the config file for you.',
      'Agents run the build and render in the editor\'s terminal.',
    ],
    prompts: [
      'Suggest launch video templates for a mobile game and show me the posters.',
      'Study my pick and give me the shot plan as an artifact to review.',
      'After I approve it: scaffold Remotion and build each shot on its frames.',
      'Render stills at the check times and compare with the reference.',
      'Fix and render the MP4.',
    ],
    pitfalls: [
      'Using "url" in mcp_config.json. Antigravity reads "serverUrl".',
      'Approving the plan without reading the shot list.',
      'A workspace config shadowing your user config.',
    ],
    faq: [
      { q: 'Where is the Antigravity MCP config?', a: 'In ~/.gemini/config/mcp_config.json, or <workspace>/.agents/mcp_config.json for one workspace. Remote servers use serverUrl.' },
      { q: 'Can Antigravity make a video?', a: 'Its agents can build and render a Remotion project in your workspace.' },
      { q: 'Is it the same config as Gemini CLI?', a: 'No. Gemini CLI uses ~/.gemini/settings.json with httpUrl.' },
    ],
    also: { label: 'Remotion with Gemini CLI', href: '/blog/remotion-with-gemini-cli' },
  },
  {
    harness: 'xum',
    slug: 'xum-parallel-video-drafts',
    heading: 'Parallel video drafts in Xum: Remotion with an agent per branch',
    title: 'Parallel video drafts in Xum (formerly Mux) with Remotion',
    description: 'Use Xum, formerly Mux, to try several launch video templates at once: one agent per workspace, each building a Remotion draft from a different measured reference, then keep the best.',
    summary: 'One agent per workspace, one template each: compare launch video drafts side by side.',
    keywords: ['xum', 'mux coding agent', 'xum mcp', 'parallel coding agents', 'remotion', 'coder mux'],
    intro: [
      'Xum, formerly Mux, runs coding agents in parallel, each in its own workspace. For a video that means you do not have to pick one template up front: build two or three drafts at once and keep the best.',
      'Each agent connects to the same library of measured launch videos, so every draft has a real reference behind it.',
    ],
    fit: [
      'One workspace per draft, so experiments never collide.',
      'One line in ~/.xum/mcp.jsonc connects the server to every agent.',
      'Compare finished renders side by side before choosing.',
      'Also in Settings → MCP if you prefer not to edit files.',
    ],
    prompts: [
      'Suggest four launch video templates for my product and show me the posters.',
      'Workspace 1: remake template 1. Workspace 2: remake template 3. Same assets in ./brand.',
      'In each workspace: study the reference, plan, build in Remotion and render.',
      'Run the remake check in both and fix the flagged shots.',
      'Put the two renders side by side so I can choose.',
    ],
    pitfalls: [
      'No Node.js on the machine. The config uses npx to bridge to the remote server.',
      'Old installs. Mux installs read ~/.mux/mcp.jsonc instead.',
      'Too many drafts. Two or three is enough to compare; more just costs time.',
    ],
    faq: [
      { q: 'What is Xum?', a: 'A tool from Coder, formerly called Mux, for running coding agents in parallel workspaces.' },
      { q: 'How do I add an MCP server to Xum?', a: 'Add it to ~/.xum/mcp.jsonc as an npx mcp-remote command with the URL, or in Settings → MCP.' },
      { q: 'Why build several drafts?', a: 'Templates feel different once your content is in them. Building two cheaply beats arguing over posters.' },
    ],
  },
];

const chat: Spec[] = [
  {
    harness: 'claude',
    slug: 'claude-custom-connector',
    heading: 'How to add a custom connector (remote MCP server) to Claude',
    title: 'How to add a custom connector (remote MCP server) to Claude',
    description: 'Add a custom connector to Claude on claude.ai or the desktop app: where the setting lives, what URL to paste, how to check the tools, and a first task to try with a free launch video library.',
    summary: 'Where custom connectors live in Claude, how to add one by URL, and what to try first.',
    keywords: ['claude custom connector', 'add mcp server to claude', 'claude remote mcp', 'claude connectors', 'claude.ai mcp', 'claude desktop mcp'],
    intro: [
      'Claude can use tools from any remote MCP server you add as a custom connector. Once added on claude.ai, the connector follows your account to the desktop app as well.',
      'This guide adds one by URL, checks it, and puts it to work planning a product launch video from a real reference.',
    ],
    fit: [
      'Search and read a library Claude has no other way to see.',
      'Call tools mid-conversation, with your approval the first time.',
      'Use the same connector on the web and in the desktop app.',
      'Pair with artifacts: Claude can lay the shot plan out as a table you keep.',
    ],
    prompts: [
      'Suggest three launch video templates for my product (describe it in a sentence) and show each poster and link.',
      'Study the one I pick: what does each shot show?',
      'Plan my remake at 30 seconds and list everything you need from me.',
      'Lay the final shot plan out as a table I can hand to a coding agent.',
    ],
    check: 'Open a new chat, turn the connector on from the tools menu and ask Claude to list its tools. It should see 13: eleven that start with `kuchi_`, plus `search` and `fetch`.',
    pitfalls: [
      'Connector added but off in the chat. Turn it on from the tools menu.',
      'Pasting the URL with a trailing space or without https.',
      'Expecting Claude to render the file. Claude plans; a coding agent such as Claude Code renders.',
    ],
    faq: [
      { q: 'How do I add a custom connector to Claude?', a: 'Open Customize → Connectors on claude.ai, add a custom connector, give it a name and paste the server URL. Leave authentication empty for a server that needs none.' },
      { q: 'Do custom connectors work in the Claude desktop app?', a: 'Yes. A connector added to your account is available on claude.ai and in the desktop app.' },
      { q: 'Can Claude make the video itself?', a: 'Claude chooses the template, studies it and writes the frame-timed plan. Claude Code builds and renders it.' },
    ],
    also: { label: 'Remotion with Claude Code', href: '/blog/remotion-with-claude-code' },
  },
  {
    harness: 'chatgpt',
    slug: 'chatgpt-custom-mcp-server',
    heading: 'How to add a custom MCP server to ChatGPT',
    title: 'How to add a custom MCP server to ChatGPT',
    description: 'Add a custom MCP server to ChatGPT in Plugins: the exact menu path, what to paste, how to choose No authentication, and a first task to try with a free launch video library.',
    summary: 'The menu path for a custom MCP server in ChatGPT, and a first task to try.',
    keywords: ['chatgpt custom mcp server', 'add mcp server to chatgpt', 'chatgpt mcp', 'chatgpt plugins mcp', 'chatgpt connector', 'chatgpt remote mcp'],
    intro: [
      'ChatGPT can call tools from a remote MCP server you add yourself. The setting lives in Plugins, and a server that needs no sign-in takes about a minute.',
      'Below, the steps, a quick check, and a first task: planning a product launch video from a real one.',
    ],
    fit: [
      'Search a library ChatGPT cannot browse on its own.',
      'Get structured results (shot lists, timings) instead of guesses.',
      'Use the tools in any chat once the plugin is on.',
      'Read-only tools, so nothing changes on your side.',
    ],
    prompts: [
      'Suggest launch video templates for a B2B SaaS product and show each poster and link.',
      'Study the one I pick shot by shot.',
      'Plan my remake for LinkedIn, 1:1, about 30 seconds. Ask me for what is missing.',
      'Give me the final plan as a list I can paste into Codex.',
    ],
    check: 'Start a new chat with the plugin on and ask ChatGPT to list the tools it can use from it. It should see 13: eleven that start with `kuchi_`, plus `search` and `fetch`.',
    pitfalls: [
      'Choosing OAuth. This server needs no authentication; pick No authentication.',
      'The plugin off in the chat. Turn it on before asking.',
      'Workspace admins. On a business workspace an admin may need to allow custom servers.',
    ],
    faq: [
      { q: 'How do I add a custom MCP server to ChatGPT?', a: 'Open Plugins, choose + and Add custom MCP server, name it, paste the Server URL, choose No authentication and create it as a plugin.' },
      { q: 'Can ChatGPT make a video with it?', a: 'ChatGPT picks the template, studies it and writes the frame-timed plan. A coding agent such as Codex builds and renders it.' },
      { q: 'Is the server safe to add?', a: 'It is read-only and asks for no credentials. Never paste secrets into a custom server that does not need them.' },
    ],
    also: { label: 'Remotion with OpenAI Codex', href: '/blog/remotion-with-codex' },
  },
  {
    harness: 'grok',
    slug: 'grok-custom-connector',
    heading: 'How to add a custom connector to Grok',
    title: 'How to add a custom connector (MCP server) to Grok',
    description: 'Add a custom MCP connector to Grok on grok.com: where Connectors lives, how to add one by URL, how to check it, and a first task with a free launch video library.',
    summary: 'Add a custom connector in Grok by URL, check it, and plan a video with it.',
    keywords: ['grok custom connector', 'grok mcp', 'add mcp server to grok', 'grok connectors', 'xai grok mcp'],
    intro: [
      'Grok can use tools from a custom connector: a remote MCP server you add by URL. The setting is on the Connectors page.',
      'This guide adds one that needs no sign-in, checks it, and uses it to plan a product launch video from a real reference.',
    ],
    fit: [
      'Search and read a library Grok has no other access to.',
      'Get exact shot timings from measured videos.',
      'Use the tools in any Grok chat once connected.',
      'Read-only tools, nothing to sign in to.',
    ],
    prompts: [
      'Suggest launch video templates for a consumer app and show each poster and link.',
      'Study my pick shot by shot.',
      'Plan my remake for X, 16:9, 20 seconds.',
      'Write the plan out so Grok Build can build it.',
    ],
    pitfalls: [
      'Not signed in. Connectors need a Grok account.',
      'Confusing Grok and Grok Build. The chat app plans; Grok Build writes and renders.',
      'The connector off in the chat.',
    ],
    faq: [
      { q: 'How do I add a custom connector to Grok?', a: 'Open Connectors on grok.com, choose New Connector → Custom and paste the server URL.' },
      { q: 'Can Grok make the video?', a: 'Grok chooses, studies and plans. Grok Build or another coding agent builds and renders.' },
      { q: 'Does it work in the Grok Bot app too?', a: 'Grok Bot has its own connector setting; see the Grok Bot guide.' },
    ],
    also: { label: 'Grok Build and Remotion', href: '/blog/remotion-with-grok-build' },
  },
  {
    harness: 'grok-bot',
    slug: 'grok-bot-custom-connector',
    heading: 'How to add a custom connector to Grok Bot',
    title: 'How to add a custom connector to the Grok Bot app',
    description: 'Add a custom MCP connector to the Grok Bot desktop app: Connect apps, Remote HTTPS, what to leave empty, and a first task with a free launch video library.',
    summary: 'Connect apps → Add a custom connector in Grok Bot, step by step.',
    keywords: ['grok bot', 'grok bot custom connector', 'grok bot mcp', 'grok bot connect apps', 'xai grok bot'],
    intro: [
      'Grok Bot is xAI\'s desktop assistant. It can add custom connectors (remote MCP servers) from Connect apps, or you can ask the Bot to add one in chat.',
      'Here is the setup for a server that needs no sign-in, and a first task: planning a product launch video.',
    ],
    fit: [
      'Add servers from the Connect apps screen or by asking in chat.',
      'The Bot shows the name and URL and asks before adding.',
      'Read-only tools, no headers or OAuth needed.',
      'Plan a video in the same app you use for other work.',
    ],
    prompts: [
      'Suggest launch video templates for my startup and show each poster and link.',
      'Study my pick shot by shot.',
      'Plan my remake with my logo and two screenshots.',
      'Summarise the final plan so a coding agent can build it.',
    ],
    pitfalls: [
      'Filling the headers or OAuth fields. Leave them empty.',
      'Choosing a local server type. Pick Remote HTTPS.',
      'Not confirming when the Bot asks.',
    ],
    faq: [
      { q: 'How do I add a custom connector to Grok Bot?', a: 'Open Connect apps, choose Add a custom connector, pick Remote HTTPS, paste the URL and choose Add plugin.' },
      { q: 'Can I ask Grok Bot to add it for me?', a: 'Yes. Ask it to add a custom server with the URL; it shows the details and asks you to confirm.' },
      { q: 'Can Grok Bot render the video?', a: 'It plans. A coding agent builds and renders the plan.' },
    ],
  },
  {
    harness: 'le-chat',
    slug: 'le-chat-custom-mcp-connector',
    heading: 'How to add a custom MCP connector to Le Chat',
    title: 'How to add a custom MCP connector to Le Chat by Mistral',
    description: 'Add a custom MCP connector to Mistral\'s Le Chat: Intelligence → Connectors, the Custom MCP Connector tab, how admin works on each plan, and a first task with a free launch video library.',
    summary: 'The Custom MCP Connector tab in Le Chat, step by step, and a first task.',
    keywords: ['le chat mcp', 'le chat custom connector', 'mistral le chat mcp', 'mistral custom mcp connector', 'le chat connectors'],
    intro: [
      'Le Chat can use tools from remote MCP servers you add as connectors. It detects whether a server needs authentication, so a public one connects in a few clicks.',
      'This guide adds one, turns it on in a chat, and plans a product launch video from a real reference.',
    ],
    fit: [
      'Add a server by URL; Le Chat detects the authentication.',
      'Turn connectors on per chat.',
      'On Free, Pro and Student plans you are your own admin.',
      'Read-only tools, nothing to sign in to.',
    ],
    prompts: [
      'Suggest launch video templates for a European fintech app and show each poster and link.',
      'Study my pick shot by shot.',
      'Plan my remake at 30 seconds, 16:9.',
      'Write the plan out for a coding agent.',
    ],
    pitfalls: [
      'The connector added but not turned on in the chat.',
      'Team plans. An admin may need to add the connector for the organisation.',
      'Pasting the website address instead of the /mcp URL.',
    ],
    faq: [
      { q: 'How do I add a custom MCP connector to Le Chat?', a: 'Open Intelligence → Connectors, choose Add Connector, open the Custom MCP Connector tab, name it, paste the URL and connect.' },
      { q: 'Who can add connectors?', a: 'On Free, Pro and Student plans you can. On team plans, an admin.' },
      { q: 'Can Le Chat make the video?', a: 'It plans the video. A coding agent builds and renders it.' },
    ],
  },
  {
    harness: 'manus',
    slug: 'manus-custom-mcp-server',
    heading: 'How to add a custom MCP server to Manus',
    title: 'How to add a custom MCP server to Manus',
    description: 'Add a custom MCP server to Manus by URL: Settings → Integrations → Custom MCP Servers, how Manus tests the connection, and a first task with a free launch video library.',
    summary: 'Add an MCP server to Manus by URL and give it a launch video task.',
    keywords: ['manus mcp', 'manus custom mcp server', 'manus integrations', 'add mcp to manus', 'manus agent'],
    intro: [
      'Manus is an agent that works through long tasks on its own. A custom MCP server gives it tools it would not otherwise have, and Manus tests the connection when you add one.',
      'This guide adds a free launch video library and hands Manus a task: research and plan a product launch video from a real reference.',
    ],
    fit: [
      'Add a server by URL; Manus tests it and lists the tools.',
      'Good at multi-step research: compare several templates before recommending one.',
      'Read-only tools, nothing to authorise.',
      'Hands you a plan a coding agent can build.',
    ],
    prompts: [
      'Find five launch video templates that fit my product, compare them and recommend one. Show posters and links.',
      'Study the one I pick and describe each shot.',
      'Plan my remake with my assets and list what is missing.',
      'Deliver the plan as a document I can give a coding agent.',
    ],
    check: 'After you add the server, Manus tests the connection and lists the tools. You should see 13: eleven that start with `kuchi_`, plus `search` and `fetch`.',
    pitfalls: [
      'Filling the authentication field. Leave it empty.',
      'Letting Manus pick the template on its own. Ask it to recommend and wait.',
      'Expecting a rendered file. Use the plan with a coding agent.',
    ],
    faq: [
      { q: 'How do I add a custom MCP server to Manus?', a: 'Open Settings → Integrations → Custom MCP Servers, choose Add Server, name it and paste the URL. In the Connectors view it is Create → Add MCP by URL.' },
      { q: 'Does Manus check the server?', a: 'Yes. It tests the connection and lists the server\'s tools.' },
      { q: 'Can Manus make the video?', a: 'Use it to choose and plan; a coding agent builds and renders the plan.' },
    ],
  },
];

export const harnessPosts: Post[] = [...coding.map(codingPost), ...chat.map(chatPost)];
