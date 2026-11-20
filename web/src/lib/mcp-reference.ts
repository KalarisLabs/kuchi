// Technical facts about the Kuchi MCP server, for the depth sections of the agent guides
// (pages/agents/[slug].astro) and the posts. Mirrors agent-service/server.mjs, brief.mjs and
// breakdown.mjs at MCP 1.3.0, which is frozen (owner, 2026-11-13); if the server ever changes,
// change this file with it. Nothing here is imported from agent-service: the site and the
// Worker build separately.

/** Every tool, in the order an agent meets them. */
export const TOOLS: { name: string; what: string; coding: string; chat: string }[] = [
  { name: 'kuchi_get_workflow', what: 'The remake method, whole or one step (find, study, plan, build, check) with the rules that hold for all steps. Markdown.', coding: 'Read once before the first remake, or one step at a time to keep context small.', chat: 'Read once at the start of the chat so the app follows the method.' },
  { name: 'kuchi_suggest_templates', what: 'A short numbered list of launch videos ranked for a product description, each with poster, link, what fits, what differs, what you would need to supply and one recommendation.', coding: 'First call of a job; the agent shows the posters and waits for your pick.', chat: 'First call of a job; the app shows the posters inline and waits for your pick.' },
  { name: 'kuchi_search_videos', what: 'Searches the whole library by keyword, style, category, format, aspect ratio, length, pace or theme, a page at a time.', coding: 'When you ask for something specific ("vertical, fast, terminal style").', chat: 'When you want to browse beyond the suggested few.' },
  { name: 'kuchi_get_video', what: 'One video by id, slug, site link or original X link: file, poster, storyboard, length and measured rhythm, with resource links to the MP4 and images.', coding: 'When you paste a link from the site instead of choosing by number.', chat: 'When you paste a link from the site.' },
  { name: 'kuchi_list_filters', what: 'Every valid style, category, format, aspect ratio, pace and theme with counts, plus the 14 shot kinds an agent classifies shots into.', coding: 'Before a filtered search, so it never guesses a filter value.', chat: 'Before a filtered search.' },
  { name: 'kuchi_get_breakdown', what: 'The frame-by-frame measurement of one video: each shot\'s start and end, entrance, amount of motion and colour roles, a per-second motion and loudness curve, and storyboard sheets of real frames.', coding: 'Study step; the agent looks at the storyboard and writes its own shot analysis.', chat: 'Study step; the app reads the storyboard images and describes each shot.' },
  { name: 'kuchi_plan_remake', what: 'Takes your product details, assets and the agent\'s shot analysis; returns a blueprint re-timed to your length on whole frames, with your content per shot, plus missing_inputs and ready.', coding: 'Called until ready=true; the blueprint becomes the shot list in code.', chat: 'Called until ready=true; the blueprint is what you hand to a coding agent.' },
  { name: 'kuchi_check_remake', what: 'Checks a shot list against the reference: reused brand text, assets taken from the reference, generated logos or UI, placeholders, timing gaps and drift. Returns passed and compare_frames.', coding: 'Before delivery; the agent renders stills at the compare_frames times and fixes drift.', chat: 'Optional; useful to sanity-check a plan before handing it over.' },
  { name: 'kuchi_list_components', what: 'Lists the copy-paste Remotion components (kinetic type, captions, UI screens, cursors, logos, transitions) with dependencies and shadcn install commands.', coding: 'While building, to find a ready-made component for a shot.', chat: 'Rarely; useful to name components in the plan.' },
  { name: 'kuchi_get_component', what: 'One component\'s full source, files, dependencies, install command and usage notes, split into parts when long.', coding: 'To read a component\'s source before installing or adapting it.', chat: 'Rarely.' },
  { name: 'kuchi_get_skill', what: 'One of the build skills bundled with the server: kuchi-remotion (Remotion setup, the @ alias, one Sequence per shot, rendering), kuchi-sound (open-license sound effects placed on the cue frame of each shot, chosen by measuring) and kuchi-audio-check (loudness, peaks and cue timing, measured).', coding: 'Before writing video code, before adding sound, and before delivering.', chat: 'Rarely.' },
  { name: 'kuchi_send_feedback', what: 'Reports a failure or a missing capability to the maintainers. The only tool that records what the agent writes.', coding: 'When a tool fails or misleads.', chat: 'When a tool fails or misleads.' },
  { name: 'search', what: 'The generic search tool some clients expect: returns up to 10 video ids, titles and URLs.', coding: 'Rarely; the kuchi_ tools are richer.', chat: 'Used by apps that only call search and fetch.' },
  { name: 'fetch', what: 'The generic fetch tool: one video by the id from search, with notes, links and metadata.', coding: 'Rarely.', chat: 'Used by apps that only call search and fetch.' },
];

/** The 14 shot kinds an agent assigns while studying a reference, and what replaces each. */
export const SHOT_KINDS: [string, string, string][] = [
  ['title_card', 'Words on a plain or lightly textured background', 'A short line in your words'],
  ['kinetic_type', 'Words that are the motion: typing, sliding, scaling', 'Your headline, animated the same way'],
  ['logo', 'A brand mark on its own, usually a reveal', 'Your logo'],
  ['ui_screen', 'A whole product screen, flat to the camera', 'A screenshot or recording of your product'],
  ['ui_closeup', 'One part of a screen enlarged: a button, a field, a cursor', 'The matching detail of your UI'],
  ['device', 'A screen inside a phone, laptop or browser frame', 'Your screen in the same frame'],
  ['chart', 'A graph, counter or data graphic drawing in', 'Your real numbers, never invented ones'],
  ['character', 'A mascot, illustrated figure or avatar', 'Your own mascot, or a placeholder'],
  ['product_render', 'A physical product, photographed or in 3D', 'Your product photo or render'],
  ['live_action', 'Filmed footage of people or places', 'Your own footage, or a placeholder'],
  ['collage', 'Several images, cards or screens arranged together', 'Several of your screens'],
  ['abstract', 'Shapes, gradients, particles or light', 'The same motion in your colours'],
  ['end_card', 'The closing frame: logo with a call to action', 'Your logo and call to action'],
  ['blank', 'An empty frame held as a pause', 'The same pause, nothing on screen'],
];

/** How a shot starts, as the breakdown measures it. */
export const ENTRANCES: [string, string][] = [
  ['cut', 'Hard cut: the whole picture changes in one frame.'],
  ['transition', 'Animated transition: several frames of heavy change join two pictures (wipe, zoom, morph or dissolve).'],
  ['hold', 'Same scene: motion resumes after the picture held still.'],
  ['blank_black', 'Passes through an empty black frame.'],
  ['blank_white', 'Passes through an empty white frame.'],
];

/** How much of the frame moves in a shot. */
export const MOTION: [string, string][] = [
  ['still', 'under 0.4% of the frame moves'],
  ['low', 'under 3%'],
  ['medium', 'under 12%'],
  ['high', '12% or more'],
];

/** Limits of kuchi_plan_remake's inputs. */
export const PLAN_LIMITS = { minSeconds: 5, maxSeconds: 180, minFps: 12, maxFps: 120, shotsPerPage: 40 };

/** A blueprint shot as kuchi_plan_remake returns it (format: json). Values are illustrative. */
export const SAMPLE_SHOT = `{
  "shot": 3,
  "start_s": 4.2,
  "end_s": 6.533,
  "start_frame": 126,
  "end_frame": 195,
  "reference_shot": 3,
  "reference_start_s": 3.9,
  "reference_end_s": 6.07,
  "compare_at_s": 5.1,
  "enters": "transition",
  "motion": "medium",
  "kind": "ui_screen",
  "reference_shows": "Product UI. Dashboard centered, cursor moves to a button",
  "your_content": "Acme: \\"Live sync\\". A screenshot or recording of the user's product..."
}`;
