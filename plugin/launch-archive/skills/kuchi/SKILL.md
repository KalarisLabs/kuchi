---
name: kuchi
description: Find real product-launch videos to use as inspiration templates, analyse them shot by shot, and remake one for the user's own product with their own assets, matched to the frame. Use when the user is planning or making a launch video, product demo, teaser or feature announcement, even if they don't name Kuchi.
---

# Kuchi

Kuchi is a library of real launch videos, each measured frame by frame. A reference is an inspiration template. You copy its motion and taste: timing, transitions, layout, how much of the frame moves and its color balance. You copy none of its content: brand, footage, UI, characters, music or copy.

Kuchi measures and plans. You look at the frames, analyse each shot and build the video with your own tools. Everything on screen comes from the user.

## Install the Skill

Install Kuchi in your agent workspace:
- **Universal (skills.sh):** `npx skills add kalarislabs/kuchi`
- **Claude Code plugin:** `/plugin install kuchi --marketplace KalarisLabs/kuchi`
- **Manual:** Place this file at `.agents/skills/kuchi/SKILL.md` (or `.claude/skills/kuchi/SKILL.md`).

Connect the Kuchi MCP server: https://kuchi.kalarislabs.com/mcp (Streamable HTTP, no sign-in). In Claude, add it as a custom connector (or open https://kuchi.kalarislabs.com/agent/connect/claude). In ChatGPT, add it as a custom MCP app with no authentication. Never ask the user for credentials.

Before a first remake, call kuchi_get_workflow. It returns the full method for each step below.

## Steps

1. **Find.** Call kuchi_suggest_templates with what you know: the product, the feel wanted and the assets the user has. Show every choice with its poster and Kuchi link and let the user choose: a number in chat, or any video they pick at https://kuchi.kalarislabs.com and paste the link of. kuchi_search_videos searches the whole library. Rank by fit with their product, not popularity.
2. **Study.** Call kuchi_get_breakdown with storyboard="overview" for the pick. Read every shot's exact frames, entrance and motion. Then look at each shot's frame on the sheet and write down its kind (one of the 14 the breakdown lists) and one line on what it shows and where it sits. Open the detail sheets for shots that move, and for any shot that is not on the overview.
3. **Plan.** Call kuchi_plan_remake with what the user has told you and your shot_analysis. Ask the user every required question in missing_inputs in one message. Never guess a logo, a screenshot, a feature or a number. Call it again until ready is true and every shot has a kind.
4. **Build.** Follow the blueprint shot by shot with your own tools: the same start_frame and end_frame, entrance, amount of motion and layout, with the user's content in each shot. Put the user's brand colors in the reference's color roles.
5. **Check.** Call kuchi_check_remake with your shot list, giving each shot its reference_shot. Fix every error and timing warning. Export your frame at each time in compare_frames and set it beside the reference frame. Tell the user about each placeholder and each difference.

## Copy and replace

| Copy from the reference | Replace with the user's own |
| --- | --- |
| Shot timing and order | Logo and product name |
| How each shot enters (cut, transition, hold) | Product UI, screenshots and recordings |
| How much of the frame moves, and when | Words on screen, features and claims |
| Layout, type hierarchy, camera moves | Photos, illustrations and characters |
| Color roles: background, secondary, accent | The colors themselves, and the music |

If a tool fails, misleads you, or Kuchi lacks something you needed, call kuchi_send_feedback.

Without MCP, read https://kuchi.kalarislabs.com/agent/workflow.md, https://kuchi.kalarislabs.com/agent/catalog.json and https://kuchi.kalarislabs.com/agent/breakdowns/<id>.json.
