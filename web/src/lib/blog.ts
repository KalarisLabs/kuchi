// Blog posts, one indexable page each at /blog/<slug> (see pages/blog/[slug].astro) plus the
// /blog index. Posts answer the questions people search for about Kuchi: how to connect the
// MCP servers, where the agent skill lives, how agents install components, and what making a
// launch video looks like. Every command and path here is one the site already supports
// (see lib/harnesses.ts and components/AgentConnect.astro); check before adding a new one.
//
// Body text is a small set of blocks. Inline text supports `code`, **bold** and [links](/path).
import { components } from './components-catalog';
import { harnesses, MCP_URL, PLUGIN_COMMAND, SKILL_COMMAND, SETUP_PROMPT } from './harnesses';
import { SITE_URL } from './video-links.js';
import { harnessPosts } from './blog-harnesses';

export type Block =
  | { type: 'h2'; id: string; text: string }
  | { type: 'h3'; text: string }
  | { type: 'p'; text: string }
  | { type: 'ul'; items: string[] }
  | { type: 'ol'; items: string[] }
  | { type: 'code'; code: string; label?: string }
  | { type: 'table'; head: string[]; rows: string[][] }
  | { type: 'note'; text: string };

export interface Faq { q: string; a: string }

export interface Post {
  slug: string;
  /** <h1>. */
  heading: string;
  /** <title> and Open Graph title. */
  title: string;
  description: string;
  /** One line for the index card. */
  summary: string;
  published: string;
  updated: string;
  /** Minutes, shown on the card. */
  minutes: number;
  keywords: string[];
  body: Block[];
  faq: Faq[];
  /** HowTo steps, for posts that are a procedure. */
  howTo?: { name: string; steps: { name: string; text: string }[] };
  /** The agent harness this post is about (lib/blog-harnesses.ts); its /agents page links back. */
  harness?: string;
  /** Further reading at the foot of the post. */
  related: { label: string; href: string }[];
}

export const postPath = (post: Post) => `/blog/${post.slug}`;
export const postUrl = (post: Post) => `${SITE_URL}${postPath(post)}`;

const escape = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);

/** Inline markup to HTML: `code`, **bold**, [text](href). Everything else is escaped. */
export function inline(text: string): string {
  return escape(text)
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, label: string, href: string) => {
      const external = /^https?:/.test(href) && !href.startsWith(SITE_URL);
      return `<a href="${href}"${external ? ' target="_blank" rel="noopener"' : ''}>${label}</a>`;
    });
}

/** Plain text for JSON-LD and descriptions: the inline markup removed. */
export const plain = (text: string) => text.replace(/`([^`]+)`/g, '$1').replace(/\*\*([^*]+)\*\*/g, '$1').replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');

// The connect table comes from the agent guides, so the two never disagree.
const firstStep = (slug: string) => {
  const h = harnesses.find((x) => x.slug === slug);
  const step = h?.install[0];
  if (!h || !step) return null;
  return [`[${h.name}](/agents/${h.slug})`, step.code ? `${step.text} \`${step.code}\`` : step.text];
};
const connectRows = ['claude-code', 'codex', 'cursor', 'vs-code', 'gemini-cli', 'claude', 'chatgpt', 'grok']
  .map(firstStep)
  .filter((row): row is string[] => row !== null);

const COUNT = components.length;

export const posts: Post[] = [
  {
    slug: 'kuchi-mcp-server-and-agent-skill',
    heading: 'How to use the Kuchi MCP server and agent skill in any AI agent',
    title: 'Kuchi MCP server and agent skill (SKILL.md): setup for every AI agent',
    description: 'Connect the Kuchi MCP server to Claude, ChatGPT, Codex, Cursor, VS Code or Gemini CLI, see what each of its 13 tools does, and find the Kuchi agent skill (SKILL.md).',
    summary: 'Both MCP servers, every tool, and every place the SKILL.md agent skill file lives.',
    published: '2026-11-19',
    updated: '2026-11-19',
    minutes: 7,
    keywords: ['kuchi mcp', 'mcp server', 'SKILL.md', 'agent skill', 'claude code', 'codex', 'cursor', 'chatgpt', 'setup', 'tools'],
    body: [
      { type: 'p', text: 'Kuchi gives your AI agent a library of real product-launch videos, each measured frame by frame, so it can remake one for your product. Your agent reaches it through MCP, the Model Context Protocol. This guide covers both MCP servers you can connect, what every tool does, and where the Kuchi agent skill file lives.' },
      { type: 'p', text: 'Nothing here needs an account. The Kuchi server takes no sign-in and no API key, so never paste credentials into your agent for it.' },

      { type: 'h2', id: 'two-servers', text: 'The two MCP servers' },
      { type: 'p', text: 'Most people only need the first one. Add the second if your agent writes Remotion code and you want it to browse and install components through shadcn as well.' },
      { type: 'table', head: ['Server', 'Address', 'What it is for'], rows: [
        ['Kuchi MCP', `\`${MCP_URL}\``, 'Finding a launch video to use as a template, reading its frame-by-frame breakdown, planning your remake, checking it, and reading video components.'],
        ['shadcn MCP, pointed at Kuchi', '`npx shadcn@latest mcp` with the `@kuchi` registry', `Browsing, searching and installing Kuchi's ${COUNT} Remotion components into your project with the shadcn CLI.`],
      ] },
      { type: 'p', text: 'The component route is covered step by step in [Remotion components your AI agent can install](/blog/remotion-components-for-ai-agents).' },

      { type: 'h2', id: 'connect', text: 'Connect the Kuchi MCP server' },
      { type: 'p', text: `The server speaks Streamable HTTP at \`${MCP_URL}\`. Pick your agent:` },
      { type: 'table', head: ['Agent', 'How to add Kuchi'], rows: connectRows },
      { type: 'p', text: 'Any other client that supports remote MCP servers works too: add the URL above as an HTTP server with no authentication. Each agent has a full guide with prompts to try on the [agent guides](/agents) page.' },
      { type: 'p', text: 'Then paste the setup prompt, so the agent knows when and how to use Kuchi:' },
      { type: 'code', label: 'Setup prompt', code: SETUP_PROMPT },

      { type: 'h2', id: 'check', text: 'Check that it works' },
      { type: 'p', text: 'Ask your agent to list the Kuchi tools. It should see 13: eleven that start with `kuchi_`, plus `search` and `fetch`. If it sees none, the server was added without the right transport: it must be HTTP (Streamable HTTP), not stdio or SSE.' },

      { type: 'h2', id: 'tools', text: 'What each tool does' },
      { type: 'p', text: 'You never call these yourself. Your agent picks them as it works, in roughly this order. Every catalog tool is read-only.' },
      { type: 'table', head: ['Tool', 'What it does'], rows: [
        ['`kuchi_get_workflow`', 'The full method for a remake, whole or one step at a time (find, study, plan, build, check). Agents read it before a first remake.'],
        ['`kuchi_suggest_templates`', 'A short numbered list of launch videos ranked for your product, with what fits, what differs, what you would need to supply, and one recommended choice.'],
        ['`kuchi_search_videos`', 'Searches the whole library by keyword, style, category, format, aspect ratio, length, pace or theme.'],
        ['`kuchi_get_video`', 'One video by id, slug, Kuchi link or X link: the file, poster, storyboard, length and measured rhythm.'],
        ['`kuchi_list_filters`', 'Every valid style, category, format, aspect ratio, pace and theme, with counts, plus the 14 shot kinds.'],
        ['`kuchi_get_breakdown`', 'The frame-by-frame measurement of one video: every shot with its exact start and end, how it enters, how much moves, its colours, and storyboard sheets of real frames.'],
        ['`kuchi_plan_remake`', 'Takes your product details and the agent\'s shot analysis and returns a blueprint: every reference shot re-timed to your length on whole frames, with your content in each, plus the questions still to ask you.'],
        ['`kuchi_check_remake`', 'Checks the agent\'s shot list before delivery: reused brand words, assets taken from the reference, invented logos or UI, placeholders, and timing against the reference shot by shot.'],
        ['`kuchi_list_components`', `Lists the ${COUNT} Remotion video components: kinetic type, captions, UI screens, AI chats, cursors, logos and transitions.`],
        ['`kuchi_get_component`', 'One component\'s full source, dependencies, install command and usage notes.'],
        ['`kuchi_send_feedback`', 'Lets the agent report a failure or a missing capability to Kuchi\'s maintainers. The only tool that records what the agent writes.'],
        ['`search`, `fetch`', 'The two tools ChatGPT connectors and deep research look for, over the same catalog.'],
      ] },

      { type: 'h3', text: 'Prompts and resources' },
      { type: 'p', text: 'Clients that show prompt menus get two prompts: `remake_launch_video` and `find_launch_inspiration`. Clients that browse resources can attach `kuchi://workflow`, any video as `kuchi://videos/{id}`, any breakdown as `kuchi://breakdowns/{id}` and any component as `kuchi://components/{name}`, with autocomplete.' },

      { type: 'h2', id: 'skill', text: 'Where the Kuchi agent skill (SKILL.md) is' },
      { type: 'p', text: 'The skill is one Markdown file that tells an agent when to reach for Kuchi (any launch video, product demo, teaser or feature announcement, even when you don\'t say "Kuchi") and the five steps to follow. The MCP server works without it, but with the skill installed your agent uses Kuchi without being asked. It is the same file everywhere:' },
      { type: 'table', head: ['Where', 'How to get it'], rows: [
        ['Claude Code plugin', `\`${PLUGIN_COMMAND}\` installs the skill and the MCP server together.`],
        ['Any agent with a skills folder', `\`${SKILL_COMMAND}\` installs it into \`.agents/skills/kuchi\`, which Claude, Cursor, Codex, Antigravity and Gemini read.`],
        ['On the web', `[${SITE_URL}/agent/SKILL.md](${SITE_URL}/agent/SKILL.md), to read or copy by hand, for example into \`.claude/skills/kuchi/SKILL.md\`.`],
        ['Over MCP', 'The server publishes it as the resource `skill://kuchi/SKILL.md`, for clients that support MCP skills.'],
      ] },

      { type: 'h2', id: 'without-mcp', text: 'Using Kuchi without MCP' },
      { type: 'p', text: `An agent that can only fetch URLs can still follow the method: [the workflow](${SITE_URL}/agent/workflow.md), [the catalog](${SITE_URL}/agent/catalog.json) and each breakdown at \`${SITE_URL}/agent/breakdowns/<id>.json\`.` },

      { type: 'h2', id: 'privacy', text: 'Privacy' },
      { type: 'ul', items: [
        'Kuchi records anonymous usage (which tool ran, how long it took, whether it failed, the client\'s name). It never records what you send to `kuchi_plan_remake` or `kuchi_check_remake`, and never your IP address. Details are on the [privacy page](/privacy).',
        'Kuchi never receives or renders your video. Your agent builds it with your own tools.',
      ] },
    ],
    faq: [
      { q: 'Is the Kuchi MCP server free?', a: 'Yes. It needs no account, no sign-in and no API key. Add the URL and start.' },
      { q: 'Which transport does the Kuchi MCP server use?', a: `Streamable HTTP at ${MCP_URL}. Add it as an HTTP (remote) server, not stdio.` },
      { q: 'Do I need the SKILL.md file if I have the MCP server?', a: 'No, the server works on its own and sends the same method through kuchi_get_workflow. The skill makes your agent reach for Kuchi automatically whenever you ask for a launch video.' },
      { q: 'Where does the skill file go?', a: `The Claude Code plugin and ${SKILL_COMMAND} put it in place for you. By hand, copy ${SITE_URL}/agent/SKILL.md into your agent's skills folder, for example .claude/skills/kuchi/SKILL.md.` },
      { q: 'Can ChatGPT use Kuchi?', a: 'Yes. Add Kuchi as a custom MCP server with no authentication. ChatGPT can find templates, read breakdowns and write the plan; a coding agent such as Codex or Claude Code then builds and renders the video.' },
      { q: 'Does Kuchi see my product details?', a: 'The plan and check tools receive what your agent sends them so they can work, but analytics never record those details, and Kuchi never sees or stores your video.' },
    ],
    related: [
      { label: 'Remotion components your AI agent can install', href: '/blog/remotion-components-for-ai-agents' },
      { label: 'How to make a product launch video with AI', href: '/blog/how-to-make-a-launch-video-with-ai' },
      { label: 'Agent guides: Claude Code, Codex, Cursor and more', href: '/agents' },
    ],
  },

  {
    slug: 'remotion-components-for-ai-agents',
    heading: 'Remotion components your AI agent can install',
    title: 'Remotion components for AI agents: install Kuchi components over MCP',
    description: `How AI coding agents find and install Kuchi's ${COUNT} Remotion video components through the Kuchi MCP server, the shadcn CLI or the shadcn MCP server, and use them in a launch video.`,
    summary: 'Three ways an agent can browse and install Kuchi components, and how to use one in a scene.',
    published: '2026-11-19',
    updated: '2026-11-19',
    minutes: 6,
    keywords: ['remotion components', 'shadcn registry', 'shadcn mcp', 'kinetic typography', 'captions', 'video components', 'kuchi_get_component', 'install'],
    body: [
      { type: 'p', text: `Kuchi's [component library](/components) has ${COUNT} Remotion components for launch videos: kinetic type, captions, phone and UI screens, AI chat windows, cursors, logo lockups and transitions. Each one is a source file in the shadcn registry format, so it is copied into your project and becomes your code to edit, not a dependency you import.` },
      { type: 'p', text: 'Because the registry is plain JSON on the web, an AI coding agent can find the right component, read its source and install it without you opening a browser. There are three ways to wire that up.' },

      { type: 'h2', id: 'kuchi-mcp', text: '1. Through the Kuchi MCP server' },
      { type: 'p', text: 'If your agent already has the [Kuchi MCP server](/blog/kuchi-mcp-server-and-agent-skill) connected, it has two component tools:' },
      { type: 'ul', items: [
        '`kuchi_list_components` lists the components, with a search and a category filter.',
        '`kuchi_get_component` returns one component\'s description, dependencies, install command, usage notes and the full source of its files.',
      ] },
      { type: 'p', text: 'This is the route the Kuchi workflow uses. While building a remake, the agent checks each shot of its blueprint against the list, and where a component fits (a kinetic type title, a chat prompt typing itself, a cursor click) it installs that component and passes your text, colours and assets in its props.' },
      { type: 'code', label: 'Try in your agent', code: 'Find a Kuchi component for word-by-word captions, show me its props, then install it and add it to my intro scene with my tagline.' },

      { type: 'h2', id: 'shadcn-cli', text: '2. With the shadcn CLI' },
      { type: 'p', text: 'Every component has its own registry URL. Your agent, or you, can install one in a Remotion project with a single command:' },
      { type: 'code', code: 'npx shadcn@latest add https://kuchi.kalarislabs.com/r/text-reveal.json' },
      { type: 'p', text: 'Its dependencies come with it: other Kuchi components it builds on and npm packages such as `remotion`. The whole index is at [/r/registry.json](/r/registry.json).' },

      { type: 'h2', id: 'shadcn-mcp', text: '3. Through the shadcn MCP server' },
      { type: 'p', text: 'The shadcn CLI ships its own MCP server, which lets an agent browse, search and install from any registry you name. Add Kuchi as the `@kuchi` registry in your project\'s `components.json`:' },
      { type: 'code', label: 'components.json', code: '{\n  "registries": {\n    "@kuchi": "https://kuchi.kalarislabs.com/r/{name}.json"\n  }\n}' },
      { type: 'p', text: 'Then set up the shadcn MCP server for your client. The `--client` option takes `claude`, `cursor`, `vscode`, `codex` or `opencode`:' },
      { type: 'code', code: 'npx shadcn@latest mcp init --client claude' },
      { type: 'p', text: 'Your agent can now ask for things like "search @kuchi for captions" or "add @kuchi/word-captions". The same namespace works on the command line:' },
      { type: 'code', code: 'npx shadcn@latest search @kuchi -q caption\nnpx shadcn@latest add @kuchi/word-captions' },

      { type: 'h2', id: 'which', text: 'Which route to use' },
      { type: 'table', head: ['Route', 'Best when'], rows: [
        ['Kuchi MCP', 'You are remaking a launch video: the agent picks components shot by shot from the blueprint, alongside the breakdown and plan tools.'],
        ['shadcn CLI', 'You know which component you want, or you are adding one by hand.'],
        ['shadcn MCP', 'Your project already uses shadcn registries and you want Kuchi beside them in the same agent tools.'],
      ] },

      { type: 'h2', id: 'use', text: 'Using a component in a scene' },
      { type: 'p', text: 'Components render inside a Remotion composition. Put each one in a `Sequence` timed to its shot, and pass your own words and colours. This is how Kuchi\'s own launch film reveals a list of words, one per second, with letters that settle into the film\'s ink colour:' },
      { type: 'code', label: 'Scene.tsx', code: 'import { AbsoluteFill, Sequence } from "remotion";\nimport { ShaderTextReveal } from "@/components/kuchi/shader-text-reveal";\n\nexport const Features = () => (\n  <AbsoluteFill style={{ background: "#FFFFFF" }}>\n    <Sequence from={0} durationInFrames={180}>\n      <ShaderTextReveal\n        text={"Kinetic type\\nCaptions\\nUI screens"}\n        fontFamily="Inter Tight"\n        fontWeight={600}\n        wordDuration={32}\n      />\n    </Sequence>\n  </AbsoluteFill>\n);' },
      { type: 'p', text: 'Transitions work the same way. A component such as [Dot Bloom](/components/dot-bloom) exports its length and the frame where it covers the screen, so you cut between your two shots underneath it on exactly that frame.' },

      { type: 'h3', text: 'Tips' },
      { type: 'ul', items: [
        'Give a component a background. A few draw on a transparent layer and render black without one.',
        'Many components were measured off real launch videos and run a set number of frames. Read the exported constants (often `*_FRAMES`) before you size the shot.',
        'Pass the brand theme once. Components that take `theme` or `mode` accept the same colours, so one constant keeps a whole film consistent.',
        'Edit the copy you installed. It is your source now: change a shadow, a colour ramp or an easing to fit your brand.',
      ] },
    ],
    faq: [
      { q: 'Do Kuchi components need Remotion?', a: 'Yes. They are Remotion components and render inside a Remotion composition. Install them into a Remotion project.' },
      { q: 'Are the components installed as a package?', a: 'No. Like shadcn/ui, each component is copied into your project as source, so you can change anything in it.' },
      { q: 'Do I need an account or API key for the registry?', a: 'No. The registry is public JSON at kuchi.kalarislabs.com/r, and the MCP servers need no sign-in.' },
      { q: 'Can my agent search the components?', a: 'Yes: kuchi_list_components over the Kuchi MCP server, or the shadcn MCP server and npx shadcn search once @kuchi is in components.json.' },
      { q: 'How do I preview a component before installing it?', a: 'Every component has a page with a video preview, its props and its source at kuchi.kalarislabs.com/components.' },
    ],
    related: [
      { label: 'Browse all video components', href: '/components' },
      { label: 'How to use the Kuchi MCP server and agent skill', href: '/blog/kuchi-mcp-server-and-agent-skill' },
      { label: 'How to make a product launch video with AI', href: '/blog/how-to-make-a-launch-video-with-ai' },
    ],
  },

  {
    slug: 'how-to-make-a-launch-video-with-ai',
    heading: 'How to make a product launch video with AI: a Kuchi walkthrough',
    title: 'How to make a product launch video with AI (step by step) — Kuchi',
    description: 'A step-by-step walkthrough of making a product launch video with an AI agent and Kuchi: choose a real launch video as the template, study it shot by shot, plan, build in Remotion and check.',
    summary: 'The five steps from "make me a launch video" to a rendered MP4, and how we made our own.',
    published: '2026-11-19',
    updated: '2026-11-19',
    minutes: 8,
    keywords: ['launch video', 'ai video', 'product launch video', 'remotion', 'how to make', 'template', 'claude code', 'walkthrough'],
    body: [
      { type: 'p', text: 'A good launch video is mostly timing: when each shot starts, how it enters, how much of the frame moves and when. Kuchi gives your AI agent that timing, measured frame by frame from real launch videos, and your agent builds a video with the same rhythm and your product in every shot.' },
      { type: 'p', text: 'Here is what the whole process looks like, from the first prompt to the rendered file.' },

      { type: 'h2', id: 'need', text: 'What you need' },
      { type: 'ul', items: [
        'An AI coding agent that can run code and render video, such as [Claude Code](/agents/claude-code), [Codex](/agents/codex) or [Cursor](/agents/cursor), with the [Kuchi MCP server connected](/blog/kuchi-mcp-server-and-agent-skill). Chat apps like Claude and ChatGPT can do the first three steps and hand the plan to a coding agent.',
        'Your own material: your logo (SVG or transparent PNG), screenshots or screen recordings of the product, the one to three features to show, and the closing call to action.',
        'Node.js, so the agent can create a Remotion project and render.',
      ] },

      { type: 'h2', id: 'step-1', text: 'Step 1: Choose a template' },
      { type: 'p', text: 'Tell your agent about the product and the feel you want:' },
      { type: 'code', label: 'Prompt', code: 'Make a 30-second launch video for my app, a calendar for remote teams. Clean and confident, light theme. I have a logo and five screenshots.' },
      { type: 'p', text: 'The agent calls `kuchi_suggest_templates` and shows you a short numbered list of real launch videos, each with its poster and link, what fits your product, what differs and what you would need to supply. Choose by number, or open the [launch video library](/videos), pick any video and paste its link.' },

      { type: 'h2', id: 'step-2', text: 'Step 2: Study it shot by shot' },
      { type: 'p', text: '`kuchi_get_breakdown` returns the measured structure of the video you chose: every shot\'s exact start and end frame, whether it enters on a cut, a transition or a hold, how much of the picture moves, the energy curve second by second, and the colour roles (background, secondary, accent). It also returns storyboard sheets of real frames.' },
      { type: 'p', text: 'Kuchi does not say what a shot shows. Your agent looks at the frames and writes one line per shot: its kind (title card, kinetic type, UI screen, device, logo and so on) and what is on screen and where.' },

      { type: 'h2', id: 'step-3', text: 'Step 3: Plan with your material' },
      { type: 'p', text: 'The agent sends your product details and its shot analysis to `kuchi_plan_remake`. If anything is missing, the plan says exactly what, worded for that template (for example how many screenshots it needs, and at what size), and the agent asks you in one message.' },
      { type: 'p', text: 'When nothing is missing, the plan holds a blueprint: each reference shot re-timed to your length on whole frames, with your content assigned to it. A 4.1-second shot in a 60-second reference becomes about 2 seconds in your 30-second cut, on an exact frame, never rounded to a tidy half second.' },

      { type: 'h2', id: 'step-4', text: 'Step 4: Build it' },
      { type: 'p', text: 'The agent writes the video in Remotion one shot at a time: the same start and end frame, the same entrance, the same amount of motion and the same layout as the reference, with your logo, screens and words. Your brand colours take the reference\'s colour roles.' },
      { type: 'p', text: `Where a shot fits a ready-made part, the agent installs one of Kuchi's ${COUNT} [video components](/components) instead of writing it from scratch. How that works is in [Remotion components your AI agent can install](/blog/remotion-components-for-ai-agents).` },

      { type: 'h2', id: 'step-5', text: 'Step 5: Check against the reference' },
      { type: 'p', text: 'Before delivering, the agent runs `kuchi_check_remake` on its shot list. It flags anything taken from the reference (brand words, footage, UI), any invented logo or metric, any placeholder, and any shot that runs long or short against the shot it rebuilds. It also returns pairs of times that show the same moment in both videos, so the agent can export its frames and compare them side by side, then fix what differs and render the MP4.' },

      { type: 'h2', id: 'copy', text: 'What is copied, and what is yours' },
      { type: 'table', head: ['Copied from the reference', 'Replaced with your own'], rows: [
        ['Shot timing and order', 'Logo and product name'],
        ['How each shot enters (cut, transition, hold)', 'Product UI, screenshots and recordings'],
        ['How much of the frame moves, and when', 'Words on screen, features and claims'],
        ['Layout, type hierarchy, camera moves', 'Photos, illustrations and characters'],
        ['Colour roles: background, secondary, accent', 'The colours themselves, and the music'],
      ] },
      { type: 'note', text: 'Kuchi never puts a frame of the reference in your video and never invents your logo, UI, features or numbers. A missing asset becomes a clearly marked placeholder, and your agent tells you about it.' },

      { type: 'h2', id: 'our-film', text: 'What it looks like in practice: our own launch film' },
      { type: 'p', text: 'We made Kuchi\'s launch film the same way: a Remotion project at 1920×1080 and 30 frames a second, built from Kuchi registry components and nothing else on screen. Some of what we learned:' },
      { type: 'ul', items: [
        '**One shot list.** Every shot lives in one array with its frame count, so a retime is a one-number change and the transitions move with it.',
        '**One look.** A white ground, one ink colour and a single red accent, passed to every component through one theme constant.',
        '**Measured, not eyeballed.** We compared every rendered frame with the one before to find stretches where nothing moved and cuts that went from a frozen frame to a frozen frame, then gave those shots more or less time.',
        '**Screen time over speed.** The first cut felt rushed. Slowing the busiest shots and holding titles until they had finished typing made the film longer and better.',
        '**A transition as a component.** Where a full-screen picture cut hard to a white page, a halftone [Dot Bloom](/components/dot-bloom) carries one into the other instead.',
      ] },

      { type: 'h2', id: 'mistakes', text: 'Common mistakes' },
      { type: 'ul', items: [
        'Rounding shots to half seconds. The rhythm lives in the exact frames.',
        'Copying the reference\'s words or UI. Only its motion and taste carry over.',
        'Adding camera shake, extra shots or new transitions the reference does not have.',
        'Skipping the check. Comparing frames side by side catches layout drift that a quick watch misses.',
      ] },
    ],
    faq: [
      { q: 'Can AI make a product launch video?', a: 'Yes. With Kuchi connected, a coding agent such as Claude Code or Codex picks a real launch video as the template, plans your version to the frame and builds and renders it in Remotion with your logo, screens and copy.' },
      { q: 'Does Kuchi render the video?', a: 'No. Kuchi measures and plans; your agent builds and renders the video with your own tools, so the file and its source stay with you.' },
      { q: 'What does Kuchi cost?', a: 'Nothing. Kuchi is free: the MCP server, the launch video library and the components need no account or API key.' },
      { q: 'Can I make a vertical video for TikTok or Reels?', a: 'Yes. Choose a vertical template, or tell the agent the aspect ratio you want when it plans the remake.' },
      { q: 'Can ChatGPT make the video?', a: 'ChatGPT can choose the template, study it and write the frame-timed plan. A coding agent then builds and renders it.' },
      { q: 'Will my video copy someone else\'s launch?', a: 'Only its timing, transitions, layout and colour balance. Kuchi\'s check flags any brand word, footage or UI taken from the reference.' },
    ],
    howTo: {
      name: 'How to make a product launch video with AI and Kuchi',
      steps: [
        { name: 'Choose a template', text: 'Describe your product and the feel you want; your agent shows a short list of real launch videos from Kuchi and you pick one.' },
        { name: 'Study it shot by shot', text: 'The agent reads the frame-by-frame breakdown and storyboard, and notes what each shot shows.' },
        { name: 'Plan with your material', text: 'The agent plans the remake with your product details and asks for any missing logo, screenshots or copy.' },
        { name: 'Build it', text: 'The agent builds each shot in Remotion on the blueprint\'s frames, using Kuchi components where they fit.' },
        { name: 'Check against the reference', text: 'The agent checks its shot list, compares frames with the reference, fixes differences and renders the video.' },
      ],
    },
    related: [
      { label: 'Browse launch video templates', href: '/videos' },
      { label: 'Make a launch video with Claude Code', href: '/agents/claude-code' },
      { label: 'Remotion components your AI agent can install', href: '/blog/remotion-components-for-ai-agents' },
    ],
  },
  ...harnessPosts,
];
