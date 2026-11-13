import {SITE_URL} from './catalog.mjs';

// The setup skill people install in their agent. The full workflow stays live
// on the server, so this file rarely needs to change.
export const SKILL = `---
name: kuchi
description: Find real product-launch videos to use as inspiration templates, study them shot by shot, and plan a remake for the user's own product with their own assets. Use when the user is planning or making a launch video, product demo, teaser or feature announcement, even if they don't name Kuchi.
---

# Kuchi

Kuchi is a library of real launch videos, each measured frame by frame. A reference is an inspiration template. You copy its motion and taste: timing, transitions, layout, how much of the frame moves and its color balance. You copy none of its content: brand, footage, UI, characters, music or copy.

Connect the Kuchi MCP server: ${SITE_URL}/mcp (Streamable HTTP, no sign-in). In Claude, add it as a custom connector (or open ${SITE_URL}/agent/connect/claude). In ChatGPT, add it as a custom MCP app with no authentication. Never ask the user for credentials.

## Steps

1. **Find.** Search with kuchi_search_videos (kuchi_list_filters shows styles, paces and themes). Show the user 3 to 5 picks, each with its poster and Kuchi link. Choose by fit with their product, not popularity.
2. **Study.** Call kuchi_get_breakdown with storyboard="overview" for the pick. Read every shot: when it starts and ends, how it enters, how much moves. Open detail sheets for the shots you will rebuild.
3. **Ask.** Call kuchi_plan_remake with what the user has told you. Ask them every required question in missing_inputs in one message. Never guess a logo, a screenshot, a feature or a number. Call it again with their answers until ready is true.
4. **Build.** Follow the blueprint shot by shot with your own tools: the same start, end, entrance and amount of motion, with the user's content in each shot. Put the user's brand colors in the reference's color roles.
5. **Check.** Call kuchi_check_remake with your shot list and fix every error. Compare your render with the reference at matching timestamps. Tell the user about each placeholder and each difference.

## Copy and replace

| Copy from the reference | Replace with the user's own |
| --- | --- |
| Shot timing and order | Logo and product name |
| How each shot enters (cut, transition, hold) | Product UI, screenshots and recordings |
| How much of the frame moves, and when | Words on screen, features and claims |
| Layout, type hierarchy, camera moves | Photos, illustrations and characters |
| Color roles: background, secondary, accent | The colors themselves, and the music |

If a tool fails, misleads you, or Kuchi lacks something you needed, call kuchi_send_feedback.

Without MCP, read ${SITE_URL}/agent/catalog.json, ${SITE_URL}/agent/breakdowns/<id>.json and ${SITE_URL}/agent/workflow.md.
`;
