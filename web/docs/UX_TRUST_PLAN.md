# Kuchi UX and trust plan

Status (2026-11-14): **proposed, not approved as a whole.** The owner asked for these parts directly and they
are built (uncommitted): the footer on every page with links to Privacy, Terms, Support and Status (finding 9),
motion for clicks and swaps (`src/styles/polish.css`, `src/scripts/polish.ts`; most of section 6), the hero agent
tile cycling through six agent logos, and the removal of the GitHub buttons and the macOS/Linux and Windows skill
install commands. A second round the same day added: the hero parallax, the "After you connect" workflow section
(`Workflow.astro`), the FAQ (`Faq.astro`), the ASCII and dither footer wordmark, and removed the "Collection" link
from the masthead, the video count from the footer and the blue glow behind the wordmark. Everything else in this
file is still a proposal.
It extends `FRONTEND_PLAN.md` and keeps every boundary in it (frontend only, `web/` only, no deploys by agents).
Where the two files disagree, `FRONTEND_PLAN.md` wins until the user approves the decisions in section 8.

Design rules come from the installed `emil-design-eng` skill (Emil Kowalski). Findings come from reading
`web/src` and from screenshots of the local dev build at 1440 px and 390 px taken on 2026-11-14.
Another session was editing `src/styles/legacy.css` while this was written, so rules are cited by selector, not line number.

## 1. Goal

A first-time visitor decides in about five seconds whether to stay, and in about a minute whether to connect
an unknown server to their AI agent. The site has to win both moments.

**The five-second test.** Without scrolling, a visitor can answer:

1. What is this? (a library of real launch videos an AI agent can use as templates)
2. Is it real? (they can see the videos, and the numbers have a source and a date)
3. Who is behind it? (Kalaris Labs, open source, reachable)
4. What happens if I press the main button? (stated before they press it)
5. What does it cost me? (no account, no key, nothing stored)

**Rich, in Emil's sense**, means many small details that are each correct, so the whole page feels solid.
It does not mean more animation. Every motion in section 6 has a stated purpose and a frequency-based budget.

## 2. What costs trust today

| # | Finding | Evidence | Why it costs trust |
|---|---|---|---|
| 1 | No video is visible in the first screen. At 1440 x 900 the first video starts about 1,050 px down; at 390 px about 1,400 px down | Screenshots; `.intro` padding, section order in `src/pages/index.astro` | A video library that opens with claims and no videos asks for belief before giving proof |
| 2 | The headline is invisible until JavaScript runs, and the buttons finish appearing about 1.5 s after load | `HeroCopy.jsx` renders the `h1` through `BlurText` with words starting at opacity 0; `.intro-reveal` delays of 0.7 to 0.94 s plus a 0.6 s animation | The first paint is an empty hero. Slow first paint reads as a slow, fragile site |
| 3 | The copy button copies a different, much longer prompt than the one shown | Shown text: `AgentConnect.astro` `#setup-command`. Copied text: `setup` in `scripts/connect.js` | "What I see is not what I copied" is the single worst signal on a page that asks people to paste a prompt into their agent |
| 4 | Quick-connect links open a desktop app (`claude://`, `codex://`) with no warning, and nothing nearby says what the server can do | `AgentConnect.astro` client links | An unexplained "Open Claude?" system prompt from an unknown site looks unsafe |
| 5 | Every one of the 84 cards is a `<video controls>`: native control bars sit on every poster, under a second custom play button, and the timecode overlaps the controls | `card()` in `scripts/gallery.js`; grid screenshot | The grid looks unfinished and noisy. It also loads 84 poster images up front because a video poster cannot be lazy-loaded |
| 6 | 41 of 84 videos have no play count, so half the grid shows "—" under "Video plays" | `.generated/videos.json` (`views` is null for 41) | An empty metric on half the cards looks like broken data. Likes and bookmarks exist for all 84 |
| 7 | Posters have black bars. The thumbnail box is 16:10; 71 of 84 videos are 16:9 | `.thumb { aspect-ratio: 16/10 }`, `object-fit: contain` on `#151515` | Looks like a rendering bug |
| 8 | The page is 13,100 px tall on desktop and 35,800 px on a phone. All 84 cards render at once, one column on phones | Measured in the dev build | The footer, with the privacy and status links, is unreachable on a phone |
| 9 | The footer has four items. Terms is linked from no page, Support only from Terms. No company name, contact, source link or data date | `SiteFooter.astro`; `terms.astro`, `support.astro` exist | People who are deciding whether to trust a site scroll to the footer. Ours is nearly empty. Legal pages have no footer at all |
| 10 | The methodology ("About the data") is a closed disclosure at the very bottom | `SourceNotes.astro` | The honest caveats are the strongest trust asset on the site and nobody sees them |
| 11 | "91.65M impressions" in the hero has no owner. It can be read as Kuchi's own reach | `Intro.astro` `.intro-stats` | An ambiguous big number reads as inflated |
| 12 | The main action after choosing a video (copy the remake brief) is hidden in a closed disclosure at the bottom of the dialog's side column | `openVideo()` in `scripts/gallery.js`, `.brief-details` | The product's core step is the hardest thing to find |
| 13 | Small inconsistencies: five corner radii (0, 5, 6, 8, 999 px); three disclosure markers (▸, +/−, ⌄); "↗" used for actions that stay on the site ("Reset filters ↗", "View details ↗"); two date formats ("Jun 17, 2026" and "2026-06-17"); a hard black border only on the connect panel | `legacy.css`, `gallery.js`, `connect.js` | None is noticed alone. Together they make the page feel assembled, not designed. This is Emil's "unseen details compound", in reverse |
| 14 | No Open Graph or Twitter card tags, and no canonical URL | `BaseLayout.astro` | For a product shared on X, the link preview is the real first sight. Today it is a bare URL |
| 15 | Copying any text makes a pill pop up that dodges the cursor and says "Nope", "Too slow" | `CopyDodge.jsx` | Playful, but it fires at the moment a careful visitor copies the server URL to inspect it. See decision 3 |
| 16 | The dialog opens with keyboard focus on "← Prev" | Dialog screenshot (focus ring on Prev) | Pressing Enter or Space right after opening jumps to another video |

Already right, keep: skip link, live regions, native `<dialog>`, labelled controls, visible focus ring, reduced-motion
handling, the WebGL background pausing off-screen and in hidden tabs, press feedback on the hero pills and the shadcn button,
plain-language privacy page.

## 3. Principles used

| Emil's rule | How it applies here |
|---|---|
| Unseen details compound | Section 5.6: one radius scale, one disclosure marker, one date format, one meaning for "↗" |
| Decide motion by frequency | Search, filters, sort and keyboard prev/next get no animation. Rare moments (first load, first open) may get more |
| Every animation needs a purpose | Section 6 names the purpose of each one. "Looks cool" is not accepted for anything seen more than once per visit |
| Good defaults beat options | The best 12 videos first, one clear primary action per section, the full prompt visible by default |
| Never block interaction for decoration | Headline and buttons are usable at first paint; entrance motion never delays them |
| Cohesion: motion matches personality | Kuchi is a reference library that touches people's agents: crisp and calm. Playfulness only where nothing is at stake |
| Transform and opacity only, under 300 ms, `ease-out-strong` | Unchanged from `FRONTEND_PLAN.md` section 6 |

## 4. Order of work

Each step is one reviewable change and passes the gates in `FRONTEND_PLAN.md` section 8 (as amended by decision 1).

| Step | What | Fits existing slice | Why this order |
|---|---|---|---|
| U1 | First screen, header, footer, link-preview tags | New, before S3 | Largest trust gain, static Astro only, lowest risk |
| U2 | Connect panel | S3 | The conversion step; fixes findings 3 and 4 |
| U3 | Gallery cards, filters, loading | S4 | Largest visual and performance gain |
| U4 | Reference dialog | S5 | Makes the core action obvious |
| U5 | Consistency pass and motion pass | S6 | Only worth doing once the components are final |
| U6 | Measure, review next day, cutover | S7 | Emil: review with fresh eyes before shipping |

## 5. The work

### 5.1 U1: first screen, header, footer

- **Headline paints without JavaScript.** Render the `h1` and tagline as static HTML in `Intro.astro`. Replace the
  word-by-word `BlurText` entrance with a CSS entrance (section 6). `HeroCopy` stops being a `client:load` island.
- **Proof in the first screen.** Under the two buttons, a strip of five or six real posters from the top references
  by impressions, each with its brand name and impression count, each a link to `#video-<id>`. Shrink `.intro`
  vertical padding so the strip is visible at 1440 x 900 and the first poster edge is visible at 390 x 844.
- **Give the number an owner.** "84 launch videos. 91.65M impressions on their original posts. Updated daily."
  with "How we measure" linking to the methodology (finding 11).
- **Three facts beside the primary button**, each already true and already stated elsewhere on the site:
  "No account or API key", "Your product details are not stored", "Open source". Each links to its proof
  (privacy page section, GitHub).
- **How it works**, a three-step row between the hero and the connect panel: pick a reference, your agent studies
  its shot breakdown, your agent plans the remake with your product. Text and real frames only. If a real remake
  made with Kuchi exists (decision 5), show reference and remake side by side with a draggable `clip-path` comparison.
- **Header.** Add "Videos", "Connect", GitHub, and a small primary "Connect" button. Make it sticky with a hairline
  border that appears after scrolling (a state change, not an animation).
- **Footer on every page**, including the legal pages: Kalaris Labs, Privacy, Terms, Support, Status, GitHub,
  the support address already published on the support page, and "Data updated <latest snapshot date>".
- **Methodology** becomes a visible two-line section above the footer with the detail behind "Read more".
- **Link preview.** `og:title`, `og:description`, `og:image`, `twitter:card`, canonical URL in `BaseLayout.astro`.
  Needs one 1200 x 630 image (decision 6).

Done when: the five-second test passes on a cold load at both sizes with JavaScript disabled.

### 5.2 U2: connect panel

- **Show what gets copied.** The visible prompt is the first lines of the real prompt with "Show full prompt".
  The copy button copies exactly the prompt the panel shows in full. The prompt text itself does not change.
- **Say what the button does before it is pressed.** One line under the client row: "Opens the app with this
  prompt filled in. You review it before sending." Web links say "Opens cursor.com".
- **What your agent gets.** A short disclosure listing the server's tools in plain words, generated from the
  published tool list, not written from memory. Read-only wording only where that is true.
- **Real buttons.** Client links become outlined shadcn buttons (visible border, 42 px tall, press feedback).
  On phones the fifth item ("More") spans the full row instead of sitting alone.
- **"More" list** becomes a shadcn Accordion: one marker style, origin-aware, no layout jump.
- **One copy confirmation.** The icon changes to a check inside the button. The toast stays only as the
  screen-reader announcement and for failures.
- Deep links, the MCP URL and analytics events stay byte-identical (gate 7).

### 5.3 U3: gallery

- **Posters are images.** Each card shows `<img loading="lazy" decoding="async">` with width and height set.
  The `<video>` element is created only when play is pressed, and only one exists at a time.
  One play button, no native controls until playing.
- **Correct shape.** Thumbnail box 16:9. 16:9 posters fill it; the 13 others sit centred on the page's light
  wash colour, not on black.
- **No empty metrics.** A card shows impressions plus plays when plays exist, otherwise impressions plus likes.
  The dialog and table keep "—" with a tooltip: "Not reported by the source".
- **First 12 cards are in the HTML at build time** (the catalog is already read at build time for the hero).
  No "Loading videos…", no layout shift, and the collection is visible without JavaScript.
  This answers open question 4 in `FRONTEND_PLAN.md`.
- **"Show 12 more"** button with a count ("12 of 84"). A button, not infinite scroll, so the footer stays reachable.
  Two columns on phones from 360 px.
- **Category chips with counts** in place of the category select (Feature clip 37, AI launch 23, Startup launch 17,
  Launch video 6, Tool demo 1). They show the breadth of the library at a glance. Style and sort stay as selects.
- **Filters live in the URL** (`?q=&category=&sort=`), so a filtered view can be shared and Back works.
- **"/" focuses search.** Shown as a small key hint in the field on devices with a keyboard.
- **Titles in ink, underlined on hover**; blue stays for links inside text and for focus (decision 4).
- **Empty state** names the active filters and offers "Clear filters" (no arrow).
- **Featured.** Poster-first player with no bars, a sliding highlight on the picker, and the same two-metric rule.
  The stray duration caption under the player goes; the duration sits on the poster like on the cards.

### 5.4 U4: reference dialog

- **Primary action at the top of the side column:** "Use as template" copies the remake brief. The editable brief
  stays below it, open.
- **Stats grouped and dated.** Heading "Stats, as of Nov 13, 2026 (PT)". Three groups: reach (impressions, plays),
  engagement (likes, bookmarks, reposts, replies, quotes), account (followers).
- **"Copy link"** next to "Original post" (the `#video-<id>` link already works).
- **Focus** goes to the dialog heading on open and back to the card on close. Prev and Next show "←" and "→" key hints.
- One date format everywhere: "Jun 17, 2026". Remove the hard-coded fallback snapshot date in `openVideo()`; show "—" if a date is ever missing.
- Rounded corners and the shared disclosure marker, matching the rest of the page.

### 5.5 States every surface needs

| Surface | Loading | Empty | Error |
|---|---|---|---|
| Collection | Never shown for the first 12 (built in). Skeleton cards of the final size for "Show more" | Names the filters, "Clear filters" | Keeps the built-in 12 visible, one line with a retry button |
| Video player | Poster stays until the first frame is ready, then crossfades | n/a | Poster stays, "Watch the original post" link |
| Copy | n/a | n/a | Text is selected for the visitor, one line says "Press Ctrl+C" |
| Daily change badges | Hidden until known (as today) | Hidden | Hidden |

### 5.6 U5: consistency

| Detail | One rule |
|---|---|
| Corner radius | 6 px controls, 10 px media and code blocks, 14 px panels and the dialog, full pill only for the two hero buttons |
| Borders | `--k-line` everywhere. Remove the ink border on the connect panel; separate it with the wash background |
| Shadows | None, except the dialog and popovers |
| Disclosure marker | One chevron, rotates 180 degrees, 150 ms |
| "↗" | Only for links that leave the site |
| Dates | "Jun 17, 2026" |
| Numbers | `font-variant-numeric: tabular-nums` on every statistic |
| Touch targets | 40 px minimum, including Prev, Next, Close and the feedback buttons |
| Press feedback | `scale(0.97)` on every pressable element, 160 ms |

## 6. Motion

Tools: CSS transitions and `@starting-style` first. GSAP with ScrollTrigger only for the one scroll-linked reveal.
The `motion` package (12.43, used today by `BlurText` and `DodgeField`) is not in the approved stack table and its
shorthand transforms are only hardware-accelerated from 14.2; after U1 nothing on the critical path should need it.

| Interaction | How often | Purpose | Decision |
|---|---|---|---|
| Hero entrance | Once per visit | First impression | CSS only. Lines fade in with 8 px rise and 4 px blur, 40 ms apart, whole sequence under 500 ms. Buttons are in the first group |
| Poster strip | Once per visit | Show the proof arriving | `clip-path` reveal from the bottom, 40 ms stagger, starts with the hero |
| How-it-works steps | Once per visit | Explain the flow in order | Fade and 12 px rise on entering the viewport, once, 60 ms stagger |
| Button press | Constant | Feedback | `scale(0.97)`, 160 ms, `ease-out-strong` |
| Copy button | Occasional | State change | Icon to check with a 2 px blur crossfade, 200 ms; back after 2 s |
| "More" and other disclosures | Occasional | Avoid a jarring jump | Content fades in with a 4 px rise, 200 ms. Close is 150 ms |
| Featured picker | Occasional | Show which is active | Highlight slides with `clip-path` (Emil's tab technique), 200 ms, `ease-in-out-strong` |
| Featured swap | Occasional | Avoid a hard cut | 200 ms crossfade with 2 px blur |
| Card hover | Tens per visit | Affordance | Poster scales to 1.02 inside its frame, play button fades in, 200 ms. Fine pointers only |
| Card hover preview | Tens per visit | Let people sample quickly | Muted playback after a 300 ms pause on the card. Fine pointers, not under reduced motion or data saver (decision 7) |
| "Show more" cards | Occasional | Show what is new | New cards only: fade and 8 px rise, 30 ms stagger, capped at 12 |
| Search, filter, sort, chips | Constant | n/a | **None** |
| Grid and table toggle | Occasional | Avoid a hard cut | 150 ms opacity |
| Dialog open | Occasional | Spatial sense | Scale 0.96 to 1 with opacity, 200 ms, centred. Close in 150 ms |
| Dialog prev and next | Constant, often by keyboard | n/a | **None, ever** |
| Tooltips ("—", △, dates) | Occasional | Explain data | 125 ms, grows from its trigger, instant when moving between neighbours |
| Toast | Occasional | Feedback | Transition (not keyframes), rises by its own height, 200 ms |
| Header border on scroll | Constant | n/a | Instant state change |
| Statistic count-up | n/a | n/a | **Not built.** It delays real numbers and nothing real starts at zero |

Reduced motion: opacity changes stay, all movement and the hover preview go.

## 7. Speed is part of trust

Measure the built Worker locally before and after each step; do not quote numbers that were not measured.

| Budget | Target |
|---|---|
| Headline visible | In the first paint, with JavaScript disabled |
| Largest contentful paint, mid-range phone on 4G | Under 2.0 s |
| Layout shift | Under 0.05 |
| Images requested before scrolling | Hero strip and the first row of cards only |
| Video elements in the page | At most one |
| JavaScript needed before the buttons work | None |

## 8. Decisions needed from the user

| # | Decision | Recommendation |
|---|---|---|
| 1 | `FRONTEND_PLAN.md` says "no redesign of copy or layout", and `web/test/pages.test.mjs` fails when the built page differs from `site/index.html`. This plan changes layout and some copy in `web/` only | Approve. Replace the whole-page comparison with a contract test: script ids, analytics event names, deep links, MCP URL and legal text stay identical. `site/` is not touched |
| 2 | Headline. "AI clonable viral launch videos" stacks keywords; the tagline is the clearer line | Lead with the tagline and add one plain sentence saying what the visitor gets. Wording is yours |
| 3 | `CopyDodge` (the pill that dodges the cursor when text is copied) | Remove it, or limit it to the gallery. It should never appear when someone copies from the connect panel or legal pages |
| 4 | Card titles in brand blue or in ink | Ink, with blue kept for links in text and for focus |
| 5 | Is there a real remake made with Kuchi that can be shown beside its reference? | If yes, it is the strongest proof on the page. If no, the how-it-works row uses reference frames only. Nothing is mocked up |
| 6 | Link-preview image (1200 x 630) | You supply it, or approve one composed from real posters |
| 7 | Muted hover previews download video on hover | Build it behind a flag, measure the data cost, then decide |
| 8 | Kalaris Labs wordmark is visually heavier than "Kuchi" in the header | Reduce its height within the brand page's rules; confirm the minimum size allowed |

## 9. Review format

Code-level items, in the skill's required format. Each becomes a checklist line in the step that touches it.

| Before | After | Why |
|---|---|---|
| `h1` rendered by a `client:load` React island, words start at `opacity: 0` | Static `h1` in `Intro.astro`, CSS entrance | The first paint must not depend on JavaScript |
| `.intro-reveal` delays of 0.7 s, 0.82 s, 0.94 s plus 0.6 s | One group, under 500 ms total, buttons first | Decoration must never delay interaction |
| `BlurText` blur of 10 px per word through `motion` 12 | CSS `filter: blur(4px)` on three lines | Heavy blur is expensive in Safari; fewer animated nodes |
| `<video controls poster>` in every card | `<img loading="lazy">` plus one play button; video created on play | 84 players and 84 eager posters; doubled controls |
| `.thumb { aspect-ratio: 16/10 }` with `object-fit: contain` on `#151515` | `16/9`, cover for 16:9, wash background for other shapes | Removes the black bars |
| `.client-buttons > a { border: 0 }` | Outlined button, `:active { transform: scale(0.97) }` | Pressable things must look and feel pressable |
| `.agent-connect { border: 1px solid var(--k-ink) }`, radius 0 | Wash background, 14 px radius, no ink border | One border colour and one radius scale |
| "More" panel filled with `innerHTML`, appears instantly | Accordion, opacity and 4 px rise, 200 ms | Prevents a jarring jump |
| Copy shows a toast and swaps the icon with `::after` | Icon to check crossfade with 2 px blur; toast only announces | One confirmation, at the place the visitor is looking |
| `.toast { transition: opacity .15s, transform .15s }` with default easing | `200ms var(--ease-out-strong)`, `translateY(100%)` | Custom easing; percentages adapt to the toast's height |
| `dialog` with no enter state | `@starting-style { opacity: 0; transform: scale(0.96) }`, 200 ms, centred origin | Modals should not appear from nothing; modals keep a centred origin |
| `.pill-secondary:hover svg` under `@media (hover: hover)` | `@media (hover: hover) and (pointer: fine)` | Touch devices fire hover on tap |
| `html { scroll-behavior: smooth }` together with Lenis | Remove the CSS rule where Lenis runs | Two smoothing systems on one scroll |
| `v.snapshotDate \|\| '2026-10-27'` | Show "—" when missing | Never display a date the data does not contain |
