---
name: kuchi
description: Find real product-launch videos to use as inspiration templates, then plan a remake for the user's own product with their own assets. Use when the user is planning or making a launch video, product demo, teaser or feature announcement, even if they don't name Kuchi.
---

# Kuchi

Kuchi is a library of real launch videos. Each one is an inspiration template: borrow its pacing, transitions, layout and motion, never its brand, footage, music or copy.

Connect the Kuchi MCP server: https://kuchi.kalarislabs.com/mcp (Streamable HTTP, no sign-in). In Claude, add it as a custom connector (or open https://kuchi.kalarislabs.com/agent/connect/claude). In ChatGPT, add it as a custom MCP app with no authentication. Never ask the user for credentials.

1. Find references with kuchi_search_videos and show the user each poster and Kuchi link. Choose by fit, not popularity.
2. Call kuchi_plan_remake with the user's product name, details and assets. Ask for anything in missing_inputs (logo, screenshots or recordings, features, call to action) before building.
3. Build with your own tools, using only the user's assets and claims. Compare with the reference before delivering.

Without MCP, read https://kuchi.kalarislabs.com/agent/catalog.json and https://kuchi.kalarislabs.com/agent/workflow.md.
