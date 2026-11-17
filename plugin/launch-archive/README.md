# Kuchi

Kuchi is a library of real product-launch videos, demos and teasers, each measured frame by frame. This plugin lets your agent find a reference video, read its shot-by-shot breakdown, plan a remake for your own product with your own assets, and fetch copy-paste video components. Kuchi does not render video: your agent builds it with its own tools.

## Install

In Claude Code: `/plugin install kuchi --marketplace KalarisLabs/kuchi`

## What this plugin contains

- **Skill** (`skills/kuchi/SKILL.md`): the short method the agent follows.
- **MCP server** (`.mcp.json`): connects to `https://kuchi.kalarislabs.com/mcp` over Streamable HTTP. No sign-in, no API key.

## What it sends and fetches

- The agent's tool calls (search terms, the chosen video, the plan inputs you give) go to the Kuchi server on Cloudflare.
- The server records anonymous usage events in PostHog (which tool ran, how long it took, the client's name and the country, never the IP address or your product details), and stores feedback text only when the agent calls `kuchi_send_feedback`.
- Video posters, breakdowns and storyboard images are fetched from `kuchi.kalarislabs.com`.
- The plugin runs no local scripts or hooks.

## Links

- Website: https://kuchi.kalarislabs.com/
- Privacy policy: https://kuchi.kalarislabs.com/privacy
- Terms: https://kuchi.kalarislabs.com/terms
- Support: https://kuchi.kalarislabs.com/support (hello@kalarislabs.com)

MIT licensed.
