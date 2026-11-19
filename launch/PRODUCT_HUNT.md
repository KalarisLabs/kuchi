# Product Hunt launch listing

Ready to load into a Product Hunt draft through the Product Hunt MCP (`start_launch` → `update_launch` → `submit_launch`). A draft stays private until it is submitted, and submitting always shows a preview first.

Same voice as `SOCIAL_POSTS.md`: free for everyone, positive, no pricing talk, no knocking other tools, no GitHub link.

## Fields

| Field | Value |
|---|---|
| url | `https://kuchi.kalarislabs.com` |
| name | Kuchi |
| tagline (≤ 60) | **Your AI agent makes your launch video, in code** (46) |
| pricingType | `free` |
| productState | `default` |
| mcpServerUrls | `https://kuchi.kalarislabs.com/mcp` |
| productTwitterHandle | `sayanchowdhuryai` |
| additionalLinks | `https://kuchi.kalarislabs.com/components`, `https://kuchi.kalarislabs.com/agents` |
| topics | Developer Tools, Artificial Intelligence, Marketing, Video (resolve IDs with `get_launch_context`) |
| makerIds | Sayan Chowdhury (resolve with `get_launch_context maker`) |
| launchDate | **you choose** (YYYY-MM-DD, launches at 00:00 Pacific) |

Alternative taglines: "Remake the best launch videos for your product" (47) · "AI for viral launch videos" (26).

## Description (≤ 260)

> A library of 89 real launch videos, measured frame by frame. Add the free MCP server to Claude, Cursor, Codex or ChatGPT, and your agent picks one that fits your product, plans every shot and writes the Remotion code. Free, no sign-in.

## Gallery

1. Launch film: `launch/out/kuchi-launch.mp4`. Product Hunt takes the video as a YouTube link, so upload it there (unlisted is fine) first.
2. `launch/out/cover.jpg`: "Your launch film is ready".
3. More stills from the film: the Claude prompt, the agent steps, "Kuchi is free for everyone".
4. Thumbnail: the popcorn mark (`web/public/favicon.svg`) on white.

## Maker's first comment (`commentBody`, HTML)

```html
<p>Hey Product Hunt! I'm Sayan, and I built Kuchi.</p>
<p>Launch videos usually get made in a rush, the week before launch, by people who'd rather be shipping. I wanted that week to be easier, so I studied how the best launch videos are actually put together.</p>
<p>Kuchi is a library of 89 real launch videos, each measured frame by frame: where every cut lands, how each shot enters, how much moves, the colours. Your AI agent studies one that fits your product and remakes its pacing with your copy, your screens and your logo. It copies the rhythm, never the content.</p>
<p><strong>Try it in about 2 minutes:</strong></p>
<ol>
<li>Add the MCP server to your agent: <a href="https://kuchi.kalarislabs.com/mcp">kuchi.kalarislabs.com/mcp</a> (setup guides for 27 agents at <a href="https://kuchi.kalarislabs.com/agents">kuchi.kalarislabs.com/agents</a>)</li>
<li>Ask: <em>"Use Kuchi to make a launch video for my app"</em></li>
<li>Answer its questions about your product, then render.</li>
</ol>
<p>It also comes with 185 open Remotion components (kinetic type, captions, UI screens, cursors, logo reveals). Every scene in our launch film is one of them.</p>
<p>It's free for everyone. No sign-in, no account, and it doesn't keep the product details you give it.</p>
<p>If you make a video with Kuchi, please share it in the comments. I'll look at every one, and whatever slowed you down is what I'll fix next.</p>
```
