// Kuchi's agent skills, as the site presents them: /skills (all of them) and
// /skills/product-launch-video (the flagship). The skill files themselves live in
// agent/skills/<name>/SKILL.md (and agent/SKILL.md for `kuchi`); the MCP server bundles
// them (kuchi_get_skill and the MCP skills extension) and serves each one over HTTP at
// /agent/skills/<name>/SKILL.md (`kuchi` at /agent/SKILL.md).
//
// Install paths shown here are the real ones only: the MCP server itself, the skills CLI
// (`npx skills add kalarislabs/kuchi`, which finds every skill in the repo) and the Claude
// Code plugin. Raw curl / PowerShell downloads were removed on owner instruction
// (2026-11-14); do not add them back.
import { MCP_URL, PLUGIN_COMMAND, SKILL_COMMAND } from './harnesses';
import { SITE_URL } from './video-links.js';

export interface Skill {
  /** The skill's `name` in its SKILL.md frontmatter. */
  name: string;
  title: string;
  /** One line for cards. */
  summary: string;
  /** When an agent loads it. */
  when: string;
  /** Where the raw SKILL.md is served. */
  url: string;
}

const skillUrl = (name: string) => (name === 'kuchi' ? `${SITE_URL}/agent/SKILL.md` : `${SITE_URL}/agent/skills/${name}/SKILL.md`);
const skill = (name: string, title: string, summary: string, when: string): Skill => ({ name, title, summary, when, url: skillUrl(name) });

export const FLAGSHIP = 'kuchi-product-launch-video';
export const LAUNCH_SKILL_PATH = '/skills/product-launch-video';

export const skills: Skill[] = [
  skill(FLAGSHIP, 'Product launch video',
    'The whole job, from a product URL or brief to a checked, sound-designed MP4 modelled shot for shot on a real launch video.',
    'Whenever someone asks for a launch video, promo, teaser, feature announcement, demo or release video.'),
  skill('kuchi', 'Kuchi workflow',
    'The short version of the method: find a reference, study it, plan the remake, build it, check it.',
    'At the start of any remake, so the agent knows which tool comes next.'),
  skill('kuchi-remotion', 'Build in Remotion',
    'Project setup, the @ alias Kuchi components need, one Sequence per blueprint shot, entrances, fonts, assets and rendering.',
    'After the plan is ready and before any video code is written.'),
  skill('kuchi-sound', 'Sound without hearing it',
    'Turns each shot’s sound cue into an open-license sound effect on its exact frame, chosen and trimmed by measuring with ffmpeg.',
    'After the plan, whenever the video is not silent.'),
  skill('kuchi-audio-check', 'Measure the mix',
    'Checks the rendered audio by measurement: loudness, true peak, clipping, silence and whether each sound lands on its cue.',
    'Before the video is delivered.'),
];

export const launchSkill = skills[0];

/** The install command for one skill with the skills CLI. */
export const skillCommand = (name: string) => `${SKILL_COMMAND} --skill ${name}`;
export const LAUNCH_SKILL_COMMAND = skillCommand(FLAGSHIP);
export { MCP_URL, PLUGIN_COMMAND, SKILL_COMMAND };

/** Ways to get the skill, in the order the pages show them. */
export const installWays = [
  {
    id: 'mcp',
    title: 'Comes with the MCP server',
    text: `Connect ${MCP_URL} to your agent and every Kuchi skill comes with it. Agents that read MCP skills see them as resources, and any agent can load one with the kuchi_get_skill tool. Nothing else to install, and you always get the latest version.`,
    code: MCP_URL,
    link: { label: 'Connect your agent', href: '/#connect' },
  },
  {
    id: 'cli',
    title: 'Any agent with a skills folder',
    text: 'The skills CLI asks which agent to add it to (Claude Code, Codex, Cursor, Gemini CLI, Antigravity, OpenCode and others) and copies the skill into that agent’s skills folder in your project.',
    code: LAUNCH_SKILL_COMMAND,
  },
  {
    id: 'plugin',
    title: 'Claude Code plugin',
    text: 'Installs every Kuchi skill and the MCP server together, in one step.',
    code: PLUGIN_COMMAND,
  },
] as const;

/** A first prompt to paste once the skill is installed. */
export const STARTER_PROMPT = `Make a launch video for my product with the Kuchi product launch video skill.

Product: [name], [one line on what it does], for [who it is for].
What's new: [the product, a feature or a release].
Call to action: [what viewers should do] at [URL].
It goes on: [X / LinkedIn / Product Hunt / landing page], about [15 / 30 / 60] seconds.
Feel: [calm / punchy / playful / premium].
Assets: my logo is [path], screenshots are in [folder].

Show me a short list of real launch videos to use as the template before you start.`;

/** What the skill walks the agent through, in order (mirrors the SKILL.md steps). */
export const launchSteps = [
  { title: 'Connect', text: 'Checks the Kuchi MCP server is connected (no sign-in) and reads the full workflow once.', tool: 'kuchi_get_workflow' },
  { title: 'Brief', text: 'Asks for everything in one message: the product, what is new, the call to action, where the video goes, the assets and the feel. Writes BRIEF.md.', tool: 'BRIEF.md' },
  { title: 'Choose the reference', text: 'Shows a short list of real launch videos ranked for your product, with posters and links, and lets you pick one or paste any video from the site.', tool: 'kuchi_suggest_templates' },
  { title: 'Study it shot by shot', text: 'Reads every shot’s exact frames, entrance, motion and colors, looks at the storyboard and notes what each shot shows.', tool: 'kuchi_get_breakdown' },
  { title: 'Plan', text: 'Turns the analysis and your details into a frame-timed blueprint with your content in every shot, asking you for anything missing.', tool: 'kuchi_plan_remake' },
  { title: 'Storyboard and script', text: 'Writes on-screen copy sized to each shot’s length, so it reads with the sound off. Writes STORYBOARD.md.', tool: 'STORYBOARD.md' },
  { title: 'Build', text: 'Builds one Remotion Sequence per shot on its exact frames, starting each from the Kuchi component the blueprint lists.', tool: 'kuchi-remotion' },
  { title: 'Sound', text: 'Places an open-license sound effect on each shot’s cue frame, chosen by measuring, and logs every license in CREDITS.md.', tool: 'kuchi-sound' },
  { title: 'Check and deliver', text: 'Checks the shot list against the reference, compares frames side by side, measures the mix, and renders the MP4 at the right size for where it goes.', tool: 'kuchi_check_remake' },
];

export const launchOutputs = [
  'An H.264 MP4 at the plan’s size and frame rate: 16:9, 1:1, 4:5 or 9:16',
  'A poster frame for the post',
  'The Remotion source, so you can change any shot later',
  'BRIEF.md, PLAN.md and STORYBOARD.md',
  'CREDITS.md with every sound’s source and license',
];

export const launchFaq = [
  { q: 'Is it free?', a: 'Yes. The skill, the MCP server, the launch-video library and the components are all free, with no sign-in and no API key.' },
  { q: 'Which agents can use it?', a: 'Any agent that can run the build: Claude Code, Codex, Cursor, Gemini CLI, Antigravity, OpenCode, Devin and others. Chat apps such as Claude, ChatGPT and Grok can run the first half (choosing, studying and planning) and hand the plan to a coding agent.' },
  { q: 'Do I need to install it if I connect the MCP server?', a: 'No. The MCP server carries every Kuchi skill, so a connected agent can load this one with kuchi_get_skill. Installing it as a file only means the agent knows about it before the first tool call.' },
  { q: 'Does Kuchi render the video?', a: 'No. Kuchi measures the reference and plans the remake. Your agent builds and renders the video on your machine with Remotion, so the files are yours.' },
  { q: 'Will my video copy someone else’s launch?', a: 'It copies the reference’s motion and taste: timing, entrances, layout and how much moves. Every logo, screen, word, color and sound comes from you or from open-license sources. The skill forbids reusing the reference’s brand, footage, music or copy.' },
  { q: 'How does it handle sound if agents can’t listen?', a: 'By measurement. The plan gives each shot a sound cue on an exact frame, and the skill uses ffmpeg to choose, trim and level open-license files, then measures the final mix for loudness, peaks and timing.' },
  { q: 'What do I need to provide?', a: 'Your product name and one line on it, what is new, the call to action, and your logo and screenshots or screen recordings. The skill asks for anything missing and never invents product facts.' },
];
