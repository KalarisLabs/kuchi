## Frontend migration rules (read first)

This app is being migrated from the old HTML/CSS/JS gallery to Astro + shadcn/ui. Before changing anything, read
`docs/FRONTEND_PLAN.md` (scope, deployment safety, design rules, gates) and `docs/AGENT_ROSTER.md`.

- Frontend only. Never touch `agent-service/`, `agent/`, `plugin/`, `site/`, `site-worker/`, `data/`, `scripts/`, `.github/`.
- Never run `npm run deploy` or `wrangler deploy`. Deploying is the user's decision.
- Do not create pages under `/mcp`, `/agent`, `/.well-known`, `/relay`, or `/assets`.
- Run `npm run build`, then `npm test`, then `npm run check:scope` before reporting a slice done.
- The build appends a snapshot to the tracked file `../data/daily-stats.json`. Do not commit that from a frontend branch.

### Where things are

| What | Where |
|---|---|
| Pages (all prerendered) | `src/pages/*.astro` |
| Document shells | `src/layouts/BaseLayout.astro`, `src/layouts/LegalLayout.astro` |
| Sections | `src/components/*.astro` |
| shadcn/ui components (React, Base UI) | `src/components/ui/`, added with `npx shadcn@latest add <name>` only |
| Gallery and connect behaviour (ported from `../site`) | `src/scripts/gallery.js`, `src/scripts/connect.js` |
| Smooth scroll (Lenis) and the GSAP loader | `src/scripts/motion.ts` |
| Tokens, cascade layers, shadcn theme | `src/styles/global.css` |
| Ported stylesheet (tokens are `--k-*`) | `src/styles/legacy.css` |
| Catalog data at build time | `src/lib/catalog.ts` (reads `.generated/videos.json`) |
| Tests | `test/*.test.mjs` |

### Rules of thumb

- The scripts find elements by id and data attribute. Renaming an id in a component breaks behaviour; `npm test` catches it.
- `../site` is still the reference. If a test says the reference changed, port the change here; do not edit `../site`.
- Tailwind's preflight is off on purpose. Utilities and shadcn components win over the ported styles through cascade layers.
- Motion: CSS transitions first, GSAP through `loadGsap()` when choreography is needed, always under 300 ms for UI,
  `ease-out-strong` for enter/exit, `transform`/`opacity` only, nothing on keyboard-initiated actions.

## Development

When starting the dev server, use background mode:

```
astro dev --background
```

Manage the background server with `astro dev stop`, `astro dev status`, and `astro dev logs`.

## Documentation

Full documentation: https://docs.astro.build

Consult these guides before working on related tasks:

- [Adding pages, dynamic routes, or middleware](https://docs.astro.build/en/guides/routing/)
- [Working with Astro components](https://docs.astro.build/en/basics/astro-components/)
- [Using React, Vue, Svelte, or other framework components](https://docs.astro.build/en/guides/framework-components/)
- [Adding or managing content](https://docs.astro.build/en/guides/content-collections/)
- [Adding styles or using Tailwind](https://docs.astro.build/en/guides/styling/)
- [Supporting multiple languages](https://docs.astro.build/en/guides/internationalization/)
