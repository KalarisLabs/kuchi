// Use-case pages, one indexable page per audience at /use-cases/<slug> (see
// pages/use-cases/[slug].astro) plus the /use-cases hub. Each entry is written by hand for its
// audience (job, pains, workflow, prompts, agents, videos, FAQ), so no page is a template with
// the noun swapped. Titles lead with what people search for, never with the product name
// (owner, 2026-11-19; see docs/CASH_PAGES_PLAN.md).
//
// Rules (owner decisions): everything is free, so no pricing or tier talk; no GitHub links; no
// shell downloads of SKILL.md; never name upstream component projects; describe only the MCP
// tools as they are (MCP 1.3.0, see lib/mcp-reference.ts). Kuchi never renders a video.
//
// Prose fields support the inline markup of lib/blog.ts: `code`, **bold** and [text](/path).
import { newestFirst, type Video } from './catalog';
import { components, type RegistryItem } from './components-catalog';
import { bySlug, type Harness } from './harnesses';
import { posts, type Post } from './blog';

/** Content date shown in the byline and JSON-LD. Change it when the copy changes. */
export const USE_CASES_UPDATED = '2026-11-20';

export interface Faq { q: string; a: string }
export interface Section { id: string; heading: string; paras: string[]; list?: string[]; ordered?: boolean; code?: string }

export interface UseCase {
  slug: string;
  /** Who the page is for, e.g. "Startup founders". */
  audience: string;
  /** Short label for links and the footer. */
  label: string;
  /** <title>: leads with the search phrase. */
  title: string;
  description: string;
  h1: string;
  kicker: string;
  /** One line for the hub card. */
  tagline: string;
  intro: string[];
  job: { heading: string; paras: string[] };
  pains: { title: string; text: string }[];
  /** Five steps, in the order of STEP_TOOLS. */
  steps: { title: string; text: string }[];
  prompts: string[];
  /** Agents that suit this audience, by harnesses.ts slug. */
  agents: { slug: string; why: string }[];
  sections: Section[];
  /** Reference videos by catalog slug, with why each suits the audience. */
  videos: { slug: string; why: string }[];
  /** Fills the video list when a picked slug leaves the catalog. */
  fallbackStyles: string[];
  /** Registry component names (missing names are skipped). */
  components: string[];
  faq: Faq[];
  /** Blog post slugs. */
  related: string[];
  keywords: string[];
}

/** The tool behind each of the five workflow steps. */
export const STEP_TOOLS = ['kuchi_suggest_templates', 'kuchi_get_breakdown', 'kuchi_plan_remake', 'kuchi_get_component · kuchi_get_skill', 'kuchi_check_remake'];

/** Shared paragraph on the build skills (every page has it, after the audience sections). */
export const SKILLS_COPY = [
  'Coding agents load Kuchi\'s build skills with `kuchi_get_skill` before they write video code: **kuchi-remotion** covers project setup, the `@` alias the components need, one `<Sequence>` per blueprint shot and rendering; **kuchi-sound** places open-license sound effects on each shot\'s cue frame, chosen by measuring; **kuchi-audio-check** measures loudness, peaks and cue timing, because an agent cannot listen to its own mix.',
  'The Kuchi product launch video skill ties those steps together, so the agent works through the whole job in order: find, study, plan, build, check. Install the skills into a project with `npx skills add kalarislabs/kuchi`, or in Claude Code with `/plugin install kuchi --marketplace KalarisLabs/kuchi`, which adds the MCP server in the same step.',
];

export const useCases: UseCase[] = [
  {
    slug: 'startup-founders',
    audience: 'Startup founders',
    label: 'Startup founders',
    title: 'Product launch video for startup founders: launch on X and Product Hunt',
    description: 'Make a launch video for your startup with the AI agent you already use. Pick a real launch video as the template, plan yours on its exact frames, and build it with your own logo, screens and words.',
    h1: 'Make a product launch video for your startup',
    kicker: 'For startup founders',
    tagline: 'Launch day on X and Product Hunt, with a video cut like the launches that work.',
    intro: [
      "A startup launch video has one job: make someone stop scrolling on launch day and understand what you built before the clip loops. You can make one this week without hiring a studio. Connect Kuchi to the AI agent you already use, pick a real launch video as your template, and the agent rebuilds its timing and motion around your own product.",
      "Kuchi is a free library of real product-launch videos, each measured frame by frame: when every shot starts and ends, how it enters, how much of the frame moves and which colours fill it. Your agent reads those measurements through an open MCP server, plans your video on the same frames and builds it with your logo, your screens and your words.",
    ],
    job: {
      heading: 'The job: a launch-day video that explains the product in 30 seconds',
      paras: [
        "Most founders make a launch video for each piece of big news: the public launch, the funding announcement, the out-of-stealth post, the 1.0. Each one lands in a feed where it autoplays without sound next to everything else, and where the first two seconds decide whether anyone watches the rest. The video has to carry the hook, the product and the call to action on its own, usually in 20 to 45 seconds.",
        "What you need is not a motion designer's toolkit. You need a cut that is known to work, a way to fit your own product into it, and something that does the build while you write the launch post. That is the split Kuchi gives you: the reference supplies the rhythm, your agent supplies the labour, and you supply the product.",
        "Every reference in the library is a real launch that went out on X, so you are not guessing at a style from a template gallery. You can watch the original, see how its shots are paced, and pick one whose structure suits what you are announcing: a hook-led out-of-stealth reveal, a feature-by-feature product story, or a quiet type-only teaser.",
      ],
    },
    pains: [
      { title: 'No time in launch week', text: 'The video competes with the landing page, the post, the investor update and the last bugs. A reference and a plan turn it from a blank canvas into a checklist your agent works through.' },
      { title: 'Templates look like templates', text: 'Stock templates give every startup the same intro. A real launch as the reference keeps pacing that works while every frame shows your product.' },
      { title: 'Studio timelines', text: 'An outsourced cut takes weeks and a revision round per change. A remake built in code by your agent changes in minutes when the headline does.' },
      { title: 'Muted autoplay', text: 'Most people see your launch with the sound off. The plan keeps the reference\'s on-screen words and motion, so the story reads without audio.' },
    ],
    steps: [
      { title: 'Find a reference', text: 'Tell your agent what the startup does and what you are announcing. `kuchi_suggest_templates` returns a short list of launch videos ranked for your product, each with a poster, a link and what you would need to supply. Pick one by number, or paste the link of any video you liked on the site.' },
      { title: 'Study it', text: '`kuchi_get_breakdown` gives the agent every shot\'s exact frames, entrance, motion and colours, plus storyboard sheets of real frames. The agent writes one line per shot: a title card here, a product screen there, a logo at the end.' },
      { title: 'Plan it', text: '`kuchi_plan_remake` maps your company onto those frames at the length you want and lists what is missing: usually your logo, two or three screenshots, the features to show and the closing call to action. Answer once and the blueprint is ready.' },
      { title: 'Build it', text: 'A coding agent writes the video in Remotion shot by shot, starting from Kuchi\'s ready-made components and the build skills, and renders the MP4 on your machine.' },
      { title: 'Check it', text: '`kuchi_check_remake` reads the shot list and flags anything that still carries the reference\'s brand, any placeholder left on screen and any shot that drifted in length. Fix those, compare the frames it names, and post.' },
    ],
    prompts: [
      "We're launching [product] on X next Tuesday. Use Kuchi to suggest five launch video templates for a seed-stage startup and show me each poster and link.",
      "Remake the template I picked as a 30-second 16:9 video. My logo is in ./brand/logo.svg and screenshots are in ./screens. Ask me for anything else the plan needs.",
      "Cut a 15-second square version from the same reference for the reply thread and LinkedIn.",
      "Run kuchi_check_remake on the final shot list, render stills at the compare times and fix every shot that drifts from the reference.",
    ],
    agents: [
      { slug: 'claude-code', why: 'Builds and renders the whole video in your repo; the plugin installs the skills and the MCP server in one command.' },
      { slug: 'codex', why: 'A good fit when the team already runs Codex on the product codebase; it renders and checks without leaving the task.' },
      { slug: 'cursor', why: 'Keeps the video beside your app\'s code, so real UI can appear in the shots.' },
      { slug: 'claude', why: 'Choose and plan in a chat while you write the launch post, then hand the blueprint to a coding agent.' },
      { slug: 'chatgpt', why: 'The same plan-in-chat flow if your team lives in ChatGPT.' },
    ],
    sections: [
      {
        id: 'x-and-product-hunt',
        heading: 'Cutting one launch for X, Product Hunt and LinkedIn',
        paras: [
          "Plan the main cut first, at the length and aspect ratio the reference was made in, usually 16:9 between 30 and 45 seconds. That is the version you pin on X and put on the landing page. Then ask the agent for a second plan from the same reference at a shorter length. When the target is much shorter than the reference, `kuchi_plan_remake` keeps an evenly spaced subset of shots instead of speeding everything up, so the short cut keeps the original's rhythm.",
          "On X the video autoplays muted in the timeline, so the first shot matters most. Look at the reference's first two seconds on the storyboard: if it opens on a hook line, write yours as a claim the reader cares about, not your product name. On Product Hunt the video sits in the gallery beside your screenshots, where people choose to press play; there a slightly longer walk through the product earns its time.",
          "Keep the closing frame doing one thing. The reference's end card becomes your logo and one call to action: the URL, a short line, or your launch-day handle. The plan asks you for it explicitly, so the agent never invents one.",
        ],
      },
      {
        id: 'structure',
        heading: 'A launch structure that holds up, and where it comes from',
        paras: [
          "Across the startup launches in the library, one shape keeps coming back: a hook made of words, two to four product moments shown as real UI, a proof beat, and a logo close. The exact timings vary, which is why a remake follows one measured reference rather than a generic formula. If the reference spends eight seconds on type before showing the product, so does yours, unless you tell the agent otherwise.",
          "A product moment is one thing a user does and sees, not a feature list. Give the planner one to three of those, each backed by a real screenshot or recording. A shot whose content you cannot supply, such as a chart with no real numbers, is dropped or marked as a placeholder, and the agent tells you. Kuchi never invents metrics, customer logos or testimonials.",
          "Proof is optional and must be real: a waitlist count, a quote from a design partner, a benchmark you can stand behind. If you have none yet, the plan gives that time to your product instead.",
        ],
      },
      {
        id: 'assets',
        heading: 'What to have ready before you start',
        paras: ["With these in hand, a coding agent can usually go from template to first render in one sitting. Everything after that is editing a headline or swapping a screenshot, which costs a re-render, not a re-shoot."],
        list: [
          'Your logo as SVG or a transparent PNG.',
          'Two to five screenshots or short screen recordings of the real product, at the size and theme the plan asks for.',
          'One line that says what the product does, and the one to three moments you want to show.',
          'The closing call to action and the URL.',
          'Optional: brand colours and fonts, a tone, and whether the video is silent, has sound effects or carries a track you own.',
        ],
      },
    ],
    videos: [
      { slug: 'aisc-out-of-stealth', why: 'An out-of-stealth announcement in 33 seconds: a hook line, counters and social UI building toward the logo.' },
      { slug: 'strawberry-1-0', why: 'A 1.0 launch with a dense product-story rhythm: large kinetic titles leading into real app screens.' },
      { slug: 'poke-imessage-ai-assistant', why: 'A consumer launch told entirely through pans across app UI, with nothing to film.' },
      { slug: 'kombai-2-0', why: 'A 2.0 launch that opens on the founder before product windows, for teams that want a face up front.' },
      { slug: 'motionstash-ai-interviewer', why: 'A 48-second B2B film: big type, glass UI cards and a cursor walking through the workflow.' },
      { slug: 'sidehoe', why: 'A square cut where a new feature arrives every three to four seconds, made for the feed.' },
    ],
    fallbackStyles: ['UI motion', 'Kinetic type'],
    components: ['hero-launch', 'punch-lines', 'screenshot-tour', 'logo-assemble', 'x-follow-card', 'upvote-burst', 'waitlist-swarm', 'launch-days'],
    faq: [
      { q: 'How long should a startup launch video be?', a: 'Most startup launches in the library run between 30 and 50 seconds. Start from your reference\'s own length for the main cut. kuchi_plan_remake accepts any target from 5 to 180 seconds and re-times the shots on whole frames, so a 15-second cut for replies comes from the same reference.' },
      { q: 'Do I need a designer or a video editor?', a: 'No. The reference supplies the pacing and layout, Kuchi\'s components supply ready-made animated parts, and a coding agent such as Claude Code or Codex builds and renders the video. You review the frames and approve.' },
      { q: 'Will my video look like the company I copied?', a: 'No. A remake borrows timing, motion, layout and colour roles. Every logo, screen, word and number comes from you, and kuchi_check_remake flags any text or asset that still belongs to the reference.' },
      { q: 'Can I make the video before I have screenshots?', a: 'You can plan it. Shots that need your UI are marked as placeholders until you supply the screens, and the agent tells you which ones are waiting. For a pre-launch teaser, pick a type-led reference that needs only your words and logo.' },
      { q: 'Does Kuchi render the video?', a: 'No. Kuchi measures references and plans the remake. Your coding agent writes the video, usually in Remotion, and renders it on your machine, so the source stays in your project.' },
    ],
    related: ['how-to-make-a-launch-video-with-ai', 'remotion-with-claude-code', 'claude-custom-connector', 'remotion-components-for-ai-agents'],
    keywords: ['startup launch video', 'product launch video for startups', 'product hunt launch video', 'launch video for x', 'founder launch video'],
  },
  {
    slug: 'product-marketing',
    audience: 'Product managers and product marketing',
    label: 'Product teams',
    title: 'Feature announcement videos for product managers and product marketing',
    description: 'Make a short video for every feature you ship. Your AI agent picks a real feature launch as the template, plans your clip on its frames with your screens and copy, and builds it in code you can re-render.',
    h1: 'Make a feature announcement video for every release',
    kicker: 'For product managers and product marketing',
    tagline: 'A short clip for every feature you ship, cut like the best feature launches.',
    intro: [
      "Product teams ship more features than they can announce well. A 15 to 30-second clip per feature, in the changelog, the launch post, the in-app announcement and the sales deck, is the format that gets a release noticed. It is also the one that gets skipped, because nobody has a week to animate it. With Kuchi, the AI agent your team already uses makes that clip, with a real feature launch as the template.",
      "Kuchi is a free library of real launch videos measured frame by frame. Your agent finds a feature clip whose structure fits what you shipped, studies its shots, plans yours on the same frames with your screens and copy, and builds it. The motion stays at the same standard release after release, and the content is always yours.",
    ],
    job: {
      heading: 'The job: announce a feature so people understand it and try it',
      paras: [
        "A feature announcement is narrower than a launch. It carries one idea: here is the thing you could not do last week, and here it is working. The strongest feature clips in the library show that in a handful of shots: a line that frames the problem, the real UI doing the new thing, a close-up on the moment that matters, and a short close that names the feature.",
        "For a product manager the hard part is not the idea, it is the production: getting the right screens, keeping them on brand, and fitting the result to the five places it will be posted. For product marketing it is consistency: the third feature clip of the quarter should feel like it belongs with the first two. A measured reference solves both. Pick one structure your team likes and re-plan it for each release with new screens and new copy.",
        "Because the build is code, the clip is also a living asset. When the UI changes after a design review, swap the screenshot and re-render. When a reviewer edits the headline, change one string.",
      ],
    },
    pains: [
      { title: 'Too many releases, too few clips', text: 'When every video is a project, only the big launches get one. A reusable reference and a plan per feature make a clip a routine part of shipping.' },
      { title: 'Clips that drift off brand', text: 'Clips made by different people look different. Re-planning one reference with your brand colours in its colour roles keeps a series consistent.' },
      { title: 'UI that changes after the video', text: 'A recorded screen goes stale with the next design tweak. A remake built from screenshots and components re-renders with the new screen.' },
      { title: 'Many formats per release', text: 'The changelog wants 16:9, the social post wants square, the stores want vertical. One reference re-plans to each length and aspect ratio.' },
    ],
    steps: [
      { title: 'Find a feature-clip reference', text: 'Describe the feature and where it will be posted. `kuchi_suggest_templates` ranks real launches for it; ask for feature clips under 30 seconds, or use `kuchi_search_videos` to filter by category, style, length or aspect ratio.' },
      { title: 'Study the shots', text: '`kuchi_get_breakdown` returns each shot\'s frames, entrance and motion, with the storyboard sheets. The agent notes which shots are whole product screens, which are close-ups on a button or field, and which are type.' },
      { title: 'Plan with your screens', text: '`kuchi_plan_remake` asks for exactly what this reference needs: how many screens, at what size and theme, the feature name, one line of value and the call to action. Answer it in one message.' },
      { title: 'Build the clip', text: 'The coding agent assembles the clip shot by shot: screenshots in device or browser frames, cursor moves and highlights from Kuchi\'s components, captions in your brand fonts. Then it renders.' },
      { title: 'Check and ship', text: '`kuchi_check_remake` catches leftover placeholders, reused reference text and timing drift, and lists the frames to compare with the reference before the clip goes into the release notes.' },
    ],
    prompts: [
      "We shipped [feature] today. Use Kuchi to find three feature-clip templates under 30 seconds that show real UI, and show me the posters.",
      "Plan a 20-second remake of the one I picked with the screenshots in ./release/screens and our brand colours #0F172A and #22C55E. Ask me for the feature name and the call to action.",
      "Make a square version and a 9:16 version from the same reference for LinkedIn and Instagram.",
      "Keep this reference as our feature-clip format. Next release, re-plan it with the new screens and change nothing else.",
    ],
    agents: [
      { slug: 'claude', why: 'Plan the clip in a chat next to the spec and the launch brief, then hand the blueprint to a coding agent.' },
      { slug: 'chatgpt', why: 'The same choose-and-plan flow in ChatGPT, with the posters shown in the chat.' },
      { slug: 'cursor', why: 'With the product repo open, the agent builds the clip next to the real UI code.' },
      { slug: 'claude-code', why: 'Builds and renders the clip end to end when someone on the team runs it in the repo.' },
      { slug: 'manus', why: 'Chooses and plans as a delegated task, then hands the blueprint to the build.' },
    ],
    sections: [
      {
        id: 'channels',
        heading: 'One clip, every place a release gets announced',
        paras: [
          "Plan each feature clip once at its main length, usually 15 to 30 seconds in 16:9 for the changelog and the launch post. Then ask for another plan from the same reference at the aspect ratio each channel wants. Every shot sits on whole frames at your render frame rate, so the agent places shots exactly where the plan says instead of rounding.",
          "Where the clip lives changes what it should say. In the changelog it sits above written notes, so it can show and let the text explain. In a social post it autoplays muted, so on-screen words carry the message; the plan keeps the reference's text shots and asks you for the lines. Inside the product, as an announcement or a tooltip, shorter is better: a condensed plan keeps three or more shots evenly spaced through the reference.",
        ],
      },
      {
        id: 'series',
        heading: 'Keep a quarter of feature clips consistent',
        paras: [
          "Product marketing teams get the most from a reference when they reuse it. Choose one feature-clip reference as the house format and keep its Kuchi link in your release checklist. Each release, the agent re-plans that reference with the new feature's screens and copy. Timing, entrances and layout stay identical across the series, so the clips read as a set.",
          "Brand consistency comes from the colour roles. The breakdown measures the reference's background, secondary and accent colours and their share of the frame; the build puts your brand colours into the same roles. Give the plan your fonts and tone once and reuse them.",
          "When a feature needs a different shape, such as a data feature that should show a chart drawing in, search for a reference in that style rather than forcing it into the house format. `kuchi_list_filters` shows every style and category with counts.",
        ],
      },
      {
        id: 'screens',
        heading: 'Getting screens the plan can use',
        paras: [
          "Most feature clips are built from UI, so the screens decide the quality. Capture them at the resolution the plan asks for and in the theme the reference uses: a dark reference wants dark screenshots. Use real or realistic seeded data, never another company's, and never content from the reference video.",
          "A short screen recording suits shots with a lot of motion. For close-ups, a crisp screenshot animated with a cursor and a highlight usually reads better than a recording zoomed in. The breakdown's motion level per shot tells you which shots need movement: still and low-motion shots are ideal for a screenshot with one animated element.",
        ],
      },
    ],
    videos: [
      { slug: 'claudeai-whiteboards-sheets-data', why: 'Real product UI with push-in and pull-out camera moves and large serif type: a template for a multi-feature release.' },
      { slug: 'notion-calendar-ios', why: 'Fifteen seconds from a phone dock to feature captions and a device family: tight enough for stores and social.' },
      { slug: 'linear-mobile-coding-sessions', why: 'One floating phone on black with code diffs in sequence: a restrained look for a focused feature.' },
      { slug: 'cursor-visualize', why: 'A command typed into a chat, then a chart drawing in: for features that produce something visible.' },
      { slug: 'paper-rich-text', why: 'A square clip carried by live cursors and selections: good for editing and collaboration features.' },
      { slug: 'figma-3d-transforms', why: 'Kinetic type on 3D planes that lands inside the editor: for a feature with a strong visual idea.' },
    ],
    fallbackStyles: ['UI motion', 'Device motion'],
    components: ['screenshot-tour', 'ui-callout', 'cursor-track', 'click-type', 'text-highlight', 'version-hero', 'toolbar-unfurl', 'check-list'],
    faq: [
      { q: 'How long should a feature announcement video be?', a: 'Between 15 and 30 seconds for most features. Feature clips in the library are usually shorter than full launches; start from your reference\'s length and let kuchi_plan_remake re-time it to yours.' },
      { q: 'Can a product manager do this without engineering help?', a: 'Choosing and planning, yes: a chat app such as Claude or ChatGPT connected to Kuchi does both. Rendering needs a coding agent such as Claude Code, Codex or Cursor; anyone comfortable running one in a project can do that step, and the code stays reusable for the next release.' },
      { q: 'Can we reuse the same template for every release?', a: 'Yes, and it is the easiest way to keep a series consistent. Give the agent the same reference link each time; only the content changes.' },
      { q: 'What if our UI is confidential until launch day?', a: 'Kuchi never receives your video and never renders it. Screenshots stay on the machine that builds the clip; the plan works from the details your agent sends and its shot analysis, and kuchi_check_remake reads a shot list, not the file.' },
      { q: 'Do the clips have sound?', a: 'Your choice. The plan defaults to open-license sound effects on each shot\'s cue frame; it can add an open-license music bed, use a track you have the rights to, or stay silent. The kuchi-audio-check skill measures the mix before delivery.' },
    ],
    related: ['how-to-make-a-launch-video-with-ai', 'chatgpt-custom-mcp-server', 'remotion-in-cursor', 'remotion-components-for-ai-agents'],
    keywords: ['feature announcement video', 'product marketing video', 'release video', 'changelog video', 'saas feature video'],
  },
  {
    slug: 'developers',
    audience: 'Engineers and developer relations',
    label: 'Developers and devrel',
    title: 'Developer demo and changelog videos in Remotion, built by your coding agent',
    description: 'Make demo, changelog and launch videos for a developer tool in Remotion. Your coding agent plans the video on a real launch\'s exact frames, installs ready-made components and renders it in your repo.',
    h1: 'Make demo and changelog videos in Remotion with your coding agent',
    kicker: 'For engineers and developer relations',
    tagline: 'Remotion videos written as code in your repo, timed to a real launch.',
    intro: [
      "If you ship a developer tool, the launch video is code you can write. Remotion turns React components into frames, your coding agent already writes React, and Kuchi gives it the part it cannot invent: a real launch video measured frame by frame, with shot timings, entrances and motion levels as data.",
      "Connect the Kuchi MCP server to Claude Code, Codex, Cursor or any coding agent, ask for a demo video, and the agent picks a reference, plans your video on its frames, installs ready-made Remotion components from Kuchi's registry and renders an MP4 in your project. The source sits next to your code and re-renders on every release.",
    ],
    job: {
      heading: 'The job: show the API, the CLI or the agent actually working',
      paras: [
        "Developer audiences trust a demo that shows the real thing: the command typed, the output streaming, the diff landing, the dashboard updating. They are also quick to notice a video that is all gradients and no product. The dev-tool launches in the library that hold attention tend to put a terminal or a code card on screen early and keep the words short.",
        "For devrel the video is rarely a one-off. Every release, SDK method or integration wants a clip for the changelog, the docs, the launch post and the conference talk. Writing those in Remotion means the second clip reuses the first one's scenes, and the tenth is a pull request.",
        "Kuchi fits into that loop as a data source. The plan comes back as JSON with integer `start_frame` and `end_frame` per shot, so the composition reads it directly instead of someone retyping times from a timeline.",
      ],
    },
    pains: [
      { title: 'Screen recordings age badly', text: 'Recorded terminals show old versions and typos. A rebuilt terminal or code card is sharp at any resolution and re-renders when the output changes.' },
      { title: 'Timing by eye', text: 'Hand-timed motion drifts and feels off. The blueprint gives every shot exact frames from a real launch, re-timed to your length.' },
      { title: 'Blank-page Remotion', text: 'A composition from nothing means writing the same terminal, cursor and caption code every time. Kuchi\'s registry installs those as editable source with the shadcn CLI.' },
      { title: 'No way to compare', text: 'It is hard to tell whether a cut matches its reference. kuchi_check_remake returns paired times, so you render stills and compare them side by side.' },
    ],
    steps: [
      { title: 'Pick a reference', text: 'Ask for a dev-tool reference. `kuchi_suggest_templates` ranks the library for your product; `kuchi_search_videos` filters by the Terminal style, pace, length or aspect ratio when you want something specific.' },
      { title: 'Read the breakdown', text: '`kuchi_get_breakdown` returns shots with start and end in frames, entrance (cut, transition, hold or blank), motion level and colour roles, plus a per-second motion curve and storyboard sheets. The agent classifies every shot into one of 14 kinds.' },
      { title: 'Generate the blueprint', text: '`kuchi_plan_remake` takes the product details and the shot analysis and returns the blueprint: fps and total frames, each shot\'s integer frames, your content, suggested components and compare times. Save it as `plan.json`.' },
      { title: 'Write the composition', text: 'The agent reads kuchi-remotion with `kuchi_get_skill`, sets up the `@` alias, installs components with the shadcn command `kuchi_get_component` returns, and writes one `<Sequence>` per shot. Then it renders with the Remotion CLI.' },
      { title: 'Compare with the reference', text: '`kuchi_check_remake` validates the shot list for gaps, drift and reused assets and returns `compare_frames`. The agent renders stills at each `your_s` and sets them beside the reference sheet.' },
    ],
    prompts: [
      "Use Kuchi to find a dev-tool launch with a terminal on screen, under 40 seconds. Show me three options.",
      "Plan a remake of the one I chose for our CLI. Save the blueprint as video/plan.json and set up a Remotion project in /video that reads its frames from it.",
      "Install Kuchi's terminal-session and glass-code-walk components and use them for shots 2 to 4, with output copied from a real run of our CLI.",
      "Render, run kuchi_check_remake on the shot list, export stills at the compare times and fix the shots that drift.",
    ],
    agents: [
      { slug: 'claude-code', why: 'The plugin adds the skills and the server in one step; it runs the whole write, render and check loop in the terminal.' },
      { slug: 'codex', why: 'One command in Codex CLI; runs the render and the check without you copying files around.' },
      { slug: 'cursor', why: 'Builds the composition beside your code, with a one-click MCP install.' },
      { slug: 'opencode', why: 'For teams that pick their own model and still want the full loop.' },
      { slug: 'copilot-cli', why: 'If your organisation standardises on Copilot, the CLI agent renders the video from the terminal.' },
      { slug: 'gemini-cli', why: 'Terminal-first, with the server added in settings.json.' },
    ],
    sections: [
      {
        id: 'remotion',
        heading: 'How the blueprint maps onto Remotion',
        paras: [
          "The blueprint carries the composition's fps and total frames, and every shot's `start_frame` and `end_frame` as integers. In Remotion that is one `<Composition>` whose `durationInFrames` is the blueprint's frames, and one `<Sequence>` per shot with `from` at `start_frame` and `durationInFrames` of `end_frame − start_frame + 1`. Inside a Sequence, `useCurrentFrame()` starts at zero, so each shot's entrance is written relative to the shot.",
          "Entrances translate directly. A `cut` changes the whole picture on the shot's first frame. A `transition` finishes over the shot's first frames, and the detail sheets show whether it wipes, zooms, morphs or dissolves. A `hold` freezes the previous picture before motion resumes. The motion level says how much moves: `still` means nothing, `low` one element such as a cursor, `medium` a panel or a block of text, `high` the whole frame.",
          "Keep renders deterministic: no `Math.random()` or `Date.now()` in frame code, assets loaded with `staticFile()`, fonts loaded before the first frame. The kuchi-remotion skill spells out these rules and the `@` alias in `remotion.config.ts` that Kuchi's components expect. A low-motion terminal shot, typed over its own frames:",
        ],
        code: `// src/shots/Install.tsx: a low-motion terminal shot, typed across the shot
import { interpolate, useCurrentFrame, useVideoConfig } from 'remotion';

const command = 'npx your-cli init';

export const Install = () => {
  const frame = useCurrentFrame(); // 0 on the shot's first frame
  const { durationInFrames } = useVideoConfig(); // the Sequence's length
  const typed = Math.round(
    interpolate(frame, [0, durationInFrames * 0.6], [0, command.length], {
      extrapolateRight: 'clamp',
    }),
  );
  return <pre className="terminal">$ {command.slice(0, typed)}</pre>;
};`,
      },
      {
        id: 'changelog-loop',
        heading: 'A changelog video on every release',
        paras: [
          "Once the first video exists, the next one is a diff. Keep the composition, the shared scenes and the brand tokens in the repo, and for each release ask the agent to re-plan the same reference with the new feature, or a shorter cut of it. The blueprint changes; shots that rebuild the same kinds of moments keep their components; the render runs in your terminal.",
          "Teams that ship weekly often keep two references: a full launch for major versions and a 15 to 20-second feature clip for everything else. Both live as Kuchi links in the repo's video folder, so anyone on the team can ask their agent to re-plan them.",
          "Real output beats mocked output. Copy terminal text from an actual run of your CLI, show a real API response, and put your real docs URL on the end card. The check flags placeholders still in the shot list, so nothing ships with filler text.",
        ],
      },
      {
        id: 'registry',
        heading: 'Components for terminals, code and agents',
        paras: [
          "Kuchi's registry serves Remotion components as source, installed with one shadcn command each, so your agent can restyle them freely. For developer videos the useful ones are terminal sessions, code cards that walk or morph between snippets, an agent run with steps, cursor and click animations, and word-by-word captions for muted autoplay. Browse them on [the components page](/components) or have the agent call `kuchi_list_components`.",
          "Each analysed blueprint shot lists the components that rebuild that kind of shot, best fit first. The agent reads one with `kuchi_get_component`, which returns its files, props, dependencies and install command, then passes your own text, colours and timing as props.",
        ],
      },
    ],
    videos: [
      { slug: 'cursor-sdk-run-steer', why: 'Twenty seconds of code typed into a card with lines highlighted: the template for explaining one API method.' },
      { slug: 'notion-shared-brain', why: 'Big headlines, floating terminal windows and a database view, for an agent or memory feature.' },
      { slug: 'treg-social-api', why: 'A terminal prompt at the centre that opens into data and dashboards: an API launch shape.' },
      { slug: 'design-to-code', why: 'Text selections, a terminal checklist and an install-command end card, for a skill or a CLI.' },
      { slug: 'readwise-for-openclaw', why: 'Phone UI alternating with type, ending on a terminal command: an integration announcement.' },
      { slug: 'vercel-run-your-backend', why: 'Twelve seconds of wireframe geometry with small labels: an abstract cut for infrastructure.' },
    ],
    fallbackStyles: ['Terminal', 'UI motion'],
    components: ['terminal-session', 'glass-code-walk', 'code-morph', 'terminal-simulator', 'agent-run', 'terminal-cursor-zoom', 'glass-code-block', 'word-captions'],
    faq: [
      { q: 'Why Remotion for a developer video?', a: 'Because the video is React code. Your coding agent already writes it, it lives in version control, it renders the same way every time from the command line, and the next video reuses the scenes. Kuchi\'s components are Remotion components for that reason.' },
      { q: 'Do I have to use Remotion?', a: 'No. The blueprint is plain JSON with frames per shot, so any frame-based tool can follow it. Kuchi\'s components and the kuchi-remotion skill are written for Remotion, which makes it the shortest path.' },
      { q: 'Can the video render in our build pipeline?', a: 'Kuchi does not render anything; rendering is Remotion\'s job on whatever machine runs it. Many teams render locally first, then move the same render command into their own pipeline once the composition is stable.' },
      { q: 'Does the blueprint change between calls?', a: 'The plan is computed from the reference\'s measurements and your inputs, so the same reference, length, fps and answers return the same frames. Every Kuchi tool is read-only and idempotent.' },
      { q: 'How do I keep terminal output readable on a phone?', a: 'Show fewer lines at a larger size than a real terminal would. The agent\'s shot notes record how much of the frame the reference\'s code occupied; match that share rather than a font size.' },
    ],
    related: ['remotion-with-claude-code', 'remotion-with-codex', 'remotion-components-for-ai-agents', 'kuchi-mcp-server-and-agent-skill', 'opencode-remotion-video'],
    keywords: ['remotion product demo', 'developer tool launch video', 'changelog video', 'devrel video', 'remotion coding agent'],
  },
  {
    slug: 'indie-hackers',
    audience: 'Indie hackers and solo makers',
    label: 'Indie hackers',
    title: 'Launch video for indie hackers and solo makers, made with an AI agent',
    description: 'Make a launch video on your own in an evening. Pick a real launch you like, and your AI agent rebuilds its timing and motion with your app, logo and words, then renders it.',
    h1: 'Make a launch video as a solo maker',
    kicker: 'For indie hackers and solo founders',
    tagline: 'One person, one evening, one agent: a launch video that does not look homemade.',
    intro: [
      "When you build alone, the launch video is one more job on a list that already holds the landing page, the post, the waitlist email and the bug you found an hour ago. Kuchi makes it a job your AI agent does. Pick a real launch video you like, and the agent rebuilds its timing and motion with your own app, logo and words.",
      "Kuchi is free and open: a library of real launch videos measured frame by frame, served to your agent through an MCP server with no sign-in. The agent plans your video on the reference's exact frames, builds it with ready-made Remotion components and renders it on your machine.",
    ],
    job: {
      heading: 'The job: ship a launch video in an evening, not a month',
      paras: [
        "Solo makers launch often: a first version, a big update, a new side project, a change of direction. Each launch post does better with a short video, and each video competes for the same few hours you have. You need a process that takes about as much effort as writing the post, and that you can repeat next month without relearning a video editor.",
        "The trick is to stop designing and start remaking. Someone has already worked out a 30-second structure that holds attention, and the library has dozens of them, from type-only teasers to app walkthroughs. You choose one, your agent copies its rhythm, and you spend your time on the parts only you can supply: what the product does and the screens that show it.",
        "Because everything is built in code, your second launch takes less work than your first. The components, colours and end card carry over; only the screens and the words change.",
      ],
    },
    pains: [
      { title: 'Every hour counts', text: 'A video that takes a weekend steals the weekend from the product. The plan\'s list of missing inputs tells you exactly what to prepare, and nothing more.' },
      { title: 'The homemade look', text: 'A screen recording with a music track looks like a screen recording. Rebuilding a real launch\'s cuts and entrances gives the same screens a studio rhythm.' },
      { title: 'No design help', text: 'The reference makes the layout decisions; you make the content decisions. Your brand colours go into the reference\'s colour roles.' },
      { title: 'Launching in public, repeatedly', text: 'Every update deserves a clip. Re-plan the same reference for the next release and your build-in-public feed keeps one look.' },
    ],
    steps: [
      { title: 'Pick a launch you like', text: 'Browse the library on the site or ask your agent. `kuchi_suggest_templates` ranks videos for your product and the assets you have, and says what each one would need from you, so a reference that needs ten screens is easy to skip.' },
      { title: 'Let the agent study it', text: '`kuchi_get_breakdown` gives every shot\'s frames, entrance, motion and colours with a sheet of real frames, and the agent writes down what each shot shows.' },
      { title: 'Answer the plan\'s questions', text: '`kuchi_plan_remake` asks only what this reference needs: your product name, one line, your logo, the screens, one to three moments and the call to action. Choose a length: 15, 30 or 60 seconds, or the reference\'s own.' },
      { title: 'Let it build', text: 'A coding agent writes the video in Remotion from Kuchi\'s components and renders it. Your edits are prompts: “make the headline shorter”, “swap screen 3”, “use my green”.' },
      { title: 'Check before you post', text: '`kuchi_check_remake` makes sure nothing of the reference is left on screen and no placeholder slipped through, then gives you frames to compare with the original.' },
    ],
    prompts: [
      "I'm launching [app] this weekend. Use Kuchi to suggest launch video templates that only need a logo and three screenshots.",
      "Remake the one I picked as a 30-second video. Use my screenshots in ./shots, my logo in ./logo.svg and #7C3AED as the accent.",
      "Make a 9:16 version from the same reference for short-form video.",
      "Before the final render, run kuchi_check_remake and list every placeholder still on screen.",
    ],
    agents: [
      { slug: 'claude-code', why: 'The plugin brings the skills and the server together; Claude Code builds and renders in the folder you point it at.' },
      { slug: 'codex', why: 'Runs the build, render and check loop from the CLI or the Codex app.' },
      { slug: 'cursor', why: 'Builds the video inside your app\'s repo, next to the UI it shows.' },
      { slug: 'opencode', why: 'Open source and model-agnostic: bring the model you already use.' },
      { slug: 'claude', why: 'Choose and plan in a chat, then hand the plan to a coding agent at your desk.' },
    ],
    sections: [
      {
        id: 'one-evening',
        heading: 'A one-evening plan',
        paras: ["Times vary with the reference and your agent, but the shape of the evening does not: most of your effort goes into choosing and into the screens, the two decisions only you can make."],
        ordered: true,
        list: [
          'Choose a reference. Watch three or four on the site and pick the one whose shape fits what you have to show.',
          'Capture the screens the plan asks for, at its size and in its theme.',
          'Answer the plan: product name, one line, the moments, the call to action, your colours.',
          'Let the agent build and render. Review the first render and ask for changes in plain words.',
          'Run the check, compare the frames it names, export and post.',
        ],
      },
      {
        id: 'build-in-public',
        heading: 'Launching in public, again and again',
        paras: [
          "If you post progress on X, a recurring video format turns updates into a series. Keep one reference for big launches and one short feature clip for weekly updates: same timing, same entrances, same end card, new screens each time. Followers learn the format, and you never start from zero.",
          "Real numbers make strong shots: revenue, signups, users, a streak of days shipped. Only use numbers you actually have. The plan never invents a metric; a chart shot with no number from you is dropped or held as a placeholder until you give one.",
          "If you have no screenshots yet because you are launching a waitlist, pick a type-led reference. Kinetic type launches carry the whole story in words and need only your logo at the end.",
        ],
      },
      {
        id: 'make-it-yours',
        heading: 'Making a remake look like yours',
        paras: [
          "The reference lends structure; everything you can see is yours. Put your brand colours in its colour roles, use your own font, and write lines in your own voice. Kuchi's components take your text and colours as props, so restyling them is a prompt, not a redesign.",
          "Sound is optional. The default is open-license sound effects on each shot's cue frame, chosen by the kuchi-sound skill; you can add an open-license music bed, use a track you own, or go silent. Never reuse the reference's music.",
        ],
      },
    ],
    videos: [
      { slug: 'sidehoe', why: 'A solo maker\'s square launch: gradients, chat UI and a new feature every few seconds.' },
      { slug: 'terminus-notes', why: 'A notes app shown through a clean workspace and a launch checklist, in 45 seconds.' },
      { slug: 'tasteskill-v2', why: 'A type-only launch that needs nothing but words and an install command at the end.' },
      { slug: 'native-cook', why: 'A UI-kit launch with phone mockups and caption pills, for anything with a mobile side.' },
      { slug: 'affordihome-finder-illustrated-launch', why: 'A vertical 9:16 launch that turns the workflow into a character story.' },
      { slug: 'shipper-build-bots-with-ai', why: 'White UI cards, floating icons and plain 2D transitions: easy to rebuild from screenshots.' },
    ],
    fallbackStyles: ['Kinetic type', 'UI motion'],
    components: ['launch-anything', 'screen-recording', 'phone-frame', 'url-bar-cta', 'rolling-number', 'follower-rush', 'upvote-burst', 'hook-punch'],
    faq: [
      { q: 'Is Kuchi really free for solo makers?', a: 'Yes. Everything is free: the library, the MCP server, the components and the skills, with no account and no API key.' },
      { q: 'What do I need installed?', a: 'An AI coding agent such as Claude Code, Codex or Cursor, and Node.js for Remotion, which the agent sets up in your project. Connect Kuchi with one command or one click from your agent\'s guide.' },
      { q: 'I only have a landing page and a logo. Can I still make a launch video?', a: 'Yes. Ask for a type-led reference: kinetic type launches tell the story in words and end on your logo. Add product shots later and re-plan.' },
      { q: 'Can I make a vertical video for short-form platforms?', a: 'Yes. Give the aspect ratio when you plan, or search for vertical references with kuchi_search_videos. The agent then sets the composition to 1080×1920.' },
      { q: 'How do I change the video after it is rendered?', a: 'Ask your agent. The video is code, so a new headline, screenshot or colour is an edit and a re-render.' },
    ],
    related: ['how-to-make-a-launch-video-with-ai', 'remotion-with-claude-code', 'remotion-in-cursor', 'kuchi-mcp-server-and-agent-skill'],
    keywords: ['indie hacker launch video', 'solo founder launch video', 'side project launch video', 'build in public video', 'make a launch video yourself'],
  },
  {
    slug: 'agencies',
    audience: 'Agencies, studios and freelancers',
    label: 'Agencies and freelancers',
    title: 'Launch videos for agencies and freelancers: client videos with AI agents',
    description: 'Turn a client brief into a frame-timed plan and a first cut. Shortlist real launch videos as references, let your AI agent plan the remake with the client\'s brand and screens, and build it in code.',
    h1: 'Make client launch videos with a measured reference for every brief',
    kicker: 'For agencies, studios and freelancers',
    tagline: 'From the client\'s “something like that one” to a frame-timed plan and a first cut.',
    intro: [
      "Clients come to an agency with a reference already in mind: “something like that launch”. Kuchi turns that conversation into a method. Shortlist real launch videos with the client, let your AI agent measure the one they choose and plan the remake on its exact frames with the client's brand and screens, and reach a first cut in code while the brief is still fresh.",
      "Kuchi is a free library of real product-launch videos, each measured frame by frame, served to AI agents through an open MCP server. It never touches the client's footage or files. Your team keeps creative control; the agent does the timing, the assembly and the checks.",
    ],
    job: {
      heading: 'The job: from reference to approved first cut without weeks of back and forth',
      paras: [
        "The slowest part of a client launch video is rarely the animation. It is agreeing on what the video should feel like, then turning that feeling into a timeline. A shared reference with measured shots shortens both. The client sees the original, you see its exact pacing, and the plan spells out what the client still owes you: logo files, screens, the feature list, the call to action.",
        "For freelancers and small studios, the agent becomes the assistant editor. It assembles shots from Kuchi's components and your own scene library, keeps every shot on its frame, and runs the check before you review. Your time goes on the work clients hire you for: taste, polish and the details that make a brand feel like itself.",
        "Because the build is code, revisions are quick. A changed tagline, a new screenshot or a different end card is an edit and a re-render, and the cutdowns for each channel come from the same reference.",
      ],
    },
    pains: [
      { title: 'Vague briefs', text: '“Make it feel like that one” becomes a concrete shot list with entrances, motion levels and colour roles.' },
      { title: 'Missing client assets', text: 'The plan\'s missing inputs are a ready-made request list: logo format, screen sizes and theme, features, call to action.' },
      { title: 'Revision rounds', text: 'A video built in code takes a copy change in minutes instead of a re-export from a timeline.' },
      { title: 'The reference\'s own brand', text: 'kuchi_check_remake flags reused brand text and any asset taken from the reference, so the delivered cut carries only the client\'s material.' },
    ],
    steps: [
      { title: 'Shortlist references with the client', text: 'Run `kuchi_suggest_templates` with the client\'s product and the feel they want, or let them pick videos on the site and paste the links. Share the posters and links at the kickoff.' },
      { title: 'Measure the chosen one', text: '`kuchi_get_breakdown` returns the frame-exact shot list, entrances, motion curve and colour roles. The agent writes a kind and a one-line description per shot, which doubles as the storyboard you present.' },
      { title: 'Plan with the client\'s brand', text: '`kuchi_plan_remake` produces the blueprint and the list of missing inputs. Send that list to the client as the asset request.' },
      { title: 'Build the first cut', text: 'Your coding agent assembles the shots from Kuchi components and your own, in the client\'s colours and fonts, and renders. Sound can be open-license effects or the client\'s licensed track.' },
      { title: 'Check and present', text: '`kuchi_check_remake` verifies timing and that nothing of the reference survived. Present the cut beside the reference frames at the compare times.' },
    ],
    prompts: [
      "Our client makes [product] for [audience]. Use Kuchi to shortlist six launch video references with a premium, calm feel, and give me the posters and links for the kickoff deck.",
      "Break down the reference the client chose and write a storyboard table: shot, frames, kind, what it shows, what we need from the client.",
      "Plan a 45-second remake and turn missing_inputs into an asset request email I can send the client.",
      "Build the first cut with the brand kit in ./clients/[client]/brand, render it, and run kuchi_check_remake.",
    ],
    agents: [
      { slug: 'claude-code', why: 'Runs the full build in each client\'s project folder; the plugin installs the skills and the server in one step.' },
      { slug: 'cursor', why: 'Studio developers keep a component library per client and let the agent compose from it.' },
      { slug: 'xum', why: 'Parallel agents per branch: explore two references for the same brief side by side.' },
      { slug: 'devin', why: 'Hand a whole remake over as a task and review the result.' },
      { slug: 'claude', why: 'Run references and storyboards with account leads in a chat, then hand the blueprint to the build.' },
    ],
    sections: [
      {
        id: 'kickoff',
        heading: 'Running a kickoff around a measured reference',
        paras: [
          "Bring three to six references to the first call, chosen by `kuchi_suggest_templates` from the client's brief or picked by the client on the site. Show each poster and the original video. When the client chooses, the breakdown gives you the numbers behind the feeling: shot changes per ten seconds, which shots cut and which transition, where motion peaks, and how much of the frame is background, secondary and accent colour.",
          "Turn that into a storyboard the client can sign off. The agent's shot analysis already has a kind and a one-line description per shot; add what the client will supply for each. Approving that table approves the structure, before any animation work starts.",
          "Be clear with the client that the reference lends structure only. Its brand, footage, characters, music and copy belong to its creator and never appear in their video.",
        ],
      },
      {
        id: 'asset-request',
        heading: 'The asset request writes itself',
        paras: [
          "`kuchi_plan_remake` returns `missing_inputs` worded for the chosen reference: how many product screens it needs, at what size and theme, whether it needs a mascot or a product render, and the logo format. Paste it into your asset request and the client knows exactly what to send.",
          "Where the client cannot supply something, such as real metrics for a chart shot, the plan drops that shot or holds it as a marked placeholder, and the check reports every placeholder before delivery. You never ship an invented number or testimonial on a client's behalf.",
        ],
      },
      {
        id: 'cutdowns',
        heading: 'Cutdowns and versions from one reference',
        paras: [
          "Most client launches need a hero cut and several cutdowns. Re-plan the same reference at each length. When the target is much shorter than the reference, the plan keeps an evenly spaced subset of at least three shots rather than speeding everything up, so the cutdowns keep the hero's rhythm. Aspect ratio and frame rate are parameters too.",
          "Keep each client's brand tokens, fonts and custom components in the project, and the next brief for the same client starts from a working kit.",
        ],
      },
    ],
    videos: [
      { slug: 'holo-marketing-motion-study', why: 'A bright marketing film of image tiles and pill-shaped words: the polished look clients ask studios for.' },
      { slug: 'opptics-payments-motion-study', why: 'Perspective cards and radial ribbons around payment UI, in 21 seconds.' },
      { slug: 'google-gemini-motion-study', why: 'Thin lines connecting icons and a glowing prompt box on white: a clean brand-system study.' },
      { slug: 'proto-calendar-ui-demo', why: 'Saturated backgrounds and oversized cursors clicking through a product: a strong UI demo shape.' },
      { slug: 'lifted-finance', why: 'Minimal white type on black with thin chart lines: an editorial fintech film.' },
      { slug: 'landatlas-launch', why: 'A step-by-step product walkthrough lit with gradients and map points, for a data-heavy product.' },
    ],
    fallbackStyles: ['UI motion', 'Image collage'],
    components: ['brand-guidelines', 'workflow-console', 'logo-construct', 'laptop-frame', 'phone-trio', 'title-sweep', 'grid-montage', 'karaoke-captions'],
    faq: [
      { q: 'Can we use Kuchi for client work?', a: 'Yes. Kuchi is free and open for everyone, including agencies and freelancers making videos for clients. The rule is the same as for anyone: copy the reference\'s motion and taste, never its content.' },
      { q: 'Does Kuchi see our client\'s files?', a: 'No. Kuchi never receives the video and never renders it. The plan works from the details your agent sends and its shot analysis, and the check reads a shot list. The client\'s screens and footage stay on your machines.' },
      { q: 'Can we mix our own scene library with Kuchi\'s components?', a: 'Yes. The blueprint suggests components per shot, but any component that keeps the shot\'s frames, entrance and motion works. Many studios combine their own scenes with Kuchi\'s.' },
      { q: 'How do we show the client the cut matches the reference?', a: 'Render stills at the compare_frames times kuchi_check_remake returns and set them beside the reference frames on the storyboard sheet. They show matching position, scale and stage of each move, with only the client\'s content on screen.' },
      { q: 'What about music?', a: 'Use a track the client has the rights to, an open-license music bed, open-license sound effects, or silence. The kuchi-sound skill logs every sound\'s source and license for your delivery notes.' },
    ],
    related: ['how-to-make-a-launch-video-with-ai', 'xum-parallel-video-drafts', 'remotion-components-for-ai-agents', 'claude-custom-connector'],
    keywords: ['agency launch video', 'freelance motion design ai', 'client launch video', 'video agency ai workflow', 'studio launch film'],
  },
  {
    slug: 'open-source',
    audience: 'Open-source maintainers',
    label: 'Open-source maintainers',
    title: 'Release videos for open-source projects: a launch video for your next version',
    description: 'Make a release video for your open-source project with your coding agent: a real launch as the template, your real CLI output in the shots, and Remotion source you can keep in the repo.',
    h1: 'Make a release video for your open-source project',
    kicker: 'For open-source maintainers',
    tagline: 'A launch video for v1.0, a major release or a new integration, built from your real CLI.',
    intro: [
      "An open-source release competes for attention with every other release that day. A short video on the announcement post, the docs home page and the release notes is often what turns a version bump into something people try. Kuchi helps your coding agent make that video with a real launch as the template, using your project's real commands and output.",
      "Kuchi is free and open: a library of real launch videos measured frame by frame, served through an MCP server with no sign-in, plus Remotion components installed as editable source. The video is code that can live in your repository, so contributors can update it with the next release.",
    ],
    job: {
      heading: 'The job: show what changed and how to start, in under a minute',
      paras: [
        "Release videos for open-source projects have a clear shape: what the project is, what is new in this version, and the command to try it. The audience is developers, so real terminal output and real code persuade more than abstract motion. The best references for this are the dev-tool and skill launches in the library that end on an install command.",
        "Maintainers rarely have a designer. What they have is a codebase, a CLI and, more and more often, a coding agent. That is enough: the agent picks a reference, plans the video on its frames, rebuilds the terminal and code shots from your real output, and renders it.",
        "Keeping the video in the repo makes it maintainable like the docs. The next release changes the version number, the feature shots and the install command; the structure, look and timing carry over.",
      ],
    },
    pains: [
      { title: 'No designer on the team', text: 'The reference makes the layout and pacing decisions. You supply the project\'s name, logo and real output.' },
      { title: 'Releases never stop', text: 'A video that needs a designer happens once a year. A video in code can follow every major release.' },
      { title: 'Demos go stale', text: 'Recorded demos show old flags and old output. Rebuilt terminal shots take your current output as text and re-render.' },
      { title: 'Contributors everywhere', text: 'A composition in the repo is reviewed in a pull request like any other change.' },
    ],
    steps: [
      { title: 'Choose a reference', text: 'Ask your agent for launches that show a terminal or end on an install command. `kuchi_suggest_templates` ranks them for your project; `kuchi_search_videos` filters by style or length.' },
      { title: 'Study it', text: '`kuchi_get_breakdown` returns the shot frames, entrances, motion and colours, with storyboard sheets the agent reads to classify each shot.' },
      { title: 'Plan the release', text: '`kuchi_plan_remake` asks for the project name and one-liner, the logo, the screens or output to show, one to three changes in this version and the closing command or URL.' },
      { title: 'Build from real output', text: 'The agent installs Kuchi\'s terminal and code components, pastes in output from a real run, applies the project\'s colours and renders with Remotion.' },
      { title: 'Check it', text: '`kuchi_check_remake` flags placeholders and timing drift and gives you frames to compare with the reference before you attach the video to the release.' },
    ],
    prompts: [
      "We're releasing v2.0 of [project]. Use Kuchi to find launch video templates that show a terminal and end on an install command.",
      "Plan a 30-second remake. The three changes are under 2.0 in CHANGELOG.md and the install command is in the README. Ask me for anything else.",
      "Run our CLI's quickstart, capture the real output and use it in the terminal shots instead of made-up text.",
      "Put the composition in /video with a short README on re-planning it for the next release, then run kuchi_check_remake.",
    ],
    agents: [
      { slug: 'claude-code', why: 'Writes, renders and checks the video in the repo; the plugin adds the skills and the server together.' },
      { slug: 'opencode', why: 'An open-source agent that works with any model.' },
      { slug: 'cline', why: 'An open-source agent in your editor, with Kuchi added in the MCP Servers panel.' },
      { slug: 'gemini-cli', why: 'An open-source terminal agent, configured with a few lines in settings.json.' },
      { slug: 'codex', why: 'One command in Codex CLI, then the full build, render and check loop.' },
    ],
    sections: [
      {
        id: 'release-structure',
        heading: 'A release video structure for open source',
        paras: [
          "A structure that suits most releases: the project's name and one line, the headline change shown working, one or two further changes as quick shots, and an end card with the install command and docs URL. Choose a reference with that shape and the plan fits your content into its exact frames.",
          "Version numbers make good kinetic type. A version hero or a number rolling up is a strong opening for a major release, and it is real information, not decoration.",
          "Close on the command people should run. The reference's end card becomes your logo and the exact install line from your docs.",
        ],
      },
      {
        id: 'in-the-repo',
        heading: 'Keeping the video in the repository',
        paras: [
          "Put the Remotion project in a folder such as `/video` with its own `package.json`, so it never touches the library's dependencies. Commit the blueprint as `plan.json` next to it. For the next release, a contributor's agent re-plans from the same reference link and updates the shots in a pull request.",
          "Kuchi components arrive through the shadcn CLI as source files in that folder, so nothing calls Kuchi at runtime. Because they are plain source, contributors read and change them like any other file.",
          "Keep rendered MP4 files out of version control; attach the video to the release or host it with your docs.",
        ],
      },
      {
        id: 'community',
        heading: 'Real numbers and community proof',
        paras: [
          "Open-source projects often have honest proof to show: contributors, downloads, adopters who agreed to be named. Use only numbers you can point to. Kuchi never invents metrics, and a chart shot with no real number stays a placeholder until you supply one.",
          "Thank-you beats suit open source: a roll of contributor names or a milestone counter. Use names only with consent, and spell them the way contributors write them.",
        ],
      },
    ],
    videos: [
      { slug: 'terminus-notes', why: 'An open-source notes app launch that closes on its open-source message and the project title.' },
      { slug: 'design-to-code', why: 'A skill launch ending on the install command: a template for a CLI or an agent skill.' },
      { slug: 'cursor-sdk-run-steer', why: 'A restrained code-card explainer for one SDK method, in 20 seconds.' },
      { slug: 'allo-font', why: 'A type-foundry release built from kinetic type and glyph construction, for a project with a strong visual identity.' },
      { slug: 'hermes-profile-builder', why: 'A square, step-by-step flow of glowing outlined cards, for a setup or configuration feature.' },
      { slug: 'tasteskill-v2', why: 'Typography-led, with a black install-command end card.' },
    ],
    fallbackStyles: ['Terminal', 'Kinetic type'],
    components: ['terminal-session', 'version-hero', 'glass-code-block', 'typed-split-wipe', 'milestone-roll', 'check-list', 'terminal-cursor-zoom', 'word-captions'],
    faq: [
      { q: 'Can an open-source project use Kuchi?', a: 'Yes. Kuchi is free for every project, open source or not, with no account and no API key.' },
      { q: 'Does the video add a dependency to my project?', a: 'No. Keep the Remotion project in its own folder with its own package.json. Kuchi components are copied in as source files, so nothing calls Kuchi at runtime.' },
      { q: 'Can contributors update the video?', a: 'Yes. Anyone with a coding agent connected to Kuchi can re-plan the same reference for a new release and change the shots in a pull request.' },
      { q: 'What should the end card say?', a: 'The exact install command from your docs and the docs URL. The plan asks for the closing call to action, so the agent never makes one up.' },
      { q: 'Can I reuse my project\'s existing logo animation?', a: 'Yes, if it is your own: it is your asset. What a remake never reuses is anything from the reference video.' },
    ],
    related: ['remotion-with-claude-code', 'opencode-remotion-video', 'remotion-components-for-ai-agents', 'kuchi-mcp-server-and-agent-skill'],
    keywords: ['open source release video', 'open source launch video', 'release announcement video', 'cli demo video', 'v1 launch video'],
  },
];

export const useCasePath = (u: UseCase) => `/use-cases/${u.slug}`;
export const useCaseBySlug = (slug: string) => useCases.find((u) => u.slug === slug);

/** The picked videos still in the catalog, with their reason, then style matches to six. */
export function videosForUseCase(u: UseCase, count = 6): { video: Video; why?: string }[] {
  const picked: { video: Video; why?: string }[] = [];
  for (const { slug, why } of u.videos) {
    const video = newestFirst.find((v) => v.slug === slug);
    if (video && picked.length < count) picked.push({ video, why });
  }
  const byReach = [...newestFirst].sort((a, b) => b.impressions - a.impressions);
  for (const style of u.fallbackStyles) {
    for (const video of byReach) {
      if (picked.length >= count) break;
      // Never feature a video named after an upstream component project.
      if (/remocn|snap-?cn/i.test(video.slug)) continue;
      if (video.styles.includes(style) && !picked.some((p) => p.video === video)) picked.push({ video });
    }
  }
  return picked;
}

export function componentsForUseCase(u: UseCase): RegistryItem[] {
  return u.components.map((name) => components.find((c) => c.name === name)).filter((c): c is RegistryItem => Boolean(c));
}

export function agentsForUseCase(u: UseCase): { harness: Harness; why: string }[] {
  return u.agents.map(({ slug, why }) => ({ harness: bySlug(slug), why })).filter((a): a is { harness: Harness; why: string } => Boolean(a.harness));
}

export function relatedPosts(u: UseCase): Post[] {
  return u.related.map((slug) => posts.find((p) => p.slug === slug)).filter((p): p is Post => Boolean(p));
}

/** The audience's own questions, then the ones every use-case page answers. */
export function faqForUseCase(u: UseCase): Faq[] {
  return [
    ...u.faq,
    { q: 'Which AI agents work with Kuchi?', a: 'Any MCP client that speaks Streamable HTTP. Coding agents such as Claude Code, Codex and Cursor choose, plan, build and render; chat apps such as Claude and ChatGPT choose, study and plan, then hand the blueprint to a coding agent. Each agent has a step-by-step guide at /agents.' },
  ];
}

/** Command-palette entries (pages/search-index.json.ts). */
export const useCaseSearchEntries = () => [
  { k: 'page' as const, t: 'Use cases', s: 'Launch videos for founders, product teams, developers and makers', h: '/use-cases', w: 'use case audience who founders product developers indie agencies open source' },
  ...useCases.map((u) => ({ k: 'page' as const, t: u.h1, s: u.tagline, h: useCasePath(u), w: `use case ${u.audience} ${u.keywords.join(' ')}` })),
];
