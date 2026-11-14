# Agent roster for the frontend migration

All agents work from `FRONTEND_PLAN.md`. Frontend only. None of them touches the MCP server, the agent service,
the data scripts, or `site/` (the frozen reference). Implementation agents run with `isolation: "worktree"`
because another session shares the main working tree.

Every agent's report must contain: files changed, gates run with real output, and open questions.
A report with no evidence for a claim is rejected.

| # | Agent | Mode | Job | May write | Output |
|---|---|---|---|---|---|
| 1 | **Orchestrator** (main session) | read/write | Owns the plan, sequences slices, reviews every report, talks to the user | `web/docs/**` | Accepted slices |
| 2 | **Recon** (`Explore`) | read-only | Inventories `site/`: element IDs and classes `app.js` depends on, analytics event names, data fields read from the JSON, deep links, a11y features that must survive | nothing | `INVENTORY.md` content, every line with `file:line` |
| 3 | **Design-system** (`general-purpose`) | write | S1: React integration, shadcn init, tokens from `site/style.css`, motion tokens from plan section 6 | `web/src/styles/**`, `web/src/components/ui/**`, `web/components.json`, `web/package.json` | Foundations with no visual change |
| 4 | **Builder** (`general-purpose`, one per slice S2-S5) | write | Builds exactly one slice with Astro + shadcn, following Emil's rules | its slice's files under `web/src/**`, `web/test/**` | One reviewable change plus test output |
| 5 | **Motion reviewer** (skill `review-animations`) | read-only | Audits the diff for motion. Output is the Before / After / Why table | nothing | Findings; blocking ones stop the slice |
| 6 | **A11y and QA** (`general-purpose`) | read-only + browser | GreatFrontEnd checklist (plan section 7): keyboard-only, labels, contrast, axe; screenshots at 390 px and 1280 px | nothing | Pass/fail list with evidence |
| 7 | **Deploy-safety reviewer** (`general-purpose`) | read-only | Runs `npm run check:scope`, reads `git diff --name-only`, checks no new path collides with `/mcp`, `/agent`, `/.well-known`, `/relay`, `/assets`, and runs the post-deploy smoke check | nothing | Go / no-go |

## Standing prompt prefix for every agent

> You are working on the Kuchi frontend only. Read `web/docs/FRONTEND_PLAN.md` first and obey its boundaries.
> Do not touch `agent-service/`, `agent/`, `plugin/`, `site/`, `site-worker/`, `data/`, `scripts/`, or `.github/`.
> Cite `file:line` for every claim about existing code. Check library docs before using an API. Use the shadcn CLI
> to add components. Do not invent data fields, event names, routes, or props. If unsure, write the question down
> instead of guessing. Report real command output, including failures.

## Order of work

1. Recon, then Orchestrator reviews the inventory (S0).
2. Design-system (S1).
3. Builder per slice (S2, S3, S4, S5), each followed by Motion reviewer, A11y and QA, and Deploy-safety reviewer.
4. Polish pass (S6), then cutover (S7) only with the user's go-ahead.
