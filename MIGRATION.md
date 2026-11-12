# Migrating from Serena Launch to Kuchi

Kuchi is a fork of Serena Launch (see `NOTICE`). The gallery UI and the MCP
tools behave the same. What changed is the names, the domain and the
operator-owned configuration. This page maps every old identifier to its new one.

## For agent users

| Serena Launch | Kuchi |
|---|---|
| MCP URL `https://serenatan.org/launchvideo/mcp` | `https://kuchi.kalarislabs.com/mcp` |
| MCP server name `serena-launch` | `kuchi` |
| Gallery `https://serenatan.org/launchvideo/` | `https://kuchi.kalarislabs.com/` |
| Setup guide `/launchvideo/agent/SKILL.md` | `/agent/SKILL.md` |
| Claude connect link `/launchvideo/agent/connect/claude` | `/agent/connect/claude` |
| Community API `/launchvideo/community/*` | `/community/*` |
| Recording API `/launchvideo/agent/recording/*` | `/agent/recording/*` |
| OAuth metadata `/.well-known/oauth-protected-resource/launchvideo/mcp` | `/.well-known/oauth-protected-resource/mcp` |
| (none) | `/mcp/health` → `{"status":"ok","product":"Kuchi","version":"…"}` |

Re-add the connector rather than editing it, for example:

```sh
codex mcp remove serena-launch
codex mcp add kuchi --url https://kuchi.kalarislabs.com/mcp
codex mcp login kuchi
```

Kuchi runs its own Clerk instance, so existing Serena Launch sign-ins and
OAuth grants don't carry over. Sign in again when your client asks.

## For recorder users (`agent/recorder.mjs`)

| Serena Launch | Kuchi |
|---|---|
| Script `serena-recorder.mjs` | `kuchi-recorder.mjs` |
| Env `SERENA_RECORDER_HOME` | `KUCHI_RECORDER_HOME` |
| Config dir `~/.config/serena-launch/recorder` | `~/.config/kuchi/recorder` |
| Default `--server serena-launch` | `--server kuchi` |

Run `install-claude` again so the hook points at the new script and server name.

## For operators

| Serena Launch | Kuchi |
|---|---|
| Worker `serenatan-launchvideo` | `kuchi-site` |
| Worker `serenatan-launchvideo-agent` | `kuchi-agent` |
| R2 `serenatan-launchvideo-media` | `kuchi-media` |
| R2 / D1 `serena-launch-conversations` | `kuchi-conversations` |
| Routes on `serenatan.org/launchvideo/*` (zone ID) | `kuchi.kalarislabs.com/*` (`zone_name: kalarislabs.com`) |
| `account_id` in `wrangler.json` | `CLOUDFLARE_ACCOUNT_ID` env var |
| Clerk `https://clerk.serenatan.org` | `https://clerk.kuchi.kalarislabs.com` |
| Header `X-Serena-Analytics-Test` | `X-Kuchi-Analytics-Test` |
| PostHog `properties.app = 'serena-launch'` | `'kuchi'` |
| Browser storage key `serena_launch_visitor` | `kuchi_visitor` |
| HTML fetched from `serena-portfolio-bzs.pages.dev` | Served from this repo's `site/` (optional `UI_ORIGIN`) |
| Build output `site-public/launchvideo/` | `site-public/` |
| Catalog source repo `serenakeyitan/awesome-ai-clonable-launch-videos` | `KUCHI_REPO` (default `kalarislabs/kuchi`) |

### First deploy checklist

1. Create the `kuchi-media` and `kuchi-conversations` R2 buckets, and the
   `kuchi-conversations` D1 database. Put its ID in `agent-service/wrangler.json`
   (`REPLACE_WITH_KUCHI_D1_DATABASE_ID`), then apply `agent-service/migrations/`.
2. Create a Clerk instance on `clerk.kuchi.kalarislabs.com`. Set
   `CLERK_PUBLISHABLE_KEY` in `agent-service/wrangler.json` and run
   `wrangler secret put CLERK_SECRET_KEY`. See `agent-service/AUTH.md`.
3. Optional analytics: put your own PostHog project token in
   `site/analytics-config.json` and set `POSTHOG_PROJECT_TOKEN` as a Worker
   secret. With the token empty, analytics stay off.
4. Push this repository to `github.com/$KUCHI_REPO`. The MCP reads its live
   catalog from there, and gallery posters load from its `main` branch.
5. `export CLOUDFLARE_ACCOUNT_ID=…`, then build and deploy as described in
   `site-worker/README.md` and `README.md`.
6. Run `python scripts/audit.py` and check `WHITELABEL_AUDIT.md`.
